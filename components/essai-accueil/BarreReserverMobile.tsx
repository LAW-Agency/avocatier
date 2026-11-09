"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

// Barre « Réserver » collée en bas de l'écran, sur mobile seulement : visible une fois le hero quitté,
// cachée dès que l'appel final arrive (et après lui, pour ne pas couvrir le pied de page).
export default function BarreReserverMobile({ hero, fin }: { hero: string; fin: string }) {
  const [heroVisible, setHeroVisible] = useState(true)
  const [finAtteinte, setFinAtteinte] = useState(false)

  useEffect(() => {
    const elHero = document.getElementById(hero)
    const elFin = document.getElementById(fin)
    if (!elHero || !elFin) return
    const observateur = new IntersectionObserver((entrees) => {
      for (const e of entrees) {
        if (e.target === elHero) setHeroVisible(e.isIntersecting)
        // Fin « atteinte » : à l'écran, ou déjà passée au-dessus
        else setFinAtteinte(e.isIntersecting || e.boundingClientRect.top < 0)
      }
    })
    observateur.observe(elHero)
    observateur.observe(elFin)
    return () => observateur.disconnect()
  }, [hero, fin])

  const visible = !heroVisible && !finAtteinte

  return (
    <div
      inert={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(13_43_33/0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm leading-tight text-text-dark">
          Réponse personnelle<br />sous 48 heures
        </p>
        <Link
          href="/reserver"
          className="min-h-11 rounded-button border border-primary-dark bg-primary-dark px-5 py-3 text-sm font-medium tracking-wide text-text-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark"
        >
          Réserver
        </Link>
      </div>
    </div>
  )
}
