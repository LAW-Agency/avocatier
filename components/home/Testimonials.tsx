import { testimonials, rating } from "@/data/testimonials"

// Section 8 — Avis clients : la citation d'abord, la note en élément secondaire
export default function Testimonials() {
  return (
    <section id="avis" aria-labelledby="avis-titre" className="py-section">
      <div data-reveal className="max-w-4xl mx-auto px-4 text-center">
        <h2 id="avis-titre" className="font-heading text-section text-balance text-text-dark">
          Ils ont séjourné chez nous… et ils en parlent !
        </h2>
        <p className="mx-auto mt-5 mb-12 max-w-2xl text-body text-pretty text-text-dark">
          La plus belle récompense, c’est la satisfaction de nos visiteurs. Découvrez les témoignages de ceux qui
          ont choisi Chez L’Avocatier et qui ont apprécié notre accueil, notre cadre privilégié et la douceur de
          vivre au bord de l’océan Indien.
        </p>

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

        <p className="mx-auto mt-10 max-w-2xl text-body text-pretty text-text-dark">
          Votre satisfaction est notre plus belle motivation. Merci à tous nos voyageurs pour leur confiance et
          leurs précieux témoignages !
        </p>
      </div>
    </section>
  )
}
