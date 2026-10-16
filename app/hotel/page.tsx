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
        text="Des bungalows dans un grand jardin tropical, une piscine, la plage au bout de la pelouse et l’accueil chaleureux de Joëlle et Stéphane."
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
        text="Cocotiers, massifs fleuris et grande pelouse : le jardin relie les bungalows à la piscine et à la plage. On y prend le soleil sur un transat, on y lit à l’ombre, et le soir, les ombres des palmiers s’étirent jusqu’à la mer."
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
        title="La plage, au bout du jardin"
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
          Quelques pas sur la pelouse et l’on a les pieds dans le sable. La mer, calme, se prête
          à la baignade ; au large, les pirogues des pêcheurs glissent sur l’eau.
        </p>
        <p>
          Les cocotiers donnent l’ombre, les hamacs invitent à la sieste, et chaque soir le soleil
          se couche face à vous.
        </p>
      </PanoramaSection>

      <SplitSection
        id="piscine"
        title="La piscine, au cœur du jardin"
        text="Entre les bungalows et les massifs tropicaux, la piscine bordée de pierres attend les baigneurs du matin au soir. Quelques marches pour entrer dans l’eau, un transat pour sécher au soleil, et l’océan juste derrière."
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
        text="Petit-déjeuner au jardin, cuisine généreuse aux saveurs de l’île et verre au bord de la piscine : la table de Chez L’Avocatier se prend face à l’océan."
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
