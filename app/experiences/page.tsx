import type { Metadata } from "next";
import BookingCTA from "@/components/BookingCTA";
import PageHero from "@/components/PageHero";
import Journee from "@/components/experiences/Journee";
import Ile from "@/components/experiences/Ile";
import Activites from "@/components/experiences/Activites";

export const metadata: Metadata = {
  title: "Expériences à Sainte-Marie | Chez L'Avocatier",
  description:
    "Plage, piscine, baleines à bosse, île aux Nattes, plongée et balades en pirogue : que faire sur l'île Sainte-Marie (Madagascar) depuis Chez L'Avocatier, à Vohilava.",
};

// Cahier des charges : « vendre ce que l'on ressent, pas uniquement ce que possède l'hôtel ».
// Plage, piscine, nature et détente racontées comme une journée ; puis l'île, les baleines,
// les excursions et activités nautiques.
// Rythme des fonds : photo → clair → mist → vert nuit → mist → clair → photo
export default function ExperiencesPage() {
  return (
    <div>
      <PageHero
        title="Expériences"
        tagline="Ici, les journées ont un autre rythme"
        text="La plage au bout du jardin, les baleines au large, l’île aux Nattes à quelques coups de pagaie : Sainte-Marie se vit lentement."
        image={{
          src: "/images/beach/plage-cocotier.jpeg",
          alt: "Cocotier penché au-dessus de la plage et de l'océan",
          position: "object-[center_45%]",
        }}
        secondary={{ label: "Découvrir l’île", href: "#sainte-marie" }}
        rubriques={[
          { label: "Prendre le temps", href: "#prendre-le-temps" },
          { label: "Sur place", href: "#sur-place" },
          { label: "Sainte-Marie", href: "#sainte-marie" },
          { label: "Excursions", href: "#excursions" },
        ]}
      />

      {/* Prendre le temps — le texte du cahier des charges, en grand */}
      <section id="prendre-le-temps" className="py-section">
        <div data-reveal className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="font-heading text-section">Prendre le temps</h2>
          <p className="font-heading text-[clamp(1.5rem,1.1rem+1.6vw,2.5rem)] leading-snug text-balance">
            Un café face à l’océan. Une baignade avant le petit-déjeuner. Une sieste sous les cocotiers.
            Ici, les journées ont un autre rythme.
          </p>
        </div>
      </section>

      <Journee/>

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
              le canal entre Sainte-Marie et la Grande Terre. Depuis la plage, on aperçoit parfois leurs
              souffles au large ; en mer, la rencontre est inoubliable.
            </p>
          </div>
        </div>
      </section>

      <Activites/>

      <BookingCTA/>
    </div>
  );
}
