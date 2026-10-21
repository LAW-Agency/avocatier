import { json, lireCorps, pourLesHotes } from "@/lib/api/hotes"
import { gestion } from "@/lib/reservation"
import type { ModePaiement } from "@/lib/reservation/types"

// Encaissement d'une réservation : { reservationId, montant (euros, négatif = remboursement), mode, note }
export const POST = pourLesHotes(async (requete, membre) => {
  const c = await lireCorps(requete)
  const resultat = await gestion.ajouterPaiement(
    String(c?.reservationId ?? ""),
    { montant: Number(c?.montant), mode: String(c?.mode ?? "") as ModePaiement, note: String(c?.note ?? "") },
    membre.id,
  )
  return resultat.ok ? json({ ok: true }) : json({ erreur: resultat.erreur }, 400)
})
