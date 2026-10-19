import { NextResponse, type NextRequest } from "next/server"
import { clientConnecte } from "@/lib/auth/dal"
import { moteur } from "@/lib/reservation"

// Suivi en direct de l'espace hôtes (components/admin/SuiviEnDirect.tsx) : événements des réservations
// survenus depuis le curseur. Réponse JSON (pas de redirection comme exigerHote : c'est un fetch)
export async function GET(requete: NextRequest) {
  const client = await clientConnecte()
  if (client?.role !== "hote") return NextResponse.json({ erreur: "Accès réservé aux hôtes." }, { status: 401 })

  const depuis = requete.nextUrl.searchParams.get("depuis")
  const valide = depuis !== null && !Number.isNaN(Date.parse(depuis))
  const fil = await moteur.activiteDepuis(valide ? new Date(depuis).toISOString() : null)
  return NextResponse.json(fil, { headers: { "Cache-Control": "no-store" } })
}
