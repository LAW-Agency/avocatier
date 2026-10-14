import { MapPin, Plane } from "lucide-react"
import type { CSSProperties } from "react"
import ButtonLink from "@/components/ButtonLink"
import SectionTitle from "@/components/home/SectionTitle"

// Nom complet obligatoire : la « Villa l'Avocatier » voisine est un autre établissement
const MAP_QUERY = "Chez L'Avocatier, Vohilava, Île Sainte-Marie, Madagascar"
const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`

// Section 9 — Localisation : carte + informations
export default function Location() {
  return (
    <section id="localisation" className="py-section bg-mist">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-12 gap-8 md:gap-10 lg:gap-14 items-center">

        <div data-reveal className="md:col-span-5 space-y-6">
          <SectionTitle title="Nous trouver" />

          <address className="not-italic space-y-4 text-body">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-1 shrink-0 stroke-[1.5]" aria-hidden="true" />
              <p className="text-body">
                <span className="font-heading text-lg">Chez L’Avocatier</span>
                <br />
                Vohilava, 515 Île Sainte-Marie, Madagascar
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Plane className="w-5 h-5 mt-1 shrink-0 stroke-[1.5]" aria-hidden="true" />
              <p className="text-body">À seulement 3 km de l’aéroport de Sainte-Marie.</p>
            </div>
          </address>

          <ButtonLink href="/infos-pratiques#comment-venir" variant="link">Voir comment venir</ButtonLink>
        </div>

        <div
          data-reveal
          style={{ "--reveal-delay": "200ms" } as CSSProperties}
          className="md:col-span-7 aspect-[4/3] md:aspect-[16/10] overflow-hidden rounded-card border border-primary-dark/10 bg-primary-light"
        >
          <iframe
            src={MAP_EMBED_URL}
            title="Carte : Chez L'Avocatier à Vohilava, Île Sainte-Marie"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </section>
  )
}
