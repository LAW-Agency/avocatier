import Image from "next/image"
import type { CSSProperties } from "react"
import SectionTitle from "@/components/home/SectionTitle"
import Grain, { FOND_SABLE } from "@/components/home/Grain"
import LienSable from "@/components/home/LienSable"

// Les trois paragraphes du client, chacun associé à un moment de la journée et à sa photo (portrait)
const moments = [
  {
    moment: "Le matin",
    texte:
      "Commencez la journée par un délicieux petit-déjeuner continental, puis laissez-vous tenter par une cuisine maison généreuse, inspirée des saveurs malgaches et préparée avec des produits frais et locaux.",
    image: { src: "/images/restaurant/petit-dejeuner.jpeg", alt: "Plateau du petit-déjeuner : fruits, viennoiseries, confitures et jus de fruits" },
  },
  {
    moment: "Le midi",
    texte:
      "Poissons de la pêche du jour, fruits tropicaux et spécialités gourmandes se dégustent face à l’océan, dans un cadre privilégié.",
    image: { src: "/images/restaurant/poisson-grille.jpeg", alt: "Poisson grillé entier et poêlée de légumes" },
  },
  {
    moment: "Le soir",
    texte:
      "En fin de journée, retrouvez le bar au bord de la piscine pour savourer un cocktail et profiter de la douceur des soirées tropicales.",
    image: { src: "/images/restaurant/table-ocean-coucher-soleil.jpeg", alt: "Table et paillote dans le jardin, face à l'océan au coucher du soleil" },
  },
]

// Section 6 — Restaurant et bar : une journée gourmande en trois temps (matin, table, soir) au lieu
// d'un bloc photo + texte. Fond sable : texte courant en encre, liens en bordeaux (contraste).
export default function Restaurant() {
  return (
    <section id="restaurant" aria-labelledby="restaurant-titre" className={`${FOND_SABLE} py-section`}>
      <Grain />
      <div className="mx-auto max-w-7xl px-4">
        <div data-reveal className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-4">
            <div id="restaurant-titre">
              <SectionTitle title="Un voyage gourmand aux saveurs de Madagascar" />
            </div>
            <p className="font-heading text-lg text-balance text-primary-accent md:text-xl">
              La gourmandise face à l’océan Indien !
            </p>
          </div>
          <div className="shrink-0">
            <LienSable href="/restaurant">Découvrez notre restaurant et notre bar</LienSable>
          </div>
        </div>

        <ol className="mt-10 grid gap-8 md:mt-14 md:grid-cols-3 md:gap-6 lg:gap-8">
          {moments.map(({ moment, texte, image }, i) => (
            <li
              key={moment}
              data-reveal
              style={{ "--reveal-delay": `${i * 150}ms` } as CSSProperties}
              // Colonne du milieu décalée vers le bas : rythme de carnet de voyage (desktop)
              className={i === 1 ? "md:mt-16" : ""}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-panel sm:aspect-[4/5]">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1280px) 400px, (min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <h3 className="mt-5 flex items-center gap-3 font-heading text-xl text-primary-accent">
                <span aria-hidden="true" className="h-px w-8 bg-primary-accent/60" />
                {moment}
              </h3>
              <p className="mt-2 text-body text-ink">{texte}</p>
            </li>
          ))}
        </ol>

        <p data-reveal className="mx-auto mt-14 max-w-3xl text-center font-heading text-2xl leading-snug text-balance text-text-dark md:mt-20 md:text-3xl">
          Chez L’Avocatier, chaque repas est une invitation au voyage !
        </p>
      </div>
    </section>
  )
}
