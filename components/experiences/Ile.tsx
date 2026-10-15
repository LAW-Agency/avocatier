import Image from "next/image"
import type { CSSProperties } from "react"
import SectionTitle from "@/components/home/SectionTitle"
import { lieux } from "@/data/experiences"

// Découvrir Sainte-Marie (référencement) : présentation de l'île, photo du lagon, puis les lieux à voir
export default function Ile() {
  return (
    <section id="sainte-marie" className="py-section bg-forest">
      <div className="max-w-7xl mx-auto px-4 space-y-14 md:space-y-20">
        <div className="grid md:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="relative overflow-hidden rounded-card md:col-span-7 aspect-[4/3] md:aspect-[4/5] lg:aspect-[4/3]">
            <Image
              src="/images/island/lagon-pirogues.jpeg"
              alt="Pirogues sur le lagon de Sainte-Marie au coucher du soleil"
              fill
              sizes="(min-width: 1280px) 720px, (min-width: 768px) 58vw, 100vw"
              data-reveal="image"
              className="object-cover"
            />
          </div>

          <div data-reveal style={{ "--reveal-delay": "200ms" } as CSSProperties} className="md:col-span-5 space-y-5">
            <SectionTitle title="Découvrir Sainte-Marie" light />
            <p className="max-w-[60ch] text-body text-primary-light/80">
              Nosy Boraha, comme on l’appelle en malgache, s’étire sur une soixantaine de kilomètres au
              large de la côte est de Madagascar. Une route longe la mer d’un village de pêcheurs à
              l’autre, entre cocotiers, lagons et criques.
            </p>
            <p className="max-w-[60ch] text-body text-primary-light/80">
              Ancien repaire de pirates, l’île garde de cette époque un cimetière face à la baie, et
              cultive aujourd’hui un art de vivre tranquille, au rythme des marées.
            </p>
          </div>
        </div>

        <dl className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {lieux.map(({ nom, texte }, i) => (
            <div
              key={nom}
              data-reveal
              style={{ "--reveal-delay": `${i * 120}ms` } as CSSProperties}
              className="border-t border-primary-light/15 pt-5"
            >
              <dt className="font-heading text-xl leading-tight text-sand">{nom}</dt>
              <dd className="mt-2 text-[0.95rem] leading-relaxed text-primary-light/75">{texte}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
