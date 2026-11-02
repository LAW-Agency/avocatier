import { journaliser, json, lireCorps, pourLesGerants } from "@/lib/api/hotes"
import { gestion } from "@/lib/reservation"
import { formaterDansDevise } from "@/lib/reservation/devises"

// Annuler une facture figée par un avoir (gérants) : { annuler: true, motif }. La facture reste, marquée annulée ;
// ses séjours redeviennent modifiables puis facturables de nouveau. Le PDF de l'avoir est mis en page par le logiciel
export const PATCH = pourLesGerants(async (requete, membre, contexte: RouteContext<"/api/hotes/factures/[id]">) => {
  const { id } = await contexte.params
  const c = await lireCorps(requete)
  if (c?.annuler !== true) return json({ erreur: "Seule l'annulation d'une facture est possible." }, 400)
  const resultat = await gestion.annulerFacture(id, String(c.motif ?? ""), membre.id)
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
  const f = resultat.facture
  journaliser(membre, "paiement", "Facture annulée par un avoir", `${f.numero} → ${f.annulation?.avoir} · ${formaterDansDevise(f.total, f.devise)} · « ${f.annulation?.motif} »`)
  return json({ ok: true, facture: f })
})
