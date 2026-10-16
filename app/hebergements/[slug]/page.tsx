import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BedDouble, Eye, ShowerHead, Users } from "lucide-react";
import type { CSSProperties } from "react";
import ButtonLink from "@/components/ButtonLink";
import SectionTitle from "@/components/home/SectionTitle";
import CarteHebergement from "@/components/hebergements/CarteHebergement";
import { conditionsSejour, equipements } from "@/components/hebergements/sejour";
import { moteur } from "@/lib/reservation";
import { Prix } from "@/components/Devise";
import { pluriel } from "@/lib/reservation/dates";

async function trouver(slug: string) {
  const hebergements = await moteur.listerHebergements();
  return { hebergement: hebergements.find((h) => h.slug === slug), hebergements };
}

export async function generateMetadata({ params }: PageProps<"/hebergements/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { hebergement } = await trouver(slug);
  if (!hebergement) return {};
  return {
    title: `${hebergement.nom}, ${hebergement.vue.toLowerCase()} à Sainte-Marie | Chez L'Avocatier`,
    description: `${hebergement.description} Jusqu'à ${pluriel(hebergement.capaciteMax, "personne")}, ${hebergement.literie.toLowerCase()}, ${hebergement.vue.toLowerCase()}. Plage privée et piscine à Vohilava, île Sainte-Marie.`,
  };
}

const titreBloc = "font-heading text-2xl leading-tight";

