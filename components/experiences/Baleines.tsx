import Image from "next/image"
import type { CSSProperties } from "react"

// Baleines à bosse (version retenue le 2026-11-10) : la photo du saut en plein cadre, la baleine laissée libre en haut ;
// le texte en bas, sur la mer assombrie (voile vert nuit qui monte du bas), en deux colonnes.
// Sur mobile, photo puis texte sur vert nuit : sur un écran étroit, le texte couvrirait la baleine.
export default function Baleines() {
  return (
    <section id="baleines" aria-labelledby="baleines-titre" className="relative isolate overflow-hidden bg-forest text-primary-light">
      <div className="relative aspect-[4/3] sm:aspect-[16/9] md:absolute md:inset-0 md:-z-20 md:aspect-auto">
        <Image
          src="/images/island/baleine-saut.webp"
          alt="Baleine à bosse en plein saut hors de l'eau, devant la côte boisée de Sainte-Marie"
          fill
          sizes="100vw"
          className="object-cover object-[60%_30%] animate-parallax"
        />
      </div>
      <div aria-hidden="true" className="absolute inset-0 -z-10 hidden bg-gradient-to-t from-forest via-forest/75 via-40% to-transparent to-70% md:block" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 hidden h-40 bg-gradient-to-b from-forest/40 to-transparent md:block" />

      <div className="mx-auto flex max-w-7xl px-4 py-14 md:min-h-[max(52rem,100svh)] md:items-end md:pb-20 md:pt-40">
        <div className="grid w-full gap-8 md:grid-cols-12 md:items-end lg:gap-16">
          <div className="space-y-5 md:col-span-6">
            <h2 id="baleines-titre" data-reveal className="font-heading text-section text-balance">
              Le spectacle magique des baleines à bosse
            </h2>
            <p data-reveal style={{ "--reveal-delay": "100ms" } as CSSProperties} className="font-heading text-lg text-balance text-sand md:text-xl">
              Une émotion inoubliable au cœur de l’océan Indien !
            </p>
            <div data-reveal style={{ "--reveal-delay": "200ms" } as CSSProperties} className="border-t border-primary-light/25 pt-5">
              <p className="font-heading text-[clamp(2.25rem,1.5rem+2.5vw,3.5rem)] leading-none text-sand">Juillet → septembre</p>
              <p className="mt-2 text-sm text-primary-light/85">Saison des baleines à Sainte-Marie</p>
            </div>
          </div>

          <div
            data-reveal
            style={{ "--reveal-delay": "300ms" } as CSSProperties}
            className="space-y-4 text-body text-primary-light/90 md:col-span-6 lg:col-span-5 lg:col-start-8"
          >
            <p>
              Chaque année, de juillet à septembre, les baleines à bosse quittent les eaux froides de l’Antarctique pour
              rejoindre les eaux chaudes de Sainte-Marie et donner naissance à leurs petits.
            </p>
            <p>
              Partez à leur rencontre lors d’une excursion en mer avec des guides locaux ou admirez parfois leurs
              souffles depuis la plage.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
