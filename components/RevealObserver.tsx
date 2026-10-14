'use client'
import { usePathname } from "next/navigation"
import { useEffect } from "react"

// Un seul observateur pour tout le site : marque data-visible sur chaque élément [data-reveal]
// quand il entre à l'écran (une seule fois). Les états visuels sont dans globals.css.
// data-visible / data-reveal-ready sont des attributs que React ne gère pas : ils ne sont pas effacés aux re-rendus.
export default function RevealObserver() {
  const pathname = usePathname()

  useEffect(() => {
    const root = document.documentElement
    const targets = document.querySelectorAll("[data-reveal]:not([data-visible])")

    // Navigateur sans IntersectionObserver : tout afficher directement
    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.setAttribute("data-visible", ""))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute("data-visible", "")
          observer.unobserve(entry.target)
        }
      },
      // Déclenche un peu avant que l'élément ne soit bien visible, pas au ras du bas de l'écran
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    )
    targets.forEach((el) => observer.observe(el))

    // Le CSS ne masque le contenu qu'à partir d'ici : si ce script ne tourne pas, tout reste visible
    root.setAttribute("data-reveal-ready", "")

    return () => observer.disconnect()
  }, [pathname]) // nouvelle page : nouveaux éléments à observer

  return null
}
