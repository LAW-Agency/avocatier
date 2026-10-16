import Image from "next/image"
import type { CSSProperties } from "react"
import SectionTitle from "@/components/home/SectionTitle"
import { lieux, panoramaIle } from "@/data/experiences"

// Découvrir Sainte-Marie (référencement), sur fond clair juste après le hero : présentation de l'île,
// panorama encadré (pas pleine largeur, pour ne pas enchaîner deux photos plein écran), puis les lieux
// à voir en quatre colonnes. Photos de Wikimedia Commons : crédits obligatoires en bas de section.
export default function Ile() {
  const photos = [{ nom: "Panorama", image: panoramaIle }, ...lieux]

  return (
    <section id="sainte-marie" className="py-section">
      <div className="max-w-7xl mx-auto px-4">
        {/* Présentation de l'île */}
        <div className="grid md:grid-cols-12 gap-6 lg:gap-14 items-end">
          <div data-reveal className="md:col-span-7 space-y-6">
            <SectionTitle title="Découvrir Sainte-Marie" />
            <p className="max-w-[30ch] font-heading text-[clamp(1.375rem,1.1rem+1vw,2rem)] leading-snug text-balance">
              Nosy Boraha, comme on l’appelle en malgache, s’étire sur une soixantaine de kilomètres au
              large de la côte est de Madagascar.
            </p>
          </div>
          <div data-reveal style={{ "--reveal-delay": "150ms" } as CSSProperties} className="md:col-span-5 lg:col-span-4 lg:col-start-9 space-y-4">
            <p className="max-w-[60ch] text-body">
              Une route côtière la parcourt de village de pêcheurs en village, entre cocotiers, lagons
              turquoise et petites criques.
            </p>
            <p className="max-w-[60ch] text-body">
              Ancien repaire de pirates, l’île en garde un cimetière historique face à la baie.
              Aujourd’hui, ce sont sa nature préservée et son rythme paisible qui séduisent les voyageurs.
            </p>
          </div>
        </div>

        {/* Panorama encadré — parallaxe dans le cadre */}
        <div className="relative overflow-hidden rounded-card mt-12 md:mt-16 aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]">
          <Image
            src={panoramaIle.src}
            alt={panoramaIle.alt}
            fill
            sizes="(min-width: 1280px) 1248px, 100vw"
            className={`object-cover animate-parallax ${panoramaIle.position ?? ""}`}
          />
        </div>

        {/* Lieux à voir */}
        <ol className="mt-14 md:mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {lieux.map(({ nom, texte, image }, i) => (
            <li key={nom}>
              <div className="relative overflow-hidden rounded-card aspect-[4/5]">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  data-reveal="image"
                  style={{ "--reveal-delay": `${i * 120}ms` } as CSSProperties}
                  className={`object-cover ${image.position ?? ""}`}
                />
              </div>
              <div data-reveal style={{ "--reveal-delay": `${i * 120 + 150}ms` } as CSSProperties} className="pt-5 space-y-2">
                <p aria-hidden="true" className="font-heading text-sm text-primary-accent tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="font-heading text-xl md:text-2xl leading-tight text-balance">{nom}</h3>
                <p className="text-[0.95rem] leading-relaxed">{texte}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
