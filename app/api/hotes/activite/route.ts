import { json, pourLesHotes } from "@/lib/api/hotes"
import { moteur } from "@/lib/reservation"

// Suivi en direct du logiciel des hôtes : événements des réservations survenus depuis le curseur
export const GET = pourLesHotes(async (requete) => {
  const depuis = requete.nextUrl.searchParams.get("depuis")
  const valide = depuis !== null && !Number.isNaN(Date.parse(depuis))
  return json(await moteur.activiteDepuis(valide ? new Date(depuis).toISOString() : null))
})
