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
        <SidebarContent aria-hidden="true">
          <SidebarGroup>
            <Skeleton className={cn("mx-2 my-2.5 h-3 w-16 group-data-[collapsible=icon]:hidden", grisBarre)} />
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {["w-24", "w-28", "w-20", "w-16"].map((largeur) => (
                  <SidebarMenuItem key={largeur} className="flex h-8 items-center gap-2 px-2">
                    <Skeleton className={cn("size-4 shrink-0", grisBarre)} />
                    <Skeleton className={cn("h-3.5 group-data-[collapsible=icon]:hidden", largeur, grisBarre)} />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter aria-hidden="true">
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
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Skeleton className="h-4 w-40" aria-hidden="true" />
          <Skeleton className="ml-auto hidden h-4 w-36 sm:block" aria-hidden="true" />
        </header>
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 p-4 md:p-6 lg:p-8">
          <SqueletteContenu />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
