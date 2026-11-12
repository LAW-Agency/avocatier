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
        tagline={["Une maison", "face à l’océan"]}
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
        title="Un jardin tropical, une invitation à la détente"
        text={[
          "Cocotiers, fleurs exotiques et pelouse verdoyante composent un écrin de nature entre votre bungalow, la piscine et la plage.",
          "Un hamac à l’ombre, un transat au soleil, le bruit des vagues en fond sonore… Ici, le bonheur est de ne rien faire, simplement profiter !",
          "Laissez-vous séduire par la douceur de vivre Chez L’Avocatier.",
        ]}
        cta={{ label: "Découvrez nos bungalows", href: "/hebergements" }}
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
          Quelques pas sur la pelouse et vous voilà les pieds dans le sable ! Profitez d’une plage paisible, d’un lagon propice à la baignade et du ballet des pirogues de pêcheurs.
        </p>
        <p>
          À l’ombre des cocotiers, laissez-vous bercer par la douceur tropicale et savourez chaque soir un magnifique coucher de soleil face à l’océan.
        </p>
        <p>
          Ici, la mer est votre voisine et le bonheur à portée de main !
        </p>
      </PanoramaSection>

      <SplitSection
        id="piscine"
        title="La piscine, votre oasis de fraîcheur"
        text={[
          "Au cœur du jardin tropical, profitez de notre piscine bordée de pierre, entourée de transats et propice à la détente. Pour quelques longueurs, un moment de fraîcheur ou une pause au soleil, tout invite à savourer l’instant présent.",
          "Et pour prolonger le plaisir, le bar vous attend à quelques pas !",
          "Un petit plongeon, un verre à la main… Voilà les vacances !",
        ]}
        cta={{ label: "Consultez nos disponibilités", href: "/reserver" }}
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
        text={[
          "Savourez un délicieux petit-déjeuner, découvrez une cuisine maison aux saveurs locales et profitez d’un verre au bord de la piscine. Des produits frais et bio, une ambiance conviviale et l’océan Indien en toile de fond.",
          "Ici, la gourmandise aussi prend des airs de vacances !",
        ]}
        cta={{ label: "Découvrez notre restaurant et notre bar", href: "/restaurant" }}
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
