"use client"

import { usePathname } from "next/navigation"
import { cn } from "cn"
import { LogoEspaceHotes } from "@/components/admin/BarreLaterale"
import { SqueletteFicheClient, SqueletteListe, SquelettePlanning, SqueletteTableauDeBord } from "@/components/admin/Squelettes"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

// Contenu de page selon l'adresse : le même squelette que le loading.tsx de la rubrique
function SqueletteContenu() {
  const chemin = usePathname()
  if (chemin.startsWith("/admin/reservations")) return <SqueletteListe avecFiltres lignes={7} />
  if (chemin.startsWith("/admin/planning")) return <SquelettePlanning />
  if (/^\/admin\/clients\/[^/]+/.test(chemin)) return <SqueletteFicheClient />
  if (chemin.startsWith("/admin/clients")) return <SqueletteListe lignes={4} />
  if (chemin.startsWith("/admin/tarifs")) return <SqueletteListe lignes={5} />
  return <SqueletteTableauDeBord />
}

// Blocs gris sur le vert nuit de la barre latérale (bg-muted y serait trop clair)
const grisBarre = "bg-sidebar-accent"

// Premier affichage de l'espace hôtes, pendant la vérification du compte et le chargement des données
// (Suspense de app/admin/layout.tsx) : barre latérale, barre du haut et page en squelette, mêmes dimensions
export default function SqueletteEspaceHotes({ ouverte }: { ouverte: boolean }) {
  return (
    <SidebarProvider defaultOpen={ouverte} data-espace-hotes className="font-sans text-foreground">
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-14 justify-center border-b border-sidebar-border">
          <LogoEspaceHotes />
        </SidebarHeader>
        <SidebarContent aria-hidden="true" className="gap-0 pt-2">
          {[
            ["w-24", "w-28", "w-20"],
            ["w-16", "w-14"],
          ].map((largeurs) => (
            <SidebarGroup key={largeurs.join()}>
              <Skeleton className={cn("mx-2 my-2.5 h-3 w-20 group-data-[collapsible=icon]:hidden", grisBarre)} />
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {largeurs.map((largeur) => (
                    <SidebarMenuItem key={largeur} className="flex h-9 items-center gap-3 px-2.5 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:px-2">
                      <Skeleton className={cn("size-4 shrink-0", grisBarre)} />
                      <Skeleton className={cn("h-3.5 group-data-[collapsible=icon]:hidden", largeur, grisBarre)} />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
          {/* Carte « Ce soir », barre ouverte seulement */}
          <SidebarGroup className="mt-auto pb-5 group-data-[collapsible=icon]:hidden">
            <Skeleton className={cn("h-31 rounded-lg", grisBarre)} />
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter aria-hidden="true" className="border-t border-sidebar-border py-3">
          <div className="flex h-12 items-center gap-2 p-2 group-data-[collapsible=icon]:p-0">
            <Skeleton className={cn("size-8 shrink-0 rounded-lg", grisBarre)} />
            <div className="flex flex-1 flex-col gap-1.5 group-data-[collapsible=icon]:hidden">
              <Skeleton className={cn("h-3.5 w-28", grisBarre)} />
              <Skeleton className={cn("h-3 w-36", grisBarre)} />
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-30 shrink-0 border-b bg-background/90 backdrop-blur">
          <div className="flex h-14 w-full items-center gap-2 px-4 md:px-6 lg:px-8">
            <SidebarTrigger className="-ml-1.5" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Skeleton className="h-4 w-40" aria-hidden="true" />
            <Skeleton className="ml-auto hidden h-4 w-36 sm:block" aria-hidden="true" />
          </div>
        </header>
        <div className="flex w-full flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
          <SqueletteContenu />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
