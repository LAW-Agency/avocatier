import { decrireReservation, journaliser, json, lireCorps, pourLesHotes } from "@/lib/api/hotes"
import { formaterPrix } from "@/lib/reservation/dates"
import { gestion } from "@/lib/reservation"
import type { ModePaiement } from "@/lib/reservation/types"

// Encaissement d'une réservation : { reservationId, montant (euros, négatif = remboursement), mode, note }
export const POST = pourLesHotes(async (requete, membre) => {
  const c = await lireCorps(requete)
  const reservationId = String(c?.reservationId ?? "")
  const montant = Number(c?.montant)
  const resultat = await gestion.ajouterPaiement(reservationId, { montant, mode: String(c?.mode ?? "") as ModePaiement, note: String(c?.note ?? "") }, membre.id)
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 400)
  journaliser(membre, "paiement", montant < 0 ? "Remboursement enregistré" : "Encaissement enregistré", async () =>
    `${formaterPrix(Math.abs(montant))} · ${await decrireReservation(reservationId)}`,
  )
  return json({ ok: true })
})
