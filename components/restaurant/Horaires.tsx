import { Mail, Phone } from "lucide-react"
import type { CSSProperties } from "react"
import ButtonLink from "@/components/ButtonLink"
import SectionTitle from "@/components/home/SectionTitle"
import { contact } from "@/data/contact"
import { horaires } from "@/data/restaurant"

// Horaires puis « Réserver / Nous contacter » (cahier des charges) : la réservation du séjour
// est le bandeau final de la page, ici on invite à écrire pour tout ce qui touche à la table
export default function Horaires() {
  return (
    <section id="horaires" className="py-section">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-12 gap-10 lg:gap-14 items-start">

        <div data-reveal className="md:col-span-6 lg:col-span-5 space-y-6">
          <SectionTitle title="Horaires" />
          <dl className="divide-y divide-primary-dark/15 border-y border-primary-dark/15">
            {horaires.map(({ service, heures }) => (
              <div key={service} className="flex items-baseline justify-between gap-6 py-4">
                <dt className="font-heading text-lg">{service}</dt>
                <dd className="text-body tabular-nums">{heures}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          data-reveal
          style={{ "--reveal-delay": "150ms" } as CSSProperties}
          className="md:col-span-6 lg:col-span-6 lg:col-start-7 rounded-card bg-mist p-6 md:p-10 space-y-5"
        >
          <h3 className="font-heading text-2xl md:text-3xl leading-tight text-balance">
            Une envie, une question ?
          </h3>
          <p className="max-w-[55ch] text-body">
            Allergie, régime particulier, anniversaire à fêter ou table pour un groupe : dites-le-nous
            à l’avance, Joëlle et Stéphane s’organiseront pour vous recevoir.
          </p>

          {(contact.phone || contact.email) && (
            <ul className="space-y-3 text-[0.95rem]">
              {contact.phone && (
                <li>
                  <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-3 transition-colors duration-300 hover:text-primary-accent">
                    <Phone className="w-5 h-5 shrink-0 stroke-[1.5]" aria-hidden="true" />
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact.email && (
                <li>
                  <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-3 transition-colors duration-300 hover:text-primary-accent">
                    <Mail className="w-5 h-5 shrink-0 stroke-[1.5]" aria-hidden="true" />
                    {contact.email}
                  </a>
                </li>
              )}
            </ul>
          )}

          <ButtonLink href="/contact" variant="link">Nous contacter</ButtonLink>
        </div>
      </div>
    </section>
  )
}
