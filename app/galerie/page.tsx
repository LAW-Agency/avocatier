import type { Metadata } from "next";
import Image from "next/image";
import BookingCTA from "@/components/BookingCTA";
import Galerie, { type Filtre } from "@/components/galerie/Galerie";
import { categories } from "@/data/galerie";

export const metadata: Metadata = {
  title: "Galerie photos de l'hôtel à Sainte-Marie | Chez L'Avocatier",
  description:
    "Bungalows, plage privée, piscine, jardin tropical et restaurant : Chez L'Avocatier en photos, à Vohilava sur l'île Sainte-Marie (Madagascar).",
};

// Cahier des charges : « une vraie galerie immersive plutôt qu'une simple grille », catégories
// TOUT | CHAMBRES | PISCINE | PLAGE | JARDIN | RESTAURANT (+ L’hôtel, du menu du cahier ; SAINTE-MARIE retirée, voir data/galerie.ts),
// ouverture en plein écran. Catégorie dans l'adresse (?categorie=plage) : liens directs depuis les autres pages.
// Bandeau photo (lagon au crépuscule) sous voiles vert nuit en tête : le header transparent passe par-dessus (HERO_PAGES).
export default async function GaleriePage({ searchParams }: PageProps<"/galerie">) {
  const { categorie } = await searchParams;
  const filtreInitial: Filtre = categories.some((c) => c.id === categorie) ? (categorie as Filtre) : "tout";

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-forest text-primary-light">
        {/* Conteneur séparé : l'apparition de la photo ne remplace pas son parallaxe */}
        <div className="absolute inset-0 -z-20 animate-photo-entree motion-reduce:animate-none">
          <Image
            src="/images/island/lagon-pirogues.jpeg"
            alt="Pirogues sur le lagon au crépuscule, vues depuis la plage sous les cocotiers"
            fill
            preload
            sizes="100vw"
            className="object-cover object-[center_45%] animate-parallax"
          />
        </div>
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-forest/35" />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-40 -z-10 bg-gradient-to-b from-forest/50 to-transparent" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3/4 -z-10 bg-gradient-to-t from-forest via-forest/60 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 pt-40 pb-10 md:pt-56 md:pb-14 grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-14">
          <h1 className="lg:col-span-7 font-heading text-[clamp(3rem,2rem+4vw,5.5rem)] leading-[0.95] animate-fade-up motion-reduce:animate-none">
            Galerie
          </h1>
          <p className="lg:col-span-5 max-w-md text-base md:text-lg leading-relaxed text-primary-light/85 animate-fade-up [animation-delay:200ms] motion-reduce:animate-none">
            Avant de venir, flânez dans le jardin, sur la plage et dans les bungalows de Chez L’Avocatier.
            Ouvrez une photo pour la voir en plein écran.
          </p>
        </div>
      </section>

      <Galerie filtreInitial={filtreInitial} />

      <BookingCTA/>
    </div>
  );
}
