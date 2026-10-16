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
  title: "Hôtel de charme et plage privée à Sainte-Marie | Chez L'Avocatier",
  description:
    "Jardin tropical, plage privée, piscine et quelques bungalows seulement : découvrez Chez L'Avocatier et l'accueil de Joëlle et Stéphane, sur l'île Sainte-Marie.",
};

// Structure du cahier des charges : hero, notre histoire, Joëlle & Stéphane, le jardin tropical,
// la plage privée, la piscine, les espaces communs, restaurant & bar, galerie, réserver.
// Rythme des fonds : photo → clair → vert nuit → mist → photo/clair → mist → clair → vert nuit → mist → photo
export default function HotelPage() {
  return (
    <div>
      <PageHero
        title="L’hôtel"
        tagline="Une maison face à l’océan, sur l’île Sainte-Marie"
        text="Quelques bungalows et chambres dans un jardin tropical, une plage privée, une piscine et l’accueil personnalisé de Joëlle et Stéphane : bienvenue dans une adresse à taille humaine."
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
        text="Cocotiers, massifs fleuris et grande pelouse : le jardin relie votre bungalow à la piscine et à la plage. Un transat au soleil, un hamac à l’ombre, un bon livre : le programme de la journée est vite trouvé."
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
        title="La plage privée, au bout du jardin"
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
          Il suffit de traverser la pelouse : la plage s’ouvre à quelques pas de votre hébergement.
          L’eau calme du lagon invite à la baignade, tandis qu’au large glissent les pirogues des pêcheurs.
        </p>
        <p>
          À l’ombre des cocotiers, un hamac vous attend. Et chaque soir, le même rendez-vous : le soleil
          qui se couche face à la plage.
        </p>
      </PanoramaSection>

      <SplitSection
        id="piscine"
        title="La piscine, au cœur du jardin"
        text="Bordée de pierre et entourée de transats, la piscine se prête aussi bien aux longues baignades qu’aux siestes au soleil. Son escalier immergé permet d’y entrer en douceur, et le bar n’est qu’à quelques pas."
        cta={{ label: "Voir les disponibilités", href: "/reserver" }}
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
        title="Restaurant & bar, face à l’océan"
        text="Petit-déjeuner continental, cuisine maison à base de produits locaux et bio, bar au bord de la piscine : ici, on dîne face à l’océan, sans avoir à reprendre la route."
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
