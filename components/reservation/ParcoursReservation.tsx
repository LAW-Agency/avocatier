"use client"

import Image from "next/image"
import { BedDouble, Check, Eye, Minus, Plus, RotateCcw, Users } from "lucide-react"
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react"
import { deconnexion } from "@/app/compte/actions"
import { envoyerDemande, type EtatDemande } from "@/app/reserver/actions"
import ButtonLink from "@/components/ButtonLink"
import { classesChamp } from "@/components/Champ"
import { BlocCompte } from "@/components/compte/FormulairesCompte"
import Calendrier from "@/components/reservation/Calendrier"
import PanneauPhoto from "@/components/reservation/PanneauPhoto"
import { MentionConversion, useDevise } from "@/components/Devise"
import { formaterPlage, nombreNuits, nuitsDuSejour, pluriel } from "@/lib/reservation/dates"
import { calculerDevis, estLibre, nuitsCompletes, verifierDates, type Devis } from "@/lib/reservation/regles"
import { versParametres, type Selection } from "@/lib/reservation/selection"
import type { ClientPublic, DateISO, Hebergement, PeriodeOccupee, Saison } from "@/lib/reservation/types"

interface ParcoursProps {
  hebergements: Hebergement[]
  saisons: Saison[]
  periodes: PeriodeOccupee[]
  client: ClientPublic | null
  aujourdhui: DateISO
  initial: Selection
}

// Étapes du cahier des charges ; la demande puis la confirmation suivent les coordonnées
const ETAPES = ["Dates", "Voyageurs", "Hébergement", "Coordonnées"] as const

// Photo du panneau selon l'étape, tant qu'aucun hébergement n'est choisi
const PHOTO_DATES = "/images/beach/ocean-crepuscule.jpeg"
const PHOTO_VOYAGEURS = "/images/pool/piscine-bungalows.jpeg"
const PHOTO_HEBERGEMENTS = "/images/hotel/jardin-bungalows.jpeg"

type Sens = "avant" | "arriere" | null

const classesGlisse = (sens: Sens) =>
  sens === "avant"
    ? "animate-glisse-avant motion-reduce:animate-none"
    : sens === "arriere"
      ? "animate-glisse-arriere motion-reduce:animate-none"
      : ""

const boutonPrincipal =
  "inline-flex items-center justify-center rounded-button border border-primary-dark bg-primary-dark px-7 py-3.5 text-sm font-medium tracking-wide text-text-light transition-[background-color,opacity] duration-300 hover:bg-primary-dark/90 disabled:cursor-not-allowed disabled:opacity-35"
const boutonRetour =
  "text-sm font-medium tracking-wide text-text-dark underline decoration-primary-dark/30 underline-offset-4 transition-colors hover:decoration-primary-dark"

