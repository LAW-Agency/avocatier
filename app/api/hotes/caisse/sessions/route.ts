import { journaliser, json, lireCorps, pourLaCaisse } from "@/lib/api/hotes"
import { caisse } from "@/lib/reservation"
import { formaterDansDevise } from "@/lib/reservation/devises"

// Ouverture de la caisse d'un poste : { id (créé par le logiciel), posteId, fondCaisse (ariary) }, à l'heure du
// serveur. Renvoyer la même ouverture ne la duplique pas
export const POST = pourLaCaisse(async (requete, membre) => {
  const c = await lireCorps(requete)
  const resultat = await caisse.ouvrirSession(
    { id: String(c?.id ?? ""), posteId: String(c?.posteId ?? ""), fondCaisse: Number(c?.fondCaisse) },
    membre.id,
  )
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
  const { session } = resultat
  if (!resultat.deja) {
    journaliser(membre, "restaurant", "Caisse ouverte", async () => `${await caisse.nomPoste(session.posteId)} · fond de caisse ${formaterDansDevise(session.fondCaisse, "MGA")}`)
  }
  return json({ ok: true, session, deja: resultat.deja })
})
