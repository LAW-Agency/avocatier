import { testimonials, rating } from "@/data/testimonials"

// Section 8 — Avis clients : la citation d'abord, la note en élément secondaire
export default function Testimonials() {
  return (
    <section id="avis" aria-labelledby="avis-titre" className="py-section">
      <div data-reveal className="max-w-4xl mx-auto px-4 text-center">
        <h2 id="avis-titre" className="sr-only">Avis de nos voyageurs</h2>

        {testimonials.map((t) => (
          <figure key={t.quote}>
            <blockquote className="font-heading text-section leading-snug text-balance text-text-dark">
              «&nbsp;{t.quote}&nbsp;»
            </blockquote>
            {(t.author || t.source) && (
              <figcaption className="mt-6 text-sm tracking-wide text-text-dark">
                {t.author ? `${t.author}, ` : "Avis publié "}
                {t.source && <>sur {t.source}</>}
              </figcaption>
            )}
          </figure>
        ))}

        <p className="mt-8 text-sm text-text-dark">
          <span className="font-bold">{rating.score}</span> — {rating.label}
        </p>
      </div>
    </section>
  )
}
