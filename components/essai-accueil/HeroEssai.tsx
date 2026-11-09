import Image from "next/image"
import { Star } from "lucide-react"
import ReservationRapide from "@/components/home/ReservationRapide"
import { googleRating } from "@/data/testimonials"

// Hero de la page d'essai : le hero de l'accueil (components/home/Hero.tsx) à l'identique — photo, wordmark
// qui sort du flou, note Google, textes, ligne de localisation — mais la barre de réservation remplace
// les deux boutons « Réserver votre séjour » et « Découvrir l'hôtel ».
export default function HeroEssai() {
  return (
    <section id="essai-hero" className="relative isolate flex h-dvh min-h-[40rem] items-center justify-center overflow-hidden bg-forest">
      <div className="absolute inset-0 -z-20 animate-photo-entree motion-reduce:animate-none">
        <Image
          src="/hero-home.jpeg"
          alt="Coucher de soleil sur l'océan depuis le jardin de Chez L'Avocatier, entre cocotiers et hamac"
          fill
          preload
          sizes="100vw"
          className="object-cover animate-hero-zoom"
        />
      </div>

      {/* Mêmes voiles que l'accueil : teinte générale, assombrissement derrière le texte, fondu en bas */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-forest/35" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_65%_55%_at_50%_52%,rgb(13_43_33/0.6),transparent_75%)]" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-56 -z-10 bg-gradient-to-t from-forest via-forest/55 to-transparent" />

      <div className="flex w-full max-w-7xl flex-col items-center px-4 pt-24 pb-16 text-center animate-hero-exit">
        <h1 className="w-full animate-reveal motion-reduce:animate-none">
          <Image
            src="/logo-texte-blanc.svg"
            alt="Chez L'Avocatier"
            width={2036}
            height={530}
            preload
            /* Un peu moins haut que l'accueil (125svh) : la barre de réservation est plus haute que les boutons */
            className="mx-auto h-auto w-[min(92vw,68rem,110svh)] [mask-image:linear-gradient(to_bottom,#000_30%,rgb(0_0_0/0.2)_100%)]"
          />
        </h1>

        <div className="mt-6 flex w-full flex-col items-center gap-5 animate-fade-up [animation-delay:600ms] motion-reduce:animate-none md:mt-8 [@media(max-height:720px)]:mt-4 [@media(max-height:720px)]:gap-3">
          <p className="flex items-center gap-2 text-sm text-primary-light/90">
            <span className="flex gap-0.5 text-sand" aria-hidden="true">
              {Array.from({ length: googleRating.outOf }, (_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </span>
            <span aria-hidden="true">{googleRating.score} sur {googleRating.source}</span>
            <span className="sr-only">Noté {googleRating.score} sur {googleRating.outOf} sur {googleRating.source}</span>
          </p>

          <p className="font-heading text-2xl leading-tight text-balance text-primary-light sm:text-3xl md:text-4xl">
            L’île Sainte-Marie, votre refuge au bout du monde.
          </p>

          <p className="max-w-xl text-base leading-relaxed text-balance text-primary-light/85 md:text-lg">
            Bungalows tropicaux, plage privée, piscine et douceur de vivre. Joëlle et Stéphane vous accueillent dans un écrin de nature face à l’océan.
          </p>

          {/* À la place des deux boutons */}
          <div className="w-full pt-2 [&>form]:mx-auto">
            <ReservationRapide />
          </div>
        </div>
      </div>

      {/* Localisation — « petit élément sous le hero » du cahier des charges */}
      <div className="absolute inset-x-0 bottom-6 px-4 animate-hero-exit">
        <p className="text-center font-heading text-sm tracking-wide text-primary-light/80 animate-fade-up [animation-delay:900ms] motion-reduce:animate-none md:text-base">
          Vohilava · Île Sainte-Marie · Madagascar
        </p>
      </div>
    </section>
  )
}
