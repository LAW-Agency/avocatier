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
  title: "Restaurant et bar face à l'océan à Sainte-Marie | Chez L'Avocatier",
  description:
    "Petit-déjeuner continental, cuisine maison aux produits locaux et bio, bar au bord de la piscine : la table de Chez L'Avocatier, face à l'océan, à Sainte-Marie.",
};

// Structure du cahier des charges : hero, notre cuisine, petit-déjeuner, restaurant, produits & saveurs
// locales, bar, photos, horaires, réserver / nous contacter.
// Rythme des fonds : photo → clair → mist → clair → vert nuit → photo/clair → mist → clair → photo
export default function RestaurantPage() {
  return (
    <div>
      <PageHero
        title="Restaurant & Bar"
        tagline="Une table face à l’océan Indien"
        text="Produits locaux et bio, assiettes généreuses et vue sur l’océan, du petit-déjeuner au dîner. Le bar, lui, vous attend au bord de la piscine."
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
            Tout commence par le produit : poisson des pêcheurs de l’île, fruits et légumes de saison,
            ingrédients locaux, frais et bio. Les saveurs de Madagascar y croisent les classiques de la
            cuisine française, dans des assiettes généreuses servies entre le jardin et l’océan.
          </p>
        </div>
      </section>

      <SplitSection
        id="petit-dejeuner"
        title="Bien commencer la journée"
        text="Fruits tropicaux, jus de fruits frais, confitures et viennoiseries : chaque matin, le petit-déjeuner continental fait la part belle aux fruits de l’île. De quoi prendre des forces avant une journée de baignade ou d’exploration."
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
          Et quand le soleil décline, c’est ici que l’on se retrouve pour l’apéritif.
        </p>
      </PanoramaSection>

      <Photos/>

      {/* Horaires, puis réserver / nous contacter */}
      <Horaires/>

      <BookingCTA title="Le soleil se couche, la table est mise"/>
    </div>
  );
}
