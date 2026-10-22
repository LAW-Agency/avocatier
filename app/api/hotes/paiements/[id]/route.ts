import { decrireReservation, journaliser, json, pourLesGerants } from "@/lib/api/hotes"
import { formaterPrix } from "@/lib/reservation/dates"
import { gestion } from "@/lib/reservation"

// Supprimer un encaissement saisi par erreur : réservé aux gérants (la réception saisit un remboursement)
export const DELETE = pourLesGerants(async (_requete, membre, contexte: RouteContext<"/api/hotes/paiements/[id]">) => {
  const { id } = await contexte.params
  // Lu avant la suppression, pour le journal
  const paiement = (await gestion.listerPaiements()).find((p) => p.id === id)
  if (!paiement || !(await gestion.supprimerPaiement(id))) return json({ erreur: "Cet encaissement n'existe plus." }, 404)
  journaliser(membre, "paiement", "Encaissement supprimé", async () => `${formaterPrix(paiement.montant)} · ${await decrireReservation(paiement.reservationId)}`)
  return json({ ok: true })
})
