import Image from "next/image"
import type { CSSProperties } from "react"
import ButtonLink from "@/components/ButtonLink"

// Étapes tirées du texte du client et du fonctionnement réel du site (une demande crée une option de 48 h)
const etapes = [
  { titre: "Choisissez vos dates et votre bungalow", texte: "Les disponibilités s’affichent en direct, dans la devise de votre choix." },
  { titre: "Envoyez votre demande", texte: "Vos dates sont mises de côté pendant que nous l’étudions." },
  { titre: "Joëlle et Stéphane vous répondent", texte: "Personnellement, sous 48 heures, pour préparer votre séjour." },
]

// Section finale « Réserver » (accueil et Expériences) : la photo reste en fond, mais le texte n'est plus centré dessus.
// À gauche l'invitation (voile vert nuit renforcé côté texte), à droite une carte claire qui explique
// la réservation en 3 étapes et porte le seul bouton plein.
export default function ReserverFinal({ id }: { id?: string }) {
  return (
    <section id={id} aria-labelledby="reserver-final-titre" className="relative isolate overflow-hidden">
      <Image
        src="/images/hotel/coucher-soleil-piscine.jpeg"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover animate-parallax"
      />
      {/* Voile plus dense du côté du texte ; uniforme sur mobile */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-forest/75 md:bg-transparent md:bg-gradient-to-r md:from-forest/90 md:via-forest/65 md:to-forest/30" />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 md:grid-cols-12 md:py-28 lg:gap-16">

        {/* L'INVITATION */}
        <div data-reveal className="space-y-6 md:col-span-6">
          <h2 id="reserver-final-titre" className="font-heading text-section text-balance text-primary-light">
            Et si votre prochain voyage au paradis commençait ici ?
          </h2>
          <p className="font-heading text-lg text-balance text-sand md:text-xl">
            L’océan Indien vous attend… et nous aussi !
          </p>
          <div className="max-w-[52ch] space-y-4 text-base leading-relaxed text-primary-light/90 md:text-lg">
            <p>
              Envie de soleil, de plages de sable fin et d’eaux turquoise ? Offrez-vous une parenthèse de détente à
              Sainte-Marie, loin du quotidien.
            </p>
            <p>En amoureux, en famille ou pour simplement déconnecter, votre petit coin de paradis vous attend !</p>
          </div>
        </div>

        {/* LA RÉSERVATION EN 3 ÉTAPES */}
        <div
          data-reveal
          style={{ "--reveal-delay": "200ms" } as CSSProperties}
          className="rounded-panel bg-background p-6 shadow-[0_24px_60px_rgb(13_43_33/0.35)] sm:p-8 md:col-span-6 lg:col-span-5 lg:col-start-8"
        >
          <h3 className="font-heading text-2xl leading-tight text-text-dark">Comment se passe la réservation</h3>

          <ol className="mt-6 space-y-5">
            {etapes.map((e, i) => (
              <li key={e.titre} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-dark font-heading text-base text-text-light"
                >
                  {i + 1}
                </span>
                <span className="pt-1">
                  <span className="block font-heading text-lg leading-snug text-text-dark">{e.titre}</span>
                  <span className="mt-1 block text-[0.95rem] leading-snug text-ink/80">{e.texte}</span>
                </span>
              </li>
            ))}
          </ol>

          <ButtonLink href="/reserver" className="mt-8 w-full">
            Réservez votre séjour dès maintenant
          </ButtonLink>
          <p className="mt-3 text-center text-sm text-ink/80">Aucun paiement maintenant · Réponse sous 48 heures</p>
        </div>
      </div>
    </section>
  )
}
