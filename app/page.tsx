import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import Amenities from "@/components/home/Amenities";
import SplitSection from "@/components/home/SplitSection";
import BlocPhotoTexte from "@/components/home/BlocPhotoTexte";
import BeachPool from "@/components/home/BeachPool";
import SainteMarie from "@/components/home/SainteMarie";
import Restaurant from "@/components/home/Restaurant";
import Testimonials from "@/components/home/Testimonials";
import ReserverFinal from "@/components/home/ReserverFinal";

export const metadata: Metadata = {
  title: "Chez L'Avocatier · Hôtel face à l'océan à Sainte-Marie, Madagascar",
  description:
    "Bungalows en bord de mer sur l'île Sainte-Marie : plage privée, piscine, jardin tropical, restaurant et l'accueil de Joëlle et Stéphane, à 3 km de l'aéroport.",
};

// Les 10 sections du cahier des charges, regroupées quand elles se recoupent
// (plage + piscine & jardin, Sainte-Marie + localisation).
// Rythme des fonds : vert nuit → clair → mist → photo/clair → mist → vert nuit → clair → photo
export default function Home() {
  return (
    <div>
      {/* 1. Hero */}
      <Hero/>

      {/* 2. L'expérience */}
      <Amenities/>
      {/* Photo plus haute aux coins doux, vignette du panneau en débord */}
      <BlocPhotoTexte
        id="experience"
        title="Votre parenthèse enchantée au bord de l’océan Indien"
        lead="Tongasoa… Bienvenue à Vohilava !"
        text={[
          "Entre jardin tropical et océan Indien, Joëlle et Stéphane vous accueillent dans leur petit coin de paradis.",
          "Plage de sable fin, cocotiers, baignades dans une eau turquoise et douceur de vivre… Ici, le temps ralentit et chaque instant devient un plaisir.",
          "Plus qu’un hôtel, Chez L’Avocatier est une invitation à l’évasion, au partage et à l’authenticité malgache.",
          "Venez découvrir votre petit paradis à Sainte-Marie !",
        ]}
        cta={{ label: "Découvrez notre hôtel et vos hôtes", href: "/hotel" }}
        image={{
          src: "/images/hotel/jardin-bungalows.jpeg",
          alt: "Le jardin tropical et les bungalows de Chez L'Avocatier en fin de journée",
        }}
        vignette={{
          src: "/images/hotel/panneau.jpeg",
          alt: "Le panneau jaune peint de Chez L'Avocatier au bord de la route",
        }}
      />

      {/* 3. Les hébergements */}
      <SplitSection
        id="hebergements"
        title="Des nuits douces, bercées par l’océan"
        lead="Votre petit cocon tropical à quelques pas de la plage…"
        text={[
          "Nichés dans un jardin luxuriant, nos bungalows et chambres vous séduiront par leur charme, leurs couleurs chaleureuses et leur décoration authentique.",
          "Confort, calme et dépaysement sont au rendez-vous pour profiter pleinement de vos vacances à Sainte-Marie.",
          "Posez vos valises, laissez-vous bercer par la nature et savourez la douceur de vivre de Vohilava !",
        ]}
        cta={{ label: "Découvrez nos bungalows et chambres", href: "/hebergements" }}
        image={{
          src: "/images/rooms/chambre-verte.jpeg",
          alt: "Chambre d'un bungalow avec lit à baldaquin et moustiquaire",
          frame: "aspect-[4/3] md:aspect-auto md:h-[32rem]",
        }}
        imageSide="right"
        tone="mist"
      />

      {/* 4–5. La plage privée, la piscine et le jardin */}
      <BeachPool/>

      {/* 6. Restaurant & bar */}
      {/* Une journée gourmande en trois temps : matin, à table, soir */}
      <Restaurant />

      {/* 7 + 9. Sainte-Marie (référencement) et localisation */}
      <SainteMarie/>

      {/* 8. Avis clients */}
      <Testimonials/>

      {/* 10. CTA final */}
      {/* L'invitation sur la photo, la réservation en 3 étapes dans une carte claire */}
      <ReserverFinal />
    </div>
  );
}
