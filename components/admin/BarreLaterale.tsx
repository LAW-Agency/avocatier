"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarRange, ChevronsUpDown, ExternalLink, Inbox, LogOut, SunMedium, Tags, Users, type LucideIcon } from "lucide-react"
import { deconnexion } from "@/app/compte/actions"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { pluriel } from "@/lib/reservation/dates"

// Centré dans la barre. Ouverte : logo texte ; repliée en icônes : l'avocat seul. Logos blancs sur le vert nuit, sans cadre.
// Aussi affiché par le squelette de chargement (SqueletteEspaceHotes)
export function LogoEspaceHotes({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/admin"
      onClick={onClick}
      aria-label="Chez L'Avocatier, espace hôtes"
      className="flex items-center justify-center gap-3 rounded-md px-2 outline-hidden ring-sidebar-ring focus-visible:ring-2 group-data-[collapsible=icon]:px-0"
    >
      <Image src="/logo-texte-blanc.svg" alt="" width={1998} height={421} className="h-8 w-auto group-data-[collapsible=icon]:hidden" />
      <Image src="/logo-blanc.svg" alt="" width={824} height={973} className="hidden h-8 w-auto group-data-[collapsible=icon]:block" />
    </Link>
  )
}

type Lien = { href: string; label: string; icone: LucideIcon; badge?: number }

// Situation de la nuit à venir, calculée par app/admin/layout.tsx (situationDuJour)
export type CeSoir = { arrivees: number; departs: number; occupes: number; total: number }

interface BarreLateraleProps {
  hote: { prenom: string; nom: string; email: string }
  aTraiter: number // demandes en option, affichées en pastille
  ceSoir: CeSoir
}

// « Aujourd'hui » n'est actif que sur /admin même ; les autres rubriques aussi sur leurs sous-pages
function estActif(chemin: string, href: string) {
  return href === "/admin" ? chemin === "/admin" : chemin === href || chemin.startsWith(`${href}/`)
}

// Rubriques en deux groupes : le suivi des séjours au jour le jour, puis le fichier clients et les tarifs
function groupes(aTraiter: number): { titre: string; liens: Lien[] }[] {
  return [
    {
      titre: "Au quotidien",
      liens: [
        { href: "/admin", label: "Aujourd'hui", icone: SunMedium },
        { href: "/admin/reservations", label: "Réservations", icone: Inbox, badge: aTraiter },
        { href: "/admin/planning", label: "Planning", icone: CalendarRange },
      ],
    },
    {
      titre: "Gestion",
      liens: [
        { href: "/admin/clients", label: "Clients", icone: Users },
        { href: "/admin/tarifs", label: "Tarifs", icone: Tags },
      ],
    },
  ]
}

