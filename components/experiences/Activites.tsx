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
          <p className="max-w-[60ch] text-body">
            Baleines, plongée, pirogue ou tour de l’île : dites-nous vos envies dès votre réservation.
            Joëlle et Stéphane vous recommandent des prestataires locaux de confiance et vous aident à
            organiser vos journées, pour profiter de l’île sans perdre de temps.
          </p>
          <ButtonLink href="/contact" variant="link">Préparer vos excursions</ButtonLink>
        </div>

        <ul className="lg:col-span-8 lg:col-start-5 divide-y divide-primary-dark/15 border-y border-primary-dark/15">
          {activites.map(({ nom, texte, icon: Icon }, i) => (
            <li
              key={nom}
              data-reveal
              style={{ "--reveal-delay": `${i * 80}ms` } as CSSProperties}
              className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 py-6 sm:grid-cols-[auto_14rem_1fr] sm:items-start sm:gap-x-8"
            >
              <Icon className="row-span-2 mt-0.5 w-7 h-7 stroke-[1.25] sm:row-span-1" aria-hidden="true" />
              <h3 className="font-heading text-xl md:text-2xl leading-tight">{nom}</h3>
              <p className="text-[0.95rem] leading-relaxed sm:pt-1">{texte}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
