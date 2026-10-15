"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

interface ChromeSiteProps {
  header: ReactNode
  footer: ReactNode
  children: ReactNode
}

// Header, <main> et footer du site public ; l'espace hôtes (/admin) a sa propre mise en page
export default function ChromeSite({ header, footer, children }: ChromeSiteProps) {
  const chemin = usePathname()
  if (chemin === "/admin" || chemin.startsWith("/admin/")) return children

  return (
    <>
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </>
  )
}
