import { decrireReservation, journaliser, json, lireCorps, pourLesHotes } from "@/lib/api/hotes"
import { gestion, moteur } from "@/lib/reservation"
import { formaterDansDevise } from "@/lib/reservation/devises"
import type { CodeDevise } from "@/lib/reservation/types"

// Facture d'un séjour confirmé : { devise } (EUR, MGA, USD…). Figée à la première édition (séjour, restaurant et bar,
// règlements, taux du jour), avec les autres chambres de son groupe au nom du même client ; la même ensuite.
// Séjour facturé avant la caisse du restaurant : son ancien numéro (« FA-2026-0001 ») pour la réimprimer.
// Le PDF est mis en page par le logiciel
export const POST = pourLesHotes(async (requete, membre, contexte: RouteContext<"/api/hotes/reservations/[id]/facture">) => {
  const { id } = await contexte.params
  const r = await moteur.trouverReservation(id)
  if (r?.factureNumero) {
    const ancienne = await gestion.numeroterFacture(id)
    if (!ancienne.ok) return json({ erreur: ancienne.erreur }, 409)
    return json({ ok: true, ancienne: { numero: ancienne.numero, le: ancienne.le } })
  }
  const c = await lireCorps(requete)
  const resultat = await gestion.editerFacture(id, String(c?.devise ?? "EUR") as CodeDevise, membre.id)
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
  const { facture } = resultat
  if (!resultat.deja) {
    journaliser(membre, "paiement", "Facture éditée", async () => `${facture.numero} · ${formaterDansDevise(facture.total, facture.devise)} · ${await decrireReservation(id)}`)
  }
  return json({ ok: true, facture })
})
