import type { Metadata } from "next"
import Image from "next/image"
import { redirect } from "next/navigation"
import type { CSSProperties } from "react"
import { annulerReservation, deconnexion } from "@/app/compte/actions"
import ButtonLink from "@/components/ButtonLink"
import { clientConnecte } from "@/lib/auth/dal"
import { moteur } from "@/lib/reservation"
import { aujourdhuiISO, formaterPlage, formaterPrix, nombreNuits, pluriel } from "@/lib/reservation/dates"
import { statutAffiche, type StatutAffiche } from "@/lib/reservation/statuts"
import type { DateISO, Hebergement, Reservation } from "@/lib/reservation/types"

export const metadata: Metadata = {
  title: "Mon compte | Chez L'Avocatier",
}

const PHOTO_SANS_SEJOUR = "/images/hotel/jardin.jpeg"

const classesTon: Record<StatutAffiche["ton"], string> = {
  attente: "bg-sand text-forest",
  ok: "bg-primary-dark text-text-light",
  neutre: "bg-primary-dark/10 text-text-dark",
  alerte: "bg-primary-accent/10 text-primary-accent",
}

export default async function ComptePage() {
  const client = await clientConnecte()
  if (!client) redirect("/compte/connexion?suite=/compte")
  if (client.role === "hote") redirect("/admin")

  const [reservations, hebergements] = await Promise.all([
    moteur.reservationsDuClient(client.id),
    moteur.listerHebergements(),
  ])
  const aujourdhui = aujourdhuiISO()
  const aVenir = reservations
    .filter((r) => (r.statut === "option" || r.statut === "confirmee") && r.depart > aujourdhui)
    .sort((a, b) => a.arrivee.localeCompare(b.arrivee))
  const [prochain, ...autres] = aVenir
  const historique = reservations.filter((r) => !aVenir.includes(r))
  const hebergementDe = (r: Reservation) => hebergements.find((h) => h.id === r.hebergementId)
  const hebergementProchain = prochain ? hebergementDe(prochain) : undefined

  return (
    <>
      {/* Le prochain séjour, en grand sur sa photo (header transparent par-dessus : voir HERO_PAGES).
          Pas plein écran : le suivi du séjour reste visible juste en dessous */}
      <section className="relative isolate flex h-[45svh] min-h-[23rem] max-h-[28rem] overflow-hidden bg-forest">
        <Image
          src={hebergementProchain?.image ?? PHOTO_SANS_SEJOUR}
          alt=""
          fill
          preload
          sizes="100vw"
          className="-z-20 object-cover animate-hero-zoom"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-forest/35" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-forest via-forest/55 to-transparent" />

        <div className="mx-auto flex w-full max-w-7xl flex-col justify-end px-4 pt-28 pb-10 text-primary-light sm:px-6 lg:pb-14">
          <h1 className="font-heading text-2xl text-sand sm:text-3xl animate-fade-up motion-reduce:animate-none">
            Bonjour {client.prenom}
          </h1>
          {prochain ? (
            <div className="animate-fade-up [animation-delay:250ms] motion-reduce:animate-none">
              <p className="mt-3 font-heading text-[clamp(2.75rem,1.9rem+4vw,5.25rem)] leading-[0.95] text-balance">
                {compteARebours(prochain, aujourdhui)}
              </p>
              <p className="mt-5 text-lg text-primary-light/90">
                {hebergementProchain?.nom}, {formaterPlage(prochain.arrivee, prochain.depart)}
              </p>
            </div>
          ) : (
            <div className="animate-fade-up [animation-delay:250ms] motion-reduce:animate-none">
              <p className="mt-3 font-heading text-[clamp(2.5rem,1.8rem+4vw,5rem)] leading-[0.95] text-balance">
                Aucun séjour prévu pour l&apos;instant
              </p>
              <div className="mt-8">
                <ButtonLink href="/reserver">Réserver votre séjour</ButtonLink>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-section sm:px-6">
        {prochain && hebergementProchain && (
          <ProchainSejour reservation={prochain} hebergement={hebergementProchain} aujourdhui={aujourdhui} />
        )}

        {autres.length > 0 && (
          <ListeSejours titre="Vos autres séjours à venir" reservations={autres} hebergementDe={hebergementDe} aujourdhui={aujourdhui} />
        )}
        {historique.length > 0 && (
          <ListeSejours titre="Historique" reservations={historique} hebergementDe={hebergementDe} aujourdhui={aujourdhui} />
        )}

        <div className="mt-20 flex flex-col gap-6 border-t border-primary-dark/15 pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-text-dark">
            Connecté avec <span className="font-medium">{client.email}</span>
          </p>
          <div className="flex items-center gap-8">
            <ButtonLink href="/reserver">Nouvelle réservation</ButtonLink>
            <form action={deconnexion}>
              <button type="submit" className="text-sm font-medium tracking-wide text-text-dark underline decoration-primary-dark/30 underline-offset-4 hover:decoration-primary-dark">
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

function compteARebours(r: Reservation, aujourdhui: DateISO): string {
  const jours = nombreNuits(aujourdhui, r.arrivee)
  if (jours < 0) return "Bon séjour"
  if (jours === 0) return "C'est aujourd'hui"
  if (jours === 1) return "C'est demain"
  return `Dans ${jours} jours`
}

// Étapes de la vie d'un séjour ; null quand la réservation n'aboutira pas (annulée, expirée…)
const ETAPES_SEJOUR = ["Demande envoyée", "Confirmée", "Séjour", "Terminé"]

function etapeAtteinte(r: Reservation, aujourdhui: DateISO): number | null {
  if (r.statut === "option") return 0
  if (r.statut !== "confirmee") return null
  if (r.depart <= aujourdhui) return 3
  if (r.arrivee <= aujourdhui) return 2
  return 1
}

function dateCourte(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Indian/Antananarivo" }).format(new Date(iso))
}

// Frise de suivi : la ligne se remplit jusqu'à l'étape atteinte
function SuiviSejour({ reservation: r, aujourdhui }: { reservation: Reservation; aujourdhui: DateISO }) {
  const atteinte = etapeAtteinte(r, aujourdhui)
  if (atteinte === null) return null
  const dates = [
    r.historique.find((e) => e.statut === "option")?.le,
    r.historique.find((e) => e.statut === "confirmee")?.le,
    r.arrivee,
    r.depart,
  ]
  return (
    <div className="relative">
      <span aria-hidden="true" className="absolute top-[7px] left-0 right-1/4 h-px bg-primary-dark/20" />
      <span
        aria-hidden="true"
        className="absolute top-[6.5px] left-0 right-1/4 h-0.5 origin-left bg-primary-dark animate-remplir motion-reduce:animate-none"
        style={{ transform: `scaleX(${atteinte / (ETAPES_SEJOUR.length - 1)})` }}
      />
      <ol className="relative grid grid-cols-4 gap-2">
        {ETAPES_SEJOUR.map((label, i) => {
          const faite = i <= atteinte
          const date = i >= 2 ? dateCourte(`${dates[i]}T12:00:00Z`) : dates[i] ? dateCourte(dates[i]!) : null
          return (
            <li key={label} aria-current={i === atteinte ? "step" : undefined} className="text-text-dark">
              <span
                aria-hidden="true"
                className={`block h-3.5 w-3.5 rounded-full border-2 ${
                  faite ? "border-primary-dark bg-primary-dark" : "border-primary-dark/30 bg-background"
                }`}
              />
              <span className={`mt-3 block text-sm ${i === atteinte ? "font-medium" : ""}`}>
                {label}
                <span className="sr-only">{faite ? " (fait)" : " (à venir)"}</span>
              </span>
              {date && <span className="block text-xs">{date}</span>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function ProchainSejour({ reservation: r, hebergement, aujourdhui }: { reservation: Reservation; hebergement: Hebergement; aujourdhui: DateISO }) {
  const statut = statutAffiche(r, aujourdhui)
  const details = [
    { terme: "Séjour", valeur: pluriel(nombreNuits(r.arrivee, r.depart), "nuit") },
    { terme: "Voyageurs", valeur: `${pluriel(r.adultes, "adulte")}${r.enfants ? `, ${pluriel(r.enfants, "enfant")}` : ""}` },
    { terme: "Navette aéroport", valeur: r.navette ? "Demandée" : "Non" },
    { terme: "Montant", valeur: formaterPrix(r.montantTotal) },
  ]

  return (
    <section aria-labelledby="titre-prochain" className="grid gap-12 lg:grid-cols-[7fr_5fr] lg:gap-20">
      <div data-reveal>
        <div className="flex flex-wrap items-center gap-4">
          <h2 id="titre-prochain" className="font-heading text-section text-text-dark">
            Votre prochain séjour
          </h2>
          <span className={`rounded-full px-3.5 py-1 text-sm font-medium ${classesTon[statut.ton]}`}>{statut.label}</span>
        </div>
        <p className="mt-5 max-w-xl text-body text-text-dark">{statut.description}</p>

        <div className="mt-12">
          <SuiviSejour reservation={r} aujourdhui={aujourdhui} />
        </div>

        {r.statut === "option" && (
          <form action={annulerReservation} className="mt-12">
            <input type="hidden" name="reservationId" value={r.id} />
            <button type="submit" className="text-sm font-medium text-primary-accent underline decoration-primary-accent/30 underline-offset-4 hover:decoration-primary-accent">
              Annuler cette demande
            </button>
          </form>
        )}
      </div>

      <div data-reveal style={{ "--reveal-delay": "150ms" } as CSSProperties} className="lg:pt-3">
        <p className="font-heading text-3xl text-text-dark">{hebergement.nom}</p>
        <p className="mt-1 text-text-dark">Référence {r.reference}</p>
        <dl className="mt-8 divide-y divide-primary-dark/15 border-y border-primary-dark/15 text-text-dark">
          {details.map((d) => (
            <div key={d.terme} className="flex justify-between gap-6 py-3.5">
              <dt>{d.terme}</dt>
              <dd className="text-right font-medium">{d.valeur}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

interface ListeSejoursProps {
  titre: string
  reservations: Reservation[]
  hebergementDe: (r: Reservation) => Hebergement | undefined
  aujourdhui: DateISO
}

function ListeSejours({ titre, reservations, hebergementDe, aujourdhui }: ListeSejoursProps) {
  return (
    <section className="mt-24">
      <h2 data-reveal className="font-heading text-3xl text-text-dark sm:text-4xl">
        {titre}
      </h2>
      <ul className="mt-8 border-t border-primary-dark/15">
        {reservations.map((r, i) => {
          const h = hebergementDe(r)
          const statut = statutAffiche(r, aujourdhui)
          return (
            <li
              key={r.id}
              data-reveal
              style={{ "--reveal-delay": `${i * 100}ms` } as CSSProperties}
              className="grid grid-cols-[5.5rem_1fr] items-center gap-x-5 gap-y-3 border-b border-primary-dark/15 py-6 sm:grid-cols-[8rem_1fr_auto] sm:gap-x-8"
            >
              {h && (
                <div className="relative aspect-[4/3] overflow-hidden rounded-panel">
                  <Image src={h.image} alt="" fill sizes="8rem" className="object-cover" />
                </div>
              )}
              <div className="text-text-dark">
                <p className="font-heading text-xl sm:text-2xl">{formaterPlage(r.arrivee, r.depart)}</p>
                <p className="mt-1 text-sm">
                  {h?.nom}, {pluriel(r.adultes + r.enfants, "voyageur")}, {formaterPrix(r.montantTotal)}
                </p>
                <p className="mt-1 text-sm">Référence {r.reference}</p>
              </div>
              <div className="col-start-2 flex flex-wrap items-center gap-5 sm:col-start-auto sm:flex-col sm:items-end sm:gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${classesTon[statut.ton]}`}>{statut.label}</span>
                {r.statut === "option" && (
                  <form action={annulerReservation}>
                    <input type="hidden" name="reservationId" value={r.id} />
                    <button type="submit" className="text-sm font-medium text-primary-accent underline decoration-primary-accent/30 underline-offset-4 hover:decoration-primary-accent">
                      Annuler la demande
                    </button>
                  </form>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
