import { json, pourLaCaisse } from "@/lib/api/hotes"
import { caisse, moteur } from "@/lib/reservation"
import { ajouterJours, aujourdhuiISO, estDateISO } from "@/lib/reservation/dates"

// Écran Restaurant et Bar : carte, postes, tickets de la période (?du=AAAA-MM-JJ&au=AAAA-MM-JJ, aujourd'hui par
// défaut, 92 jours au plus), séjours en cours (pour mettre un ticket sur la chambre) et taux des devises
export const GET = pourLaCaisse(async (requete) => {
  const parametres = requete.nextUrl.searchParams
  const aujourdhui = aujourdhuiISO()
  const du = parametres.get("du") ?? aujourdhui
  const au = parametres.get("au") ?? du
  if (!estDateISO(du) || !estDateISO(au) || au < du) return json({ erreur: "Période invalide." }, 400)
  if (ajouterJours(du, 92) < au) return json({ erreur: "92 jours au plus à la fois." }, 400)
  const [donnees, devises] = await Promise.all([caisse.donnees({ du, au }), moteur.reglagesDevises()])
  return json({ ...donnees, devises, aujourdhui })
})
