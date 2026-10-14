import Image from "next/image"
import type { CSSProperties } from "react"
import ButtonLink from "@/components/ButtonLink"
import SectionTitle from "@/components/home/SectionTitle"

type Tone = "light" | "mist" | "forest"

// Fond et couleurs de texte par ton de section
const toneClasses: Record<Tone, { section: string; text: string }> = {
  light: { section: "", text: "text-text-dark" },
  mist: { section: "bg-mist", text: "text-text-dark" },
  forest: { section: "bg-forest", text: "text-primary-light/80" },
}

interface SplitSectionProps {
  id?: string
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
  tone?: Tone
}

// Bloc photo + texte en grille asymétrique 7/5 (photo dominante), côté de la photo alternable
export default function SplitSection({
  id,
  title,
  text,
  cta,
  image,
  imageSide = "left",
  tone = "light",
}: SplitSectionProps) {
  const dark = tone === "forest"
  return (
    <section id={id} className={`py-section ${toneClasses[tone].section}`}>
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-12 gap-8 md:gap-10 lg:gap-14 items-center">

        {/* PHOTO — se révèle lentement au défilement */}
        <div
          className={`relative overflow-hidden rounded-card md:col-span-7 ${image.frame ?? "aspect-[4/3]"} ${
            imageSide === "right" ? "md:order-2" : ""
          }`}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1280px) 720px, (min-width: 768px) 58vw, 100vw"
            data-reveal="image"
            className={`object-cover ${image.position ?? ""}`}
          />
        </div>

        {/* TEXTE — monte juste après la photo */}
        <div
          data-reveal
          style={{ "--reveal-delay": "200ms" } as CSSProperties}
          className="md:col-span-5 space-y-5"
        >
          <SectionTitle title={title} light={dark} />
          <p className={`max-w-[60ch] text-body ${toneClasses[tone].text}`}>{text}</p>
          <ButtonLink href={cta.href} variant={dark ? "link-light" : "link"}>
            {cta.label}
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
