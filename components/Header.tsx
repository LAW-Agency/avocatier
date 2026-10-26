'use client'
import Link from "next/link"
import Image from "next/image"
import { ChevronDown, MapPin, User } from "lucide-react"
import { useEffect, useState, useSyncExternalStore } from "react"
import { useChemin } from "@/components/useChemin"
import { navLinks } from "@/data/navLinks"

// Pages avec un hero plein écran : le header y reste transparent tant qu'on n'a pas défilé
const HERO_PAGES = ["/", "/compte", "/hotel", "/hebergements", "/experiences", "/restaurant", "/galerie"]
const SCROLL_THRESHOLD = 24 // px
const DESKTOP_MIN_WIDTH = 1024 // breakpoint lg

// Vrai dès qu'on a quitté le haut de la page
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

export default function Header() {
  const pathname = useChemin()
  const hasHero = HERO_PAGES.includes(pathname)
  // Page de réservation ou de compte ouverte : le bouton correspondant le signale
  const surReservation = pathname.startsWith("/reserver")
  const surCompte = pathname.startsWith("/compte")
  const scrolled = useScrolled()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)

  // Transparent en haut d'une page avec hero, blanc partout ailleurs et quand le menu est ouvert
  const solid = !hasHero || scrolled || mobileOpen

  const closeMenu = () => {
    setMobileOpen(false)
    setOpenSubmenu(null)
  }

  // Menu ouvert : page bloquée, fermeture avec Échap ou en passant en affichage desktop
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
  const linkColor = solid
    ? "text-text-dark hover:text-primary-accent"
    : "text-primary-light hover:text-primary-light/80"

  return (
    <>
      {/* Pas de filter/transform sur <header> : ils casseraient le positionnement fixe du menu mobile.
          viewTransitionName : le header reste immobile pendant la transition entre pages (globals.css) */}
      <header className="fixed inset-x-0 top-0 z-50" style={{ viewTransitionName: "site-header" }}>
        <div className={`relative ${fade} ${solid ? "h-16 lg:h-20" : "h-20 lg:h-24"}`}>

          {/* Fonds : dégradé sombre sur le hero, blanc après défilement — fondu entre les deux */}
          <div
            aria-hidden="true"
            className={`absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-transparent ${fade} ${solid ? "opacity-0" : "opacity-100"}`}
          />
          <div
            aria-hidden="true"
            className={`absolute inset-0 bg-primary-light shadow-[0_2px_20px_rgba(0,0,0,0.07)] ${fade} ${solid ? "opacity-100" : "opacity-0"}`}
          />

          {/* Mobile : logo | actions — Desktop : logo | navigation centrée | actions */}
          <div className="relative mx-auto h-full max-w-7xl px-4 sm:px-6 flex items-center justify-between gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6">

            {/* LOGO — blanc (SVG) sur le hero, couleur sur fond blanc */}
            <Link
              href="/"
              onClick={closeMenu}
              aria-label="Chez L'Avocatier — accueil"
              className={`relative block aspect-square shrink-0 justify-self-start ${fade} ${solid ? "h-11 lg:h-14" : "h-14 lg:h-18"}`}
            >
              <Image
                src="/logo-blanc.svg"
                alt=""
                fill
                sizes="80px"
                loading="eager"
                className={`object-contain ${fade} ${solid ? "opacity-0" : "opacity-100"}`}
              />
              <Image
                src="/logo.png"
                alt=""
                fill
                sizes="80px"
                loading="eager"
                className={`object-contain ${fade} ${solid ? "opacity-100" : "opacity-0"}`}
              />
            </Link>

            {/* NAVIGATION desktop — centrée */}
            <nav aria-label="Navigation principale" className="hidden lg:flex items-center gap-5 xl:gap-8">
              {navLinks.map((link) => (
                <div key={link.label} className="relative group">
                  <Link
                    href={link.href}
                    className={`relative flex items-center gap-1 py-2 text-sm xl:text-[0.95rem] font-medium tracking-wide transition-colors duration-500 ${linkColor}
                      after:absolute after:left-0 after:bottom-0.5 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-500 hover:after:scale-x-100`}
                  >
                    {link.label}
                    {link.submenu && (
                      <ChevronDown className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180 group-has-[:focus-visible]:rotate-180" aria-hidden="true" />
                    )}
                  </Link>

                  {/* SOUS-MENU — au survol, et au clavier via :focus-visible
                      (pas focus-within : un clic laisserait le menu ouvert pendant qu'on survole le suivant) */}
                  {link.submenu && (
                    <div className="absolute left-1/2 top-full -translate-x-1/2 pt-4 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-has-[:focus-visible]:opacity-100 group-has-[:focus-visible]:visible group-has-[:focus-visible]:translate-y-0 transition-all duration-300">
                      <ul className="min-w-[230px] rounded-card bg-primary-light py-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)] ring-1 ring-primary-dark/10">
                        {link.submenu.map((sub) => (
                          <li key={sub.label}>
                            <Link
                              href={sub.href}
                              className="block px-5 py-2 text-sm text-text-dark transition-colors hover:bg-background hover:text-primary-accent"
                            >
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* ACTIONS à droite — Réserver toujours visible (cahier des charges) */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 justify-self-end">
              <Link
                href="/reserver"
                onClick={closeMenu}
                aria-current={surReservation ? "page" : undefined}
                className={`inline-flex items-center justify-center rounded-button border border-primary-dark px-4 py-2 sm:px-5 sm:py-2.5 text-sm font-medium tracking-wide transition-colors ${
                  surReservation
                    ? "bg-transparent text-text-dark"
                    : "bg-primary-dark text-text-light hover:bg-primary-dark/90"
                }`}
              >
                Réserver
              </Link>

              {/* ICONE COMPTE */}
              <Link
                href="/compte"
                onClick={closeMenu}
                aria-label="Mon compte"
                aria-current={surCompte ? "page" : undefined}
                className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${fade} ${
                  surCompte
                    ? solid
                      ? "ring-2 ring-primary-accent ring-offset-2 ring-offset-primary-light "
                      : "ring-2 ring-primary-light ring-offset-2 ring-offset-transparent "
                    : ""
                }${
                  solid
                    ? "bg-primary-accent/80 text-primary-light hover:bg-primary-accent"
                    : "bg-primary-light/15 text-primary-light ring-1 ring-primary-light/40 hover:bg-primary-light/25"
                }`}
              >
                <User className="w-5 h-5" />
              </Link>

              {/* BOUTON MENU mobile — 3 traits qui deviennent une croix */}
              <button
                type="button"
                onClick={() => (mobileOpen ? closeMenu() : setMobileOpen(true))}
                aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={mobileOpen}
                aria-controls="menu-mobile"
                className={`lg:hidden grid place-items-center w-10 h-10 -mr-2 transition-colors duration-500 ${solid ? "text-primary-dark" : "text-primary-light"}`}
              >
                <span aria-hidden="true" className="relative block w-6 h-4">
                  <span className={`absolute left-0 top-0 h-0.5 w-6 rounded-full bg-current transition-transform duration-300 ${mobileOpen ? "translate-y-[7px] rotate-45" : ""}`} />
                  <span className={`absolute right-0 top-[7px] h-0.5 w-4 rounded-full bg-current transition-opacity duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
                  <span className={`absolute left-0 bottom-0 h-0.5 w-6 rounded-full bg-current transition-transform duration-300 ${mobileOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* MENU MOBILE — plein écran sous la barre ; inert quand il est fermé (hors tabulation) */}
        <div
          id="menu-mobile"
          inert={!mobileOpen}
          className={`lg:hidden fixed inset-0 -z-10 flex flex-col bg-background pt-16 transition-all duration-500 ease-out ${
            mobileOpen ? "opacity-100 visible" : "opacity-0 invisible"
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
                    className={`transition-all duration-500 ease-out ${mobileOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
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
                          <ChevronDown
                            aria-hidden="true"
                            className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-primary-accent" : ""}`}
                          />
                        </button>

                        {/* Accordéon : hauteur animée (grid 0fr → 1fr) */}
                        <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                          <div inert={!isOpen} className="overflow-hidden">
                            <ul className="mb-4 ml-1 space-y-1 border-l border-primary-dark/15 pl-4">
                              {link.submenu.map((sub) => (
                                <li key={sub.label}>
                                  <Link
                                    href={sub.href}
                                    onClick={closeMenu}
                                    className="block py-1.5 text-base text-text-dark/80 transition-colors hover:text-primary-accent"
                                  >
                                    {sub.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </>
                    ) : (
                      // Lien simple (ex. Galerie) : navigue et ferme le menu
                      <Link
                        href={link.href}
                        onClick={closeMenu}
                        className="block py-4 font-heading text-2xl text-text-dark"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Pied du menu : l'adresse (Réserver et le compte restent dans la barre au-dessus) */}
          <p
            style={{ transitionDelay: mobileOpen ? `${120 + navLinks.length * 50}ms` : "0ms" }}
            className={`flex items-start gap-2 border-t border-primary-dark/10 px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-sm text-text-dark transition-all duration-500 ease-out ${
              mobileOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            Vohilava, Île Sainte-Marie, Madagascar
          </p>
        </div>
      </header>

      {/* Pages sans hero : réserve la hauteur du header fixe */}
      {!hasHero && <div aria-hidden="true" className="h-16 lg:h-20" />}
    </>
  )
}
