import { journaliser, json, lireCorps, pourLaCaisse } from "@/lib/api/hotes"
import { caisse } from "@/lib/reservation"
import { formaterDansDevise } from "@/lib/reservation/devises"
import type { ModificationArticle } from "@/lib/reservation/types"

// Modifier un article de la carte : { nom?, categorie?, prix?, description?, actif?, ordre? }
export const PATCH = pourLaCaisse(async (requete, membre, contexte: RouteContext<"/api/hotes/caisse/articles/[id]">) => {
  const { id } = await contexte.params
  const c = await lireCorps(requete)
  const modification: ModificationArticle = {}
  if (typeof c?.nom === "string") modification.nom = c.nom
  if (typeof c?.categorie === "string") modification.categorie = c.categorie
  if (c?.prix !== undefined) modification.prix = Number(c.prix)
  if (typeof c?.description === "string") modification.description = c.description
  if (typeof c?.actif === "boolean") modification.actif = c.actif
  if (typeof c?.ordre === "number") modification.ordre = c.ordre
  const resultat = await caisse.modifierArticle(id, modification)
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 400)
  const { article } = resultat
  const action = modification.actif === false ? "Article retiré de la carte" : modification.actif === true ? "Article remis à la carte" : "Article modifié"
  journaliser(membre, "restaurant", action, `${article.nom} · ${formaterDansDevise(article.prix, "MGA")}`)
  return json({ ok: true, article })
})

// Supprimer un article jamais vendu (sinon : le désactiver)
export const DELETE = pourLaCaisse(async (_requete, membre, contexte: RouteContext<"/api/hotes/caisse/articles/[id]">) => {
  const { id } = await contexte.params
  const resultat = await caisse.supprimerArticle(id)
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
  journaliser(membre, "restaurant", "Article supprimé de la carte", `${resultat.article.nom} · ${resultat.article.categorie}`)
  return json({ ok: true })
})
