import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import Amenities from "@/components/home/Amenities";
import SplitSection from "@/components/home/SplitSection";
import Beach from "@/components/home/Beach";
import PoolGarden from "@/components/home/PoolGarden";
import Testimonials from "@/components/home/Testimonials";
import Location from "@/components/home/Location";
import BookingCTA from "@/components/BookingCTA";

export const metadata: Metadata = {
  title: "Chez L'Avocatier — Bungalows face à l'océan à Sainte-Marie, Madagascar",
  description:
    "Bungalows, piscine et accès direct à la plage à Vohilava, sur l'île Sainte-Marie (Madagascar). Une adresse intimiste tenue par Joëlle & Stéphane, à 3 km de l'aéroport.",
};

// Rythme des fonds : clair → mist → photo → mist → clair → vert nuit → clair → mist → photo
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

      {/* 4. La plage privée */}
      <Beach/>

      {/* 5. Piscine & jardin */}
      <PoolGarden/>

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
      />

      {/* 7. Sainte-Marie — section importante pour le référencement */}
      <SplitSection
        id="sainte-marie"
        title="Sainte-Marie, l’île autrement"
        text="Au large de la côte est de Madagascar, Sainte-Marie — Nosy Boraha en malgache — déroule une soixantaine de kilomètres de cocotiers, de lagons et de villages de pêcheurs. De juillet à septembre, les baleines à bosse viennent s’y reproduire ; toute l’année, on part à la découverte de l’île aux Nattes, du cimetière des pirates ou des fonds marins."
        cta={{ label: "Explorer Sainte-Marie", href: "/experiences" }}
        image={{
          src: "/images/island/lagon-pirogues.jpeg",
          alt: "Pirogues sur le lagon de Sainte-Marie au coucher du soleil",
        }}
        imageSide="right"
        tone="forest"
      />

      {/* 8. Avis clients */}
      <Testimonials/>

      {/* 9. Localisation */}
      <Location/>

      {/* 10. CTA final */}
      <BookingCTA/>
    </div>
  );
}
