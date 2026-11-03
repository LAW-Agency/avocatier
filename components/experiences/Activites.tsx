import type { CSSProperties } from "react"
import ButtonLink from "@/components/ButtonLink"
import SectionTitle from "@/components/home/SectionTitle"
import { activites } from "@/data/experiences"

// Excursions et activités nautiques — sans photo (pas d'images du client pour ces sorties) :
// une liste typographique, et un appel à écrire aux hôtes pour organiser le séjour
export default function Activites() {
  return (
    <section id="excursions" className="py-section">
      <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-12 gap-10 lg:gap-14">
        <div data-reveal className="lg:col-span-4 space-y-5 lg:sticky lg:top-28 lg:self-start">
          <SectionTitle title="Excursions et activités" />
          <p className="max-w-[60ch] font-heading text-lg md:text-xl text-balance text-primary-accent">
            Vivez Sainte-Marie pleinement !
          </p>
          <p className="max-w-[60ch] text-body">
            Baleines, plongée, balades en pirogue, pêche ou découverte de l’île… Sainte-Marie regorge d’expériences à vivre !
          </p>
          <p className="max-w-[60ch] text-body">
            Joëlle et Stéphane vous conseillent et vous orientent vers des prestataires locaux de confiance pour organiser vos excursions et profiter pleinement de votre séjour.
          </p>
          <p className="max-w-[60ch] text-body">
            À vous l’aventure, nous vous aidons à la préparer !
          </p>
          <ButtonLink href="/contact" variant="link">Préparez vos excursions</ButtonLink>
        </div>

        <ul className="lg:col-span-8 lg:col-start-5 divide-y divide-primary-dark/15 border-y border-primary-dark/15">
          {activites.map(({ nom, periode, texte, icon: Icon }, i) => (
            <li
              key={nom}
              data-reveal
              style={{ "--reveal-delay": `${i * 80}ms` } as CSSProperties}
              className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 py-6 sm:grid-cols-[auto_14rem_1fr] sm:items-start sm:gap-x-8"
            >
              <Icon className="row-span-2 mt-0.5 w-7 h-7 stroke-[1.25] sm:row-span-1" aria-hidden="true" />
              <div>
                <h3 className="font-heading text-xl md:text-2xl leading-tight">{nom}</h3>
                {periode && <p className="mt-1 text-sm text-primary-accent">{periode}</p>}
              </div>
              <p className="text-[0.95rem] leading-relaxed sm:pt-1">{texte}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
