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
        hideTitle
        tagline="Une cuisine savoureuse face à l’océan Indien"
        text={[
          "Des produits locaux, une cuisine maison généreuse et des saveurs qui sentent bon Madagascar… Du petit-déjeuner au dîner, profitez d’une belle expérience gourmande face à l’océan.",
          "Et pour prolonger ces instants de plaisir, retrouvez notre bar au bord de la piscine pour savourer un verre dans une ambiance tropicale.",
          "Chez L’Avocatier, les vacances se dégustent aussi à table !",
        ]}
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
          <SectionTitle title="Une cuisine maison, généreuse et pleine de saveurs" center />
          <p className="text-body text-balance">
            Poissons frais des pêcheurs locaux, fruits et légumes de saison, produits frais… Notre cuisine met à l’honneur les richesses de Madagascar et les saveurs de la cuisine française.
          </p>
          <p className="text-body text-balance">
            Des assiettes gourmandes et préparées avec soin, à savourer dans un cadre privilégié entre jardin tropical et océan Indien.
          </p>
          <p className="text-body text-balance">
            Le plaisir des bons produits, la générosité du fait maison et le bonheur de partager !
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
          Jus de fruits frais, cocktails et rhums arrangés… Installez-vous sous notre paillote, au cœur du jardin tropical, et profitez d’un moment de détente au bord de la piscine.
        </p>
        <p>
          En journée comme à l’heure de l’apéritif, notre bar est le rendez-vous idéal pour savourer la douceur des vacances.
        </p>
        <p>
          Un verre à la main, les pieds presque dans l’eau… Le bonheur tout simplement !
        </p>
      </PanoramaSection>

      <Photos/>

      {/* Horaires, puis réserver / nous contacter */}
      <Horaires/>

      <BookingCTA
        title="Le soleil se couche, la table est mise…"
        text={[
          "Imaginez un dîner aux saveurs de Madagascar, face à l’océan Indien, dans une ambiance douce et tropicale.",
          "Envie de partager ce moment gourmand ? Contactez Joëlle et Stéphane pour réserver votre table. Ils seront ravis de vous accueillir !",
          "Chez L’Avocatier, les plus beaux souvenirs se partagent aussi autour d’une bonne table !",
        ]}
      />
    </div>
  );
}
