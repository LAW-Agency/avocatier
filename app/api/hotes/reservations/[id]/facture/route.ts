import { decrireReservation, journaliser, json, pourLesHotes } from "@/lib/api/hotes"
import { gestion } from "@/lib/reservation"

// Facture d'un séjour confirmé : numéro attribué à la première édition (« FA-2026-0001 »), le même ensuite.
// Le PDF est mis en page par le logiciel, avec les données qu'il a déjà
export const POST = pourLesHotes(async (_requete, membre, contexte: RouteContext<"/api/hotes/reservations/[id]/facture">) => {
  const { id } = await contexte.params
  const resultat = await gestion.numeroterFacture(id)
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
  journaliser(membre, "paiement", "Facture éditée", async () => `${resultat.numero} · ${await decrireReservation(id)}`)
  return json({ ok: true, numero: resultat.numero, le: resultat.le })
})
