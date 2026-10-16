import Image from "next/image"
import { MapPin, Plane } from "lucide-react"
import type { CSSProperties } from "react"
import ButtonLink from "@/components/ButtonLink"
import SectionTitle from "@/components/home/SectionTitle"
import { contact } from "@/data/contact"

// Sections 7 et 9 réunies — Sainte-Marie (importante pour le référencement) et la localisation de l'hôtel.
// La carte intégrée est remplacée par un lien Google Maps : pas d'iframe tierce sur l'accueil.
export default function SainteMarie() {
  const { address } = contact

  return (
    <section id="sainte-marie" className="py-section bg-forest">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-12 gap-8 md:gap-10 lg:gap-14 items-center">

        {/* PHOTO — se révèle lentement au défilement */}
        <div className="relative overflow-hidden rounded-card md:col-span-7 md:order-2 aspect-[4/3] md:aspect-[4/5] lg:aspect-[4/3]">
          <Image
            src="/images/island/lagon-pirogues.jpeg"
            alt="Pirogues sur le lagon de Sainte-Marie au coucher du soleil"
            fill
            sizes="(min-width: 1280px) 720px, (min-width: 768px) 58vw, 100vw"
            data-reveal="image"
            className="object-cover"
          />
        </div>

        {/* TEXTE — l'île, puis où nous trouver */}
        <div
          data-reveal
          style={{ "--reveal-delay": "200ms" } as CSSProperties}
          className="md:col-span-5 space-y-5"
        >
          <SectionTitle title="Sainte-Marie, l’île autrement" light />
          <p className="max-w-[60ch] text-body text-primary-light/80">
            Au large de la côte est de Madagascar, Sainte-Marie — Nosy Boraha en malgache — déroule une
            soixantaine de kilomètres de cocotiers, de lagons et de villages de pêcheurs. De juillet à
            septembre, les baleines à bosse viennent s’y reproduire ; toute l’année, on part à la découverte
            de l’île aux Nattes, du cimetière des pirates ou des fonds marins.
          </p>

          <address id="localisation" className="not-italic space-y-3 border-t border-primary-light/15 pt-5 text-[0.95rem] text-primary-light/80">
            <a
              href={contact.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 transition-colors duration-300 hover:text-sand"
            >
              <MapPin className="w-5 h-5 mt-0.5 shrink-0 stroke-[1.5] text-sand" aria-hidden="true" />
              <span>
                <span className="font-heading text-primary-light">{contact.name}</span>
                {" — "}
                {address.locality}, {address.postalCode} {address.island}
                <span className="sr-only"> (ouvrir dans Google Maps)</span>
              </span>
            </a>
            <p className="flex items-start gap-3">
              <Plane className="w-5 h-5 mt-0.5 shrink-0 stroke-[1.5] text-sand" aria-hidden="true" />
              {contact.airport}
            </p>
          </address>

          <div className="flex flex-wrap gap-x-8 gap-y-4 pt-1">
            <ButtonLink href="/experiences#sainte-marie" variant="link-light">Explorer Sainte-Marie</ButtonLink>
            <ButtonLink href="/infos-pratiques#comment-venir" variant="link-light">Comment venir</ButtonLink>
          </div>
        </div>
      </div>
    </section>
  )
}
