import type { Metadata } from "next";
import ReserverFinal from "@/components/home/ReserverFinal";
import Testimonials from "@/components/home/Testimonials";
import Atouts from "@/components/essai-accueil/Atouts";
import BarreReserverMobile from "@/components/essai-accueil/BarreReserverMobile";
import BlocPhotoTexte from "@/components/home/BlocPhotoTexte";
import HebergementsCartes from "@/components/essai-accueil/HebergementsCartes";
import HeroEssai from "@/components/essai-accueil/HeroEssai";
import Restaurant from "@/components/home/Restaurant";
import Reassurance from "@/components/essai-accueil/Reassurance";
import BeachPool from "@/components/home/BeachPool";
import SainteMarie from "@/components/home/SainteMarie";
import { moteur } from "@/lib/reservation";

// Page d'essai d'une refonte de l'accueil (direction « Nature chaleureuse ») : mêmes textes du client,
// mise en page différente, à comparer avec /. Hors menu et non indexée ; l'accueil n'en dépend pas.
export const metadata: Metadata = {
  title: "Essai de page d'accueil · Chez L'Avocatier",
  robots: { index: false, follow: false },
};

// Rythme des fonds : photo → vert nuit → crème → sable → crème → photo/crème → sable → sable → vert nuit → photo
export default async function EssaiAccueil() {
  const hebergements = await moteur.listerHebergements();

  return (
    <div>
      <HeroEssai />
      <Reassurance />

      <BlocPhotoTexte
        id="experience"
        title="Votre parenthèse enchantée au bord de l’océan Indien"
        lead="Tongasoa… Bienvenue à Vohilava !"
        text={[
          "Entre jardin tropical et océan Indien, Joëlle et Stéphane vous accueillent dans leur petit coin de paradis.",
          "Plage de sable fin, cocotiers, baignades dans une eau turquoise et douceur de vivre… Ici, le temps ralentit et chaque instant devient un plaisir.",
          "Plus qu’un hôtel, Chez L’Avocatier est une invitation à l’évasion, au partage et à l’authenticité malgache.",
        ]}
        cta={{ label: "Découvrez notre hôtel et vos hôtes", href: "/hotel" }}
        image={{
          src: "/images/hotel/jardin-bungalows.jpeg",
          alt: "Le jardin tropical et les bungalows de Chez L'Avocatier en fin de journée",
        }}
        vignette={{
          src: "/images/hotel/panneau.jpeg",
          alt: "Le panneau jaune peint de Chez L'Avocatier au bord de la route",
        }}
      />

      <Atouts />

      <HebergementsCartes hebergements={hebergements} />

      <BeachPool />

      <Restaurant />

      <Testimonials />

      <SainteMarie />

      <ReserverFinal id="essai-fin" />

      <BarreReserverMobile hero="essai-hero" fin="essai-fin" />
    </div>
  );
}
