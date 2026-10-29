import { json, pourLesGerants } from "@/lib/api/hotes"
import { caisse } from "@/lib/reservation"
import { estDateISO } from "@/lib/reservation/dates"

// Ventes du restaurant et du bar sur une période (écran Revenus, gérants) : ?du=AAAA-MM-JJ&au=AAAA-MM-JJ compris
export const GET = pourLesGerants(async (requete) => {
  const du = requete.nextUrl.searchParams.get("du")
  const au = requete.nextUrl.searchParams.get("au")
  if (!estDateISO(du) || !estDateISO(au) || au < du) return json({ erreur: "Période invalide." }, 400)
  return json(await caisse.bilanPeriode({ du, au }))
})
