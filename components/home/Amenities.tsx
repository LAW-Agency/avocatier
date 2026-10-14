import Link from "next/link"
import { TreePalm, Umbrella, WavesLadder, UtensilsCrossed } from "lucide-react"
import type { CSSProperties } from "react"

// Les 4 éléments visuels de la section « L'expérience » (cahier des charges),
// chacun relié à sa section de la page d'accueil
const amenities = [
  { label: "Jardin tropical", detail: "Cocotiers et massifs fleuris", href: "#experience", icon: TreePalm },
  { label: "Plage privée", detail: "Accès direct, mer calme", href: "#plage", icon: Umbrella },
  { label: "Piscine", detail: "Au cœur du jardin", href: "#piscine-jardin", icon: WavesLadder },
  { label: "Restaurant & bar", detail: "Petit-déjeuner, cuisine et bar", href: "#restaurant", icon: UtensilsCrossed },
]

// Bande vert nuit dans laquelle le bas du hero se fond
export default function Amenities() {
  return (
    <nav aria-label="Les atouts de l'hôtel" className="bg-forest text-primary-light">
      <ul className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4">
        {amenities.map(({ label, detail, href, icon: Icon }, i) => (
          <li
            key={label}
            // Séparateurs fins : grille 2×2 sur mobile, une seule ligne sur desktop.
            // Cascade : chaque atout apparaît 120 ms après le précédent.
            data-reveal
            style={{ "--reveal-delay": `${i * 120}ms` } as CSSProperties}
            className="border-primary-light/15 odd:border-r [&:nth-child(-n+2)]:border-b lg:border-r lg:last:border-r-0 lg:[&:nth-child(-n+2)]:border-b-0"
          >
            <Link
              href={href}
              className="group flex h-full flex-col items-center gap-3 px-3 py-8 lg:py-10 text-center rounded-card focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-sand"
            >
              <Icon
                aria-hidden="true"
                className="w-8 h-8 stroke-[1.25] text-sand transition-transform duration-500 group-hover:-translate-y-0.5"
              />
              <span className="font-heading text-base sm:text-lg leading-tight text-balance transition-colors duration-500 group-hover:text-sand">
                {label}
              </span>
              <span className="text-sm leading-snug text-primary-light/65">{detail}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
