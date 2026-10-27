import { after } from "next/server"
import { decrireReservation, journaliser, json, lireCorps, nomDuMembre, pourLesHotes, rafraichirSite } from "@/lib/api/hotes"
import { notifierDecisionDesHotes, notifierModificationParLesHotes } from "@/lib/email/notifications"
import { gestion, moteur } from "@/lib/reservation"
import { formaterPrix } from "@/lib/reservation/dates"
import type { StatutReservation } from "@/lib/reservation/types"

const STATUTS_HOTE = ["confirmee", "refusee", "annulee"] as const
type StatutHote = (typeof STATUTS_HOTE)[number]
const estStatutHote = (valeur: unknown): valeur is StatutHote => (STATUTS_HOTE as readonly unknown[]).includes(valeur)
const NOTES: Partial<Record<StatutReservation, string>> = {
  confirmee: "Confirmée par les hôtes",
  refusee: "Déclinée par les hôtes",
  annulee: "Annulée par les hôtes",
}
const ACTIONS: Record<StatutHote, string> = { confirmee: "Demande confirmée", refusee: "Demande refusée", annulee: "Réservation annulée" }
const MOUVEMENTS = {
  arrivee: ["Arrivée enregistrée", "Arrivée annulée"],
  depart: ["Départ enregistré", "Départ annulé"],
} as const
const MOT_MAX = 2000

// { statut, mot? } : confirmer ou refuser une demande, annuler une réservation confirmée ; `mot` : message des
// hôtes ajouté à l'e-mail du client (et à l'historique).
// { mouvement: "arrivee" | "depart", annuler?, mot? } : arrivée ou départ du client enregistré par la réception ;
// `mot` obligatoire pour un départ non soldé ; `annuler` réservé aux gérants.
// { modification: { hebergementId, chambreId, arrivee, depart, adultes, enfants, navette, montantTotal }, prevenir?, mot? } :
// séjour modifié ; `prevenir` : e-mail au client avec ce qui change. `chambreId` vide : chambre attribuée par le moteur.
// Confirmer ou refuser une demande de plusieurs chambres s'applique à toutes ses chambres.
export const PATCH = pourLesHotes(async (requete, membre, contexte: RouteContext<"/api/hotes/reservations/[id]">) => {
  const { id } = await contexte.params
  const corps = await lireCorps(requete)
  const mot = String(corps?.mot ?? "").trim().slice(0, MOT_MAX)

  if (corps?.mouvement === "arrivee" || corps?.mouvement === "depart") {
    const annuler = corps.annuler === true
    // Erreur de clic : seuls les gérants reviennent sur une arrivée ou un départ
    if (annuler && membre.role !== "hote") return json({ erreur: "Seul un gérant peut annuler une arrivée ou un départ." }, 403)
    const resultat = await gestion.enregistrerMouvement(id, corps.mouvement, { annuler, auteur: nomDuMembre(membre), note: mot })
    if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
    const { soldeDu } = resultat
    journaliser(membre, "reservation", MOUVEMENTS[corps.mouvement][annuler ? 1 : 0], async () => {
      const reste = !annuler && soldeDu > 0 ? ` · reste ${formaterPrix(soldeDu)} à payer` : ""
      return `${await decrireReservation(id)}${reste}${mot ? ` · « ${mot} »` : ""}`
    })
    return json({ ok: true })
  }

  const m = corps?.modification
  if (m && typeof m === "object" && !Array.isArray(m)) {
    const champ = (nom: string) => (m as Record<string, unknown>)[nom]
    const montant = champ("montantTotal")
    const resultat = await gestion.modifierReservation(
      id,
      {
        hebergementId: String(champ("hebergementId") ?? ""),
        chambreId: String(champ("chambreId") ?? "") || null,
        arrivee: String(champ("arrivee") ?? ""),
        depart: String(champ("depart") ?? ""),
        adultes: Number(champ("adultes")),
        enfants: Number(champ("enfants") ?? 0),
        navette: champ("navette") === true,
        montantTotal: montant === null || montant === undefined || montant === "" ? null : Number(montant),
      },
      nomDuMembre(membre),
    )
    if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
    const { changements } = resultat
    if (changements.length > 0) {
      journaliser(membre, "reservation", "Réservation modifiée", async () => `${await decrireReservation(id)} · ${changements.join(" ; ")}`)
      if (corps?.prevenir === true) after(() => notifierModificationParLesHotes(id, changements, mot))
      rafraichirSite()
    }
    return json({ ok: true, changements })
  }

  const statut = corps?.statut
  if (!estStatutHote(statut)) return json({ erreur: "Action inconnue." }, 400)
  const resultat = await moteur.changerStatut(id, statut, mot ? `${NOTES[statut]} : « ${mot} »` : NOTES[statut])
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
  journaliser(membre, "reservation", ACTIONS[statut], () => decrireReservation(id))
  // Le client est prévenu par e-mail, après la réponse
  after(() => notifierDecisionDesHotes(id, statut, mot))
  rafraichirSite()
  return json({ ok: true })
})
