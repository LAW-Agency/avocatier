import type { Metadata } from "next";
import BookingCTA from "@/components/BookingCTA";
import PageHero from "@/components/PageHero";
import Ile from "@/components/experiences/Ile";
import Activites from "@/components/experiences/Activites";

export const metadata: Metadata = {
  title: "Que faire à Sainte-Marie, Madagascar ? | Chez L'Avocatier",
  description:
    "Baleines à bosse de juillet à septembre, île aux Nattes, plongée, pirogue : que faire à Sainte-Marie depuis Chez L'Avocatier, à Vohilava.",
};

// Cahier des charges : « vendre ce que l'on ressent, pas uniquement ce que possède l'hôtel ».
// L'île, les baleines, les excursions et activités nautiques.
// Rythme des fonds : photo → clair → mist → clair → photo
export default function ExperiencesPage() {
  return (
    <div>
      <PageHero
        title="Expériences"
        tagline="Ici, les journées ont un autre rythme"
        text="Un café face à l’océan. Une baignade avant le petit-déjeuner. Une sieste sous les cocotiers. Puis, quand l’envie vous prend : les baleines, l’île aux Nattes ou les fonds marins de Sainte-Marie."
        image={{
          src: "/images/beach/plage-cocotier.jpeg",
          alt: "Cocotier penché au-dessus de la plage et de l'océan",
          position: "object-[center_45%]",
        }}
        secondary={{ label: "Découvrir l’île", href: "#sainte-marie" }}
        rubriques={[
          { label: "Sainte-Marie", href: "#sainte-marie" },
          { label: "Baleines", href: "#baleines" },
          { label: "Excursions", href: "#excursions" },
        ]}
      />

      <Ile/>

      {/* Les baleines à bosse : le grand rendez-vous de l'île, de juillet à septembre */}
      <section id="baleines" className="py-section bg-mist">
        <div data-reveal className="max-w-7xl mx-auto px-4 grid md:grid-cols-12 gap-6 lg:gap-14 items-end">
          <p className="md:col-span-7 font-heading text-[clamp(3rem,1.5rem+6vw,7.5rem)] leading-[0.9] text-balance">
            Juillet – septembre
          </p>
          <div className="md:col-span-5 space-y-4">
            <h2 className="font-heading text-2xl md:text-3xl leading-tight text-balance">
              La saison des baleines à bosse à Sainte-Marie
            </h2>
            <p className="max-w-[60ch] text-body">
              Chaque hiver austral, les baleines à bosse remontent de l’Antarctique pour donner naissance
              à leurs petits dans le canal qui sépare Sainte-Marie de la Grande Terre : l’un des sites
              d’observation les plus réputés de l’océan Indien. Les sorties en mer se font avec des
              opérateurs locaux ; depuis la plage, on aperçoit parfois leurs souffles au large.
            </p>
          </div>
        </div>
      </section>

      <Activites/>

      <BookingCTA/>
    </div>
  );
}
