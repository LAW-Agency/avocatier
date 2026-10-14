import Image from "next/image"
import type { CSSProperties } from "react"
import SectionTitle from "@/components/home/SectionTitle"

// Section 5 — Piscine & jardin : mosaïque de 3 photos (piscine + jardin, puis océan en pleine largeur)
const tiles = [
  {
    caption: "La piscine, entre les bungalows",
    src: "/images/pool/piscine-bungalows.jpeg",
    alt: "La piscine bordée de pierres, face aux bungalows",
    className: "md:col-span-8",
    frame: "h-64 md:h-[26rem]",
    sizes: "(min-width: 1280px) 830px, (min-width: 768px) 66vw, 100vw",
    position: "",
  },
  {
    caption: "Le jardin tropical",
    src: "/images/hotel/jardin.jpeg",
    alt: "La pelouse du jardin tropical et la piscine sous un ciel de nuages",
    className: "md:col-span-4",
    frame: "h-64 md:h-[26rem]",
    sizes: "(min-width: 1280px) 410px, (min-width: 768px) 33vw, 100vw",
    position: "",
  },
  {
    caption: "L’océan, au crépuscule",
    src: "/images/beach/ocean-crepuscule.jpeg",
    alt: "L'océan au crépuscule depuis la plage",
    className: "md:col-span-12",
    frame: "h-52 md:h-72",
    sizes: "(min-width: 1280px) 1248px, 100vw",
    position: "object-[center_58%]",
  },
]

export default function PoolGarden() {
  return (
    <section id="piscine-jardin" className="py-section bg-mist">
      <div className="max-w-7xl mx-auto px-4 space-y-8 md:space-y-12">

        {/* En-tête éditorial : titre à gauche, phrase à droite — monte au défilement */}
        <div data-reveal className="grid md:grid-cols-12 gap-5 md:gap-12 md:items-end">
          <div className="md:col-span-6">
            <SectionTitle title="Ici, les journées ont un autre rythme" />
          </div>
          <p className="md:col-span-6 lg:col-start-8 lg:col-span-5 max-w-[60ch] text-body">
            Un café face à l’océan. Une baignade avant le petit-déjeuner. Une sieste sous les cocotiers.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-x-4 gap-y-6">
          {tiles.map((tile, i) => (
            <figure key={tile.caption} className={tile.className}>
              <div className={`relative overflow-hidden rounded-card ${tile.frame}`}>
                {/* Cascade : chaque photo se révèle 150 ms après la précédente */}
                <Image
                  src={tile.src}
                  alt={tile.alt}
                  fill
                  sizes={tile.sizes}
                  data-reveal="image"
                  style={{ "--reveal-delay": `${i * 150}ms` } as CSSProperties}
                  className={`object-cover ${tile.position}`}
                />
              </div>
              <figcaption className="mt-3 text-sm text-text-dark">{tile.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
