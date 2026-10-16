import type { Metadata } from "next";
import Histoire from "@/components/hotel/Histoire";
import Hotes from "@/components/hotel/Hotes";
import EspacesCommuns from "@/components/hotel/EspacesCommuns";
import ApercuGalerie from "@/components/hotel/ApercuGalerie";
import SplitSection from "@/components/home/SplitSection";
import BookingCTA from "@/components/BookingCTA";
import PageHero from "@/components/PageHero";
import PanoramaSection from "@/components/PanoramaSection";

export const metadata: Metadata = {
  title: "L'hôtel | Chez L'Avocatier",
  description:
    "Bungalows dans un jardin tropical, piscine et accès direct à la plage à Vohilava, sur l'île Sainte-Marie (Madagascar) : découvrez Chez L'Avocatier et l'accueil de Joëlle & Stéphane.",
};

// Structure du cahier des charges : hero, notre histoire, Joëlle & Stéphane, le jardin tropical,
// la plage privée, la piscine, les espaces communs, restaurant & bar, galerie, réserver.
// Rythme des fonds : photo → clair → vert nuit → mist → photo/clair → mist → clair → vert nuit → mist → photo
export default function HotelPage() {
  return (
    <div>
      <PageHero
        title="L’hôtel"
        tagline="Une maison au bord de l’océan"
        text="Bungalows et chambres dans un jardin tropical, piscine, accès direct à la plage et un accueil personnalisé assuré par Joëlle et Stéphane, vos hôtes sur place."
        image={{
          src: "/images/hotel/jardin-ombres.jpeg",
          alt: "La pelouse du jardin et les bungalows au soleil couchant, sous les cocotiers",
        }}
        secondary={{ label: "Voir les hébergements", href: "/hebergements" }}
        rubriques={[
          { label: "Notre histoire", href: "#histoire" },
          { label: "Vos hôtes", href: "#hotes" },
          { label: "Jardin, plage & piscine", href: "#jardin" },
          { label: "Espaces communs", href: "#espaces-communs" },
        ]}
      />

      <Histoire/>

      <Hotes/>

      <SplitSection
        id="jardin"
        title="Le jardin tropical"
        text="Cocotiers, massifs fleuris et grande pelouse : le jardin relie les hébergements à la piscine et à la plage. Transats et coins d’ombre sont à votre disposition tout au long de la journée, pour la détente comme pour la lecture."
        cta={{ label: "Voir les bungalows", href: "/hebergements" }}
        image={{
          src: "/images/hotel/jardin.jpeg",
          alt: "La pelouse du jardin tropical et la piscine sous un ciel de nuages",
          frame: "aspect-[4/5] md:aspect-auto md:h-[36rem]",
        }}
        tone="mist"
      />

      <PanoramaSection
        id="plage"
        title="Un accès direct à la plage"
        image={{
          src: "/images/beach/plage-pirogues.jpeg",
          alt: "La plage au petit matin, pirogues sur le lagon sous les palmes",
          position: "object-[center_55%]",
        }}
        aside={{
          src: "/images/beach/plage-cocotier.jpeg",
          alt: "Cocotier penché au-dessus de la plage et de l'océan",
          position: "object-[center_40%]",
        }}
      >
        <p>
          La plage se rejoint directement depuis le jardin, à quelques pas des hébergements. Les eaux
          calmes du lagon se prêtent à la baignade ; au large, les pirogues des pêcheurs animent l’horizon.
        </p>
        <p>
          Cocotiers et hamacs offrent des espaces de repos à l’ombre, et chaque soir le soleil se
          couche face à la plage.
        </p>
      </PanoramaSection>

      <SplitSection
        id="piscine"
        title="La piscine, au cœur du jardin"
        text="Au centre du jardin, la piscine bordée de pierre est accessible du matin au soir. Escalier immergé, transats à disposition et l’océan en toile de fond : un espace de baignade complémentaire à la plage."
        cta={{ label: "Réserver votre séjour", href: "/reserver" }}
        image={{
          src: "/images/pool/piscine-escalier.jpeg",
          alt: "Les marches en pierre de la piscine, eau turquoise et végétation tropicale",
          frame: "aspect-[4/5] md:aspect-auto md:h-[36rem]",
        }}
        imageSide="right"
        tone="mist"
      />

      <EspacesCommuns/>

      <SplitSection
        id="restaurant"
        title="Restaurant & bar"
        text="Une cuisine maison à base de produits locaux et bio, servie du petit-déjeuner au dîner, et un bar au bord de la piscine : le restaurant de Chez L’Avocatier vous accueille face à l’océan."
        cta={{ label: "Découvrir la table", href: "/restaurant" }}
        image={{
          src: "/images/restaurant/jardin-table-plage.jpeg",
          alt: "Une table sous la paillote, sur la pelouse au bord de la plage, au soleil couchant",
          frame: "aspect-[4/5] md:aspect-auto md:h-[36rem]",
        }}
        tone="forest"
      />

      <ApercuGalerie/>

      <BookingCTA/>
    </div>
  );
}
