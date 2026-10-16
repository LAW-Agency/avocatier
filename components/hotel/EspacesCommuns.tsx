import Image from "next/image"
import type { CSSProperties } from "react"
import SectionTitle from "@/components/home/SectionTitle"

const espaces = [
  {
    src: "/images/hotel/salon.jpeg",
    alt: "Le salon : canapés en bois, table basse et escalier habillé de branches blanches",
    legende: "Le salon",
    cadre: "md:col-span-7 aspect-[4/3]",
    sizes: "(min-width: 1280px) 720px, (min-width: 768px) 58vw, 100vw",
  },
  {
    src: "/images/hotel/allee-baobabs.jpeg",
    alt: "Allée entre deux bâtiments, dont le mur est peint d'une fresque de baobabs",
    legende: "L’allée des baobabs",
    cadre: "md:col-span-5 aspect-[4/3] md:aspect-auto",
    sizes: "(min-width: 1280px) 510px, (min-width: 768px) 42vw, 100vw",
  },
]

// Légende posée en bas de la photo, sur un voile vert nuit qui assure la lisibilité
const legende =
  "absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest/80 via-forest/35 to-transparent px-5 pt-16 pb-4 font-heading text-base md:text-lg text-primary-light"

// Les espaces communs : titre et texte en tête, puis deux photos en 7/5
// TODO client : confirmer les espaces partagés (salon, salle à manger…) et leurs usages
export default function EspacesCommuns() {
  return (
    <section id="espaces-communs" className="py-section">
      <div className="max-w-7xl mx-auto px-4">
        <div data-reveal className="grid md:grid-cols-12 gap-6 lg:gap-14 items-end mb-8 md:mb-12">
          <div className="md:col-span-5">
            <SectionTitle title="Des espaces communs pleins de caractère" />
          </div>
          <p className="md:col-span-7 max-w-[60ch] text-body">
            Fresques murales, luminaires tressés, mobilier en bois&nbsp;: la décoration, artisanale,
            raconte Madagascar. Ouvert sur le jardin, le salon se prête à la lecture comme aux
            conversations de fin de journée.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-4 lg:gap-6">
          {espaces.map(({ src, alt, legende: texte, cadre, sizes }, i) => (
            <figure key={src} className={`relative overflow-hidden rounded-card ${cadre}`}>
              <Image
                src={src}
                alt={alt}
                fill
                sizes={sizes}
                data-reveal="image"
                style={{ "--reveal-delay": `${i * 150}ms` } as CSSProperties}
                className="object-cover"
              />
              <figcaption className={legende}>{texte}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
