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
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="-ml-1" />
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
    </header>
  )
}
