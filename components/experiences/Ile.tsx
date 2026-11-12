import Image from "next/image"
import type { CSSProperties } from "react"
import SectionTitle from "@/components/home/SectionTitle"
import { Anchor, Leaf } from "lucide-react"
import { lieux, panoramaIle, photosIle } from "@/data/experiences"

// Les deux phrases du client, chacune avec un petit titre tiré de son contenu
const piliers = [
  {
    titre: "Une île d’histoire",
    texte: "Ancien refuge des pirates, l’île conserve les traces de son histoire, notamment son célèbre cimetière face à la baie.",
    icon: Anchor,
  },
  {
    titre: "Une nature préservée",
    texte: "Entre nature préservée, rencontres authentiques et douceur de vivre, Sainte-Marie vous promet un dépaysement inoubliable.",
    icon: Leaf,
  },
]

// Découvrir Sainte-Marie (référencement), juste après le hero : intro centrée, deux encarts (histoire, nature),
// puis les lieux à voir en mosaïque : la grande case (2 × 2 sur grand écran) réunit deux photos en haut
// (cascade, phare) et le panorama en bas, sous la phrase d'accroche ;
// les quatre lieux l'entourent, texte posé sur la photo.
// Crédits Wikimedia Commons retirés de la section à la demande (2026-11-10) : ils restent dus (licences CC BY / BY-SA),
// voir data/experiences.ts.
export default function Ile() {
  return (
    <section id="sainte-marie" className="py-section">
      <div className="mx-auto max-w-7xl px-4">
        {/* Intro centrée façon page de magazine : titre, chapeau, puis deux « piliers » côte à côte */}
        <div className="mx-auto max-w-4xl text-center">
          <div data-reveal>
            <SectionTitle title="Découvrez Sainte-Marie, l’île aux mille trésors" center />
          </div>
          <p
            data-reveal
            style={{ "--reveal-delay": "120ms" } as CSSProperties}
            className="mx-auto mt-6 max-w-[42ch] font-heading text-[clamp(1.25rem,1.05rem+0.8vw,1.75rem)] leading-snug text-balance text-ink"
          >
            Au large de la côte est de Madagascar, Nosy Boraha dévoile un véritable décor de carte postale : plages de
            sable fin, cocotiers, lagons turquoise et petits villages de pêcheurs.
          </p>
        </div>

        <ul className="mx-auto mt-12 grid max-w-5xl gap-px overflow-hidden rounded-panel bg-primary-dark/15 md:mt-14 md:grid-cols-2">
          {piliers.map(({ titre, texte, icon: Icon }, i) => (
            <li
              key={titre}
              data-reveal
              style={{ "--reveal-delay": `${240 + i * 120}ms` } as CSSProperties}
              className="flex gap-5 bg-mist p-6 sm:p-8"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-background text-text-dark">
                <Icon aria-hidden="true" className="h-6 w-6 stroke-[1.25]" />
              </span>
              <span>
                <span className="block font-heading text-xl leading-tight text-text-dark">{titre}</span>
                <span className="mt-2 block text-[0.95rem] leading-relaxed text-ink">{texte}</span>
              </span>
            </li>
          ))}
        </ul>

        <h3 id="lieux" className="sr-only">Les lieux à voir</h3>
        <ul className="mt-12 grid scroll-mt-28 grid-cols-1 gap-4 sm:grid-cols-2 md:mt-16 lg:grid-cols-4 lg:grid-rows-2 lg:gap-5">
          {/* Le panorama : grande case */}
          <li
            data-reveal
            className="relative isolate flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-panel p-6 text-primary-light sm:col-span-2 lg:row-span-2 lg:aspect-auto lg:min-h-[36rem]"
          >
            {/* Deux photos en haut (40 %), le panorama en bas, séparés d'un filet clair */}
            <div className="absolute inset-0 -z-20 grid grid-cols-2 grid-rows-[2fr_3fr] gap-0.5 bg-primary-light/70">
              {photosIle.map((photo) => (
                <div key={photo.src} className="relative">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 1280px) 310px, (min-width: 640px) 50vw, 50vw"
                    className={`object-cover ${photo.position ?? ""}`}
                  />
                </div>
              ))}
              <div className="relative col-span-2">
                <Image
                  src={panoramaIle.src}
                  alt={panoramaIle.alt}
                  fill
                  sizes="(min-width: 1280px) 620px, (min-width: 640px) 100vw, 100vw"
                  className={`object-cover ${panoramaIle.position ?? ""}`}
                />
              </div>
            </div>
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-forest/85 via-forest/10 via-35% to-transparent to-50%" />
            <p className="font-heading text-2xl leading-tight text-balance md:text-3xl">
              Une île à explorer, des merveilles à découvrir et des souvenirs à emporter !
            </p>
          </li>

          {lieux.map(({ nom, texte, image, image2 }, i) => (
            <li
              key={nom}
              data-reveal
              style={{ "--reveal-delay": `${(i + 1) * 100}ms` } as CSSProperties}
              className="relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-panel p-5 text-primary-light lg:aspect-auto"
            >
              {image2 ? (
                // Deux photos côte à côte, séparées d'un filet clair
                <div className="absolute inset-0 -z-20 grid grid-cols-2 gap-0.5 bg-primary-light/70">
                  {[image, image2].map((photo) => (
                    <div key={photo.src} className="relative">
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="(min-width: 1280px) 150px, (min-width: 1024px) 13vw, (min-width: 640px) 25vw, 50vw"
                        className={`object-cover ${photo.position ?? ""}`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className={`-z-20 object-cover ${image.position ?? ""}`}
                />
              )}
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-forest/90 via-forest/35 to-transparent" />
              <h4 className="font-heading text-xl leading-tight text-balance">{nom}</h4>
              <p className="mt-1.5 text-sm leading-snug text-primary-light/90">{texte}</p>
            </li>
          ))}
        </ul>

      </div>
    </section>
  )
}
