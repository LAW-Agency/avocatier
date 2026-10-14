import Image from "next/image"
import SectionTitle from "@/components/home/SectionTitle"

// Section 4 — La plage privée : « ici, on vend le rêve » — panorama pleine largeur, titre posé sur la photo
export default function Beach() {
  return (
    <section id="plage" className="pb-section">
      {/* Pleine largeur jusqu'à 1536 px : la photo source (1200 px) ne doit pas être trop agrandie */}
      <div className="relative isolate mx-auto max-w-screen-2xl h-[60svh] min-h-[24rem] overflow-hidden">
        {/* Parallaxe : la photo glisse plus lentement que la page */}
        <Image
          src="/images/beach/plage-cocotier.jpeg"
          alt="Cocotier penché au-dessus de la plage et de l'océan"
          fill
          sizes="(min-width: 1536px) 1536px, 100vw"
          className="object-cover object-[center_55%] -z-20 animate-parallax"
        />
        {/* Voile en bas uniquement, pour la lisibilité du titre */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/3 -z-10 bg-gradient-to-t from-forest/75 to-transparent" />

        <div className="max-w-7xl mx-auto h-full px-4 pb-8 md:pb-12 flex items-end">
          <div data-reveal>
            <SectionTitle title="L’océan à quelques pas" light />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-8 md:pt-10 grid md:grid-cols-12">
        <p data-reveal className="md:col-start-6 md:col-span-7 lg:col-start-7 lg:col-span-6 max-w-[60ch] text-body">
          Depuis le jardin, un accès direct à la plage : les cocotiers pour l’ombre, une mer calme
          pour la baignade et, chaque soir, le soleil qui se couche sur l’océan.
        </p>
      </div>
    </section>
  )
}
