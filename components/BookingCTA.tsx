import Image from "next/image"
import ButtonLink from "@/components/ButtonLink"

interface BookingCTAProps {
  title?: string
  label?: string
  image?: string
}

// Bandeau final « Réserver » sur grande photo — réutilisable en bas de chaque page
export default function BookingCTA({
  title = "Et si votre prochaine escapade commençait ici ?",
  label = "Réserver votre séjour",
  image = "/images/hotel/coucher-soleil-piscine.jpeg",
}: BookingCTAProps) {
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
        <ButtonLink href="/reserver">{label}</ButtonLink>
      </div>
    </section>
  )
}
