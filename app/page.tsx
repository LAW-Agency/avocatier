import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import Amenities from "@/components/home/Amenities";
import SplitSection from "@/components/home/SplitSection";
import BeachPool from "@/components/home/BeachPool";
import SainteMarie from "@/components/home/SainteMarie";
import Testimonials from "@/components/home/Testimonials";
import BookingCTA from "@/components/BookingCTA";

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
      <SplitSection
        id="experience"
        title="Bienvenue chez vous, au bord de l’océan"
        text="Tongasoa : bienvenue, en malgache. À Vohilava, Joëlle et Stéphane vous reçoivent dans une adresse confidentielle, entre jardin tropical et océan Indien. Ici, on vient pour ralentir, se baigner, lire à l’ombre des cocotiers… et se sentir attendu."
        cta={{ label: "Découvrir l’hôtel et vos hôtes", href: "/hotel" }}
        image={{
          src: "/images/hotel/jardin-bungalows.jpeg",
          alt: "Le jardin tropical et les bungalows de Chez L'Avocatier en fin de journée",
        }}
      />

      {/* 3. Les hébergements */}
      <SplitSection
        id="hebergements"
        title="Dormir au rythme de l’océan"
        text="Lits à baldaquin voilés de moustiquaire, murs aux couleurs franches, salles d’eau peintes de fresques : chaque bungalow a sa personnalité. Tous ouvrent sur la végétation tropicale, à quelques pas de la plage."
        cta={{ label: "Découvrir nos bungalows et chambres", href: "/hebergements" }}
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
        text="Un petit-déjeuner continental pour bien commencer la journée, puis une cuisine généreuse, à base de produits locaux et bio, servie face à l’océan. Et quand le soleil décline, un verre au bar, au bord de la piscine."
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
