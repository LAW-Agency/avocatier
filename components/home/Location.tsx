import { MapPin, Plane } from "lucide-react"
import AnimateOnScroll from "@/components/AnimateOnScroll"
import ButtonLink from "@/components/ButtonLink"
import SectionTitle from "@/components/home/SectionTitle"

// Nom complet obligatoire : la « Villa l'Avocatier » voisine est un autre établissement
const MAP_QUERY = "Chez L'Avocatier, Vohilava, Île Sainte-Marie, Madagascar"
const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`

// Section 9 — Localisation : carte + informations
export default function Location() {
  return (
    <section id="localisation" className="py-20 md:py-28 bg-primary-dark/5">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-10 md:gap-16 items-center">

        <AnimateOnScroll animation="fade-up" className="space-y-8 max-w-lg">
          <SectionTitle eyebrow="Localisation" title="Chez L’Avocatier" />

          <address className="not-italic space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-1 shrink-0 stroke-[1.5]" aria-hidden="true" />
              <p className="text-base md:text-lg">
                <span className="font-bold">Vohilava</span>, 515 Île Sainte-Marie
                <br />
                Madagascar
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Plane className="w-5 h-5 mt-1 shrink-0 stroke-[1.5]" aria-hidden="true" />
              <p className="text-base md:text-lg">À seulement 3 km de l’aéroport de Sainte-Marie.</p>
            </div>
          </address>

          <ButtonLink href="/infos-pratiques#comment-venir" arrow>Voir comment venir</ButtonLink>
        </AnimateOnScroll>

        <AnimateOnScroll animation="fade-right" delay={150}>
          <div className="aspect-[4/3] overflow-hidden rounded-card border border-primary-dark/10 bg-primary-light">
            <iframe
              src={MAP_EMBED_URL}
              title="Carte : Chez L'Avocatier à Vohilava, Île Sainte-Marie"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full border-0"
            />
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
