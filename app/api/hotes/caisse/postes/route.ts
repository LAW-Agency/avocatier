import { journaliser, json, lireCorps, pourLaCaisse } from "@/lib/api/hotes"
import { caisse } from "@/lib/reservation"

// Poste de caisse : { id (créé par le logiciel), nom }. Créé à sa première utilisation, renommé ensuite ; renvoie
// son préfixe de numérotation et le plus haut numéro de ticket reçu
export const POST = pourLaCaisse(async (requete, membre) => {
  const c = await lireCorps(requete)
  const resultat = await caisse.enregistrerPoste(String(c?.id ?? ""), String(c?.nom ?? ""))
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 400)
  journaliser(membre, "restaurant", "Poste de caisse enregistré", `${resultat.poste.nom} · ${resultat.poste.prefixe}`)
  return json({ ok: true, poste: resultat.poste })
})
