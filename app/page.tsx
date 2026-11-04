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
      <SplitSection
        id="restaurant"
        title="Un voyage gourmand aux saveurs de Madagascar"
        lead="La gourmandise face à l’océan Indien !"
        text={[
          "Commencez la journée par un délicieux petit-déjeuner continental, puis laissez-vous tenter par une cuisine maison généreuse, inspirée des saveurs malgaches et préparée avec des produits frais et locaux.",
          "Poissons de la pêche du jour, fruits tropicaux et spécialités gourmandes se dégustent face à l’océan, dans un cadre privilégié.",
          "En fin de journée, retrouvez le bar au bord de la piscine pour savourer un cocktail et profiter de la douceur des soirées tropicales.",
          "Chez L’Avocatier, chaque repas est une invitation au voyage !",
        ]}
        cta={{ label: "Découvrez notre restaurant et notre bar", href: "/restaurant" }}
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
      <BookingCTA
        title="Et si votre prochain voyage au paradis commençait ici ?"
        lead="L’océan Indien vous attend… et nous aussi !"
        text={[
          "Envie de soleil, de plages de sable fin et d’eaux turquoise ? Offrez-vous une parenthèse de détente à Sainte-Marie, loin du quotidien.",
          "Joëlle et Stéphane seront heureux de vous accueillir Chez L’Avocatier, à Vohilava. Envoyez-nous votre demande de réservation : nous vous répondrons personnellement sous 48 heures pour préparer votre séjour.",
          "En amoureux, en famille ou pour simplement déconnecter, votre petit coin de paradis vous attend !",
        ]}
        label="Réservez votre séjour dès maintenant"
      />
    </div>
  );
}
