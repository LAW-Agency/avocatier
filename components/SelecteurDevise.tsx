"use client"

import { ChevronDown, Globe } from "lucide-react"
import { useDevise } from "@/components/Devise"
import { DEVISES, estCodeDevise } from "@/lib/reservation/devises"

// Pied de page : région et devise d'affichage des prix. « Par défaut » suit la devise choisie par les hôtes
// dans /admin/tarifs ; un autre choix est retenu dans ce navigateur.
export default function SelecteurDevise() {
  const { reglages, devise, personnalisee, choisir } = useDevise()
  // Une seule devise proposée : rien à choisir
  if (reglages.actives.length < 2) return null

  const parDefaut = DEVISES[reglages.parDefaut]

  return (
    <div className="flex items-center gap-2.5">
      <Globe className="w-4 h-4 shrink-0 stroke-[1.5]" aria-hidden="true" />
      <label htmlFor="selecteur-devise" className="sr-only">
        Région et devise des prix
      </label>
      <span className="relative inline-flex items-center">
        <select
          id="selecteur-devise"
          value={personnalisee ? devise : ""}
          onChange={(e) => choisir(estCodeDevise(e.target.value) ? e.target.value : null)}
          className="appearance-none cursor-pointer rounded-full bg-transparent py-1.5 pl-3 pr-8 text-sm text-primary-light ring-1 ring-primary-light/30 transition-colors duration-300 hover:ring-primary-light/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          {/* Liste native : fond et texte posés sur chaque option, sinon texte blanc sur fond blanc */}
          <option value="" className="bg-forest text-primary-light">
            Par défaut · {parDefaut.nom} ({parDefaut.symbole})
          </option>
          {reglages.actives.map((code) => (
            <option key={code} value={code} className="bg-forest text-primary-light">
              {DEVISES[code].region} · {DEVISES[code].nom} ({DEVISES[code].symbole})
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 w-3.5 h-3.5" aria-hidden="true" />
      </span>
    </div>
  )
}
