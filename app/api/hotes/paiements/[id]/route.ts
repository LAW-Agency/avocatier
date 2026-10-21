import { json, pourLesGerants } from "@/lib/api/hotes"
import { gestion } from "@/lib/reservation"

// Supprimer un encaissement saisi par erreur : réservé aux gérants (la réception saisit un remboursement)
export const DELETE = pourLesGerants(async (_requete, _membre, contexte: RouteContext<"/api/hotes/paiements/[id]">) => {
  const { id } = await contexte.params
  return (await gestion.supprimerPaiement(id)) ? json({ ok: true }) : json({ erreur: "Cet encaissement n'existe plus." }, 404)
})
