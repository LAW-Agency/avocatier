import type { Metadata } from "next";
import Restaurant from "@/components/restaurant/Restaurant";
import Saveurs from "@/components/restaurant/Saveurs";
import Photos from "@/components/restaurant/Photos";
import Horaires from "@/components/restaurant/Horaires";
import SectionTitle from "@/components/home/SectionTitle";
import SplitSection from "@/components/home/SplitSection";
import BookingCTA from "@/components/BookingCTA";
import PageHero from "@/components/PageHero";
import PanoramaSection from "@/components/PanoramaSection";

export const metadata: Metadata = {
  title: "Restaurant & Bar | Chez L'Avocatier",
  description:
    "Cuisine maison à base de produits locaux et bio, petit-déjeuner continental, restaurant et bar au bord de la piscine, face à l'océan : la table de Chez L'Avocatier, à Vohilava sur l'île Sainte-Marie (Madagascar).",
};

// Structure du cahier des charges : hero, notre cuisine, petit-déjeuner, restaurant, produits & saveurs
// locales, bar, photos, horaires, réserver / nous contacter.
// Rythme des fonds : photo → clair → mist → clair → vert nuit → photo/clair → mist → clair → photo
export default function RestaurantPage() {
  return (
    <div>
      <PageHero
        title="Restaurant & Bar"
        tagline="Une table face à l’océan"
        text="Une cuisine maison élaborée à partir de produits locaux et bio, servie du petit-déjeuner au dîner, et un bar au bord de la piscine, face à l’océan."
        image={{
          src: "/images/restaurant/table-ocean-coucher-soleil.jpeg",
          alt: "Table et paillote dans le jardin, face à l'océan au coucher du soleil",
          position: "object-[center_55%]",
        }}
        secondary={{ label: "Horaires & contact", href: "#horaires" }}
        rubriques={[
          { label: "Petit-déjeuner", href: "#petit-dejeuner" },
          { label: "Restaurant", href: "#restaurant" },
          { label: "Bar", href: "#bar" },
        ]}
      />

      {/* Notre cuisine : un texte court, beaucoup d'air */}
      <section id="cuisine" className="py-section">
        <div data-reveal className="max-w-3xl mx-auto px-4 text-center space-y-6">
          <SectionTitle title="Une cuisine maison, généreuse et soignée" center />
          <p className="text-body text-balance">
            Notre cuisine repose sur des produits locaux, frais et bio, sélectionnés auprès des pêcheurs
            et des producteurs de l’île. Les saveurs de Madagascar y rencontrent les classiques de la
            cuisine française, dans des assiettes généreuses servies du petit-déjeuner au dîner, entre
            le jardin et l’océan.
          </p>
        </div>
      </section>

      <SplitSection
        id="petit-dejeuner"
        title="Bien commencer la journée"
        text="Fruits tropicaux de saison, jus de fruits frais, confitures, viennoiseries : le petit-déjeuner continental met à l’honneur les fruits de l’île et est servi chaque matin, avant une journée de baignade ou de découverte."
        cta={{ label: "Voir les horaires", href: "#horaires" }}
        image={{
          src: "/images/restaurant/petit-dejeuner.jpeg",
          alt: "Plateau du petit-déjeuner : fruits, viennoiseries, confitures et jus de fruits",
          frame: "aspect-[4/5] md:aspect-auto md:h-[36rem]",
        }}
        tone="mist"
      />

      <Restaurant/>

      {/* Produits & saveurs locales */}
      <Saveurs/>

      {/* Bar : cadrage à droite sur le comptoir et ses tabourets, au bord de la piscine */}
      <PanoramaSection
        id="bar"
        title="Le bar, au bord de la piscine"
        image={{
          src: "/images/pool/piscine-bungalows.jpeg",
          alt: "Le comptoir du bar et ses tabourets, au bord de la piscine, face aux bungalows",
          position: "object-[80%_60%]",
        }}
        aside={{
          src: "/images/restaurant/paillote-crepuscule.jpeg",
          alt: "L'océan au crépuscule, vu depuis l'abri d'une paillote",
          position: "object-[center_45%]",
        }}
      >
        <p>
          Jus de fruits frais, cocktails et rhums arrangés : installé sous sa paillote, entre la
          piscine et le jardin, le bar vous accueille tout au long de la journée.
        </p>
        <p>
          En fin de journée, c’est le lieu idéal pour un apéritif face à l’océan, au moment du
          coucher du soleil.
        </p>
      </PanoramaSection>

      <Photos/>

      {/* Horaires, puis réserver / nous contacter */}
      <Horaires/>

      <BookingCTA title="Le soleil se couche, la table est mise"/>
    </div>
  );
}
