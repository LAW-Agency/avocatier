import type { Metadata } from "next";
import BookingCTA from "@/components/BookingCTA";
import PageHero from "@/components/PageHero";
import Ile from "@/components/experiences/Ile";
import Activites from "@/components/experiences/Activites";

export const metadata: Metadata = {
  title: "Expériences à Sainte-Marie | Chez L'Avocatier",
  description:
    "Plage, piscine, baleines à bosse, île aux Nattes, plongée et balades en pirogue : que faire sur l'île Sainte-Marie (Madagascar) depuis Chez L'Avocatier, à Vohilava.",
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
        text="Observation des baleines, île aux Nattes, plongée, tour de l’île : vos hôtes vous conseillent et vous orientent vers des prestataires locaux pour organiser vos excursions."
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
              La saison des baleines à bosse
            </h2>
            <p className="max-w-[60ch] text-body">
              Chaque hiver austral, les baleines à bosse remontent de l’Antarctique pour mettre bas dans
              le canal entre Sainte-Marie et la Grande Terre, l’un des sites d’observation les plus
              réputés de l’océan Indien. Les sorties en mer s’organisent avec des opérateurs locaux ;
              depuis la plage, leurs souffles sont parfois visibles au large.
            </p>
          </div>
        </div>
      </section>

      <Activites/>

      <BookingCTA/>
    </div>
  );
}
