import { MapPin, Plane, Star, Umbrella } from "lucide-react"
import type { CSSProperties } from "react"
import { googleRating, rating } from "@/data/testimonials"

// Bandeau vert nuit sous le hero : la preuve sociale tout de suite, avec des données réelles seulement
const points = [
  { icon: Star, fort: `${googleRating.score} / ${googleRating.outOf}`, detail: `Note ${googleRating.source}` },
  { icon: MapPin, fort: rating.score, detail: rating.label },
  { icon: Umbrella, fort: "Plage privée", detail: "Au bout du jardin" },
  { icon: Plane, fort: "3 km", detail: "De l’aéroport de Sainte-Marie" },
]

export default function Reassurance() {
  return (
    <section aria-label="En bref" className="bg-forest text-primary-light">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-y-6 px-4 pt-4 pb-10 md:grid-cols-4 md:pb-12">
        {points.map(({ icon: Icon, fort, detail }, i) => (
          <li
            key={detail}
            data-reveal
            style={{ "--reveal-delay": `${i * 100}ms` } as CSSProperties}
            className="flex items-center gap-3 px-2 md:justify-center"
          >
            <Icon aria-hidden="true" className="h-6 w-6 shrink-0 stroke-[1.25] text-sand" />
            <span className="flex flex-col leading-tight">
              <span className="font-heading text-lg">{fort}</span>
              <span className="text-sm text-primary-light/75">{detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
