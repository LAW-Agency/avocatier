import { Star } from "lucide-react"
import type { CSSProperties } from "react"
import SectionTitle from "@/components/home/SectionTitle"
import { googleRating, testimonials } from "@/data/testimonials"

// Joëlle & Stéphane — place importante aux propriétaires (cahier des charges) : c'est leur accueil
// que les avis retiennent. Section typographique sur vert nuit, l'avis réel en grand.
// TODO client : un portrait de Joëlle et Stéphane viendrait ici
export default function Hotes() {
  const [avis] = testimonials

  return (
    <section id="hotes" className="py-section bg-forest">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-12 gap-10 lg:gap-14 items-center">

        <div data-reveal className="md:col-span-5 space-y-5">
          <SectionTitle title="Joëlle & Stéphane, vos hôtes" light />
          <p className="max-w-[60ch] text-body text-primary-light/80">
            Ici, on est accueilli comme des amis : un conseil pour découvrir l’île, une bonne adresse
            à partager, une attention au quotidien. C’est ce que les voyageurs retiennent en premier
            de leur séjour.
          </p>
        </div>

        {avis && (
          <figure
            data-reveal
            style={{ "--reveal-delay": "200ms" } as CSSProperties}
            className="md:col-span-7 md:border-l md:border-primary-light/15 md:pl-10 lg:pl-14"
          >
            <blockquote className="font-heading text-[clamp(1.75rem,1.2rem+2.2vw,3rem)] leading-tight text-balance text-sand">
              «&nbsp;{avis.quote}&nbsp;»
            </blockquote>
            <figcaption className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm tracking-wide text-primary-light/80">
              {avis.source && <span>Avis publié sur {avis.source}</span>}
              <span className="flex items-center gap-2">
                <span className="flex gap-0.5 text-sand" aria-hidden="true">
                  {Array.from({ length: googleRating.outOf }, (_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </span>
                <span aria-hidden="true">{googleRating.score} sur {googleRating.source}</span>
                <span className="sr-only">Noté {googleRating.score} sur {googleRating.outOf} sur {googleRating.source}</span>
              </span>
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  )
}
