import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { ReactNode } from "react"

// Bouton plein : réservé à la réservation. Lien : appels secondaires des sections.
type Variant = "primary" | "outline" | "outline-light" | "link" | "link-light"

const base =
  "group inline-flex items-center gap-2 text-sm font-medium tracking-wide transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"

// Chaque variante porte sa propre géométrie : pas de classes contradictoires à arbitrer
const variantClasses: Record<Variant, string> = {
  primary: "justify-center px-6 py-3 rounded-button border border-primary-dark bg-primary-dark text-text-light hover:bg-primary-dark/90",
  outline: "justify-center px-6 py-3 rounded-button border border-primary-dark text-text-dark hover:bg-primary-dark hover:text-text-light",
  "outline-light": "justify-center px-6 py-3 rounded-button border border-primary-light text-primary-light hover:bg-primary-light/10",
  link: "pb-1 border-b border-primary-dark/40 text-text-dark hover:border-primary-accent hover:text-primary-accent",
  "link-light": "pb-1 border-b border-primary-light/40 text-primary-light hover:border-sand hover:text-sand",
}

interface ButtonLinkProps {
  href: string
  children: ReactNode
  variant?: Variant
  arrow?: boolean      // flèche → des CTA du cahier des charges (par défaut sur les liens)
  className?: string
}

export default function ButtonLink({
  href,
  children,
  variant = "primary",
  arrow = variant === "link" || variant === "link-light",
  className = "",
}: ButtonLinkProps) {
  return (
    <Link href={href} className={`${base} ${variantClasses[variant]} ${className}`}>
      {children}
      {arrow && (
        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
      )}
    </Link>
  )
}
