import type { Metadata } from "next"
import { cookies } from "next/headers"
import { Suspense, type ReactNode } from "react"
import BarreHaut from "@/components/admin/BarreHaut"
import BarreLaterale from "@/components/admin/BarreLaterale"
import SqueletteEspaceHotes from "@/components/admin/SqueletteEspaceHotes"
import SuiviEnDirect from "@/components/admin/SuiviEnDirect"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { exigerHote } from "@/lib/auth/dal"
import { aujourdhuiISO, formaterDate } from "@/lib/reservation/dates"
import { donneesHotes, situationDuJour } from "@/lib/reservation/hotes"

export const metadata: Metadata = {
  title: "Espace hôtes | Chez L'Avocatier",
  robots: { index: false, follow: false },
}

// Espace de Joëlle & Stéphane, sans le header ni le footer du site (voir components/ChromeSite.tsx).
// Premier affichage : tout l'espace en squelette (barre latérale, barre du haut, page) le temps de vérifier
// le compte et de charger les données ; ensuite, d'une rubrique à l'autre, seuls les loading.tsx des pages.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Barre latérale repliée ou non : le composant Sidebar mémorise son état dans ce cookie (lu avant le
  // squelette pour qu'il ait déjà la bonne largeur)
  const ouverte = (await cookies()).get("sidebar_state")?.value !== "false"

  return (
    <Suspense fallback={<SqueletteEspaceHotes ouverte={ouverte} />}>
      <EspaceHotes ouverte={ouverte}>{children}</EspaceHotes>
    </Suspense>
  )
}

// Chaque page revérifie aussi le rôle (exigerHote)
async function EspaceHotes({ ouverte, children }: { ouverte: boolean; children: ReactNode }) {
  const [hote, donnees] = await Promise.all([exigerHote(), donneesHotes()])
  const aTraiter = donnees.reservations.filter((r) => r.statut === "option").length
  const { arrivees, departs, occupes, total } = situationDuJour(donnees, aujourdhuiISO())

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={ouverte} data-espace-hotes className="font-sans text-foreground">
        <BarreLaterale
          hote={{ prenom: hote.prenom, nom: hote.nom, email: hote.email }}
          aTraiter={aTraiter}
          ceSoir={{ arrivees: arrivees.length, departs: departs.length, occupes, total }}
        />
        <SidebarInset className="min-w-0">
          <BarreHaut dateDuJour={formaterDate(aujourdhuiISO(), { weekday: "long", month: "long" })}>
            <SuiviEnDirect aTraiter={aTraiter} />
          </BarreHaut>
          <div className="flex w-full flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">{children}</div>
        </SidebarInset>
        {/* Annonces du suivi en direct (nouvelle demande, annulation par le client, option expirée) */}
        <Toaster position="bottom-right" />
      </SidebarProvider>
    </TooltipProvider>
  )
}
