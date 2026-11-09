import Image from "next/image"
import { ArrowUpRight, MapPin, Plane, Waves } from "lucide-react"
import type { CSSProperties } from "react"
import ButtonLink from "@/components/ButtonLink"
import SectionTitle from "@/components/home/SectionTitle"
import { contact } from "@/data/contact"
import { lieux, panoramaIle } from "@/data/experiences"

// Les 3 envies du texte du client qui ont une photo (Wikimedia Commons, voir data/experiences.ts)
const [ileAuxNattes, ambodifotatra] = lieux
const tuiles = [
  { titre: "L’île aux Nattes", texte: "Sable blanc et eau turquoise, à quelques minutes de pirogue.", image: ileAuxNattes.image },
  { titre: "Le cimetière des pirates", texte: "De vieilles tombes face à la baie, près d’Ambodifotatra.", image: ambodifotatra.image },
  { titre: "Des eaux cristallines", texte: "Baies, lagons et îlots à explorer masque sur le nez.", image: panoramaIle },
]

// Sections 7 et 9 réunies — Sainte-Marie et localisation : l'île racontée en tuiles (les envies du texte du
// client), l'adresse dans une carte à part. Fond vert nuit comme sur l'accueil.
export default function SainteMarie() {
  const { address } = contact
  const credits = tuiles.map((t) => t.image.credit)

  return (
    <section id="sainte-marie" className="bg-forest py-section text-primary-light">
      <div className="mx-auto max-w-7xl px-4">

        {/* L'ÎLE ET L'ADRESSE */}
        <div className="grid gap-10 md:grid-cols-12 lg:gap-16">
          <div data-reveal className="space-y-5 md:col-span-6">
            <SectionTitle title="Sainte-Marie, un petit paradis à explorer" light />
            <p className="font-heading text-lg text-balance text-sand md:text-xl">
              Laissez-vous séduire par la magie de Nosy Boraha !
            </p>
            <p className="max-w-[60ch] text-body text-primary-light/85">
              Plages de sable fin, cocotiers, lagons turquoise et villages de pêcheurs… Sainte-Marie est une île pleine
              de charme où nature préservée et douceur de vivre se rencontrent.
            </p>
          </div>

          <div
            data-reveal
            style={{ "--reveal-delay": "150ms" } as CSSProperties}
            className="space-y-6 md:col-span-6 md:pt-2 lg:col-span-5 lg:col-start-8"
          >
            <p className="text-body text-primary-light/85">
              Chez L’Avocatier, à Vohilava, profitez d’un emplacement privilégié pour explorer toutes les merveilles de
              Sainte-Marie, avant de retrouver le calme et le confort de votre petit paradis au bord de l’océan.
            </p>

            <address id="localisation" className="not-italic overflow-hidden rounded-panel border border-primary-light/15">
              <a
                href={contact.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 px-5 py-4 transition-colors duration-300 hover:bg-primary-light/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sand"
              >
                <MapPin className="h-6 w-6 shrink-0 stroke-[1.5] text-sand" aria-hidden="true" />
                <span className="flex-1 leading-snug">
                  <span className="block font-heading text-lg">{contact.name}</span>
                  <span className="text-sm text-primary-light/80">
                    {address.locality}, {address.postalCode} {address.island}
                  </span>
                  <span className="sr-only"> (ouvrir dans Google Maps)</span>
                </span>
                <ArrowUpRight className="h-5 w-5 text-primary-light/70 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
              <p className="flex items-center gap-4 border-t border-primary-light/15 px-5 py-4 text-[0.95rem] text-primary-light/85">
                <Plane className="h-6 w-6 shrink-0 stroke-[1.5] text-sand" aria-hidden="true" />
                {contact.airport}
              </p>
            </address>
          </div>
        </div>

        {/* CE QU'ON Y FAIT */}
        <p data-reveal className="mt-14 max-w-3xl font-heading text-xl leading-snug text-balance md:mt-20 md:text-2xl">
          Partez à la découverte de l’île aux Nattes, plongez dans des eaux cristallines, explorez le célèbre
          cimetière des pirates ou admirez les baleines à bosse de juillet à septembre.
        </p>

        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {tuiles.map(({ titre, texte, image }, i) => (
            <li
              key={titre}
              data-reveal
              style={{ "--reveal-delay": `${i * 120}ms` } as CSSProperties}
              className="relative isolate flex aspect-[4/3] flex-col sm:aspect-[4/5] justify-end overflow-hidden rounded-panel p-5"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className={`-z-20 object-cover ${image.position ?? ""}`}
              />
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-forest/90 via-forest/30 to-transparent" />
              <h3 className="font-heading text-xl leading-tight">{titre}</h3>
              <p className="mt-1 text-sm leading-snug text-primary-light/85">{texte}</p>
            </li>
          ))}

          {/* Pas de photo libre des baleines : tuile typographique */}
          <li
            data-reveal
            style={{ "--reveal-delay": "360ms" } as CSSProperties}
            className="flex aspect-[4/3] flex-col sm:aspect-[4/5] justify-between rounded-panel bg-sand p-5 text-forest"
          >
            <Waves className="h-10 w-10 stroke-[1.25]" aria-hidden="true" />
            <div>
              <p className="font-heading text-4xl leading-none">Juillet<br />→ septembre</p>
              <h3 className="mt-4 font-heading text-xl leading-tight">Les baleines à bosse</h3>
              <p className="mt-1 text-sm leading-snug">En mer, à la rencontre des baleines et de leurs baleineaux.</p>
            </div>
          </li>
        </ul>

        <div className="mt-10 flex flex-col gap-6 border-t border-primary-light/15 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <ButtonLink href="/experiences#sainte-marie" variant="link-light">Découvrez les expériences de Sainte-Marie</ButtonLink>
            <ButtonLink href="/infos-pratiques#comment-venir" variant="link-light">Préparez votre arrivée</ButtonLink>
          </div>
          {/* Crédits exigés par les licences des photos */}
          <p className="text-xs text-primary-light/70">
            Photos Wikimedia Commons :{" "}
            {credits.map((c, i) => (
              <span key={c.source}>
                {i > 0 && ", "}
                <a href={c.source} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                  {c.auteur}
                </a>{" "}
                ({c.licence})
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  )
}
