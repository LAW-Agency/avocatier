import Image from "next/image"
import AnimateOnScroll from "@/components/AnimateOnScroll"
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
      <Image src={image} alt="" fill sizes="100vw" className="object-cover -z-20" />
      <div className="absolute inset-0 -z-10 bg-black/45" />

      <div className="max-w-3xl mx-auto px-4 py-28 md:py-40 text-center space-y-8">
        <AnimateOnScroll animation="fade-up">
          <h2 className="font-heading text-3xl md:text-5xl leading-tight text-primary-light drop-shadow-lg">
            {title}
          </h2>
        </AnimateOnScroll>
        <AnimateOnScroll animation="fade-up" delay={250}>
          <ButtonLink href="/reserver">{label}</ButtonLink>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
