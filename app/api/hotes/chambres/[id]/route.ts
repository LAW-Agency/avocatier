import { json, lireCorps, pourLesHotes } from "@/lib/api/hotes"
import { gestion } from "@/lib/reservation"
import type { EtatChambre } from "@/lib/reservation/types"

// Ménage et maintenance d'un hébergement : { etat, noteEtat }
export const PATCH = pourLesHotes(async (requete, _membre, contexte: RouteContext<"/api/hotes/chambres/[id]">) => {
  const { id } = await contexte.params
  const corps = await lireCorps(requete)
  const resultat = await gestion.modifierChambre(id, String(corps?.etat ?? "") as EtatChambre, String(corps?.noteEtat ?? ""))
  return resultat.ok ? json({ ok: true }) : json({ erreur: resultat.erreur }, 400)
})
