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
        tagline="Votre cocon tropical à Sainte-Marie"
        // Un seul paragraphe : équipements et « Posez vos valises… » sont repris dans la section Bungalows juste dessous
        text="Nichés dans un jardin tropical, à deux pas de la piscine et de la plage, nos bungalows et chambres vous accueillent dans une atmosphère chaleureuse et dépaysante, pour un séjour en toute sérénité."
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
            <div className="md:col-span-5 space-y-4">
              <SectionTitle title="Les bungalows, entre jardin et océan" />
              <p className="max-w-[40ch] font-heading text-lg md:text-xl text-balance text-primary-accent">
                Posez vos valises, déconnectez et savourez la douceur de vivre Chez L’Avocatier !
              </p>
            </div>
            <div className="md:col-span-7 max-w-[60ch] space-y-4 text-body">
              <p>
                Avec leur décoration colorée et leur charme tropical, nos bungalows vous offrent un véritable cocon de tranquillité. Chaque hébergement dispose de sa salle d’eau privative, du Wi-Fi et d’un coffre-fort et s’ouvre sur le jardin, à quelques pas de la plage.
              </p>
              <p>
                En amoureux ou en famille, trouvez votre petit nid pour des vacances inoubliables à Sainte-Marie !
              </p>
            </div>
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
                <SectionTitle title="Les chambres, confort et douceur tropicale" />
              </div>
              <div className="md:col-span-7 max-w-[60ch] space-y-4 text-body">
                <p>
                  Cosy et accueillantes, nos chambres vous offrent tout le confort nécessaire pour un séjour agréable à Sainte-Marie. Idéales pour une escapade en amoureux ou une belle découverte de l’île.
                </p>
                <p>
                  Un petit cocon pour se ressourcer et profiter pleinement des vacances !
                </p>
              </div>
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
              Nos tarifs sont indiqués par nuit et peuvent varier selon la saison. Sélectionnez vos dates de séjour pour découvrir instantanément le prix exact de votre réservation.
            </p>
            <p className="max-w-[60ch] text-body text-primary-light/80">
              Pas de mauvaise surprise, juste le plaisir de préparer vos vacances en toute sérénité !
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
