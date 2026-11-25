import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { synchroniserAgenda } from "@/lib/agenda"
import { synchroniserCalendriers } from "@/lib/reservation/calendriers"

// Tâche planifiée de Vercel (vercel.json) : importe les calendriers des plateformes même quand le logiciel des
// hôtes est fermé, puis remet à jour l'agenda Google du propriétaire. Vercel envoie « Authorization: Bearer <CRON_SECRET> » ; sans CRON_SECRET, la route refuse tout
export async function GET(requete: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || requete.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ erreur: "Non autorisé." }, { status: 401 })
  }
  const bilans = await synchroniserCalendriers()
  if (bilans.some((b) => b.ajoutees.length > 0 || b.retirees > 0)) revalidatePath("/", "layout")
  // Rattrapage complet de l'agenda Google du propriétaire : options expirées dans la journée, échecs d'envoi
  const agenda = await synchroniserAgenda().catch((erreur: unknown) => ({ actif: true, erreurs: [String(erreur)] }))
  if (agenda.erreurs.length > 0) console.error("Agenda Google :", agenda.erreurs.join(" | "))
  return NextResponse.json(
    {
      calendriers: bilans.length,
      erreurs: bilans.filter((b) => b.erreur).length,
      agenda: agenda.actif ? { ...agenda, erreurs: agenda.erreurs.length } : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  )
}
