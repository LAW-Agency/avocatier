import Image from "next/image"
import Link from "next/link"
import { BedDouble, Eye, Users } from "lucide-react"
import type { CSSProperties } from "react"
import ButtonLink from "@/components/ButtonLink"
import { formaterPrix, pluriel } from "@/lib/reservation/dates"
import type { Hebergement } from "@/lib/reservation/types"
import { equipements } from "@/components/hebergements/sejour"

interface CarteHebergementProps {
  hebergement: Hebergement
  cadre?: string    // ratio de la photo, ex. "aspect-[4/5]"
  sizes: string
  delai?: number    // cascade d'apparition, en ms
}

// Carte d'un hébergement (cahier des charges) : photo, description, équipements, « Voir le bungalow »
export default function CarteHebergement({ hebergement: h, cadre = "aspect-[4/3]", sizes, delai = 0 }: CarteHebergementProps) {
  const href = `/hebergements/${h.slug}`
  const style = { "--reveal-delay": `${delai}ms` } as CSSProperties

  return (
    <article className="flex flex-col">
      {/* Lien en double du bouton : retiré du clavier et des lecteurs d'écran */}
      <Link href={href} tabIndex={-1} aria-hidden="true" className={`relative block overflow-hidden rounded-card ${cadre}`}>
        <Image src={h.image} alt="" fill sizes={sizes} data-reveal="image" style={style} className="object-cover" />
      </Link>

      <div data-reveal style={style} className="flex flex-1 flex-col gap-4 pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="font-heading text-2xl md:text-3xl leading-tight">{h.nom}</h3>
          <p className="shrink-0 text-right text-sm">
            dès <span className="font-heading text-xl tabular-nums">{formaterPrix(h.prixNuit)}</span> / nuit
          </p>
        </div>

        <p className="text-body">{h.description}</p>

        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <li className="flex items-center gap-1.5">
            <Users className="w-4 h-4 stroke-[1.5]" aria-hidden="true" /> Jusqu’à {pluriel(h.capaciteMax, "personne")}
          </li>
          <li className="flex items-center gap-1.5">
            <BedDouble className="w-4 h-4 stroke-[1.5]" aria-hidden="true" /> {h.literie}
          </li>
          <li className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 stroke-[1.5]" aria-hidden="true" /> {h.vue}
          </li>
        </ul>

        <p className="border-t border-primary-dark/15 pt-4 text-sm">
          {h.equipements.map((e) => equipements[e].label).join(" · ")}
        </p>

        <ButtonLink href={href} variant="link" className="mt-auto self-start">
          {h.type === "bungalow" ? "Voir le bungalow" : "Voir la chambre"}
        </ButtonLink>
      </div>
    </article>
  )
}