// Fiche d'un hébergement (cahier des charges) : galerie photos, capacité, literie, salle de bains, vue,
// équipements (coffre-fort, bureau, Wi-Fi…), conditions, tarif et demande de réservation.
// Pas de hero plein écran : le header est blanc d'emblée (page absente de HERO_PAGES).
export default async function HebergementPage({ params }: PageProps<"/hebergements/[slug]">) {
  const { slug } = await params;
  const [{ hebergement: h, hebergements }, saisons] = await Promise.all([trouver(slug), moteur.listerSaisons()]);
  if (!h) notFound();

  const autres = hebergements.filter((autre) => autre.id !== h.id).slice(0, 3);
  const caracteristiques = [
    { label: "Capacité", valeur: `Jusqu’à ${pluriel(h.capaciteMax, "personne")}`, icon: Users },
    { label: "Literie", valeur: h.literie, icon: BedDouble },
    { label: "Salle de bains", valeur: h.salleDeBains, icon: ShowerHead },
    { label: "Vue", valeur: h.vue, icon: Eye },
  ];
  // Galerie : la première vignette s'étale sur deux colonnes quand leur nombre est impair
  const vignettes = h.galerie.slice(0, 4);

  return (
    <div>
      {/* EN-TÊTE ET GALERIE PHOTOS */}
      <section className="pt-8 md:pt-12 pb-10 md:pb-14">
        <div className="max-w-7xl mx-auto px-4">
          <Link
            href="/hebergements"
            className="inline-flex items-center gap-2 text-sm transition-colors duration-300 hover:text-primary-accent"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Tous les hébergements
          </Link>

          <div className="mt-5 mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 animate-fade-up motion-reduce:animate-none">
            <h1 className="font-heading text-[clamp(2.5rem,1.8rem+3vw,4.5rem)] leading-[0.95]">{h.nom}</h1>
            <p className="text-sm">
              {h.type === "bungalow" ? "Bungalow" : "Chambre"} · jusqu’à {pluriel(h.capaciteMax, "personne")} · {h.vue.toLowerCase()}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-12 md:h-[32rem] lg:h-[36rem] md:gap-4">
            <div className="relative overflow-hidden rounded-card aspect-[4/3] md:aspect-auto md:col-span-7">
              <Image
                src={h.image}
                alt={`${h.nom} : la chambre et son lit à baldaquin`}
                fill
                preload
                sizes="(min-width: 1280px) 720px, (min-width: 768px) 58vw, 100vw"
                className="object-cover animate-photo-entree motion-reduce:animate-none"
              />
            </div>
            {vignettes.length > 0 && (
              <div className="grid grid-cols-2 auto-rows-fr gap-3 md:col-span-5 md:gap-4">
                {vignettes.map((src, i) => (
                  <div
                    key={src}
                    className={`relative overflow-hidden rounded-card aspect-[4/3] md:aspect-auto ${
                      i === 0 && vignettes.length % 2 === 1 ? "col-span-2" : ""
                    }`}
                  >
                    <Image
                      src={src}
                      alt={`${h.nom} : photo ${i + 2}`}
                      fill
                      sizes="(min-width: 1280px) 260px, (min-width: 768px) 21vw, 50vw"
                      data-reveal="image"
                      style={{ "--reveal-delay": `${i * 100}ms` } as CSSProperties}
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* DESCRIPTION, CARACTÉRISTIQUES, ÉQUIPEMENTS, CONDITIONS — et le tarif, collant sur grand écran */}
      <section className="pb-section">
        <div className="max-w-7xl mx-auto px-4 grid gap-12 lg:grid-cols-12 lg:gap-14 items-start">
          {/* TARIF ET DEMANDE DE RÉSERVATION — juste sous la galerie sur mobile et tablette, à droite et collant sur grand écran */}
          <aside className="lg:order-2 lg:col-span-5 lg:sticky lg:top-28">
            <div className="rounded-card bg-mist p-6 md:p-8 space-y-5">
              <p className="text-sm">
                À partir de{" "}
                <span className="block font-heading text-4xl tabular-nums">
                  <Prix montant={h.prixNuit} />
                  <span className="text-base font-normal"> / nuit</span>
                </span>
              </p>
              <p className="text-[0.95rem] leading-relaxed">
                Tarif de base, variable selon la saison. Choisissez vos dates pour connaître le prix exact :
                elles vous sont réservées 48 h, le temps que Joëlle et Stéphane confirment votre séjour.
              </p>
              <ButtonLink href={`/reserver?hebergement=${h.slug}`} className="w-full">
                Voir les disponibilités
              </ButtonLink>
              <ButtonLink href="/contact" variant="link">Une question ? Écrivez-nous</ButtonLink>
            </div>
          </aside>

          <div className="lg:col-span-7 space-y-12">
            <p data-reveal className="max-w-[60ch] font-heading text-xl md:text-2xl leading-snug text-balance">
              {h.presentation}
            </p>

            <dl data-reveal className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {caracteristiques.map(({ label, valeur, icon: Icon }) => (
                <div key={label} className="flex gap-4 border-t border-primary-dark/15 pt-4">
                  <Icon className="w-6 h-6 shrink-0 stroke-[1.25]" aria-hidden="true" />
                  <div>
                    <dt className="text-sm">{label}</dt>
                    <dd className="font-heading text-lg leading-snug">{valeur}</dd>
                  </div>
                </div>
              ))}
            </dl>

            <div data-reveal className="space-y-5">
              <h2 className={titreBloc}>Équipements</h2>
              <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {h.equipements.map((e) => {
                  const { label, icon: Icon } = equipements[e];
                  return (
                    <li key={e} className="flex items-center gap-3 text-body">
                      <Icon className="w-5 h-5 shrink-0 stroke-[1.5]" aria-hidden="true" /> {label}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div data-reveal className="space-y-5">
              <h2 className={titreBloc}>Conditions</h2>
              <dl className="divide-y divide-primary-dark/15 border-y border-primary-dark/15">
                {conditionsSejour(saisons).map(({ label, valeur }) => (
                  <div key={label} className="grid gap-1 py-4 sm:grid-cols-3 sm:gap-6">
                    <dt className="font-heading">{label}</dt>
                    <dd className="sm:col-span-2 text-[0.95rem] leading-relaxed">{valeur}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

        </div>
      </section>

      {/* LES AUTRES HÉBERGEMENTS */}
      {autres.length > 0 && (
        <section className="py-section bg-mist">
          <div className="max-w-7xl mx-auto px-4">
            <div data-reveal className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 mb-10 md:mb-14">
              <SectionTitle title="Nos autres hébergements" />
              <ButtonLink href="/hebergements" variant="link">Tout voir</ButtonLink>
            </div>
            <div className="grid gap-x-4 gap-y-14 md:grid-cols-3 lg:gap-x-6">
              {autres.map((autre, i) => (
                <CarteHebergement
                  key={autre.id}
                  hebergement={autre}
                  cadre="aspect-[4/5]"
                  sizes="(min-width: 1280px) 400px, (min-width: 768px) 33vw, 100vw"
                  delai={i * 120}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
