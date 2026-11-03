import Image from "next/image"
import type { CSSProperties } from "react"
import ButtonLink from "@/components/ButtonLink"
import SectionTitle from "@/components/home/SectionTitle"

type Tone = "light" | "mist" | "forest"

// Fond et couleurs de texte par ton de section
const toneClasses: Record<Tone, { section: string; text: string; lead: string }> = {
  light: { section: "", text: "text-text-dark", lead: "text-primary-accent" },
  mist: { section: "bg-mist", text: "text-text-dark", lead: "text-primary-accent" },
  forest: { section: "bg-forest", text: "text-primary-light/80", lead: "text-sand" },
}

interface SplitSectionProps {
  id?: string
  title: string
  lead?: string             // phrase d'accroche sous le titre
  text: string | string[]   // un ou plusieurs paragraphes
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
  lead,
  text,
  cta,
  image,
  imageSide = "left",
  tone = "light",
}: SplitSectionProps) {
  const dark = tone === "forest"
  const paragraphs = Array.isArray(text) ? text : [text]
  // Texte long (plus haut que la photo) : la photo reste à l'écran pendant qu'on lit (desktop)
  const long = paragraphs.join("").length > 700
  return (
    <section id={id} className={`py-section ${toneClasses[tone].section}`}>
      <div className={`max-w-7xl mx-auto px-4 grid md:grid-cols-12 gap-8 md:gap-10 lg:gap-14 ${long ? "items-start" : "items-center"}`}>

        {/* PHOTO — se révèle lentement au défilement */}
        <div
          className={`relative overflow-hidden rounded-card md:col-span-7 ${image.frame ?? "aspect-[4/3]"} ${
            imageSide === "right" ? "md:order-2" : ""
          } ${long ? "md:sticky md:top-28" : ""}`}
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
          {lead && (
            <p className={`max-w-[60ch] font-heading text-lg md:text-xl text-balance ${toneClasses[tone].lead}`}>{lead}</p>
          )}
          <div className="space-y-4">
            {paragraphs.map((p) => (
              <p key={p} className={`max-w-[60ch] text-body ${toneClasses[tone].text}`}>{p}</p>
            ))}
          </div>
          <ButtonLink href={cta.href} variant={dark ? "link-light" : "link"}>
            {cta.label}
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
