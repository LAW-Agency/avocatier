import Image from "next/image"
import AnimateOnScroll from "@/components/AnimateOnScroll"
import SectionTitle from "@/components/home/SectionTitle"

// Section 4 — La plage privée : grande image panoramique
export default function Beach() {
  return (
    <section id="plage" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 space-y-10 md:space-y-14">

        <AnimateOnScroll animation="fade-up">
          <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] overflow-hidden rounded-card">
            <Image
              src="/images/beach/plage-cocotier.jpeg"
              alt="Cocotier penché au-dessus de la plage et de l'océan"
              fill
              sizes="(min-width: 1280px) 1248px, 100vw"
              className="object-cover object-[center_55%]"
            />
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll animation="fade-up" delay={150} className="grid md:grid-cols-2 gap-6 md:gap-16 md:items-end">
          <SectionTitle eyebrow="La plage privée" title="L’océan à quelques pas" />
          <p className="text-base md:text-lg leading-relaxed max-w-lg">
            Depuis le jardin, un accès direct à la plage : les cocotiers pour l’ombre, une mer calme
            pour la baignade et, chaque soir, le soleil qui se couche sur l’océan.
          </p>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
