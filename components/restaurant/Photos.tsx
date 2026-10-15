import Image from "next/image"
import type { CSSProperties } from "react"
import ButtonLink from "@/components/ButtonLink"
import SectionTitle from "@/components/home/SectionTitle"

// Grille de 6 colonnes : trois photos en portrait sur la première ligne, deux en paysage sur la seconde.
// Sur mobile : deux colonnes en portrait, la dernière photo en paysage sur toute la largeur
const photos = [
  { src: "/images/restaurant/poulet-riz.jpeg", alt: "Cuisse de poulet grillée et timbale de riz", legende: "Poulet grillé et son riz", cadre: "aspect-[4/5] md:col-span-2" },
  { src: "/images/restaurant/salade-composee.jpeg", alt: "Salade composée dressée en timbale, décorée d'une fleur de carotte", legende: "Salade composée", cadre: "aspect-[4/5] md:col-span-2" },
  { src: "/images/restaurant/tiramisu.jpeg", alt: "Part de tiramisu saupoudrée de cacao", legende: "Tiramisu", cadre: "aspect-[4/5] md:col-span-2" },
  { src: "/images/restaurant/boeuf-puree.jpeg", alt: "Viande tranchée en sauce et purée de pommes de terre", legende: "Viande en sauce et purée", cadre: "aspect-[4/5] md:aspect-[4/3] md:col-span-3" },
  { src: "/images/restaurant/mijote-riz.jpeg", alt: "Mijoté de viande aux légumes et riz blanc", legende: "Mijoté et riz blanc", cadre: "col-span-2 aspect-[4/3] md:col-span-3" },
]

// Légende posée en bas de la photo, sur un voile vert nuit qui assure la lisibilité
const legende =
  "absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest/80 via-forest/35 to-transparent px-3 pt-12 pb-3 md:px-5 md:pt-16 md:pb-4 font-heading text-sm leading-snug md:text-lg text-primary-light"

// Photos des plats (cahier des charges : « Photos »), avec un renvoi vers la galerie complète
export default function Photos() {
  return (
    <section id="photos" className="py-section bg-mist">
      <div className="max-w-7xl mx-auto px-4">
        <div data-reveal className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 mb-8 md:mb-12">
          <SectionTitle title="Dans l’assiette" />
          <ButtonLink href="/galerie?categorie=restaurant" variant="link">Voir toute la galerie</ButtonLink>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 lg:gap-6">
          {photos.map(({ src, alt, legende: texte, cadre }, i) => (
            <figure
              key={src}
              className={`relative overflow-hidden rounded-card ${cadre}`}
            >
              <Image
                src={src}
                alt={alt}
                fill
                sizes={cadre.includes("col-span-3") ? "(min-width: 1280px) 610px, (min-width: 768px) 50vw, 100vw" : "(min-width: 1280px) 400px, (min-width: 768px) 33vw, 50vw"}
                data-reveal="image"
                style={{ "--reveal-delay": `${(i % 3) * 120}ms` } as CSSProperties}
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
