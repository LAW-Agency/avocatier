import Image from "next/image"
import type { CSSProperties } from "react"
import SectionTitle from "@/components/home/SectionTitle"

// Notre histoire : texte à gauche, le panneau peint de l'hôtel à droite
// TODO client : raconter l'histoire du lieu (origine du nom, arrivée de Joëlle et Stéphane, dates)
export default function Histoire() {
  return (
    <section id="histoire" className="py-section">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-12 gap-10 lg:gap-14 items-center">

        <div data-reveal className="md:col-span-5 space-y-5">
          <SectionTitle title="Une adresse à taille humaine" />
          <p className="max-w-[60ch] text-body">
            Quelques bungalows et chambres seulement, un grand jardin tropical, une piscine et la plage
            au bout de la pelouse : Chez L’Avocatier a choisi l’intimité plutôt que le nombre. Un format
            qui garantit à chacun un séjour au calme et l’attention de ses hôtes.
          </p>
          <p className="max-w-[60ch] text-body">
            Le panneau peint au bord de la route de Vohilava résume l’essentiel : piscine, accès direct
            à la plage, calme et coucher de soleil face à l’océan. Une promesse simple, tenue chaque jour.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-card md:col-span-7 aspect-[4/3]">
          <Image
            src="/images/hotel/panneau.jpeg"
            alt="Le panneau jaune peint de Chez L'Avocatier au bord de la route, entre les arbres"
            fill
            sizes="(min-width: 1280px) 720px, (min-width: 768px) 58vw, 100vw"
            data-reveal="image"
            style={{ "--reveal-delay": "150ms" } as CSSProperties}
            className="object-cover object-[60%_center]"
          />
        </div>
      </div>
    </section>
  )
}
