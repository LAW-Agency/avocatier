"use client"

import { usePathname } from "next/navigation"
import { useSyncExternalStore } from "react"
import { ArrowDown } from "lucide-react"

// Pages sans bouton : la réservation a sa propre barre d'actions collée en bas de l'écran
const PAGES_SANS_BOUTON = ["/reserver"]
const MARGE_BAS = 8 // px : tolérance pour considérer qu'on est arrivé en bas

type Etat = "suivante" | "haut" | "cache"

// Sections de premier niveau de la page (pas celles imbriquées dans une autre), puis le footer
function cibles() {
  return Array.from(document.querySelectorAll<HTMLElement>("main section, body footer")).filter(
    (el) => !el.parentElement?.closest("section, footer"),
  )
}

// Hauteur réservée au header fixe : le scroll-padding-top posé sur <html> (globals.css)
function decalageHeader() {
  return parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
}

// Première section dont le haut est encore sous la ligne d'arrivée (bas du header)
function sectionSuivante() {
  const ligne = decalageHeader() + 2
  return cibles().find((el) => el.getBoundingClientRect().top > ligne)
}

function lireEtat(): Etat {
  const { scrollHeight } = document.documentElement
  if (scrollHeight <= window.innerHeight + MARGE_BAS) return "cache" // rien à faire défiler
  const enBas = window.scrollY + window.innerHeight >= scrollHeight - MARGE_BAS
  return enBas || !sectionSuivante() ? "haut" : "suivante"
}

function useEtat() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("scroll", onChange, { passive: true })
      window.addEventListener("resize", onChange)
      return () => {
        window.removeEventListener("scroll", onChange)
        window.removeEventListener("resize", onChange)
      }
    },
    lireEtat,
    () => "cache" as Etat,
  )
}

// Bouton flottant en bas à droite : descend à la section suivante, puis remonte en haut une fois en bas.
// Défilement doux hérité de scroll-behavior (désactivé si l'utilisateur réduit les animations).
export default function BoutonDefilement() {
  const chemin = usePathname()
  const etat = useEtat()
  if (PAGES_SANS_BOUTON.includes(chemin)) return null

  const versLeHaut = etat === "haut"

  function defiler() {
    if (versLeHaut) {
      window.scrollTo({ top: 0 })
      return
    }
    sectionSuivante()?.scrollIntoView({ block: "start" })
  }

  return (
    <button
      type="button"
      onClick={defiler}
      aria-label={versLeHaut ? "Revenir en haut de la page" : "Aller à la section suivante"}
      title={versLeHaut ? "Revenir en haut" : "Section suivante"}
      tabIndex={etat === "cache" ? -1 : undefined}
      aria-hidden={etat === "cache" || undefined}
      style={{ viewTransitionName: "bouton-defilement" }}
      className={`fixed bottom-4 right-4 z-40 flex size-12 items-center justify-center rounded-full bg-forest/90 text-primary-light shadow-lg shadow-forest/25 ring-1 ring-primary-light/25 backdrop-blur-sm transition-[opacity,translate,color] duration-500 ease-out hover:text-sand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sand md:bottom-8 md:right-8 ${
        etat === "cache" ? "pointer-events-none translate-y-4 opacity-0" : "opacity-100"
      }`}
    >
      <ArrowDown
        aria-hidden="true"
        className={`size-5 transition-transform duration-500 ease-out ${versLeHaut ? "rotate-180" : ""}`}
      />
    </button>
  )
}
