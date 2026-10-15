import Image from "next/image"
import type { CSSProperties } from "react"
import SectionTitle from "@/components/home/SectionTitle"
import { journee } from "@/data/experiences"

// Sur place — plage, piscine, détente, nature — racontés comme une journée, du matin au soir.
// Quatre colonnes décalées en escalier sur grand écran : le temps qui passe.
export default function Journee() {
  return (
    <section id="sur-place" className="py-section bg-mist">
      <div className="max-w-7xl mx-auto px-4">
        <div data-reveal className="grid md:grid-cols-12 gap-6 lg:gap-14 items-end mb-10 md:mb-14">
          <div className="md:col-span-5">
            <SectionTitle title="Du matin au soir" />
          </div>
          <p className="md:col-span-7 max-w-[60ch] text-body">
            La plage au bout du jardin, la piscine, l’ombre des cocotiers : sur place, chaque moment
            de la journée a son décor.
          </p>
        </div>

        <ol className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {journee.map(({ moment, titre, texte, image }, i) => (
            <li
              key={moment}
              // Escalier : chaque moment un peu plus bas que le précédent sur grand écran
              className={["", "lg:mt-12", "lg:mt-24", "lg:mt-36"][i] ?? ""}
            >
              <div className="relative overflow-hidden rounded-card aspect-[3/4]">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1280px) 300px, (min-width: 1024px) 25vw, 50vw"
                  data-reveal="image"
                  style={{ "--reveal-delay": `${i * 120}ms` } as CSSProperties}
                  className="object-cover"
                />
              </div>
              <div data-reveal style={{ "--reveal-delay": `${i * 120 + 150}ms` } as CSSProperties} className="pt-5 space-y-2">
                <p className="font-heading text-sm tracking-wide">{moment}</p>
                <h3 className="font-heading text-lg sm:text-xl md:text-2xl leading-tight text-balance">{titre}</h3>
                <p className="text-[0.95rem] leading-relaxed">{texte}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
