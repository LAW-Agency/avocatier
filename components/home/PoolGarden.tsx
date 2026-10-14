import Image from "next/image"
import AnimateOnScroll from "@/components/AnimateOnScroll"
import SectionTitle from "@/components/home/SectionTitle"

// Section 5 — Piscine & jardin : mosaïque de 3 photos (piscine + jardin, puis océan en pleine largeur)
const tiles = [
  {
    label: "Piscine",
    src: "/images/pool/piscine-bungalows.jpeg",
    alt: "La piscine bordée de pierres, face aux bungalows",
    className: "md:col-span-2 h-72 md:h-[28rem]",
    sizes: "(min-width: 1280px) 830px, (min-width: 768px) 66vw, 100vw",
    position: "",
  },
  {
    label: "Jardin",
    src: "/images/hotel/jardin.jpeg",
    alt: "La pelouse du jardin tropical et la piscine sous un ciel de nuages",
    className: "h-72 md:h-[28rem]",
    sizes: "(min-width: 1280px) 410px, (min-width: 768px) 33vw, 100vw",
    position: "",
  },
  {
    label: "Océan",
    src: "/images/beach/ocean-crepuscule.jpeg",
    alt: "L'océan au crépuscule depuis la plage",
    className: "md:col-span-3 h-56 md:h-80",
    sizes: "(min-width: 1280px) 1248px, 100vw",
    position: "object-[center_58%]",
  },
]

export default function PoolGarden() {
  return (
    <section id="piscine-jardin" className="py-20 md:py-28 bg-primary-dark/5">
      <div className="max-w-7xl mx-auto px-4 space-y-12 md:space-y-16">

        <AnimateOnScroll animation="fade-up" className="max-w-2xl mx-auto text-center space-y-5">
          <SectionTitle center eyebrow="Piscine & jardin" title="Ici, les journées ont un autre rythme" />
          <p className="text-base md:text-lg leading-relaxed">
            Un café face à l’océan. Une baignade avant le petit-déjeuner. Une sieste sous les cocotiers.
          </p>
        </AnimateOnScroll>

        <div className="grid md:grid-cols-3 gap-4">
          {tiles.map((tile, i) => (
            <AnimateOnScroll key={tile.label} animation="fade-up" delay={i * 150} className={tile.className}>
              <figure className="group relative h-full overflow-hidden rounded-card">
                <Image
                  src={tile.src}
                  alt={tile.alt}
                  fill
                  sizes={tile.sizes}
                  className={`object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-105 ${tile.position}`}
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-5 pt-12 pb-4 font-heading text-xl md:text-2xl text-primary-light">
                  {tile.label}
                </figcaption>
              </figure>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
