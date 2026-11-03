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
          <SectionTitle title="Le charme d’une adresse confidentielle" />
          <p className="max-w-[60ch] text-body">
            Quelques bungalows et chambres nichés dans un écrin tropical, une piscine, une plage au bout du jardin… Chez L’Avocatier, nous avons choisi l’intimité et la tranquillité plutôt que le nombre.
          </p>
          <p className="max-w-[60ch] text-body">
            Joëlle et Stéphane vous accueillent personnellement dans une atmosphère chaleureuse et conviviale, pour un séjour placé sous le signe de la détente, de l’authenticité et de la douceur de vivre.
          </p>
          <p className="max-w-[60ch] text-body">
            Un petit paradis où l’on se sent tout simplement bien !
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
