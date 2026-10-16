import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import Amenities from "@/components/home/Amenities";
import SplitSection from "@/components/home/SplitSection";
import BeachPool from "@/components/home/BeachPool";
import SainteMarie from "@/components/home/SainteMarie";
import Testimonials from "@/components/home/Testimonials";
import BookingCTA from "@/components/BookingCTA";

export const metadata: Metadata = {
  title: "Chez L'Avocatier — Bungalows face à l'océan à Sainte-Marie, Madagascar",
  description:
    "Bungalows, piscine et accès direct à la plage à Vohilava, sur l'île Sainte-Marie (Madagascar). Une adresse intimiste tenue par Joëlle & Stéphane, à 3 km de l'aéroport.",
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
      <SplitSection
        id="experience"
        title="Bienvenue chez vous, au bord de l’océan"
        text="Tongasoa, comme on dit ici pour souhaiter la bienvenue. Joëlle et Stéphane vous accueillent à Vohilava, dans une adresse intimiste entre jardin tropical et océan Indien : on y vient pour ralentir, respirer et profiter pleinement de Sainte-Marie."
        cta={{ label: "Découvrir Chez L’Avocatier", href: "/hotel" }}
        image={{
          src: "/images/hotel/jardin-bungalows.jpeg",
          alt: "Le jardin tropical et les bungalows de Chez L'Avocatier en fin de journée",
        }}
      />

      {/* 3. Les hébergements */}
      <SplitSection
        id="hebergements"
        title="Dormir au rythme de l’océan"
        text="Installez-vous dans un bungalow pensé pour profiter pleinement de la douceur de Sainte-Marie, entouré de végétation tropicale et ouvert sur l’océan."
        cta={{ label: "Découvrir nos hébergements", href: "/hebergements" }}
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
      <SplitSection
        id="restaurant"
        title="Les saveurs de l’île"
        text="Petit-déjeuner continental pour bien commencer la journée, restaurant sur place et bar : une cuisine généreuse, aux saveurs de l’île."
        cta={{ label: "Découvrir la table", href: "/restaurant" }}
        image={{
          src: "/images/restaurant/petit-dejeuner.jpeg",
          alt: "Plateau du petit-déjeuner : fruits, viennoiseries, confitures et jus de fruits",
          frame: "aspect-[4/3] md:aspect-auto md:h-[32rem]",
        }}
        tone="mist"
      />

      {/* 7 + 9. Sainte-Marie (référencement) et localisation */}
      <SainteMarie/>

      {/* 8. Avis clients */}
      <Testimonials/>

      {/* 10. CTA final */}
      <BookingCTA/>
    </div>
  );
}