// Navigation de l'espace hôtes : repliable en icônes sur ordinateur, panneau coulissant sur mobile
export default function BarreLaterale({ hote, aTraiter, ceSoir }: BarreLateraleProps) {
  const chemin = usePathname()
  // Sur mobile, le panneau se referme dès qu'on choisit une rubrique
  const { setOpenMobile } = useSidebar()
  const fermerSurMobile = () => setOpenMobile(false)
  const initiales = `${hote.prenom[0] ?? ""}${hote.nom[0] ?? ""}`.toUpperCase()

  return (
    <Sidebar collapsible="icon">
      {/* Même hauteur et même filet que la barre du haut : les deux bordures se prolongent */}
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border">
        <LogoEspaceHotes onClick={fermerSurMobile} />
      </SidebarHeader>

      <SidebarContent className="gap-0 pt-2">
        {groupes(aTraiter).map((groupe) => (
          <SidebarGroup key={groupe.titre}>
            <SidebarGroupLabel className="text-[0.6875rem] tracking-wider uppercase">{groupe.titre}</SidebarGroupLabel>
            <SidebarGroupContent>
              {/* Espace entre les rubriques : la rubrique active et celle survolée ne se touchent pas */}
              <SidebarMenu className="gap-1">
                {groupe.liens.map((lien) => {
                  const actif = estActif(chemin, lien.href)
                  return (
                    <SidebarMenuItem key={lien.href}>
                      {/* Rubrique active : repère sable collé au bord gauche de la barre (masqué une fois repliée) */}
                      {actif ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-2 -left-2 w-[3px] rounded-r-full bg-sidebar-primary group-data-[collapsible=icon]:hidden"
                        />
                      ) : null}
                      <SidebarMenuButton
                        asChild
                        isActive={actif}
                        tooltip={lien.label}
                        className="h-9 gap-3 px-2.5 hover:bg-sidebar-accent/60 data-active:bg-sidebar-accent data-active:[&>svg]:text-sidebar-primary"
                      >
                        <Link href={lien.href} aria-current={actif ? "page" : undefined} onClick={fermerSurMobile}>
                          <lien.icone />
                          <span>{lien.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {lien.badge ? (
                        <>
                          <SidebarMenuBadge className="top-2! right-2 rounded-full bg-sidebar-primary px-1.5 text-sidebar-primary-foreground peer-hover/menu-button:text-sidebar-primary-foreground peer-data-active/menu-button:text-sidebar-primary-foreground">
                            {lien.badge}
                            <span className="sr-only"> à traiter</span>
                          </SidebarMenuBadge>
                          {/* Barre repliée : le nombre disparaît, une pastille signale qu'il reste des demandes */}
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute top-1 right-1 hidden size-2 rounded-full bg-sidebar-primary ring-2 ring-sidebar group-data-[collapsible=icon]:block"
                          />
                        </>
                      ) : null}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Bas de la barre ouverte : la nuit à venir d'un coup d'œil (« Voir le site » est dans le menu du compte) */}
        <SidebarGroup className="mt-auto pb-5 group-data-[collapsible=icon]:hidden">
          <CarteCeSoir ceSoir={ceSoir} onClick={fermerSurMobile} />
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="hover:bg-sidebar-accent/60 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-sidebar-primary font-medium text-sidebar-primary-foreground">
                      {initiales}
                    </AvatarFallback>
                  </Avatar>
                  <span className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium text-sidebar-accent-foreground">
                      {hote.prenom} {hote.nom}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/70">{hote.email}</span>
                  </span>
                  <ChevronsUpDown className="ml-auto text-sidebar-foreground/70" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              {/* Décalé de 20 px : le menu s'ouvre à 12 px du bord de la barre, ouverte ou repliée */}
              <DropdownMenuContent side="right" align="end" sideOffset={20} className="min-w-56">
                <DropdownMenuLabel className="font-normal">
                  <span className="block font-medium text-foreground">
                    {hote.prenom} {hote.nom}
                  </span>
                  <span className="block truncate text-xs">{hote.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/" target="_blank">
                      <ExternalLink />
                      Voir le site
                    </Link>
                  </DropdownMenuItem>
                  {/* Déconnexion par Server Action : le bouton du menu soumet le formulaire caché */}
                  <DropdownMenuItem asChild>
                    <button type="submit" form="deconnexion-hote" className="w-full">
                      <LogOut />
                      Se déconnecter
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <form id="deconnexion-hote" action={deconnexion} hidden />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

// Occupation de la nuit à venir : un segment par hébergement (sable = occupé ou bloqué), puis les mouvements du jour.
// Mène au planning.
function CarteCeSoir({ ceSoir, onClick }: { ceSoir: CeSoir; onClick: () => void }) {
  const { arrivees, departs, occupes, total } = ceSoir
  if (total === 0) return null

  return (
    <Link
      href="/admin/planning"
      onClick={onClick}
      className="block rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-4 outline-hidden ring-sidebar-ring transition-colors hover:bg-sidebar-accent/70 focus-visible:ring-2"
    >
      <p className="text-[0.6875rem] font-medium tracking-wider text-sidebar-foreground/70 uppercase">Ce soir</p>
      <p className="mt-1 text-sm text-sidebar-foreground">
        <span className="text-xl font-semibold text-sidebar-accent-foreground tabular-nums">{occupes}</span>
        <span className="tabular-nums"> sur {total}</span> {total > 1 ? "hébergements occupés" : "hébergement occupé"}
      </p>
      <div aria-hidden="true" className="mt-2.5 flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i < occupes ? "h-1.5 flex-1 rounded-full bg-sidebar-primary" : "h-1.5 flex-1 rounded-full bg-sidebar-border"} />
        ))}
      </div>
      <p className="mt-2.5 text-xs text-sidebar-foreground/70 tabular-nums">
        {pluriel(arrivees, "arrivée")} · {pluriel(departs, "départ")}
      </p>
    </Link>
  )
}
