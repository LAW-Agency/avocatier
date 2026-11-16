import Image from "next/image"
import type { CSSProperties } from "react"

// Baleines à bosse (version retenue le 2026-11-16, « format d'origine ») : la photo du saut entière, à son
// format d'origine (2500 × 1479, jamais recadrée) et petite à gauche, la saison en légende dessous ;
// titre, accroche et récit à droite, sur fond brume. Empilé sur mobile.
export default function Baleines() {
  return (
    <section id="baleines" aria-labelledby="baleines-titre" className="bg-mist py-section">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-12 lg:gap-16">
        <figure className="space-y-3 md:col-span-5">
          <div className="relative aspect-[2500/1479] overflow-hidden rounded-card">
            <Image
              src="/images/island/baleine-saut.webp"
              alt="Baleine à bosse en plein saut hors de l'eau, devant la côte boisée de Sainte-Marie"
              fill
              sizes="(min-width: 1024px) 520px, (min-width: 768px) 42vw, 100vw"
              data-reveal="image"
              className="object-cover"
            />
          </div>
          <figcaption className="flex items-baseline justify-between gap-4 border-t border-primary-dark/15 pt-3 text-sm text-text-dark">
            <span>Saison des baleines à Sainte-Marie</span>
            <span className="font-heading text-base text-primary-accent">Juillet → septembre</span>
          </figcaption>
        </figure>

        <div className="space-y-5 md:col-span-7">
          <h2 id="baleines-titre" data-reveal className="font-heading text-section text-balance text-text-dark">
            Le spectacle magique des baleines à bosse
          </h2>
          <p
            data-reveal
            style={{ "--reveal-delay": "100ms" } as CSSProperties}
            className="font-heading text-lg text-balance text-primary-accent md:text-xl"
          >
            Une émotion inoubliable au cœur de l’océan Indien !
          </p>
          <div data-reveal style={{ "--reveal-delay": "200ms" } as CSSProperties} className="space-y-4">
            <p className="max-w-[60ch] text-body text-text-dark">
              Chaque année, de juillet à septembre, les baleines à bosse quittent les eaux froides de l’Antarctique
              pour rejoindre les eaux chaudes de Sainte-Marie et donner naissance à leurs petits.
            </p>
            <p className="max-w-[60ch] text-body text-text-dark">
              Partez à leur rencontre lors d’une excursion en mer avec des guides locaux ou admirez parfois leurs
              souffles depuis la plage.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
