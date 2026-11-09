'use client'
import Link from "next/link"
import Image from "next/image"
import { ChevronDown, MapPin, User } from "lucide-react"
import { useEffect, useState, useSyncExternalStore } from "react"
import { navLinks } from "@/data/navLinks"

const SCROLL_THRESHOLD = 24 // px
const DESKTOP_MIN_WIDTH = 1024 // breakpoint lg

function useScrolled() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("scroll", onChange, { passive: true })
      return () => window.removeEventListener("scroll", onChange)
    },
    () => window.scrollY > SCROLL_THRESHOLD,
    () => false,
  )
}

// Header de la page d'essai (affiché seulement sur /essai-accueil, voir components/Header.tsx).
// En haut du hero : barre transparente pleine largeur, liens blancs, Réserver en pilule.
// Après défilement : la barre se détache en capsule flottante crème (coins ronds, ombre douce, flou derrière),
// plus basse et centrée, au lieu d'un bandeau blanc collé en haut.
// Le flou est sur la capsule, jamais sur <header> : il casserait le positionnement fixe du menu mobile.
export default function HeaderEssai() {
  const scrolled = useScrolled()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const solid = scrolled || mobileOpen

  // Rail de la barre de défilement de Windows en vert nuit tant que le header est transparent (globals.css)
  useEffect(() => {
    document.documentElement.toggleAttribute("data-rail-sombre", !solid)
  }, [solid])

  const closeMenu = () => {
    setMobileOpen(false)
    setOpenSubmenu(null)
  }

  useEffect(() => {
    if (!mobileOpen) return
    const root = document.documentElement
    root.style.overflow = "hidden"
    const close = () => {
      setMobileOpen(false)
      setOpenSubmenu(null)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    const onResize = () => {
      if (window.innerWidth >= DESKTOP_MIN_WIDTH) close()
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("resize", onResize)
    return () => {
      root.style.overflow = ""
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("resize", onResize)
    }
  }, [mobileOpen])

  const fade = "transition-all duration-500 ease-out"
  const linkColor = solid ? "text-text-dark hover:text-primary-accent" : "text-primary-light hover:text-sand"

  return (
    <header className="fixed inset-x-0 top-0 z-50" style={{ viewTransitionName: "site-header" }}>
      {/* Voile du haut du hero, pour la lisibilité des liens blancs ; s'efface quand la capsule apparaît */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/55 via-black/20 to-transparent ${fade} ${solid ? "opacity-0" : "opacity-100"}`}
      />

      <div className={`relative ${fade} ${solid ? "px-3 pt-3 sm:px-4" : "px-0 pt-0"}`}>
        <div
          className={`mx-auto flex items-center justify-between gap-4 ${fade} lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6 ${
            solid
              ? "h-14 max-w-6xl rounded-full bg-background/90 pl-3 pr-2 shadow-[0_10px_30px_rgb(13_43_33/0.14)] ring-1 ring-ink/5 backdrop-blur-md sm:pl-4 lg:h-16 lg:pr-2.5"
              : "h-20 max-w-7xl px-4 sm:px-6 lg:h-24"
          }`}
        >
          {/* LOGO : emblème blanc sur le hero, couleur dans la capsule */}
          <Link
            href="/"
            onClick={closeMenu}
            aria-label="Chez L'Avocatier — accueil"
            className={`relative block aspect-square shrink-0 justify-self-start ${fade} ${solid ? "h-10 lg:h-12" : "h-14 lg:h-18"}`}
          >
            <Image src="/logo-blanc.svg" alt="" fill sizes="80px" loading="eager" className={`object-contain ${fade} ${solid ? "opacity-0" : "opacity-100"}`} />
            <Image src="/logo.png" alt="" fill sizes="80px" loading="eager" className={`object-contain ${fade} ${solid ? "opacity-100" : "opacity-0"}`} />
          </Link>

          {/* NAVIGATION desktop : l'entrée de la page courante (Accueil) porte un point sable/bordeaux */}
          <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex xl:gap-2">
            {navLinks.map((link) => {
              const courant = link.href === "/"
              return (
                <div key={link.label} className="group relative">
                  <Link
                    href={link.href}
                    aria-current={courant ? "page" : undefined}
                    className={`relative flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium tracking-wide transition-colors duration-300 xl:text-[0.95rem] ${linkColor} ${
                      solid ? "hover:bg-ink/[0.05]" : "hover:bg-primary-light/10"
                    }`}
                  >
                    {link.label}
                    {link.submenu && (
                      <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180 group-has-[:focus-visible]:rotate-180" aria-hidden="true" />
                    )}
                    {courant && (
                      <span
                        aria-hidden="true"
                        className={`absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${solid ? "bg-primary-accent" : "bg-sand"}`}
                      />
                    )}
                  </Link>

                  {link.submenu && (
                    <div className="invisible absolute left-1/2 top-full -translate-x-1/2 translate-y-1 pt-3 opacity-0 transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-has-[:focus-visible]:visible group-has-[:focus-visible]:translate-y-0 group-has-[:focus-visible]:opacity-100">
                      <ul className="min-w-[230px] rounded-panel bg-background p-2 shadow-[0_16px_40px_rgb(13_43_33/0.16)] ring-1 ring-ink/5">
                        {link.submenu.map((sub) => (
                          <li key={sub.label}>
                            <Link
                              href={sub.href}
                              className="block rounded-[0.6rem] px-4 py-2.5 text-sm text-text-dark transition-colors hover:bg-mist hover:text-primary-accent"
                            >
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* ACTIONS : compte discret, Réserver en pilule (toujours visible) */}
          <div className="flex items-center justify-end gap-1.5 justify-self-end sm:gap-2">
            <Link
              href="/compte"
              onClick={closeMenu}
              aria-label="Mon compte"
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${fade} ${
                solid ? "text-text-dark hover:bg-ink/[0.06]" : "text-primary-light ring-1 ring-primary-light/40 hover:bg-primary-light/15"
              }`}
            >
              <User className="h-5 w-5" aria-hidden="true" />
            </Link>

            <Link
              href="/reserver"
              onClick={closeMenu}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary-dark px-5 text-sm font-medium tracking-wide text-text-light transition-colors hover:bg-primary-dark/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark lg:min-h-11 lg:px-6"
            >
              Réserver
            </Link>

            <button
              type="button"
              onClick={() => (mobileOpen ? closeMenu() : setMobileOpen(true))}
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileOpen}
              aria-controls="menu-mobile-essai"
              className={`grid h-10 w-10 place-items-center rounded-full transition-colors duration-500 lg:hidden ${solid ? "text-primary-dark" : "text-primary-light"}`}
            >
              <span aria-hidden="true" className="relative block h-4 w-6">
                <span className={`absolute left-0 top-0 h-0.5 w-6 rounded-full bg-current transition-transform duration-300 ${mobileOpen ? "translate-y-[7px] rotate-45" : ""}`} />
                <span className={`absolute right-0 top-[7px] h-0.5 w-4 rounded-full bg-current transition-opacity duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
                <span className={`absolute bottom-0 left-0 h-0.5 w-6 rounded-full bg-current transition-transform duration-300 ${mobileOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* MENU MOBILE : plein écran sous la capsule, inert quand il est fermé */}
      <div
        id="menu-mobile-essai"
        inert={!mobileOpen}
        className={`fixed inset-0 -z-10 flex flex-col bg-background pt-20 transition-all duration-500 ease-out lg:hidden ${
          mobileOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <nav aria-label="Navigation mobile" className="flex-1 overflow-y-auto px-6 pt-6 pb-4">
          <ul className="divide-y divide-primary-dark/10">
            {navLinks.map((link, i) => {
              const isOpen = openSubmenu === link.label
              return (
                <li
                  key={link.label}
                  style={{ transitionDelay: mobileOpen ? `${120 + i * 50}ms` : "0ms" }}
                  className={`transition-all duration-500 ease-out ${mobileOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
                >
                  {link.submenu ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setOpenSubmenu(isOpen ? null : link.label)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between py-4 text-left font-heading text-2xl text-text-dark"
                      >
                        {link.label}
                        <ChevronDown aria-hidden="true" className={`h-5 w-5 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-primary-accent" : ""}`} />
                      </button>
                      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                        <div inert={!isOpen} className="overflow-hidden">
                          <ul className="mb-4 ml-1 space-y-1 border-l border-primary-dark/15 pl-4">
                            {link.submenu.map((sub) => (
                              <li key={sub.label}>
                                <Link href={sub.href} onClick={closeMenu} className="block py-1.5 text-base text-text-dark transition-colors hover:text-primary-accent">
                                  {sub.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link href={link.href} onClick={closeMenu} className="block py-4 font-heading text-2xl text-text-dark">
                      {link.label}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
        <p className="flex items-start gap-2 border-t border-primary-dark/10 px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-sm text-text-dark">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Vohilava, Île Sainte-Marie, Madagascar
        </p>
      </div>
    </header>
  )
}
