import { testimonials, rating } from "@/data/testimonials"

// Section 8 — Avis clients : la citation d'abord, la note en élément secondaire
export default function Testimonials() {
  return (
    <section id="avis" aria-labelledby="avis-titre" className="py-section">
      <div data-reveal className="max-w-4xl mx-auto px-4 text-center">
        <h2 id="avis-titre" className="font-heading text-section text-balance text-text-dark">
          Ils ont séjourné chez nous… et ils en parlent !
        </h2>
        <p className="mx-auto mt-5 max-w-2xl font-heading text-lg md:text-xl text-balance text-primary-accent">
          Leurs sourires et leurs témoignages sont notre plus belle récompense !
        </p>
        <p className="mx-auto mt-4 mb-12 max-w-2xl text-body text-pretty text-text-dark">
          Découvrez les avis de nos voyageurs et partagez leur expérience : un accueil chaleureux, un cadre
          privilégié et de doux moments au bord de l’océan Indien.
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
          Merci à tous nos visiteurs pour leur confiance. Nous avons hâte de vous accueillir à votre tour
          Chez L’Avocatier !
        </p>
      </div>
    </section>
  )
}
