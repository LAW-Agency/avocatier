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
          "Plus qu’un hôtel, une invitation à vivre l’océan autrement.",
          "Dans un écrin de verdure tropicale, les pieds presque dans l’eau, Joëlle et Stéphane vous ouvrent les portes de leur petit paradis. Ici, le temps ralentit, les cocotiers murmurent au gré du vent et l’océan Indien devient votre horizon quotidien.",
          "Imaginez… des baignades dans une eau turquoise, des instants de détente à l’ombre des palmiers, le plaisir de ne rien prévoir et celui de se sentir véritablement chez soi, loin du quotidien.",
          "À Vohilava, chaque séjour est une parenthèse de douceur, de convivialité et d’évasion.",
          "Joëlle et Stéphane vous accueillent avec simplicité et authenticité pour vous faire découvrir un lieu unique, où l’hospitalité malgache prend tout son sens.",
          "Laissez-vous séduire par l’esprit de Vohilava… votre prochain coup de cœur au bord de l’océan Indien !",
        ]}
        cta={{ label: "Découvrez notre hôtel et faites connaissance avec vos hôtes", href: "/hotel" }}
        image={{
          src: "/images/hotel/jardin-bungalows.jpeg",
          alt: "Le jardin tropical et les bungalows de Chez L'Avocatier en fin de journée",
        }}
      />

      {/* 3. Les hébergements */}
      <SplitSection
        id="hebergements"
        title="Des nuits douces, bercées par l’océan"
        lead="Un réveil au paradis, à quelques pas de la plage…"
        text={[
          "Laissez-vous séduire par le charme de nos bungalows et chambres, nichés au cœur d’une végétation tropicale luxuriante.",
          "Chaque hébergement possède son propre caractère : lits délicatement enveloppés de moustiquaires, couleurs chaleureuses et lumineuses, salles d’eau ornées de fresques originales… Autant de détails qui créent une atmosphère unique, entre authenticité et dépaysement.",
          "À l’extérieur, la nature vous enveloppe, tandis que l’océan Indien vous attend à quelques pas.",
          "Ici, on s’endort au calme, bercé par les sons de la nature, et l’on se réveille avec une seule envie : profiter pleinement de l’instant présent.",
          "Choisissez votre petit cocon tropical et laissez la magie de Vohilava opérer !",
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
        lead="Le plaisir des papilles face à l’océan Indien !"
        text={[
          "À Vohilava, chaque journée commence par un délicieux petit-déjeuner continental, pour faire le plein d’énergie avant de profiter des merveilles de l’île.",
          "À table, place à la gourmandise et à l’authenticité ! Découvrez une cuisine généreuse et savoureuse, inspirée des richesses de Madagascar, préparée avec des produits locaux, frais et issus de l’agriculture locale.",
          "Installez-vous face à l’océan, laissez-vous tenter par les saveurs du terroir et profitez de ces instants privilégiés où le plaisir de bien manger se mêle à la beauté du paysage.",
          "Et lorsque le soleil commence à se coucher, prolongez la douceur de la journée autour d’un verre au bar, au bord de la piscine, dans une atmosphère tropicale et conviviale.",
          "À Vohilava, les vacances se savourent aussi dans l’assiette !",
        ]}
        cta={{ label: "Découvrez notre restaurant et nos saveurs", href: "/restaurant" }}
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
        title="Et si votre prochain voyage au paradis se préparait ici ?"
        lead="Le bonheur de l’océan Indien n’attend plus que vous !"
        text={[
          "Vous rêvez de soleil, de plages bordées de cocotiers, de baignades dans une eau turquoise et de moments de détente loin du quotidien ? Ne cherchez plus, votre prochaine escapade commence chez nous !",
          "Joëlle et Stéphane seront ravis de vous accueillir à Vohilava et de vous faire découvrir leur petit coin de paradis. Quelques minutes suffisent pour nous adresser votre demande de réservation. Nous vous répondrons personnellement sous 48 heures afin de préparer avec vous votre prochain séjour.",
          "Que ce soit pour une escapade en amoureux, des vacances en famille ou une parenthèse de déconnexion, nous avons hâte de vous recevoir !",
          "N’attendez plus pour faire de votre rêve une réalité. Madagascar vous attend, et votre petit coin de paradis aussi !",
        ]}
        label="Demandez votre séjour dès maintenant"
      />
    </div>
  );
}
