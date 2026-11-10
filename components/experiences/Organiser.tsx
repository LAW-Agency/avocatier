import Image from "next/image"
import type { CSSProperties } from "react"
import ButtonLink from "@/components/ButtonLink"
import SectionTitle from "@/components/home/SectionTitle"

// Le paragraphe du client sur l'aide des hôtes, déroulé en trois temps (rien n'est promis de plus que son texte)
const etapes = [
  { titre: "Dites-nous vos envies", texte: "Baleines, plongée, pirogue, pêche ou tour de l’île : parlez-nous de ce qui vous fait rêver." },
  { titre: "Nous vous orientons", texte: "Joëlle et Stéphane vous conseillent et vous orientent vers des prestataires locaux de confiance." },
  { titre: "Vivez l’île à votre rythme", texte: "Profitez pleinement de votre séjour, puis retrouvez le calme de votre bungalow." },
]

// Photo de la plage à gauche, les trois temps à droite ; fond crème
export default function Organiser() {
  return (
    <section id="organiser" className="py-section">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:grid-cols-12 lg:gap-16">
        <div className="relative overflow-hidden rounded-panel aspect-[4/5] md:col-span-5">
          <Image
            src="/images/beach/plage-cocotier.jpeg"
            alt="Cocotier penché au-dessus de la plage et de l'océan"
            fill
            sizes="(min-width: 1280px) 500px, (min-width: 768px) 40vw, 100vw"
            data-reveal="image"
            className="object-cover"
          />
        </div>

        <div className="space-y-8 md:col-span-7 lg:col-span-6 lg:col-start-7">
          <div data-reveal className="space-y-4">
            <SectionTitle title="À vous l’aventure, nous vous aidons à la préparer !" />
          </div>

          <ol className="space-y-6">
            {etapes.map((e, i) => (
              <li
                key={e.titre}
                data-reveal
                style={{ "--reveal-delay": `${(i + 1) * 120}ms` } as CSSProperties}
                className="flex gap-5 border-t border-primary-dark/15 pt-6"
              >
                <span aria-hidden="true" className="font-heading text-3xl leading-none tabular-nums text-primary-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block font-heading text-xl leading-snug text-text-dark">{e.titre}</span>
                  <span className="mt-1 block text-body text-ink">{e.texte}</span>
                </span>
              </li>
            ))}
          </ol>

          {/* TODO client : /contact n'existe pas encore (même lien que la page actuelle) */}
          <div data-reveal style={{ "--reveal-delay": "480ms" } as CSSProperties}>
            <ButtonLink href="/contact" variant="link">Préparez vos excursions</ButtonLink>
          </div>
        </div>
      </div>
    </section>
  )
}
