import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { ReactNode } from "react"

// Variante « link » de ButtonLink pour les fonds sable : bordeaux au lieu du vert (contraste 4,5:1)
export default function LienSable({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 pb-1 border-b border-primary-accent/40 text-sm font-medium tracking-wide text-primary-accent transition-colors duration-300 hover:border-primary-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
    >
      {children}
      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  )
}
