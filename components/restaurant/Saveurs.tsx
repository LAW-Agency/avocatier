import Image from "next/image"
import type { CSSProperties } from "react"
import SectionTitle from "@/components/home/SectionTitle"

// TODO client : produits à confirmer (cahier des charges : « produits & saveurs locales »),
// ainsi que la mention « bio » reprise sur le site (accueil, hôtel, restaurant)
const produits = [
  { nom: "Vanille de Madagascar", detail: "Pour des desserts et des glaces maison délicieusement parfumés." },
  { nom: "Poisson frais", detail: "Pêché localement et préparé selon les arrivages." },
  { nom: "Riz de Madagascar", detail: "L’incontournable de la cuisine malgache, servi au fil des repas." },
  { nom: "Fruits tropicaux", detail: "Papayes, bananes et agrumes pour une touche de fraîcheur et d’exotisme." },
]

// Produits & saveurs locales — section vert nuit : photo à gauche, texte et produits à droite
export default function Saveurs() {
  return (
    <section id="saveurs" className="py-section bg-forest">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-12 gap-10 lg:gap-14 items-center">

        <div className="relative overflow-hidden rounded-card md:col-span-5 aspect-[4/5]">
          <Image
            src="/images/restaurant/glace-vanille.jpeg"
            alt="Coupe de glace à la vanille, parsemée de grains de vanille"
            fill
            sizes="(min-width: 1280px) 510px, (min-width: 768px) 42vw, 100vw"
            data-reveal="image"
            className="object-cover"
          />
        </div>

        <div
          data-reveal
          style={{ "--reveal-delay": "200ms" } as CSSProperties}
          className="md:col-span-7 space-y-8"
        >
          <div className="space-y-5">
            <SectionTitle title="Le goût authentique de Sainte-Marie" light />
            <p className="max-w-[60ch] text-body text-primary-light/80">
              Chez L’Avocatier, nous privilégions les produits locaux, frais et bio, issus des producteurs de l’île. Poissons fraîchement pêchés, fruits tropicaux, légumes de saison, vanille et noix de coco composent une cuisine généreuse aux saveurs de Madagascar.
            </p>
            <p className="max-w-[60ch] text-body text-primary-light/80">
              Entre recettes traditionnelles malgaches et inspirations françaises, chaque assiette célèbre les richesses de l’île et le savoir-faire local.
            </p>
          </div>

          <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {produits.map(({ nom, detail }) => (
              <div key={nom} className="border-t border-primary-light/15 pt-4">
                <dt className="font-heading text-xl text-sand">{nom}</dt>
                <dd className="mt-1 text-[0.95rem] leading-relaxed text-primary-light/75">{detail}</dd>
              </div>
            ))}
          </dl>

          <p className="max-w-[60ch] font-heading text-lg md:text-xl text-balance text-sand">
            Des produits authentiques, des saveurs généreuses et un véritable goût de Madagascar !
          </p>
        </div>
      </div>
    </section>
  )
}
