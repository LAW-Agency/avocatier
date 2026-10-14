import { TreePalm, Umbrella, WavesLadder, UtensilsCrossed } from "lucide-react"

// Les 4 éléments visuels de la section « L'expérience » (cahier des charges)
const amenities = [
  { label: "Jardin tropical", icon: TreePalm },
  { label: "Plage privée", icon: Umbrella },
  { label: "Piscine", icon: WavesLadder },
  { label: "Restaurant & bar", icon: UtensilsCrossed },
]

export default function Amenities() {
  return (
    <section aria-label="Les atouts de l'hôtel" className="bg-primary-light border-b border-primary-dark/10">
      <ul className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
        {amenities.map(({ label, icon: Icon }) => (
          <li key={label} className="flex flex-col sm:flex-row items-center justify-center gap-3 text-text-dark">
            <Icon className="w-6 h-6 shrink-0 stroke-[1.5]" aria-hidden="true" />
            <span className="text-sm tracking-wide">{label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
