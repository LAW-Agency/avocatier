import { decrireReservation, journaliser, json, lireCorps, pourLesHotes } from "@/lib/api/hotes"
import { formaterPrix } from "@/lib/reservation/dates"
import { formaterDansDevise } from "@/lib/reservation/devises"
import { gestion } from "@/lib/reservation"
import type { CodeDevise, ModePaiement } from "@/lib/reservation/types"

// Encaissement d'une réservation : { reservationId, montant (dans la devise, négatif = remboursement), devise
// (EUR par défaut, MGA, USD…), mode, note } ; contre-valeur en euros calculée au taux du jour
export const POST = pourLesHotes(async (requete, membre) => {
  const c = await lireCorps(requete)
  const reservationId = String(c?.reservationId ?? "")
  const montant = Number(c?.montant)
  const devise = String(c?.devise ?? "EUR") as CodeDevise
  const resultat = await gestion.ajouterPaiement(
    reservationId,
    { montantDevise: montant, devise, mode: String(c?.mode ?? "") as ModePaiement, note: String(c?.note ?? "") },
    membre.id,
  )
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 400)
  journaliser(membre, "paiement", montant < 0 ? "Remboursement enregistré" : "Encaissement enregistré", async () =>
    `${devise === "EUR" ? formaterPrix(Math.abs(montant)) : formaterDansDevise(Math.abs(montant), devise)} · ${await decrireReservation(reservationId)}`,
  )
  return json({ ok: true })
})
