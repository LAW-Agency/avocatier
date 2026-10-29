import { json, pourLaCaisse } from "@/lib/api/hotes"
import { moteur } from "@/lib/reservation"

// Suivi en direct du logiciel des hôtes : événements des réservations survenus depuis le curseur. Un caissier ne
// suit pas les réservations : fil vide et curseur fixe (le logiciel n'y voit jamais de nouveauté)
export const GET = pourLaCaisse(async (requete, membre) => {
  if (membre.role === "caissier") return json({ curseur: new Date(0).toISOString(), total: 0, evenements: [] })
  const depuis = requete.nextUrl.searchParams.get("depuis")
  const valide = depuis !== null && !Number.isNaN(Date.parse(depuis))
  return json(await moteur.activiteDepuis(valide ? new Date(depuis).toISOString() : null))
})
