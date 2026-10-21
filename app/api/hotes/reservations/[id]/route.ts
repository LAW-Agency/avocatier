import { after } from "next/server"
import { json, lireCorps, pourLesHotes, rafraichirSite } from "@/lib/api/hotes"
import { notifierDecisionDesHotes } from "@/lib/email/notifications"
import { gestion, moteur } from "@/lib/reservation"
import type { StatutReservation } from "@/lib/reservation/types"

const STATUTS_HOTE = ["confirmee", "refusee", "annulee"] as const
type StatutHote = (typeof STATUTS_HOTE)[number]
const estStatutHote = (valeur: unknown): valeur is StatutHote => (STATUTS_HOTE as readonly unknown[]).includes(valeur)
const NOTES: Partial<Record<StatutReservation, string>> = {
  confirmee: "Confirmée par les hôtes",
  refusee: "Déclinée par les hôtes",
  annulee: "Annulée par les hôtes",
}

// { statut } : confirmer ou refuser une demande, annuler une réservation confirmée.
// { mouvement: "arrivee" | "depart", annuler? } : arrivée ou départ du client enregistré par la réception.
export const PATCH = pourLesHotes(async (requete, _membre, contexte: RouteContext<"/api/hotes/reservations/[id]">) => {
  const { id } = await contexte.params
  const corps = await lireCorps(requete)

  if (corps?.mouvement === "arrivee" || corps?.mouvement === "depart") {
    const resultat = await gestion.enregistrerMouvement(id, corps.mouvement, corps.annuler === true)
    return resultat.ok ? json({ ok: true }) : json({ erreur: resultat.erreur }, 409)
  }

  const statut = corps?.statut
  if (!estStatutHote(statut)) return json({ erreur: "Action inconnue." }, 400)
  const resultat = await moteur.changerStatut(id, statut, NOTES[statut])
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
  // Le client est prévenu par e-mail, après la réponse
  after(() => notifierDecisionDesHotes(id, statut))
  rafraichirSite()
  return json({ ok: true })
})
