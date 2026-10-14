import Image from "next/image"
import AnimateOnScroll from "@/components/AnimateOnScroll"
import ButtonLink from "@/components/ButtonLink"
import SectionTitle from "@/components/home/SectionTitle"

interface SplitSectionProps {
  id?: string
  eyebrow: string
  title: string
  text: string
  cta: { label: string; href: string }
  image: {
    src: string
    alt: string
    frame?: string     // ratio du cadre, ex. "aspect-[4/3] md:aspect-[4/5]"
    position?: string  // cadrage de la photo, ex. "object-[center_40%]"
  }
  imageSide?: "left" | "right"
  tinted?: boolean     // fond légèrement teinté pour alterner les sections
}

export default function SplitSection({
  id,
  eyebrow,
  title,
  text,
  cta,
  image,
  imageSide = "left",
  tinted = false,
}: SplitSectionProps) {
  return (
    <section id={id} className={`py-20 md:py-28 ${tinted ? "bg-primary-dark/5" : ""}`}>
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-10 md:gap-16 items-center">

        {/* PHOTO */}
        <AnimateOnScroll
          animation={imageSide === "left" ? "fade-left" : "fade-right"}
          className={imageSide === "right" ? "md:order-2" : ""}
        >
          <div className={`relative overflow-hidden rounded-card ${image.frame ?? "aspect-[4/3]"}`}>
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 1280px) 600px, (min-width: 768px) 50vw, 100vw"
              className={`object-cover transition-transform duration-[1500ms] ease-out hover:scale-105 ${image.position ?? ""}`}
            />
          </div>
        </AnimateOnScroll>

        {/* TEXTE */}
        <AnimateOnScroll animation="fade-up" delay={150} className="space-y-6 max-w-lg">
          <SectionTitle eyebrow={eyebrow} title={title} />
          <p className="text-base md:text-lg leading-relaxed">{text}</p>
          <ButtonLink href={cta.href} arrow>{cta.label}</ButtonLink>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
