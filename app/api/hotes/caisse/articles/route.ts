import { journaliser, json, lireCorps, pourLaCaisse } from "@/lib/api/hotes"
import { caisse } from "@/lib/reservation"
import { formaterDansDevise } from "@/lib/reservation/devises"

// Nouvel article de la carte : { nom, categorie, prix (ariary), description?, ordre? }
export const POST = pourLaCaisse(async (requete, membre) => {
  const c = await lireCorps(requete)
  const resultat = await caisse.creerArticle({
    nom: String(c?.nom ?? ""),
    categorie: String(c?.categorie ?? ""),
    prix: Number(c?.prix),
    description: String(c?.description ?? ""),
    ...(typeof c?.ordre === "number" && { ordre: c.ordre }),
  })
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 400)
  const { article } = resultat
  journaliser(membre, "restaurant", "Article ajouté à la carte", `${article.nom} · ${article.categorie} · ${formaterDansDevise(article.prix, "MGA")}`)
  return json({ ok: true, article })
})