export default function ParcoursReservation({ hebergements, saisons, periodes, client, aujourdhui, initial }: ParcoursProps) {
  const [selection, setSelection] = useState(initial)
  const [etatDemande, envoyer, envoiEnCours] = useActionState<EtatDemande, FormData>(envoyerDemande, {})

  const { arrivee, depart, adultes, enfants } = selection
  const voyageurs = adultes + enfants
  const capaciteMax = Math.max(...hebergements.map((h) => h.capaciteMax))
  const hebergement = hebergements.find((h) => h.slug === selection.hebergement) ?? null

  // Ce qui est valide jusqu'ici décide de l'étape la plus avancée accessible
  // Dates venues de l'URL : elles peuvent traverser des nuits où tout l'hôtel est complet
  const nuitsHotelComplet = nuitsCompletes(hebergements.map((h) => h.id), periodes)
  const plageComplete = Boolean(arrivee && depart && nuitsDuSejour(arrivee, depart).some((n) => nuitsHotelComplet.has(n)))
  const erreurDates =
    arrivee && depart
      ? (verifierDates(arrivee, depart, aujourdhui, saisons) ??
        (plageComplete ? "L'hôtel est complet sur une partie de ces dates. Choisissez une autre période." : null))
      : null
  const datesOk = Boolean(arrivee && depart) && !erreurDates
  const voyageursOk = adultes >= 1 && voyageurs <= capaciteMax
  const disponible = (h: Hebergement) => datesOk && estLibre(h.id, arrivee!, depart!, periodes)
  const hebergementOk = hebergement !== null && disponible(hebergement) && voyageurs <= hebergement.capaciteMax
  const etapeMax = !datesOk ? 0 : !voyageursOk ? 1 : !hebergementOk ? 2 : 3

  const [navigation, setNavigation] = useState<{ etape: number; sens: Sens }>({ etape: etapeMax, sens: null })
  const etape = Math.min(navigation.etape, etapeMax)
  const allerA = (cible: number) => setNavigation({ etape: cible, sens: cible > etape ? "avant" : "arriere" })

  const devis = hebergement && datesOk ? calculerDevis(hebergement, arrivee!, depart!, saisons) : null
  const confirmee = Boolean(etatDemande.reference && hebergement && devis)
  const { formater } = useDevise()
  const prixSejour = devis ? `${formater(devis.total)} pour ${pluriel(devis.nuits, "nuit")}` : null

  // Ce que la barre d'action rappelle, ou ce qu'il reste à faire, à chaque étape
  const indications = [
    !arrivee ? "Choisissez votre arrivée" : !depart ? "Choisissez votre départ" : datesOk ? pluriel(nombreNuits(arrivee, depart), "nuit") : null,
    pluriel(voyageurs, "voyageur"),
    hebergementOk ? prixSejour : "Choisissez un hébergement",
    prixSejour,
  ]

  // Changement d'étape : le titre reçoit le focus et revient à l'écran (pas au premier affichage)
  const premierAffichage = useRef(true)
  useEffect(() => {
    if (premierAffichage.current) {
      premierAffichage.current = false
      return
    }
    const titre = document.getElementById("titre-etape")
    if (!titre) return
    titre.focus({ preventScroll: true })
    // Le titre doit être visible sous le header fixe : sinon on remonte jusqu'à lui
    const basHeader = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0
    const haut = titre.getBoundingClientRect().top
    if (haut < basHeader + 16) {
      const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      window.scrollTo({ top: window.scrollY + haut - basHeader - 32, behavior: reduit ? "instant" : "smooth" })
    }
  }, [etape, confirmee])

  // L'URL suit la sélection (lien partageable, retour après connexion)
  function modifier(changement: Partial<Selection>) {
    const suivante = { ...selection, ...changement }
    setSelection(suivante)
    window.history.replaceState(null, "", `?${versParametres(suivante)}`)
  }

  // Tout effacer et repartir des dates (proposé seulement quand il y a quelque chose à effacer)
  const aEffacer = Boolean(arrivee || selection.hebergement || adultes !== 2 || enfants)
  function reinitialiser() {
    modifier({ arrivee: null, depart: null, adultes: 2, enfants: 0, hebergement: null })
    setNavigation({ etape: 0, sens: etape > 0 ? "arriere" : null })
  }
  const effacer = aEffacer ? reinitialiser : undefined

  // Calendrier : disponibilités de l'hébergement choisi, sinon nuits où tout est complet
  const nuitsIndisponibles = hebergement ? nuitsCompletes([hebergement.id], periodes) : nuitsHotelComplet
  // Libre chaque nuit pris séparément, mais aucun hébergement libre sur toute la période
  const aucunLibre = datesOk && !hebergements.some(disponible)

  // Photo du panneau : celle de l'hébergement dès qu'il est choisi
  const photos = [...new Set([PHOTO_DATES, PHOTO_VOYAGEURS, PHOTO_HEBERGEMENTS, ...hebergements.map((h) => h.image)])]
  const photoActive =
    confirmee || etape >= 2
      ? (hebergement?.image ?? PHOTO_HEBERGEMENTS)
      : etape === 1
        ? PHOTO_VOYAGEURS
        : PHOTO_DATES

  return (
    // Même conteneur que le header (max-w-7xl, mêmes marges) : la photo s'aligne sur le logo, le formulaire sur les actions
    <div className="mx-auto max-w-7xl px-4 pt-4 pb-12 sm:px-6 lg:grid lg:grid-cols-[5fr_7fr] lg:gap-12 lg:pt-8 lg:pb-16 xl:gap-16">
      <PanneauPhoto images={photos} active={photoActive} className="h-72 sm:h-96">
        <RecitSejour selection={selection} hebergement={hebergementOk || confirmee ? hebergement : null} devis={hebergementOk || confirmee ? devis : null} />
      </PanneauPhoto>

      <div className="pt-8 lg:pt-0">
        <div className="max-w-2xl">
          {confirmee && hebergement ? (
            <Confirmation reference={etatDemande.reference!} />
          ) : (
            <>
              <h1 className="font-heading text-section text-balance text-text-dark">Réserver votre séjour</h1>
              <p className="mt-4 max-w-xl text-body text-text-dark">
                Choisissez vos dates et votre hébergement. Joëlle &amp; Stéphane confirment ensuite votre séjour
                personnellement.
              </p>

              <Progression etape={etape} etapeMax={etapeMax} onChoisir={allerA} />

              {/* Clé = étape : le contenu est recréé et glisse dans le sens de la navigation */}
              <div key={etape} className={classesGlisse(navigation.sens)}>
                {etape === 0 && (
                  <Etape titre="Vos dates">
                    <Calendrier
                      arrivee={arrivee}
                      depart={depart}
                      aujourdhui={aujourdhui}
                      nuitsIndisponibles={nuitsIndisponibles}
                      onChange={(a, d) => modifier({ arrivee: a, depart: d })}
                    />
                    {hebergement && (
                      <p className="mt-4 text-sm text-text-dark">
                        Disponibilités de {hebergement.nom} uniquement.{" "}
                        <button type="button" onClick={() => modifier({ hebergement: null })} className={boutonRetour}>
                          Voir tous les hébergements
                        </button>
                      </p>
                    )}
                    <MessageErreur message={erreurDates} />
                    <Actions reinitialiser={effacer} indication={indications[0]}>
                      <button type="button" disabled={!datesOk} onClick={() => allerA(1)} className={boutonPrincipal}>
                        Continuer
                      </button>
                    </Actions>
                  </Etape>
                )}

                {etape === 1 && (
                  <Etape titre="Voyageurs">
                    <div className="divide-y divide-primary-dark/15 border-y border-primary-dark/15">
                      <Compteur label="Adultes" valeur={adultes} min={1} max={capaciteMax - enfants} onChange={(n) => modifier({ adultes: n })} />
                      <Compteur
                        label="Enfants"
                        aide="Moins de 12 ans"
                        valeur={enfants}
                        min={0}
                        max={capaciteMax - adultes}
                        onChange={(n) => modifier({ enfants: n })}
                      />
                    </div>
                    <p className="mt-5 text-sm text-text-dark">
                      Nos hébergements accueillent jusqu&apos;à {capaciteMax} personnes. Pour un groupe, contactez-nous
                      directement.
                    </p>
                    <Actions reinitialiser={effacer} retour={() => allerA(0)} indication={indications[1]}>
                      <button type="button" disabled={!voyageursOk} onClick={() => allerA(2)} className={boutonPrincipal}>
                        Continuer
                      </button>
                    </Actions>
                  </Etape>
                )}

                {etape === 2 && (
                  <Etape titre="Votre hébergement">
                    {aucunLibre && (
                      <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-4 border-l-2 border-primary-accent bg-primary-accent/5 px-4 py-3 text-sm text-primary-accent">
                        Aucun hébergement n&apos;est libre sur toute cette période.
                        <button type="button" onClick={() => allerA(0)} className="font-medium underline underline-offset-4">
                          Modifier les dates
                        </button>
                      </div>
                    )}
                    <div role="radiogroup" aria-label="Hébergements" className="space-y-4">
                      {hebergements.map((h) => (
                        <CarteHebergement
                          key={h.id}
                          hebergement={h}
                          libre={disponible(h)}
                          assezGrand={voyageurs <= h.capaciteMax}
                          choisi={h.slug === selection.hebergement}
                          devis={disponible(h) ? calculerDevis(h, arrivee!, depart!, saisons) : null}
                          onChoisir={() => modifier({ hebergement: h.slug })}
                        />
                      ))}
                    </div>
                    <Actions reinitialiser={effacer} retour={() => allerA(1)} indication={indications[2]}>
                      <button type="button" disabled={!hebergementOk} onClick={() => allerA(3)} className={boutonPrincipal}>
                        Continuer
                      </button>
                    </Actions>
                  </Etape>
                )}

                {etape === 3 && hebergement && (
                  <Etape titre="Vos coordonnées">
                    {!client ? (
                      // Compte obligatoire pour finaliser : la sélection reste en place pendant la connexion
                      <>
                        <p className="mb-8 text-body text-text-dark">
                          Pour finaliser votre demande, connectez-vous ou créez votre compte. Vous y suivrez ensuite votre
                          réservation.
                        </p>
                        <BlocCompte />
                        <Actions reinitialiser={effacer} retour={() => allerA(2)} indication="Connectez-vous pour continuer" />
                      </>
                    ) : (
                      <form action={envoyer}>
                        <input type="hidden" name="hebergementId" value={hebergement.id} />
                        <input type="hidden" name="arrivee" value={arrivee ?? ""} />
                        <input type="hidden" name="depart" value={depart ?? ""} />
                        <input type="hidden" name="adultes" value={adultes} />
                        <input type="hidden" name="enfants" value={enfants} />
                        {/* Retour après « Changer de compte » : React interdit name/value sur un bouton à formAction */}
                        <input type="hidden" name="suite" value={`/reserver?${versParametres(selection)}`} />

                        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-primary-dark/15 pb-6">
                          <p className="text-text-dark">
                            <span className="block font-heading text-2xl">
                              {client.prenom} {client.nom}
                            </span>
                            <span className="text-sm">{client.email}</span>
                          </p>
                          <button type="submit" formAction={deconnexion} formNoValidate className={boutonRetour}>
                            Changer de compte
                          </button>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-1.5">
                            <label htmlFor="telephone" className="block text-sm font-medium text-text-dark">
                              Téléphone / WhatsApp
                            </label>
                            <input id="telephone" name="telephone" type="tel" autoComplete="tel" required defaultValue={client.telephone} className={classesChamp} />
                          </div>

                          <label className="flex cursor-pointer items-start gap-3 rounded-panel border border-primary-dark/15 bg-primary-light p-4 text-text-dark transition-colors has-[:checked]:border-primary-dark">
                            <input type="checkbox" name="navette" className="mt-1 h-4 w-4 accent-primary-dark" />
                            <span className="text-sm">
                              <span className="block font-medium">Navette aéroport</span>
                              Sur demande, avec supplément. Les hôtes vous indiqueront le tarif.
                            </span>
                          </label>

                          <div className="space-y-1.5">
                            <label htmlFor="message" className="block text-sm font-medium text-text-dark">
                              Un message pour Joëlle &amp; Stéphane <span className="font-normal">(facultatif)</span>
                            </label>
                            <textarea id="message" name="message" rows={4} maxLength={1000} className={classesChamp} aria-describedby="message-aide" />
                            <p id="message-aide" className="text-sm text-text-dark">
                              Heure d&apos;arrivée, occasion particulière, régime alimentaire…
                            </p>
                          </div>
                        </div>

                        <MessageErreur message={etatDemande.erreur} />

                        <p className="mt-6 text-sm text-text-dark">
                          Aucun paiement maintenant. Les hôtes confirment votre séjour, puis vous indiquent les modalités
                          d&apos;acompte.
                        </p>
                        <Actions reinitialiser={effacer} retour={() => allerA(2)} indication={indications[3]}>
                          <button type="submit" disabled={envoiEnCours} className={boutonPrincipal}>
                            {envoiEnCours ? "Envoi en cours…" : "Envoyer ma demande"}
                          </button>
                        </Actions>
                      </form>
                    )}
                  </Etape>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Le séjour raconté sur la photo : chaque valeur sort du flou quand elle change
function RecitSejour({ selection, hebergement, devis }: { selection: Selection; hebergement: Hebergement | null; devis: Devis | null }) {
  const { formater } = useDevise()
  const { arrivee, depart, adultes, enfants } = selection
  const plage = arrivee && depart ? formaterPlage(arrivee, depart) : null
  const voyageurs = `${pluriel(adultes, "adulte")}${enfants ? `, ${pluriel(enfants, "enfant")}` : ""}`
  const details = [devis && pluriel(devis.nuits, "nuit"), voyageurs].filter(Boolean).join(", ")
  const valeur = "block animate-valeur motion-reduce:animate-none"

  return (
    <section aria-label="Votre séjour" aria-live="polite" className="absolute inset-x-0 bottom-0 p-6 text-primary-light sm:p-8 lg:p-12">
      <p key={plage ?? "vide"} className={`font-heading text-4xl leading-none text-balance sm:text-5xl ${valeur}`}>
        {plage ?? "Quand venez-vous ?"}
      </p>
      <p key={details} className={`mt-4 text-base text-primary-light/90 ${valeur}`}>
        {details}
      </p>

      {hebergement && devis && (
        <div className="mt-6 flex items-end justify-between gap-6 border-t border-primary-light/25 pt-5">
          <p key={hebergement.id} className={`font-heading text-2xl text-sand sm:text-3xl ${valeur}`}>
            {hebergement.nom}
          </p>
          <p className="text-right">
            <span key={devis.total} className={`text-2xl font-light tabular-nums sm:text-3xl ${valeur}`}>
              {formater(devis.total)}
            </span>
            <span className="block text-xs text-primary-light/85">prix indicatif</span>
            <MentionConversion montant={devis.total} className="block text-xs text-primary-light/85" />
          </p>
        </div>
      )}
    </section>
  )
}

// Barre d'étapes : segment rempli + numéro (coche une fois l'étape faite) ; les étapes accessibles restent cliquables
function Progression({ etape, etapeMax, onChoisir }: { etape: number; etapeMax: number; onChoisir: (i: number) => void }) {
  return (
    <nav aria-label="Étapes de la réservation" className="mt-7 mb-8">
      <ol className="grid grid-cols-4 gap-2 sm:gap-4">
        {ETAPES.map((label, i) => {
          const courante = i === etape
          const faite = i < etape
          const accessible = i <= etapeMax && !courante
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => onChoisir(i)}
                disabled={!accessible}
                aria-current={courante ? "step" : undefined}
                className="group block w-full text-left text-text-dark disabled:cursor-default"
              >
                <span className="block h-1 overflow-hidden rounded-full bg-primary-dark/15">
                  <span
                    className="block h-full origin-left rounded-full bg-primary-dark transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                    style={{ transform: `scaleX(${i <= etape ? 1 : 0})` }}
                  />
                </span>
                <span className="mt-3 flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums transition-colors duration-500 ${
                      courante || faite ? "bg-primary-dark text-text-light" : "border border-primary-dark/40 bg-primary-light"
                    }`}
                  >
                    {faite ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  <span
                    className={`truncate text-sm ${courante ? "font-semibold" : "font-normal"} ${
                      courante ? "" : "sr-only sm:not-sr-only"
                    } ${accessible ? "underline-offset-4 group-hover:underline" : ""}`}
                  >
                    <span className="sr-only">Étape {i + 1} : </span>
                    {label}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function Etape({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section aria-labelledby="titre-etape">
      <h2 id="titre-etape" tabIndex={-1} className="mb-6 font-heading text-3xl text-text-dark outline-none sm:text-4xl">
        {titre}
      </h2>
      {children}
    </section>
  )
}

// Barre d'action flottante : reste visible en bas de l'écran tant que l'étape défile, avec un rappel du séjour
interface ActionsProps {
  retour?: () => void
  reinitialiser?: () => void
  indication?: string | null
  children?: ReactNode
}

function Actions({ retour, reinitialiser, indication, children }: ActionsProps) {
  return (
    <div className="sticky bottom-3 z-20 mt-8 sm:bottom-5">
      <div className="flex items-center gap-3 rounded-panel border border-primary-dark/15 bg-primary-light/95 p-2.5 pl-4 backdrop-blur sm:gap-5 sm:pl-5">
        {retour && (
          <button type="button" onClick={retour} className={`${boutonRetour} shrink-0`}>
            Retour
          </button>
        )}
        {reinitialiser && (
          <button
            type="button"
            onClick={reinitialiser}
            title="Effacer les dates, les voyageurs et l'hébergement"
            className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1.5 text-sm text-text-dark transition-colors hover:bg-primary-dark/5"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {/* Avec « Retour » à côté, l'icône seule suffit sur mobile */}
            <span className={retour ? "sr-only sm:not-sr-only" : ""}>Réinitialiser</span>
          </button>
        )}
        {indication && (
          <p key={indication} aria-live="polite" className="min-w-0 flex-1 truncate text-right text-sm text-text-dark animate-valeur motion-reduce:animate-none sm:text-base">
            {indication}
          </p>
        )}
        <div className={`shrink-0 ${indication ? "" : "ml-auto"}`}>{children}</div>
      </div>
    </div>
  )
}

function MessageErreur({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-6 border-l-2 border-primary-accent bg-primary-accent/5 px-4 py-3 text-sm text-primary-accent animate-valeur motion-reduce:animate-none">
      {message}
    </p>
  )
}

interface CompteurProps {
  label: string
  aide?: string
  valeur: number
  min: number
  max: number
  onChange: (valeur: number) => void
}

function Compteur({ label, aide, valeur, min, max, onChange }: CompteurProps) {
  const rond =
    "grid h-11 w-11 place-items-center rounded-full border border-primary-dark/30 text-text-dark transition-colors duration-300 hover:border-primary-dark hover:bg-primary-dark/5 disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-primary-dark/30 disabled:hover:bg-transparent"
  return (
    <div className="flex items-center justify-between py-6">
      <div>
        <p className="font-heading text-2xl text-text-dark">{label}</p>
        {aide && <p className="text-sm text-text-dark">{aide}</p>}
      </div>
      <div className="flex items-center gap-5">
        <button type="button" onClick={() => onChange(valeur - 1)} disabled={valeur <= min} aria-label={`Retirer : ${label.toLowerCase()}`} className={rond}>
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <span aria-live="polite" className="w-8 text-center text-3xl font-light tabular-nums text-text-dark">
          <span className="sr-only">{label} : </span>
          <span key={valeur} className="inline-block animate-valeur motion-reduce:animate-none">
            {valeur}
          </span>
        </span>
        <button type="button" onClick={() => onChange(valeur + 1)} disabled={valeur >= max} aria-label={`Ajouter : ${label.toLowerCase()}`} className={rond}>
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

interface CarteHebergementProps {
  hebergement: Hebergement
  libre: boolean
  assezGrand: boolean
  choisi: boolean
  devis: Devis | null
  onChoisir: () => void
}

function CarteHebergement({ hebergement: h, libre, assezGrand, choisi: choisiDemande, devis, onChoisir }: CarteHebergementProps) {
  const { formater } = useDevise()
  const choisissable = libre && assezGrand
  const choisi = choisiDemande && choisissable
  const indisponible = !libre ? "Complet à ces dates" : !assezGrand ? `${h.capaciteMax} personnes au maximum` : null

  return (
    <button
      type="button"
      role="radio"
      aria-checked={choisi}
      disabled={!choisissable}
      onClick={onChoisir}
      className={`relative block w-full overflow-hidden rounded-panel border bg-primary-light text-left transition-[border-color,box-shadow] duration-300 sm:pl-52 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-dark ${
        choisi
          ? "border-primary-dark ring-1 ring-primary-dark"
          : "border-primary-dark/25 enabled:hover:border-primary-dark"
      } disabled:cursor-not-allowed`}
    >
      {/* Photo sur toute la hauteur de la carte (position absolue : ne dépend pas de l'étirement de la grille) */}
      <span className={`relative block aspect-[16/10] sm:absolute sm:inset-y-0 sm:left-0 sm:aspect-auto sm:w-52 ${choisissable ? "" : "opacity-50 grayscale"}`}>
        <Image src={h.image} alt="" fill sizes="(min-width: 640px) 13rem, 100vw" className="object-cover" />
        {choisi && (
          <span aria-hidden="true" className="absolute top-3 left-3 grid h-8 w-8 place-items-center rounded-full bg-primary-dark text-text-light animate-pastille motion-reduce:animate-none">
            <Check className="h-4 w-4" />
          </span>
        )}
      </span>

      <span className={`flex flex-col gap-4 p-5 sm:min-h-48 sm:p-6 ${choisissable ? "" : "opacity-70"}`}>
        <span className="flex items-start justify-between gap-4">
          <span className="font-heading text-2xl leading-tight text-text-dark">{h.nom}</span>
          {indisponible ? (
            <span className="shrink-0 pt-1 text-right text-sm font-medium text-primary-accent">{indisponible}</span>
          ) : (
            devis && (
              <span className="shrink-0 text-right text-text-dark">
                <span className="block text-xl font-light tabular-nums">{formater(devis.total)}</span>
                <span className="block text-xs">pour {pluriel(devis.nuits, "nuit")}</span>
              </span>
            )
          )}
        </span>
        <span className="text-sm text-text-dark">{h.description}</span>
        <span className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-dark">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" aria-hidden="true" /> Jusqu&apos;à {pluriel(h.capaciteMax, "personne")}
          </span>
          <span className="flex items-center gap-1.5">
            <BedDouble className="h-4 w-4" aria-hidden="true" /> {h.literie}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" aria-hidden="true" /> {h.vue}
          </span>
        </span>
        {choisissable && (
          // Indique clairement que la carte se choisit d'un clic, et l'état choisi
          <span
            aria-hidden="true"
            className={`mt-1 inline-flex items-center gap-2 self-start rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-300 ${
              choisi ? "border-primary-dark bg-primary-dark text-text-light" : "border-primary-dark/40 text-text-dark"
            }`}
          >
            {choisi && <Check className="h-4 w-4" strokeWidth={2.5} />}
            {choisi ? "Sélectionné" : "Choisir"}
          </span>
        )}
      </span>
    </button>
  )
}

// Fin du parcours : la coche se trace, puis ce qui va se passer ensuite
function Confirmation({ reference }: { reference: string }) {
  const suite = [
    "Joëlle & Stéphane confirment votre séjour, sous 48 h.",
    "Vous versez l'acompte qu'ils vous indiquent.",
    "Une semaine avant l'arrivée, vous recevez les informations pratiques.",
  ]
  return (
    <div>
      <svg viewBox="0 0 56 56" className="h-14 w-14 text-primary-dark" aria-hidden="true">
        <circle cx="28" cy="28" r="26" fill="none" stroke="currentColor" strokeWidth="1.5" pathLength={1} strokeDasharray={1} className="animate-trace motion-reduce:animate-none" />
        <path d="M17 29.5 24.5 37 39 21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} className="animate-trace [animation-delay:700ms] motion-reduce:animate-none" />
      </svg>

      <div className="animate-fade-up [animation-delay:400ms] motion-reduce:animate-none">
        <h1 id="titre-etape" tabIndex={-1} className="mt-8 font-heading text-section text-balance text-text-dark outline-none">
          Demande envoyée
        </h1>
        <p className="mt-6 text-sm text-text-dark">Référence de votre demande</p>
        <p className="font-heading text-3xl tracking-wide text-text-dark">{reference}</p>
        <p className="mt-6 max-w-xl text-body text-text-dark">
          Vos dates sont bloquées pendant 48 h, le temps que les hôtes reviennent vers vous.
        </p>

        <h2 className="mt-12 font-heading text-2xl text-text-dark">Et ensuite</h2>
        <ol className="mt-5 space-y-4 border-l border-primary-dark/20 pl-6">
          {suite.map((texte, i) => (
            <li key={texte} className="relative text-text-dark">
              <span aria-hidden="true" className="absolute top-0.5 -left-[2.2rem] grid h-5 w-5 place-items-center rounded-full bg-background text-xs font-medium ring-1 ring-primary-dark">
                {i + 1}
              </span>
              {texte}
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-col gap-6 sm:flex-row sm:items-center">
          <ButtonLink href="/compte" variant="outline">
            Suivre ma demande
          </ButtonLink>
          <ButtonLink href="/" variant="link">
            Retour à l&apos;accueil
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}
