import type { Metadata } from "next";
import ReserverFinal from "@/components/home/ReserverFinal";
import PageHero from "@/components/PageHero";
import Ile from "@/components/experiences/Ile";
import Activites from "@/components/experiences/Activites";
import Baleines from "@/components/experiences/Baleines";
import Organiser from "@/components/experiences/Organiser";

export const metadata: Metadata = {
  title: "Que faire à Sainte-Marie, Madagascar ? | Chez L'Avocatier",
  description:
    "Baleines à bosse de juillet à septembre, île aux Nattes, plongée, pirogue : que faire à Sainte-Marie depuis Chez L'Avocatier, à Vohilava.",
};

// Cahier des charges : « vendre ce que l'on ressent, pas uniquement ce que possède l'hôtel ».
// L'île, les baleines, les excursions et activités nautiques.
// Rythme des fonds : photo → clair → photo (baleines) → sable → clair → photo
export default function ExperiencesPage() {
  return (
    <div>
      <PageHero
        title="Expériences"
        tagline="Sainte-Marie, mille façons de s’émerveiller"
        text={[
          "Baignades dans les eaux turquoise, rencontres avec les baleines, balades en pirogue, découvertes de paysages préservés… Sainte-Marie regorge de trésors à explorer.",
          "Vivez l’île à votre rythme, entre aventure, nature et moments inoubliables !",
        ]}
        image={{
          // TODO client : image fournie le 2026-11-10 — confirmer sa provenance et qu'elle montre bien l'île
          src: "/images/island/cascade.jpeg",
          alt: "Cascade tropicale qui tombe d'une falaise au milieu d'une végétation luxuriante",
          position: "object-[center_40%]",
        }}
        secondary={{ label: "Découvrir l’île", href: "#sainte-marie" }}
        rubriques={[
          { label: "Sainte-Marie", href: "#sainte-marie" },
          { label: "Baleines", href: "#baleines" },
          { label: "Excursions", href: "#excursions" },
        ]}
      />

      <Ile/>

      <Baleines/>

      <Activites/>

      <Organiser/>

      <ReserverFinal/>
    </div>
  );
}
