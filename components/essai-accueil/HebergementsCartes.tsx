import Image from "next/image"
import Link from "next/link"
import { BedDouble, Users } from "lucide-react"
import ButtonLink from "@/components/ButtonLink"
import { Prix } from "@/components/Devise"
import SectionTitle from "@/components/home/SectionTitle"
import { pluriel } from "@/lib/reservation/dates"
import type { Hebergement } from "@/lib/reservation/types"

// Les catégories en cartes avec un prix « dès » : on choisit déjà sur l'accueil.
// Mobile : rangée qui défile à l'horizontale (aimantée) ; desktop : grille de 3.
export default function HebergementsCartes({ hebergements }: { hebergements: Hebergement[] }) {
  return (
    <section id="hebergements" aria-labelledby="essai-hebergements-titre" className="py-section">
      <div className="mx-auto max-w-7xl px-4">
        <div data-reveal className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-4">
            <div id="essai-hebergements-titre">
              <SectionTitle title="Des nuits douces, bercées par l’océan" />
            </div>
            <p className="font-heading text-lg text-balance text-primary-accent md:text-xl">
              Votre petit cocon tropical à quelques pas de la plage…
            </p>
          </div>
          <ButtonLink href="/hebergements" variant="link" className="shrink-0 self-start md:self-auto">
            Tous les bungalows et chambres
          </ButtonLink>
        </div>

        <ul data-reveal className="-mx-4 mt-10 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:snap-none md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-3">
          {hebergements.map((h) => (
            <li
              key={h.slug}
              className="w-[82%] shrink-0 snap-start sm:w-[60%] md:w-auto"
            >
              <Link
                href={`/hebergements/${h.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-panel bg-mist transition-shadow duration-300 hover:shadow-[0_10px_32px_rgb(13_43_33/0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={h.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 82vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-heading text-2xl leading-tight text-text-dark">{h.nom}</h3>
                    <p className="shrink-0 text-right text-sm text-text-dark">
                      dès <span className="font-heading text-xl tabular-nums"><Prix montant={h.prixNuit} /></span>
                      <span className="sr-only"> par nuit</span>
                    </p>
                  </div>
                  <p className="text-[0.95rem] leading-snug text-text-dark">{h.description}</p>
                  <ul className="mt-auto flex flex-wrap gap-x-5 gap-y-1 pt-2 text-sm text-text-dark">
                    <li className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 stroke-[1.5]" aria-hidden="true" /> {pluriel(h.capaciteMax, "personne")}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <BedDouble className="h-4 w-4 stroke-[1.5]" aria-hidden="true" /> {h.literie}
                    </li>
                  </ul>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-text-dark md:hidden" aria-hidden="true">Faites glisser pour voir les autres →</p>
      </div>
    </section>
  )
}
