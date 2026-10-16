import Image from "next/image"
import type { CSSProperties } from "react"
import SectionTitle from "@/components/home/SectionTitle"

// TODO client : produits à confirmer (cahier des charges : « produits & saveurs locales »),
// ainsi que la mention « bio » reprise sur le site (accueil, hôtel, restaurant)
const produits = [
  { nom: "Vanille", detail: "Vanille bourbon de Madagascar, dans les glaces et les desserts maison." },
  { nom: "Poisson", detail: "Issu de la pêche locale du jour, grillé avec les légumes de saison." },
  { nom: "Riz", detail: "Riz de Madagascar, base de la cuisine malgache, présent à chaque repas." },
  { nom: "Fruits tropicaux", detail: "Papaye, banane, agrumes : cultivés sur l’île, au fil des saisons." },
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
            <SectionTitle title="Le goût de Sainte-Marie" light />
            <p className="max-w-[60ch] text-body text-primary-light/80">
              Nous privilégions les circuits courts et les produits bio : poisson de la pêche locale,
              légumes et fruits de saison, riz, vanille et coco issus de producteurs de l’île. Une cuisine
              plus fraîche et plus authentique, qui soutient directement l’économie de Sainte-Marie.
            </p>
            <p className="max-w-[60ch] text-body text-primary-light/80">
              Recettes malgaches et classiques français arrivent à table avec soin, sur des sets tressés à la main.
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
        </div>
      </div>
    </section>
  )
}
