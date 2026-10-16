import Image from "next/image"
import type { CSSProperties } from "react"
import SectionTitle from "@/components/home/SectionTitle"

// Le restaurant : texte à gauche, deux photos en portrait décalées à droite (la table, puis l'assiette)
export default function Restaurant() {
  return (
    <section id="restaurant" className="py-section">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-12 gap-10 lg:gap-14 items-center">

        <div data-reveal className="md:col-span-5 space-y-5">
          <SectionTitle title="Le restaurant, entre jardin et océan" />
          <p className="max-w-[60ch] text-body">
            Au déjeuner comme au dîner, la carte suit les arrivages du marché local et la pêche du
            jour : poisson grillé, légumes de saison, viandes mijotées, riz parfumé et desserts maison
            à la vanille de Madagascar.
          </p>
          <p className="max-w-[60ch] text-body">
            Le service est assuré en salle ou dans le jardin, sous la paillote, selon la météo et
            vos préférences, avec vue sur l’océan.
          </p>
        </div>

        {/* Deux photos côte à côte, la seconde plus bas : un rythme plutôt qu'une grille */}
        <div className="md:col-span-7 grid grid-cols-2 gap-4 lg:gap-6">
          <div className="relative overflow-hidden rounded-card aspect-[3/4]">
            <Image
              src="/images/restaurant/jardin-table-plage.jpeg"
              alt="Une table sous la paillote, sur la pelouse au bord de la plage, au soleil couchant"
              fill
              sizes="(min-width: 1280px) 400px, (min-width: 768px) 28vw, 50vw"
              data-reveal="image"
              className="object-cover"
            />
          </div>
          <div className="relative overflow-hidden rounded-card aspect-[3/4] mt-12 md:mt-20">
            <Image
              src="/images/restaurant/poisson-grille.jpeg"
              alt="Poisson grillé entier et poêlée de légumes, sur un set de table tressé"
              fill
              sizes="(min-width: 1280px) 400px, (min-width: 768px) 28vw, 50vw"
              data-reveal="image"
              style={{ "--reveal-delay": "150ms" } as CSSProperties}
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
