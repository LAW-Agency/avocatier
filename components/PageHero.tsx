import Image from "next/image"
import ButtonLink from "@/components/ButtonLink"

interface PageHeroProps {
  title?: string     // sans titre, l'accroche devient le grand titre (Expériences, Hébergements)
  tagline: string | [string, string]   // une ligne en blanc, ou deux parties : la première en blanc, la seconde en sable à la ligne
  text: string | string[]   // un ou plusieurs paragraphes
  image: {
    src: string
    alt: string
    position?: string  // cadrage de la photo, ex. "object-[center_55%]"
  }
  secondary: { label: string; href: string }   // second bouton, à côté de « Réserver votre séjour »
  rubriques?: { label: string; href: string }[] // sommaire de la page (ancres)
  // Titre réservé aux lecteurs d'écran : l'accroche devient le grand titre et le texte passe dessous
  hideTitle?: boolean
}

// Hero plein écran des pages intérieures : photo, titre en bas à gauche, texte et boutons à droite.
// Header transparent par-dessus : la page doit figurer dans HERO_PAGES (components/Header.tsx).
export default function PageHero({ title, tagline: accroche, text, image, secondary, rubriques }: PageHeroProps) {
  const paragraphs = Array.isArray(text) ? text : [text]
  const [debut, suite] = Array.isArray(accroche) ? accroche : [accroche, ""]
  const tagline = [debut, suite].filter(Boolean).join(" ")
  return (
    <section className="relative isolate flex min-h-[max(100dvh,38rem)] items-end overflow-hidden bg-forest">
      {/* Conteneur séparé : l'apparition de la photo ne remplace pas son zoom au défilement */}
      <div className="absolute inset-0 -z-20 animate-photo-entree motion-reduce:animate-none">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          preload
          sizes="100vw"
          className={`object-cover animate-hero-zoom ${image.position ?? ""}`}
        />
      </div>

      {/* Voiles vert nuit : teinte générale, haut assombri pour le header, bas dense sous le texte */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-forest/25" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-40 -z-10 bg-gradient-to-b from-forest/50 to-transparent" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3/4 -z-10 bg-gradient-to-t from-forest via-forest/60 to-transparent" />

      {/* Contenu — s'efface en remontant quand on fait défiler la page */}
      <div className="w-full max-w-7xl mx-auto px-4 pt-28 pb-8 md:pb-12 text-primary-light animate-hero-exit">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-14 animate-fade-up motion-reduce:animate-none">
          {title ? (
            // Titre et accroche dans le même h1 : l'accroche porte les mots-clés de la page (référencement)
            <h1 className="lg:col-span-7 space-y-4">
              <span className="block text-[clamp(3rem,2rem+4vw,5.5rem)] leading-[0.95] text-balance">
                {title}
              </span>
              {/* Espace : sans lui, le texte du titre (lu par les moteurs) colle « L'hôtel » à l'accroche */}
              {" "}
              <span className="block text-2xl md:text-3xl leading-tight text-balance text-sand">
                {tagline}
              </span>
            </h1>
          ) : (
            <h1 className="lg:col-span-7 text-[clamp(2.5rem,1.6rem+3.6vw,4.75rem)] leading-[1.02] tracking-[-0.02em]">
              <span className="block text-balance">{debut}</span>
              {suite && " "}
              {suite && <span className="block text-balance text-sand">{suite}</span>}
            </h1>
          )}

          <div className="lg:col-span-5 space-y-6">
            <div className="max-w-md space-y-3">
              {paragraphs.map((p) => (
                <p key={p} className="text-base md:text-lg leading-relaxed text-primary-light/85">{p}</p>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-14 animate-fade-up motion-reduce:animate-none">
            {/* Titre et accroche dans le même h1 : l'accroche porte les mots-clés de la page (référencement) */}
            <h1 className="lg:col-span-7 space-y-4">
              <span className="block text-[clamp(3rem,2rem+4vw,5.5rem)] leading-[0.95] text-balance">
                {title}
              </span>
              {/* Espace : sans lui, le texte du titre (lu par les moteurs) colle « L'hôtel » à l'accroche */}
              {" "}
              <span className="block text-2xl md:text-3xl leading-tight text-balance text-sand">
                {tagline}
              </span>
            </h1>

            <div className="lg:col-span-5 space-y-6">
              <div className="max-w-md space-y-3">
                {paragraphs.map((p) => (
                  <p key={p} className="text-base md:text-lg leading-relaxed text-primary-light/85">{p}</p>
                ))}
              </div>
              {boutons}
            </div>
          </div>
        )}

        {/* Sommaire de la page : apparaît juste après le texte */}
        {rubriques && rubriques.length > 0 && (
          <nav
            aria-label="Rubriques de la page"
            className="mt-10 border-t border-primary-light/20 pt-5 md:mt-12 animate-fade-up [animation-delay:400ms] motion-reduce:animate-none"
          >
            <ul className="flex flex-wrap gap-x-8 gap-y-2 font-heading text-sm md:text-base tracking-wide">
              {rubriques.map(({ label, href }) => (
                <li key={href}>
                  <a href={href} className="text-primary-light/85 transition-colors duration-300 hover:text-sand">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </section>
  )
}
