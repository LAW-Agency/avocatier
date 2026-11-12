import Image from "next/image"
import type { CSSProperties } from "react"

// Baleines à bosse (version retenue le 2026-11-12, « photo libre ») : la photo du saut en pleine largeur,
// à son format d'origine et sans rien dessus pour qu'elle reste nette ; le texte suit sur vert nuit,
// en trois colonnes (titre et accroche, saison, récit), empilées sur mobile.
export default function Baleines() {
  return (
    <section id="baleines" aria-labelledby="baleines-titre" className="bg-forest text-primary-light">
      <div data-reveal="image" className="relative aspect-[4/3] sm:aspect-[2500/1479] max-h-[100svh] w-full overflow-hidden">
        <Image
          src="/images/island/baleine-saut.webp"
          alt="Baleine à bosse en plein saut hors de l'eau, devant la côte boisée de Sainte-Marie"
          fill
          sizes="100vw"
          className="object-cover object-[60%_30%]"
        />
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-section md:grid-cols-12 lg:gap-16">
        <div className="space-y-5 md:col-span-5">
          <h2 id="baleines-titre" data-reveal className="font-heading text-section text-balance">
            Le spectacle magique des baleines à bosse
          </h2>
          <p data-reveal style={{ "--reveal-delay": "100ms" } as CSSProperties} className="font-heading text-lg text-balance text-sand md:text-xl">
            Une émotion inoubliable au cœur de l’océan Indien !
          </p>
        </div>

        <div
          data-reveal
          style={{ "--reveal-delay": "200ms" } as CSSProperties}
          className="md:col-span-3 md:border-l md:border-primary-light/20 md:pl-8"
        >
          <p className="font-heading text-[clamp(2.25rem,1.5rem+2vw,3rem)] leading-[1.05] text-sand">
            Juillet →
            <br />
            septembre
          </p>
          <p className="mt-3 text-sm text-primary-light/80">Saison des baleines à Sainte-Marie</p>
        </div>

        <div data-reveal style={{ "--reveal-delay": "300ms" } as CSSProperties} className="space-y-4 text-body md:col-span-4">
          <p>
            Chaque année, de juillet à septembre, les baleines à bosse quittent les eaux froides de l’Antarctique pour
            rejoindre les eaux chaudes de Sainte-Marie et donner naissance à leurs petits.
          </p>
          <p>
            Partez à leur rencontre lors d’une excursion en mer avec des guides locaux ou admirez parfois leurs souffles
            depuis la plage.
          </p>
        </div>
      </div>
    </section>
  )
}
