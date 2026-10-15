import Image from "next/image"
import type { CSSProperties } from "react"
import SectionTitle from "@/components/home/SectionTitle"

// Légende posée en bas de la photo, sur un voile vert nuit qui assure la lisibilité
const caption =
  "absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest/80 via-forest/35 to-transparent px-5 pt-16 pb-4 font-heading text-base md:text-lg text-primary-light"

// Sections 4 et 5 réunies — la plage privée (« ici, on vend le rêve ») puis la piscine et le jardin :
// panorama pleine largeur avec le titre posé sur la photo, puis texte et jardin à gauche, piscine à droite
export default function BeachPool() {
  return (
    <section id="plage" className="pb-section">
      {/* Pleine largeur jusqu'à 1536 px : la photo source (1200 px) ne doit pas être trop agrandie */}
      <div className="relative isolate mx-auto max-w-screen-2xl h-[60svh] min-h-[24rem] overflow-hidden">
        {/* Parallaxe : la photo glisse plus lentement que la page */}
        <Image
          src="/images/beach/plage-cocotier.jpeg"
          alt="Cocotier penché au-dessus de la plage et de l'océan"
          fill
          sizes="(min-width: 1536px) 1536px, 100vw"
          className="object-cover object-[center_55%] -z-20 animate-parallax"
        />
        {/* Voile en bas uniquement, pour la lisibilité du titre */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/3 -z-10 bg-gradient-to-t from-forest/75 to-transparent" />

        <div className="max-w-7xl mx-auto h-full px-4 pb-8 md:pb-12 flex items-end">
          <div data-reveal>
            <SectionTitle title="L’océan à quelques pas" light />
          </div>
        </div>
      </div>

      {/* Sous le titre : le texte et le jardin dans la colonne de gauche, la piscine en grand à droite */}
      <div className="max-w-7xl mx-auto px-4 pt-8 md:pt-12 grid md:grid-cols-12 gap-x-4 lg:gap-x-6 gap-y-8">
        <div id="piscine-jardin" className="md:col-span-5 lg:col-span-4 flex flex-col gap-8 md:gap-10">
          <p data-reveal className="max-w-[60ch] text-body">
            Depuis le jardin, un accès direct à la plage : les cocotiers pour l’ombre, une mer calme
            pour la baignade et, chaque soir, le soleil qui se couche sur l’océan. Entre deux baignades,
            la piscine vous attend au cœur du jardin tropical.
          </p>

          {/* Le cadre s'étire pour finir à la même hauteur que la photo de la piscine */}
          <figure className="relative overflow-hidden rounded-card h-64 md:h-auto md:min-h-56 md:flex-1">
            <Image
              src="/images/hotel/jardin.jpeg"
              alt="La pelouse du jardin tropical et la piscine sous un ciel de nuages"
              fill
              sizes="(min-width: 1280px) 410px, (min-width: 768px) 40vw, 100vw"
              data-reveal="image"
              className="object-cover"
            />
            <figcaption className={caption}>Le jardin tropical</figcaption>
          </figure>
        </div>

        <figure className="relative overflow-hidden rounded-card h-72 md:h-[34rem] md:col-span-7 lg:col-span-8">
          {/* Se révèle juste après le jardin */}
          <Image
            src="/images/pool/piscine-bungalows.jpeg"
            alt="La piscine bordée de pierres, face aux bungalows"
            fill
            sizes="(min-width: 1280px) 830px, (min-width: 768px) 58vw, 100vw"
            data-reveal="image"
            style={{ "--reveal-delay": "150ms" } as CSSProperties}
            className="object-cover"
          />
          <figcaption className={caption}>La piscine, entre les bungalows</figcaption>
        </figure>
      </div>
    </section>
  )
}
