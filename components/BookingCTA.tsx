import Image from "next/image"
import ButtonLink from "@/components/ButtonLink"

interface BookingCTAProps {
  title?: string
  lead?: string            // phrase d'accroche sous le titre
  text?: string | string[] // réassurance : comment se passe la réservation (un ou plusieurs paragraphes)
  label?: string
  image?: string
}

// Bandeau final « Réserver » sur grande photo — réutilisable en bas de chaque page
export default function BookingCTA({
  title = "Et si votre prochaine escapade commençait ici ?",
  lead,
  text = "Faites votre demande en quelques minutes : Joëlle et Stéphane confirment personnellement votre séjour sous 48 h.",
  label = "Réserver votre séjour",
  image = "/images/hotel/coucher-soleil-piscine.jpeg",
}: BookingCTAProps) {
  const paragraphs = Array.isArray(text) ? text : [text]
  return (
    <section className="relative isolate overflow-hidden">
      {/* Parallaxe : la photo glisse plus lentement que la page */}
      <Image src={image} alt="" fill sizes="100vw" className="object-cover -z-20 animate-parallax" />
      {/* Même voile vert nuit que le hero : la page se referme comme elle s'ouvre */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-forest/55" />

      <div data-reveal className="max-w-3xl mx-auto px-4 py-20 md:py-28 text-center space-y-7">
        <h2 className="font-heading text-section text-balance text-primary-light">
          {title}
        </h2>
        {lead && <p className="font-heading text-lg md:text-xl text-balance text-sand">{lead}</p>}
        <div className="mx-auto max-w-xl space-y-4">
          {paragraphs.map((p) => (
            <p key={p} className="text-base md:text-lg leading-relaxed text-balance text-primary-light/85">{p}</p>
          ))}
        </div>
        <ButtonLink href="/reserver">{label}</ButtonLink>
      </div>
    </section>
  )
}
