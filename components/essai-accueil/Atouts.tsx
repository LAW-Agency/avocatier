import Link from "next/link"
import { TreePalm, Umbrella, UtensilsCrossed, WavesLadder } from "lucide-react"
import type { CSSProperties } from "react"
import Grain, { FOND_SABLE } from "@/components/home/Grain"

// Les 4 atouts du cahier des charges en cartes, chacune reliée à sa section de la page
const atouts = [
  { label: "Jardin tropical", detail: "Cocotiers, fleurs et coins d’ombre autour des bungalows.", href: "#experience", icon: TreePalm },
  { label: "Plage privée", detail: "Accès direct depuis le jardin, lagon turquoise.", href: "#plage", icon: Umbrella },
  { label: "Piscine", detail: "Transats et bar au bord de l’eau.", href: "#piscine-jardin", icon: WavesLadder },
  { label: "Restaurant & bar", detail: "Cuisine maison aux saveurs malgaches, face à l’océan.", href: "#restaurant", icon: UtensilsCrossed },
]

export default function Atouts() {
  return (
    <nav aria-label="Les atouts de l'hôtel" className={`${FOND_SABLE} py-section`}>
      <Grain />
      <ul className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {atouts.map(({ label, detail, href, icon: Icon }, i) => (
          <li key={label} data-reveal style={{ "--reveal-delay": `${i * 120}ms` } as CSSProperties}>
            <Link
              href={href}
              className="group flex h-full items-start gap-4 rounded-panel bg-background/80 p-6 shadow-[0_8px_32px_rgb(13_43_33/0.06)] transition-colors duration-300 hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-accent lg:flex-col"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-dark/10 text-text-dark">
                <Icon aria-hidden="true" className="h-6 w-6 stroke-[1.25]" />
              </span>
              <span className="space-y-1">
                <span className="block font-heading text-xl leading-tight text-text-dark">{label}</span>
                <span className="block text-[0.95rem] leading-snug text-ink/80">{detail}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
