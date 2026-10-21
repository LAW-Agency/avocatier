"use client"

import { usePathname } from "next/navigation"
import { ViewTransition, type ReactNode } from "react"
import BoutonDefilement from "@/components/BoutonDefilement"

interface ChromeSiteProps {
  header: ReactNode
  footer: ReactNode
  children: ReactNode
}

// Header, <main> et footer du site
export default function ChromeSite({ header, footer, children }: ChromeSiteProps) {
  const chemin = usePathname()

  return (
    <>
      {header}
      <main className="flex-1">
        {/* Transition fluide entre pages : clé = chemin, l'ancienne page sort et la nouvelle entre
            (animations page-sortie / page-entree dans globals.css). default="none" : rien ne bouge
            lors des autres transitions (filtres de la galerie, étapes de la réservation…) */}
        <ViewTransition key={chemin} enter="page-entree" exit="page-sortie" default="none">
          <div>{children}</div>
        </ViewTransition>
      </main>
      {footer}
      <BoutonDefilement />
    </>
  )
}
