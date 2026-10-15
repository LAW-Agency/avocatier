import Image from "next/image"
import type { CSSProperties } from "react"
import ButtonLink from "@/components/ButtonLink"
import SectionTitle from "@/components/home/SectionTitle"

// Photos déjà vues ailleurs sur le site : un avant-goût, la galerie complète est sur /galerie
const photos = [
  { src: "/images/rooms/chambre-verte.jpeg", alt: "Chambre d'un bungalow avec lit à baldaquin et moustiquaire" },
  { src: "/images/beach/ocean-crepuscule.jpeg", alt: "L'océan au crépuscule, silhouette d'un palmier" },
  { src: "/images/pool/piscine-bungalows.jpeg", alt: "La piscine bordée de pierres, face aux bungalows" },
  { src: "/images/restaurant/table-ocean-coucher-soleil.jpeg", alt: "Table et paillote dans le jardin, face à l'océan au coucher du soleil" },
]

// Galerie (cahier des charges) : une bande de quatre photos et le renvoi vers la galerie
export default function ApercuGalerie() {
  return (
    <section id="galerie" className="py-section bg-mist">
      <div className="max-w-7xl mx-auto px-4">
        <div data-reveal className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 mb-8 md:mb-12">
          <SectionTitle title="Chez L’Avocatier en images" />
          <ButtonLink href="/galerie" variant="link">Voir toute la galerie</ButtonLink>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {photos.map(({ src, alt }, i) => (
            <div key={src} className="relative overflow-hidden rounded-card aspect-[4/5]">
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(min-width: 1280px) 300px, (min-width: 768px) 25vw, 50vw"
                data-reveal="image"
                style={{ "--reveal-delay": `${i * 120}ms` } as CSSProperties}
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
