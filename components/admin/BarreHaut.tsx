"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const RUBRIQUES: Record<string, string> = {
  "/admin/reservations": "Réservations",
  "/admin/planning": "Planning",
  "/admin/clients": "Clients",
  "/admin/tarifs": "Tarifs",
}

// Fil d'Ariane déduit de l'adresse : Espace hôtes › rubrique › fiche
function filDAriane(chemin: string): { label: string; href?: string }[] {
  if (chemin === "/admin") return [{ label: "Aujourd'hui" }]
  const rubrique = Object.keys(RUBRIQUES).find((r) => chemin === r || chemin.startsWith(`${r}/`))
  if (!rubrique) return []
  if (chemin === rubrique) return [{ label: RUBRIQUES[rubrique] }]
  return [{ label: RUBRIQUES[rubrique], href: rubrique }, { label: "Fiche" }]
}

// Barre du haut, collée au défilement : bouton du menu, fil d'Ariane, date du jour
export default function BarreHaut({ dateDuJour }: { dateDuJour: string }) {
  const chemin = usePathname()
  const fil = filDAriane(chemin)

  return (
    // Mêmes marges que le contenu de la page (pleine largeur) ;
    // -ml-1.5 : l'icône du bouton s'aligne sur le bord du contenu
    <header className="sticky top-0 z-30 shrink-0 border-b bg-background/90 backdrop-blur">
      <div className="flex h-14 w-full items-center gap-2 px-4 md:px-6 lg:px-8">
        <SidebarTrigger className="-ml-1.5" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink asChild>
                <Link href="/admin">Espace hôtes</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {fil.map((etape, i) => (
              <Fragment key={etape.label}>
                <BreadcrumbSeparator className={i === 0 ? "hidden md:block" : undefined} />
                <BreadcrumbItem>
                  {etape.href ? (
                    <BreadcrumbLink asChild>
                      <Link href={etape.href}>{etape.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{etape.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <p className="ml-auto hidden text-sm text-muted-foreground first-letter:uppercase sm:block">{dateDuJour}</p>
      </div>
    </header>
  )
}
