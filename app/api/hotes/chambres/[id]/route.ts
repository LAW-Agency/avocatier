import { journaliser, json, lireCorps, nomChambre, pourLesGerants, pourLesHotes, rafraichirSite } from "@/lib/api/hotes"
import { gestion, moteur } from "@/lib/reservation"
import type { EtatChambre, ModificationChambre } from "@/lib/reservation/types"

const ETATS: Record<EtatChambre, string> = { propre: "propre", a_nettoyer: "à nettoyer", maintenance: "en maintenance" }

// Chambre modifiée : { etat?, noteEtat? } (ménage et maintenance, toute l'équipe) ; { numero?, active? } (gérants :
// renommer, retirer de la vente ou y remettre)
export const PATCH = pourLesHotes(async (requete, membre, contexte: RouteContext<"/api/hotes/chambres/[id]">) => {
  const { id } = await contexte.params
  const corps = await lireCorps(requete)
  const modification: ModificationChambre = {
    ...(corps?.etat !== undefined && { etat: String(corps.etat) as EtatChambre }),
    ...(corps?.noteEtat !== undefined && { noteEtat: String(corps.noteEtat).trim() }),
    ...(corps?.numero !== undefined && { numero: String(corps.numero) }),
    ...(typeof corps?.active === "boolean" && { active: corps.active }),
  }
  if ((modification.numero !== undefined || modification.active !== undefined) && membre.role !== "hote") {
    return json({ erreur: "Réservé aux gérants." }, 403)
  }
  const avant = (await moteur.listerChambres()).find((c) => c.id === id)
  const resultat = await gestion.modifierChambre(id, modification)
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)

  const { etat, noteEtat, numero, active } = modification
  if (etat !== undefined || noteEtat !== undefined) {
    journaliser(membre, "chambre", "État de chambre modifié", async () =>
      [`${await nomChambre(id)} : ${ETATS[etat ?? avant?.etat ?? "propre"]}`, noteEtat ?? avant?.noteEtat].filter(Boolean).join(" · "),
    )
  }
  if (numero !== undefined && avant && numero.trim() !== avant.numero) {
    journaliser(membre, "chambre", "Chambre renommée", async () => `${avant.numero} → ${await nomChambre(id)}`)
  }
  if (active !== undefined && active !== avant?.active) {
    journaliser(membre, "chambre", active ? "Chambre remise en vente" : "Chambre désactivée", () => nomChambre(id))
    // Une chambre de plus ou de moins à vendre : disponibilités du site à régénérer
    rafraichirSite()
  }
  return json({ ok: true })
})

// Chambre supprimée (gérants), seulement si aucune réservation n'y a jamais été faite
export const DELETE = pourLesGerants(async (_requete, membre, contexte: RouteContext<"/api/hotes/chambres/[id]">) => {
  const { id } = await contexte.params
  // Lu avant la suppression, pour le journal
  const nom = await nomChambre(id)
  const resultat = await gestion.supprimerChambre(id)
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
  journaliser(membre, "chambre", "Chambre supprimée", nom)
  rafraichirSite()
  return json({ ok: true })
})
