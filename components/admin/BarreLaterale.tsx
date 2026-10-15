"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarRange, ChevronsUpDown, ExternalLink, Inbox, LogOut, SunMedium, Users, type LucideIcon } from "lucide-react"
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

// Ouverte : logo texte ; repliée en icônes : l'avocat seul. Logos blancs sur le vert nuit, sans cadre.
// Aussi affiché par le squelette de chargement (SqueletteEspaceHotes)
export function LogoEspaceHotes({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/admin"
      onClick={onClick}
      aria-label="Chez L'Avocatier, espace hôtes"
      className="flex items-center gap-3 rounded-md px-2 outline-hidden ring-sidebar-ring focus-visible:ring-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
    >
      <Image src="/logo-texte-blanc.svg" alt="" width={1998} height={421} className="h-8 w-auto group-data-[collapsible=icon]:hidden" />
      <Image src="/logo-blanc.svg" alt="" width={824} height={973} className="hidden h-8 w-auto group-data-[collapsible=icon]:block" />
    </Link>
  )
}

type Lien = { href: string; label: string; icone: LucideIcon; badge?: number }

interface BarreLateraleProps {
  hote: { prenom: string; nom: string; email: string }
  aTraiter: number // demandes en option, affichées en pastille
}

// « Aujourd'hui » n'est actif que sur /admin même ; les autres rubriques aussi sur leurs sous-pages
function estActif(chemin: string, href: string) {
  return href === "/admin" ? chemin === "/admin" : chemin === href || chemin.startsWith(`${href}/`)
}

// Navigation de l'espace hôtes : repliable en icônes sur ordinateur, panneau coulissant sur mobile
export default function BarreLaterale({ hote, aTraiter }: BarreLateraleProps) {
  const chemin = usePathname()
  // Sur mobile, le panneau se referme dès qu'on choisit une rubrique
  const { setOpenMobile } = useSidebar()
  const fermerSurMobile = () => setOpenMobile(false)
  const liens: Lien[] = [
    { href: "/admin", label: "Aujourd'hui", icone: SunMedium },
    { href: "/admin/reservations", label: "Réservations", icone: Inbox, badge: aTraiter },
    { href: "/admin/planning", label: "Planning", icone: CalendarRange },
    { href: "/admin/clients", label: "Clients", icone: Users },
  ]
  const initiales = `${hote.prenom[0] ?? ""}${hote.nom[0] ?? ""}`.toUpperCase()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border">
        <LogoEspaceHotes onClick={fermerSurMobile} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestion</SidebarGroupLabel>
          <SidebarGroupContent>
            {/* Espace entre les rubriques : la rubrique active et celle survolée ne se touchent pas */}
            <SidebarMenu className="gap-1">
              {liens.map((lien) => {
                const actif = estActif(chemin, lien.href)
                return (
                  <SidebarMenuItem key={lien.href}>
                    <SidebarMenuButton asChild isActive={actif} tooltip={lien.label}>
                      <Link href={lien.href} aria-current={actif ? "page" : undefined} onClick={fermerSurMobile}>
                        <lien.icone />
                        <span>{lien.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {lien.badge ? (
                      <>
                        <SidebarMenuBadge className="bg-sidebar-primary text-sidebar-primary-foreground">
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

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild size="sm" tooltip="Voir le site">
                  <Link href="/" target="_blank">
                    <ExternalLink />
                    <span>Voir le site</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">{initiales}</AvatarFallback>
                  </Avatar>
                  <span className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {hote.prenom} {hote.nom}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/70">{hote.email}</span>
                  </span>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" sideOffset={8} className="min-w-56">
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
