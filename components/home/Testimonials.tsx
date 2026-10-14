import AnimateOnScroll from "@/components/AnimateOnScroll"
import { testimonials, rating } from "@/data/testimonials"

// Section 8 — Avis clients : les témoignages d'abord, la note en élément secondaire
export default function Testimonials() {
  return (
    <section id="avis" className="py-20 md:py-28">
      <AnimateOnScroll animation="fade-up" className="max-w-3xl mx-auto px-4 text-center space-y-10">
        <span className="block text-xs md:text-sm uppercase tracking-[0.25em] text-primary-accent">
          L’expérience de nos voyageurs
        </span>

        {testimonials.map((t) => (
          <figure key={t.quote} className="space-y-4">
            <blockquote className="font-heading text-2xl md:text-4xl leading-snug text-balance text-text-dark">
              «&nbsp;{t.quote}&nbsp;»
            </blockquote>
            {(t.author || t.source) && (
              <figcaption className="text-sm tracking-wide">
                {[t.author, t.source].filter(Boolean).join(" · ")}
              </figcaption>
            )}
          </figure>
        ))}

        <p className="text-sm tracking-wide">
          <span className="font-bold">{rating.score}</span> — {rating.label}
        </p>
      </AnimateOnScroll>
    </section>
  )
}
