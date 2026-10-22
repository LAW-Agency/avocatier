import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { synchroniserCalendriers } from "@/lib/reservation/calendriers"

// Tâche planifiée de Vercel (vercel.json) : importe les calendriers des plateformes même quand le logiciel des
// hôtes est fermé. Vercel envoie « Authorization: Bearer <CRON_SECRET> » ; sans CRON_SECRET, la route refuse tout
export async function GET(requete: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || requete.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ erreur: "Non autorisé." }, { status: 401 })
  }
  const bilans = await synchroniserCalendriers()
  if (bilans.some((b) => b.ajoutees.length > 0 || b.retirees > 0)) revalidatePath("/", "layout")
  return NextResponse.json(
    { calendriers: bilans.length, erreurs: bilans.filter((b) => b.erreur).length },
    { headers: { "Cache-Control": "no-store" } },
  )
}
