import Image from "next/image"
import type { CSSProperties, ReactNode } from "react"
import SectionTitle from "@/components/home/SectionTitle"

interface PanoramaSectionProps {
  id?: string
  title: string
  image: { src: string; alt: string; position?: string }
  children: ReactNode   // paragraphes sous le panorama
  aside?: { src: string; alt: string; position?: string }   // seconde photo, à droite du texte
  tone?: "light" | "mist"
}

// Panorama pleine largeur avec le titre posé sur la photo, puis le texte et une seconde photo
// (même principe que la plage de l'accueil)
export default function PanoramaSection({ id, title, image, children, aside, tone = "light" }: PanoramaSectionProps) {
  return (
    <section id={id} className={`pb-section ${tone === "mist" ? "bg-mist" : ""}`}>
      {/* Pleine largeur jusqu'à 1536 px : les photos sources ne dépassent pas 1600 px */}
      <div className="relative isolate mx-auto max-w-screen-2xl h-[60svh] min-h-[24rem] overflow-hidden">
        {/* Parallaxe : la photo glisse plus lentement que la page */}
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1536px) 1536px, 100vw"
          className={`object-cover -z-20 animate-parallax ${image.position ?? ""}`}
        />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/3 -z-10 bg-gradient-to-t from-forest/75 to-transparent" />

        <div className="max-w-7xl mx-auto h-full px-4 pb-8 md:pb-12 flex items-end">
          <div data-reveal>
            <SectionTitle title={title} light />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-8 md:pt-12 grid md:grid-cols-12 gap-8 lg:gap-14 items-center">
        <div data-reveal className="md:col-span-5 space-y-5 [&_p]:max-w-[60ch] [&_p]:text-body">
          {children}
        </div>

        {aside && (
          <div className="relative overflow-hidden rounded-card md:col-span-7 aspect-[4/3] md:aspect-[16/10]">
            <Image
              src={aside.src}
              alt={aside.alt}
              fill
              sizes="(min-width: 1280px) 720px, (min-width: 768px) 58vw, 100vw"
              data-reveal="image"
              style={{ "--reveal-delay": "150ms" } as CSSProperties}
              className={`object-cover ${aside.position ?? ""}`}
            />
          </div>
        )}
      </div>
    </section>
  )
}
