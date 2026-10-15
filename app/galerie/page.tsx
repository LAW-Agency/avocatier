import type { Metadata } from "next";
import BookingCTA from "@/components/BookingCTA";
import Galerie, { type Filtre } from "@/components/galerie/Galerie";
import { categories } from "@/data/galerie";

export const metadata: Metadata = {
  title: "Galerie photos | Chez L'Avocatier",
  description:
    "Bungalows, piscine, plage, jardin tropical, restaurant et île Sainte-Marie : la galerie photos de Chez L'Avocatier, à Vohilava (Madagascar).",
};

// Cahier des charges : « une vraie galerie immersive plutôt qu'une simple grille », catégories
// TOUT | CHAMBRES | PISCINE | PLAGE | JARDIN | RESTAURANT | SAINTE-MARIE (+ L'hôtel, du menu du cahier),
// ouverture en plein écran. Catégorie dans l'adresse (?categorie=plage) : liens directs depuis les autres pages.
// Bandeau vert nuit en tête : le header transparent passe par-dessus (HERO_PAGES).
export default async function GaleriePage({ searchParams }: PageProps<"/galerie">) {
  const { categorie } = await searchParams;
  const filtreInitial: Filtre = categories.some((c) => c.id === categorie) ? (categorie as Filtre) : "tout";

  return (
    <div>
      <section className="bg-forest text-primary-light">
        <div className="max-w-7xl mx-auto px-4 pt-32 pb-10 md:pt-40 md:pb-14 grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-14">
          <h1 className="lg:col-span-7 font-heading text-[clamp(3rem,2rem+4vw,5.5rem)] leading-[0.95] animate-fade-up motion-reduce:animate-none">
            Galerie
          </h1>
          <p className="lg:col-span-5 max-w-md text-base md:text-lg leading-relaxed text-primary-light/85 animate-fade-up [animation-delay:200ms] motion-reduce:animate-none">
            Le jardin, la plage, les bungalows et la table de Chez L’Avocatier, en images. Touchez une
            photo pour l’ouvrir en plein écran.
          </p>
        </div>
      </section>

      <Galerie filtreInitial={filtreInitial} />

      <BookingCTA/>
    </div>
  );
}
