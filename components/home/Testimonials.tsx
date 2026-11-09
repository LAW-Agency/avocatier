import Image from "next/image"
import { Quote, Star } from "lucide-react"
import type { CSSProperties } from "react"
import { googleRating, rating, testimonials } from "@/data/testimonials"

// Section 8 — Avis clients : grille 5/7. À gauche le titre, l'accroche et les notes en grands chiffres ;
// à droite la citation posée sur une photo du crépuscule (voile vert nuit). Avis réels seulement
// (data/testimonials.ts) : un seul pour l'instant, donc pas de carrousel.
export default function Testimonials() {
  const avis = testimonials[0]

  return (
    <section id="avis" aria-labelledby="avis-titre" className="py-section">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:grid-cols-12 lg:gap-16">

        {/* TEXTE ET NOTES */}
        <div data-reveal className="space-y-6 md:col-span-5">
          <h2 id="avis-titre" className="font-heading text-section text-balance text-text-dark">
            Ils ont séjourné chez nous… et ils en parlent !
          </h2>
          <p className="font-heading text-lg text-balance text-primary-accent md:text-xl">
            Leurs sourires et leurs témoignages sont notre plus belle récompense !
          </p>
          <p className="max-w-[60ch] text-body text-text-dark">
            Découvrez les avis de nos voyageurs et partagez leur expérience : un accueil chaleureux, un cadre
            privilégié et de doux moments au bord de l’océan Indien.
          </p>

          {/* Notes : le chiffre d'abord, la source en dessous */}
          <dl className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-panel bg-mist px-5 py-4">
              <dt className="sr-only">Note {googleRating.source}</dt>
              <dd className="font-heading text-4xl leading-none text-text-dark">
                {googleRating.score}
                <span className="text-lg"> / {googleRating.outOf}</span>
              </dd>
              <dd className="mt-2 flex items-center gap-2 text-sm text-text-dark">
                <span className="flex gap-0.5 text-primary-accent" aria-hidden="true">
                  {Array.from({ length: googleRating.outOf }, (_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </span>
                {googleRating.source}
              </dd>
            </div>
            <div className="rounded-panel bg-mist px-5 py-4">
              <dt className="sr-only">Emplacement</dt>
              <dd className="font-heading text-4xl leading-none text-text-dark">{rating.score}</dd>
              <dd className="mt-2 text-sm text-text-dark">{rating.label}</dd>
            </div>
          </dl>
        </div>

        {/* CITATION SUR PHOTO */}
        {avis && (
          <figure
            data-reveal
            style={{ "--reveal-delay": "200ms" } as CSSProperties}
            className="relative isolate flex min-h-[26rem] flex-col justify-end overflow-hidden rounded-panel p-7 md:col-span-7 md:min-h-[32rem] md:p-12"
          >
            <Image
              src="/images/beach/ocean-crepuscule.jpeg"
              alt=""
              fill
              sizes="(min-width: 1280px) 720px, (min-width: 768px) 58vw, 100vw"
              className="-z-20 object-cover object-[center_35%]"
            />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-forest via-forest/70 to-forest/20" />

            <Quote aria-hidden="true" className="mb-5 h-12 w-12 fill-sand stroke-none md:h-16 md:w-16" />
            <blockquote className="font-heading text-3xl leading-snug text-balance text-primary-light md:text-5xl">
              {avis.quote}
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 text-sm tracking-wide text-primary-light/85">
              <span aria-hidden="true" className="h-px w-10 bg-sand" />
              {avis.author ? `${avis.author}, ` : "Avis publié "}
              {avis.source && <>sur {avis.source}</>}
            </figcaption>
          </figure>
        )}

        <p className="text-center text-body text-text-dark md:col-span-12 md:mx-auto md:max-w-2xl md:text-pretty">
          Merci à tous nos visiteurs pour leur confiance. Nous avons hâte de vous accueillir à votre tour
          Chez L’Avocatier !
        </p>
      </div>
    </section>
  )
}
