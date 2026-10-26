import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { BedDouble, CalendarPlus, Clock, LogOut, Mail, MapPin, Navigation, Phone, Plane, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { annulerReservation, deconnexion } from "@/app/compte/actions"
import ButtonLink from "@/components/ButtonLink"
import { BoutonEnvoi } from "@/components/Chargement"
import { Prix } from "@/components/Devise"
import { HORAIRES } from "@/components/hebergements/sejour"
import { contact } from "@/data/contact"
import { clientConnecte } from "@/lib/auth/dal"
import { moteur } from "@/lib/reservation"
import { ajouterJours, aujourdhuiISO, formaterDate, formaterPlage, nombreNuits, pluriel } from "@/lib/reservation/dates"
import { statutAffiche, type StatutAffiche } from "@/lib/reservation/statuts"
import type { ClientPublic, DateISO, Hebergement, Reservation } from "@/lib/reservation/types"

export const metadata: Metadata = {
  title: "Mon compte | Chez L'Avocatier",
}

const PHOTO_SANS_SEJOUR = "/images/hotel/jardin.jpeg"

// Écran de compte en encre neutre (ink) : le vert reste réservé à ce qui avance (statut, suivi, liens)
// Pastille pleine = acquis, cerclée = en attente de réponse
const pastilleTon: Record<StatutAffiche["ton"], string> = {
  attente: "border-2 border-primary-dark",
  ok: "bg-primary-dark",
  neutre: "bg-ink/35",
  alerte: "bg-primary-accent",
}

const lienAction =
  "inline-flex items-center gap-2 text-sm font-medium text-ink transition-colors duration-300 hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-dark"

export default async function ComptePage() {
  const client = await clientConnecte()
  if (!client) redirect("/compte/connexion?suite=/compte")

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
  // Haut de la colonne principale : le prochain séjour, ou l'invitation du premier séjour
  const enTete =
    prochain && hebergementProchain ? (
      <CarteSejour reservation={prochain} hebergement={hebergementProchain} aujourdhui={aujourdhui} />
    ) : reservations.length === 0 ? (
      <SansReservation />
    ) : null

  return (
    <>
      {/* Le prochain séjour, en grand sur sa photo (header transparent par-dessus : voir HERO_PAGES).
          Pas plein écran : la carte du séjour reste visible juste en dessous */}
      <section className="relative isolate flex h-[45svh] min-h-[23rem] max-h-[28rem] overflow-hidden bg-forest">
        {/* Conteneur séparé : l'apparition de la photo ne remplace pas son zoom au défilement */}
        <div className="absolute inset-0 -z-20 animate-photo-entree motion-reduce:animate-none">
          <Image
            src={hebergementProchain?.image ?? PHOTO_SANS_SEJOUR}
            alt=""
            fill
            preload
            sizes="100vw"
            className="object-cover animate-hero-zoom"
          />
        </div>
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

      {/* Sur mobile, l'encadré pratique suit directement la carte du séjour ; en desktop il occupe
          la colonne de droite sur toute la hauteur et reste collé au défilement */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-4 py-section sm:gap-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-14 lg:gap-y-0 xl:grid-cols-[minmax(0,1fr)_22rem] xl:gap-x-20">
        {enTete}

        <aside className="space-y-6 lg:sticky lg:top-28 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          {prochain && <PreparerArrivee reservation={prochain} />}
          <VotreCompte client={client} />
        </aside>

        {(autres.length > 0 || historique.length > 0) && (
          <div className={`min-w-0 space-y-16 sm:space-y-20 ${enTete ? "lg:mt-20" : ""}`}>
            {autres.length > 0 && (
              <ListeSejours titre="Vos autres séjours à venir" reservations={autres} hebergementDe={hebergementDe} aujourdhui={aujourdhui} />
            )}
            {historique.length > 0 && (
              <ListeSejours titre="Historique" reservations={historique} hebergementDe={hebergementDe} aujourdhui={aujourdhui} />
            )}
          </div>
        )}
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

function Statut({ statut, className = "" }: { statut: StatutAffiche; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-2 rounded-full bg-ink/[0.05] px-3 py-1 text-sm font-medium text-ink ${className}`}>
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${pastilleTon[statut.ton]}`} />
      {statut.label}
    </span>
  )
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
      <span aria-hidden="true" className="absolute top-[5px] left-0 right-1/4 h-px bg-ink/15" />
      <span
        aria-hidden="true"
        className="absolute top-[4.5px] left-0 right-1/4 h-0.5 origin-left bg-primary-dark animate-remplir motion-reduce:animate-none"
        style={{ transform: `scaleX(${atteinte / (ETAPES_SEJOUR.length - 1)})` }}
      />
      <ol className="relative grid grid-cols-4 gap-3">
        {ETAPES_SEJOUR.map((label, i) => {
          const faite = i <= atteinte
          const date = i >= 2 ? dateCourte(`${dates[i]}T12:00:00Z`) : dates[i] ? dateCourte(dates[i]!) : null
          return (
            <li key={label} aria-current={i === atteinte ? "step" : undefined}>
              <span
                aria-hidden="true"
                className={`block h-[11px] w-[11px] rounded-full border-2 ${
                  faite ? "border-primary-dark bg-primary-dark" : "border-ink/25 bg-primary-light"
                }`}
              />
              <span className={`mt-3 block text-sm leading-snug ${faite ? "text-ink" : "text-ink/70"} ${i === atteinte ? "font-medium" : ""}`}>
                {label}
                <span className="sr-only">{faite ? " (fait)" : " (à venir)"}</span>
              </span>
              {date && <span className="mt-0.5 block text-xs text-ink/70 tabular-nums">{date}</span>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

// Fichier .ics de l'événement « séjour » (journées entières, départ inclus), servi en lien data:
function lienAgenda(r: Reservation, h: Hebergement): string {
  const jour = (iso: DateISO) => iso.replaceAll("-", "")
  const horodatage = new Date(r.creeLe).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Chez L'Avocatier//Mon compte//FR",
    "BEGIN:VEVENT",
    `UID:${r.reference}@chez-lavocatier`,
    `DTSTAMP:${horodatage}`,
    `DTSTART;VALUE=DATE:${jour(r.arrivee)}`,
    `DTEND;VALUE=DATE:${jour(ajouterJours(r.depart, 1))}`,
    `SUMMARY:Séjour Chez L'Avocatier\\, ${h.nom}`,
    "LOCATION:Chez L'Avocatier\\, Vohilava\\, Île Sainte-Marie\\, Madagascar",
    `DESCRIPTION:Référence ${r.reference}. Arrivée ${HORAIRES.arrivee.toLowerCase()}\\, départ ${HORAIRES.depart.toLowerCase()}.`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
}

function JourSejour({ terme, date, horaire, alignement = "" }: { terme: string; date: DateISO; horaire: string; alignement?: string }) {
  return (
    <div className={alignement}>
      <dt className="text-sm text-ink/70">{terme}</dt>
      <dd>
        <span className="mt-1 block font-heading text-[clamp(1.75rem,1.4rem+1.5vw,2.5rem)] leading-tight text-ink tabular-nums">
          {formaterDate(date, { weekday: undefined, year: undefined })}
        </span>
        <span className="mt-1 block text-sm text-ink">
          <span className="capitalize">{formaterDate(date, { weekday: "long", day: undefined, month: undefined, year: undefined })}</span>
          <span className="block text-ink/70">{horaire}</span>
        </span>
      </dd>
    </div>
  )
}

function CarteSejour({ reservation: r, hebergement: h, aujourdhui }: { reservation: Reservation; hebergement: Hebergement; aujourdhui: DateISO }) {
  const statut = statutAffiche(r, aujourdhui)
  const nuits = nombreNuits(r.arrivee, r.depart)
  const details = [
    { terme: "Voyageurs", valeur: `${pluriel(r.adultes, "adulte")}${r.enfants ? `, ${pluriel(r.enfants, "enfant")}` : ""}` },
    { terme: "Navette aéroport", valeur: r.navette ? "Demandée" : "Non demandée" },
    { terme: r.statut === "option" ? "Montant estimé" : "Montant total", valeur: <Prix montant={r.montantTotal} /> },
  ]

  return (
    <article aria-labelledby="titre-prochain" className="overflow-hidden rounded-panel border border-ink/10 bg-primary-light">
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 p-6 sm:p-8">
        <div>
          <h2 id="titre-prochain" className="font-heading text-2xl text-ink sm:text-3xl">
            {h.nom}
          </h2>
          <p className="mt-1 text-sm text-ink/70">
            Référence <span className="tabular-nums">{r.reference}</span>
          </p>
        </div>
        <Statut statut={statut} />
      </header>

      {/* Les deux dates du séjour, de part et d'autre de la durée */}
      <dl className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-y border-ink/10 px-6 py-6 sm:gap-8 sm:px-8 sm:py-8">
        <JourSejour terme="Arrivée" date={r.arrivee} horaire={HORAIRES.arrivee} />
        <div className="flex flex-col items-center gap-2 text-ink/70" aria-hidden="true">
          <span className="text-sm whitespace-nowrap">{pluriel(nuits, "nuit")}</span>
          <span className="flex w-10 items-center sm:w-20">
            <span className="h-1.5 w-1.5 rounded-full border border-ink/40" />
            <span className="h-px flex-1 bg-ink/25" />
            <span className="h-1.5 w-1.5 rounded-full bg-ink/40" />
          </span>
        </div>
        <JourSejour terme="Départ" date={r.depart} horaire={HORAIRES.depart} alignement="text-right" />
        <div className="sr-only">
          <dt>Durée</dt>
          <dd>{pluriel(nuits, "nuit")}</dd>
        </div>
      </dl>

      <div className="space-y-8 px-6 py-7 sm:px-8 sm:py-8">
        <p className="max-w-xl text-ink">{statut.description}</p>
        <SuiviSejour reservation={r} aujourdhui={aujourdhui} />
      </div>

      <dl className="grid gap-x-8 gap-y-4 border-t border-ink/10 px-6 py-6 sm:grid-cols-3 sm:px-8">
        {details.map((d, i) => (
          <div key={d.terme} className="flex items-baseline justify-between gap-6 sm:block">
            <dt className="text-sm text-ink/70">{d.terme}</dt>
            <dd className={`text-ink sm:mt-1 ${i === details.length - 1 ? "font-heading text-xl tabular-nums" : "font-medium"}`}>{d.valeur}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center gap-x-7 gap-y-4 border-t border-ink/10 bg-mist/70 px-6 py-5 sm:px-8">
        <a href={lienAgenda(r, h)} download={`sejour-${r.reference}.ics`} className={lienAction}>
          <CalendarPlus className="h-4 w-4 text-primary-dark" aria-hidden="true" />
          Ajouter à mon agenda
        </a>
        <a href={contact.mapUrl} target="_blank" rel="noopener noreferrer" className={lienAction}>
          <Navigation className="h-4 w-4 text-primary-dark" aria-hidden="true" />
          Itinéraire
          <span className="sr-only"> (Google Maps, nouvel onglet)</span>
        </a>
        <Link href={`/hebergements/${h.slug}`} className={lienAction}>
          <BedDouble className="h-4 w-4 text-primary-dark" aria-hidden="true" />
          {h.type === "bungalow" ? "Voir le bungalow" : "Voir la chambre"}
        </Link>
        {r.statut === "option" && <BoutonAnnuler reservation={r} className="sm:ml-auto" />}
      </div>
    </article>
  )
}

// Une demande de plusieurs chambres s'annule en entier
function BoutonAnnuler({ reservation: r, className = "" }: { reservation: Reservation; className?: string }) {
  return (
    <form action={annulerReservation} className={className}>
      <input type="hidden" name="reservationId" value={r.id} />
      <BoutonEnvoi
        enCours="Annulation…"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary-accent underline decoration-primary-accent/30 underline-offset-4 transition-colors hover:decoration-primary-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-accent"
      >
        {r.groupe ? "Annuler la demande (toutes ses chambres)" : "Annuler la demande"}
      </BoutonEnvoi>
    </form>
  )
}

function LigneInfo({ icone: Icone, children }: { icone: LucideIcon; children: ReactNode }) {
  return (
    <li className="flex gap-3.5">
      <Icone className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary-dark" aria-hidden="true" />
      <div className="text-sm leading-relaxed text-ink">{children}</div>
    </li>
  )
}

function PreparerArrivee({ reservation: r }: { reservation: Reservation }) {
  return (
    <section aria-labelledby="titre-arrivee" className="rounded-panel bg-mist p-6 sm:p-7">
      <h2 id="titre-arrivee" className="font-heading text-xl text-ink">
        Préparer votre arrivée
      </h2>
      <ul className="mt-5 space-y-4">
        <LigneInfo icone={MapPin}>
          {contact.address.locality}, {contact.address.island}
          <span className="block text-ink/70">{contact.airport}</span>
        </LigneInfo>
        <LigneInfo icone={Plane}>
          {r.navette ? "Navette aéroport demandée" : "Navette aéroport"}
          <span className="block text-ink/70">
            {r.navette ? "Indiquez votre vol aux hôtes dès que vous l'avez." : "Sur demande, avec supplément."}
          </span>
        </LigneInfo>
        <LigneInfo icone={Clock}>
          Arrivée {HORAIRES.arrivee.toLowerCase()}
          <span className="block text-ink/70">Départ {HORAIRES.depart.toLowerCase()}</span>
        </LigneInfo>
      </ul>

      {(contact.phone || contact.email) && (
        <div className="mt-6 border-t border-ink/10 pt-5">
          <p className="text-sm text-ink">Une question ? Joëlle et Stéphane vous répondent.</p>
          <div className="mt-3 flex flex-col gap-2.5">
            {contact.phone && (
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className={lienAction}>
                <Phone className="h-4 w-4 text-primary-dark" aria-hidden="true" />
                <span className="tabular-nums">{contact.phone}</span>
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}?subject=${encodeURIComponent(`Réservation ${r.reference}`)}`} className={`${lienAction} break-all`}>
                <Mail className="h-4 w-4 shrink-0 text-primary-dark" aria-hidden="true" />
                {contact.email}
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function VotreCompte({ client }: { client: ClientPublic }) {
  const lignes = [
    { terme: "E-mail", valeur: client.email },
    { terme: "Téléphone", valeur: client.telephone },
    { terme: "Pays", valeur: client.pays },
  ].filter((l) => l.valeur)

  return (
    <section aria-labelledby="titre-compte" className="rounded-panel border border-ink/10 p-6 sm:p-7">
      <h2 id="titre-compte" className="font-heading text-xl text-ink">
        Votre compte
      </h2>
      <p className="mt-1 text-sm text-ink/70">
        {client.prenom} {client.nom}
      </p>
      <dl className="mt-5 space-y-3 text-sm">
        {lignes.map((l) => (
          <div key={l.terme}>
            <dt className="text-ink/70">{l.terme}</dt>
            <dd className="break-words text-ink">{l.valeur}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex flex-col gap-4 border-t border-ink/10 pt-6">
        <ButtonLink href="/reserver">Nouvelle réservation</ButtonLink>
        <form action={deconnexion} className="self-center">
          <BoutonEnvoi enCours="Déconnexion…" className={`${lienAction} text-ink/70`}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Se déconnecter
          </BoutonEnvoi>
        </form>
      </div>
    </section>
  )
}

function SansReservation() {
  return (
    <section className="rounded-panel border border-dashed border-ink/20 px-6 py-10 sm:px-10 sm:py-14">
      <h2 className="font-heading text-2xl text-ink">Vos séjours s&apos;afficheront ici</h2>
      <p className="mt-3 max-w-lg text-ink/70">
        Dès votre première demande, vous suivrez ici sa confirmation, vos dates et les informations utiles pour votre arrivée.
      </p>
      <div className="mt-7">
        <ButtonLink href="/hebergements" variant="link">
          Découvrir les hébergements
        </ButtonLink>
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
    <section>
      <h2 className="font-heading text-2xl text-ink">{titre}</h2>
      <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
        {reservations.map((r) => {
          const h = hebergementDe(r)
          const statut = statutAffiche(r, aujourdhui)
          return (
            <li key={r.id} className="grid grid-cols-[5rem_1fr] items-center gap-x-5 gap-y-3 py-5 sm:grid-cols-[7rem_1fr_auto] sm:gap-x-7">
              {h && (
                <div className="relative aspect-[4/3] overflow-hidden rounded-card">
                  <Image src={h.image} alt="" fill sizes="7rem" className="object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-heading text-lg text-ink sm:text-xl">{formaterPlage(r.arrivee, r.depart)}</p>
                <p className="mt-0.5 text-sm text-ink/70">
                  {h?.nom}, {pluriel(r.adultes + r.enfants, "voyageur")}, <Prix montant={r.montantTotal} />
                </p>
                <p className="text-sm text-ink/70">
                  Référence <span className="tabular-nums">{r.reference}</span>
                </p>
              </div>
              <div className="col-start-2 flex flex-wrap items-center gap-5 sm:col-start-auto sm:flex-col sm:items-end sm:gap-2.5">
                <Statut statut={statut} />
                {r.statut === "option" && <BoutonAnnuler reservation={r} />}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
