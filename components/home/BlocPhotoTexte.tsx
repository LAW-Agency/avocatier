import Image from "next/image"
import type { CSSProperties } from "react"
import ButtonLink from "@/components/ButtonLink"
import SectionTitle from "@/components/home/SectionTitle"
import Grain, { FOND_SABLE } from "@/components/home/Grain"
import LienSable from "@/components/home/LienSable"

interface BlocPhotoTexteProps {
  id: string
  title: string
  lead: string
  text: string[]
  cta: { label: string; href: string }
  image: { src: string; alt: string; position?: string }
  // Petite photo posée en débord sur le coin de la grande (desktop)
  vignette?: { src: string; alt: string }
  imageSide?: "left" | "right"
  sable?: boolean
}

// Bloc photo + texte de l'accueil : photo plus haute et coins doux, vignette en débord,
// fond crème ou sable. Grille 7/5 comme SplitSection.
export default function BlocPhotoTexte({
  id,
  title,
  lead,
  text,
  cta,
  image,
  vignette,
  imageSide = "left",
  sable = false,
}: BlocPhotoTexteProps) {
  return (
    <section id={id} className={`py-section ${sable ? FOND_SABLE : ""}`}>
      {sable && <Grain />}
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:grid-cols-12 lg:gap-16">
        <div className={`relative md:col-span-7 ${imageSide === "right" ? "md:order-2" : ""} ${vignette ? "md:pb-16" : ""}`}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-panel sm:aspect-[4/3] md:aspect-[5/6] lg:aspect-[4/3.6]">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 1280px) 720px, (min-width: 768px) 58vw, 100vw"
              data-reveal="image"
              className={`object-cover ${image.position ?? ""}`}
            />
          </div>
          {vignette && (
            <div
              className={`relative mt-4 aspect-[16/10] w-2/3 overflow-hidden rounded-panel md:absolute md:bottom-0 md:mt-0 md:w-[42%] md:border-8 md:border-background ${
                imageSide === "right" ? "md:-left-8" : "md:-right-8"
              }`}
            >
              <Image
                src={vignette.src}
                alt={vignette.alt}
                fill
                sizes="(min-width: 768px) 300px, 66vw"
                data-reveal="image"
                style={{ "--reveal-delay": "250ms" } as CSSProperties}
                className="object-cover"
              />
            </div>
          )}
        </div>

        <div data-reveal style={{ "--reveal-delay": "200ms" } as CSSProperties} className="space-y-5 md:col-span-5">
          <SectionTitle title={title} />
          <p className="max-w-[60ch] font-heading text-lg text-balance text-primary-accent md:text-xl">{lead}</p>
          <div className="space-y-4">
            {text.map((p) => (
              <p key={p} className={`max-w-[60ch] text-body ${sable ? "text-ink" : "text-text-dark"}`}>{p}</p>
            ))}
          </div>
          {sable ? (
            <LienSable href={cta.href}>{cta.label}</LienSable>
          ) : (
            <ButtonLink href={cta.href} variant="link">{cta.label}</ButtonLink>
          )}
        </div>
      </div>
    </section>
  )
}
