import type { Metadata } from "next";
import type { CSSProperties } from "react";
import BookingCTA from "@/components/BookingCTA";
import PageHero from "@/components/PageHero";
import SectionTitle from "@/components/home/SectionTitle";
import CarteHebergement from "@/components/hebergements/CarteHebergement";
import { conditionsSejour } from "@/components/hebergements/sejour";
import { moteur } from "@/lib/reservation";

export const metadata: Metadata = {
  title: "Bungalows et chambres à Sainte-Marie, Madagascar | Chez L'Avocatier",
  description:
    "Bungalows et chambres dans un jardin tropical, à deux pas de la plage privée et de la piscine, à Vohilava (île Sainte-Marie) : équipements et tarifs.",
};

// Cahier des charges : hero « Votre refuge tropical », puis la grille des hébergements
// (photo, description, équipements, « Voir le bungalow »). Données du moteur de réservation.
// Rythme des fonds : photo → clair → mist → vert nuit → photo
export default async function HebergementsPage() {
  const [hebergements, saisons] = await Promise.all([moteur.listerHebergements(), moteur.listerSaisons()]);
  const bungalows = hebergements.filter((h) => h.type === "bungalow");
  const chambres = hebergements.filter((h) => h.type === "chambre");

  return (
    <div>
      <PageHero
        title="Hébergements"
        tagline="Votre refuge tropical à Sainte-Marie"
        text="Bungalows et chambres au cœur du jardin, à deux pas de la piscine et de la plage. Partout, une salle d’eau privative, le Wi-Fi et un coffre-fort, pour un séjour aussi simple que serein."
        image={{
          src: "/images/rooms/bungalow-ocean-2.jpeg",
          alt: "Un bungalow aux murs vert profond : lit à baldaquin, moustiquaire et suspensions tressées",
        }}
        secondary={{ label: "Découvrir les bungalows", href: "#bungalows" }}
        rubriques={[
          { label: "Bungalows", href: "#bungalows" },
          { label: "Chambres", href: "#chambres" },
          { label: "Bon à savoir", href: "#bon-a-savoir" },
        ]}
      />

      <section id="bungalows" className="py-section">
        <div className="max-w-7xl mx-auto px-4">
          <div data-reveal className="grid md:grid-cols-12 gap-6 lg:gap-14 items-end mb-10 md:mb-14">
            <div className="md:col-span-5">
              <SectionTitle title="Les bungalows, entre jardin et océan" />
            </div>
            <p className="md:col-span-7 max-w-[60ch] text-body">
              Chaque bungalow a sa décoration, ses couleurs et sa salle d’eau privative, et ouvre
              directement sur le jardin, à quelques pas de l’océan. En amoureux ou en famille, il y en
              a un à votre mesure.
            </p>
          </div>

          <div className="grid gap-x-4 gap-y-14 md:grid-cols-3 lg:gap-x-6">
            {bungalows.map((h, i) => (
              <CarteHebergement
                key={h.id}
                hebergement={h}
                cadre="aspect-[4/5]"
                sizes="(min-width: 1280px) 400px, (min-width: 768px) 33vw, 100vw"
                delai={i * 120}
              />
            ))}
          </div>
        </div>
      </section>

      {chambres.length > 0 && (
        <section id="chambres" className="py-section bg-mist">
          <div className="max-w-7xl mx-auto px-4">
            <div data-reveal className="grid md:grid-cols-12 gap-6 lg:gap-14 items-end mb-10 md:mb-14">
              <div className="md:col-span-5">
                <SectionTitle title="Les chambres" />
              </div>
              <p className="md:col-span-7 max-w-[60ch] text-body">
                Plus compactes, les chambres offrent le même confort et le même soin que les bungalows.
                Idéales pour une escale sur l’île ou un séjour à deux.
              </p>
            </div>

            <div className="grid gap-x-6 gap-y-14 md:grid-cols-2">
              {chambres.map((h, i) => (
                <CarteHebergement
                  key={h.id}
                  hebergement={h}
                  sizes="(min-width: 1280px) 610px, (min-width: 768px) 50vw, 100vw"
                  delai={i * 120}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bon à savoir : conditions communes à tous les hébergements */}
      <section id="bon-a-savoir" className="py-section bg-forest">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-12 gap-10 lg:gap-14">
          <div data-reveal className="md:col-span-5 space-y-5">
            <SectionTitle title="Bon à savoir" light />
            <p className="max-w-[60ch] text-body text-primary-light/80">
              Les prix indiqués sont des tarifs de base par nuit, qui peuvent varier selon la saison.
              Choisissez vos dates : le montant exact de votre séjour s’affiche aussitôt, sans surprise.
            </p>
          </div>

          <dl
            data-reveal
            style={{ "--reveal-delay": "150ms" } as CSSProperties}
            className="md:col-span-7 divide-y divide-primary-light/15 border-y border-primary-light/15"
          >
            {conditionsSejour(saisons).map(({ label, valeur }) => (
              <div key={label} className="grid gap-1 py-4 sm:grid-cols-3 sm:gap-6">
                <dt className="font-heading text-lg text-sand">{label}</dt>
                <dd className="sm:col-span-2 text-[0.95rem] leading-relaxed text-primary-light/80">{valeur}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <BookingCTA/>
    </div>
  );
}
