import { journaliser, json, lireCorps, nomHebergement, pourLesHotes } from "@/lib/api/hotes"
import { gestion } from "@/lib/reservation"
import type { EtatChambre } from "@/lib/reservation/types"

const ETATS: Record<EtatChambre, string> = { propre: "propre", a_nettoyer: "à nettoyer", maintenance: "en maintenance" }

// Ménage et maintenance d'un hébergement : { etat, noteEtat }
export const PATCH = pourLesHotes(async (requete, membre, contexte: RouteContext<"/api/hotes/chambres/[id]">) => {
  const { id } = await contexte.params
  const corps = await lireCorps(requete)
  const etat = String(corps?.etat ?? "") as EtatChambre
  const noteEtat = String(corps?.noteEtat ?? "").trim()
  const resultat = await gestion.modifierChambre(id, etat, noteEtat)
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 400)
  journaliser(membre, "chambre", "État de chambre modifié", async () => [`${await nomHebergement(id)} : ${ETATS[etat]}`, noteEtat].filter(Boolean).join(" · "))
  return json({ ok: true })
})
