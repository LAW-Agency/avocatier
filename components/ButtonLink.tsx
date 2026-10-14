import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { ReactNode } from "react"

type Variant = "primary" | "outline" | "outline-light"

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary-dark text-text-light border border-primary-dark hover:bg-primary-dark/90",
  outline: "border border-primary-dark text-text-dark hover:bg-primary-dark hover:text-text-light",
  "outline-light": "border border-primary-light text-primary-light hover:bg-primary-light/10",
}

interface ButtonLinkProps {
  href: string
  children: ReactNode
  variant?: Variant
  arrow?: boolean      // flèche → des CTA du cahier des charges
  className?: string
}

export default function ButtonLink({
  href,
  children,
  variant = "primary",
  arrow = false,
  className = "",
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-button text-sm font-medium tracking-wide transition-colors duration-500 ${variantClasses[variant]} ${className}`}
    >
      {children}
      {arrow && (
        <ArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true" />
      )}
    </Link>
  )
}
