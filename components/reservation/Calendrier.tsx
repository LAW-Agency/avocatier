"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { ajouterJours, formaterDate, versDate } from "@/lib/reservation/dates"
import { NUITS_MAX } from "@/lib/reservation/regles"
import type { DateISO } from "@/lib/reservation/types"

interface CalendrierProps {
  arrivee: DateISO | null
  depart: DateISO | null
  aujourdhui: DateISO
  nuitsIndisponibles: Set<DateISO>
  onChange: (arrivee: DateISO | null, depart: DateISO | null) => void
}

const JOURS = ["lu", "ma", "me", "je", "ve", "sa", "di"]
const MOIS_MAX = 18 // ouverture des réservations


const premierDuMois = (iso: DateISO) => `${iso.slice(0, 7)}-01`

function decalerMois(premier: DateISO, mois: number): DateISO {
  const d = versDate(premier)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + mois, 1)).toISOString().slice(0, 10)
}

// Cases du mois, précédées de cases vides pour commencer un lundi
function joursDuMois(premier: DateISO): (DateISO | null)[] {
  const d = versDate(premier)
  const nbJours = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  const vides = (d.getUTCDay() + 6) % 7
  return [
    ...Array<null>(vides).fill(null),
    ...Array.from({ length: nbJours }, (_, i) => ajouterJours(premier, i)),
  ]
}

// Sélecteur de séjour : un clic pour l'arrivée, un second pour le départ.
// Une nuit complète ne peut pas commencer un séjour, mais son jour peut servir de départ.
export default function Calendrier({ arrivee, depart, aujourdhui, nuitsIndisponibles, onChange }: CalendrierProps) {
  const moisMin = premierDuMois(aujourdhui)
  const moisMax = decalerMois(moisMin, MOIS_MAX - 2)
  // sens : direction du dernier changement de mois, pour faire glisser la grille du bon côté
  const [vue, setVue] = useState<{ mois: DateISO; sens: "avant" | "arriere" | null }>(() => ({
    mois: premierDuMois(arrivee ?? aujourdhui),
    sens: null,
  }))
  const [survol, setSurvol] = useState<DateISO | null>(null)
  const { mois } = vue

  const choixDepart = arrivee !== null && depart === null

  // Dernier départ possible : la première nuit complète après l'arrivée (ou la durée maximale)
  let limiteDepart: DateISO | null = null
  if (choixDepart) {
    limiteDepart = ajouterJours(arrivee, NUITS_MAX)
    for (let nuit = ajouterJours(arrivee, 1); nuit < limiteDepart; nuit = ajouterJours(nuit, 1)) {
      if (nuitsIndisponibles.has(nuit)) {
        limiteDepart = nuit
        break
      }
    }
  }

  // Fin du ruban : le départ choisi, ou le jour survolé pendant le choix du départ
  const finPlage =
    depart ?? (choixDepart && survol && survol > arrivee && limiteDepart && survol <= limiteDepart ? survol : null)

  const choisir = (jour: DateISO) => {
    if (choixDepart && jour > arrivee) onChange(arrivee, jour)
    else onChange(jour, null)
  }

  function etatDuJour(jour: DateISO) {
    const complet = nuitsIndisponibles.has(jour)
    let desactive = jour < aujourdhui
    if (!desactive) {
      if (choixDepart && jour > arrivee) desactive = limiteDepart !== null && jour > limiteDepart
      else desactive = complet
    }
    return {
      complet,
      desactive,
      debut: jour === arrivee,
      fin: jour === depart,
      dansPlage: arrivee !== null && finPlage !== null && jour > arrivee && jour < finPlage,
      finSurvol: !depart && jour === finPlage,
    }
  }

  // Ruban du séjour derrière les pastilles : demi-case côté intérieur aux extrémités,
  // bouts arrondis en début et fin de semaine (ou de mois) pour ne jamais finir en angle droit
  function classesRuban(e: ReturnType<typeof etatDuJour>, jour: DateISO, colonne: number, dernierJour: DateISO): string | null {
    const finDuRuban = e.fin || e.finSurvol
    if (!e.dansPlage && !(e.debut && finPlage) && !finDuRuban) return null
    const debutLigne = colonne === 0 || jour.endsWith("-01")
    const finLigne = colonne === 6 || jour === dernierJour
    return [
      e.debut ? "left-1/2 right-0" : finDuRuban ? "left-0 right-1/2" : "inset-x-0",
      !e.debut && debutLigne ? "rounded-l-full" : "",
      !finDuRuban && finLigne ? "rounded-r-full" : "",
    ].join(" ")
  }

  // Fonction de rendu (pas un composant déclaré pendant le rendu)
  function rendreMois(premier: DateISO, className = "") {
    const titre = formaterDate(premier, { weekday: undefined, day: undefined, month: "long", year: "numeric" })
    const jours = joursDuMois(premier)
    const dernierJour = jours[jours.length - 1]!
    return (
      <div key={premier} className={className}>
        <p className="mb-5 text-center font-heading text-xl text-text-dark capitalize">{titre}</p>
        <div className="grid grid-cols-7 gap-y-1.5">
          {/* Les jours de semaine sont aussi dans le libellé de chaque date */}
          {JOURS.map((j) => (
            <span key={j} aria-hidden="true" className="pb-2 text-center text-xs font-medium text-text-dark">
              {j}
            </span>
          ))}
          {jours.map((jour, i) => {
            if (!jour) return <span key={`vide-${i}`} aria-hidden="true" />
            const e = etatDuJour(jour)
            const extremite = e.debut || e.fin
            const ruban = classesRuban(e, jour, i % 7, dernierJour)
            return (
              <div key={jour} className="relative flex h-11 items-center justify-center">
                {ruban && <span aria-hidden="true" className={`absolute inset-y-0.5 bg-primary-dark/10 ${ruban}`} />}
                <button
                  type="button"
                  disabled={e.desactive}
                  aria-pressed={extremite}
                  aria-label={`${formaterDate(jour, { weekday: "long", month: "long" })}${e.complet ? ", complet" : ""}${e.debut ? ", arrivée" : ""}${e.fin ? ", départ" : ""}`}
                  onClick={() => choisir(jour)}
                  onMouseEnter={() => setSurvol(jour)}
                  onFocus={() => setSurvol(jour)}
                  className={`relative grid h-10 w-10 place-items-center rounded-full text-sm tabular-nums transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark ${
                    extremite
                      ? "bg-primary-dark font-medium text-text-light animate-pastille motion-reduce:animate-none"
                      : e.finSurvol
                        ? "bg-primary-light ring-1 ring-primary-dark text-text-dark"
                        : "text-text-dark enabled:hover:bg-primary-dark/10"
                  } ${e.desactive ? "cursor-not-allowed opacity-30" : ""} ${
                    e.complet && !extremite ? "line-through decoration-primary-accent/70" : ""
                  } ${jour === aujourdhui && !extremite ? "font-semibold" : ""}`}
                >
                  {Number(jour.slice(8))}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const changerMois = (sens: "avant" | "arriere") =>
    setVue({ mois: decalerMois(mois, sens === "avant" ? 1 : -1), sens })

  const navigation =
    "grid h-10 w-10 place-items-center rounded-full border border-primary-dark/25 text-text-dark transition-colors hover:border-primary-dark hover:bg-primary-dark/5 disabled:opacity-25 disabled:hover:border-primary-dark/25 disabled:hover:bg-transparent"
  const glisse =
    vue.sens === "avant"
      ? "animate-glisse-avant motion-reduce:animate-none"
      : vue.sens === "arriere"
        ? "animate-glisse-arriere motion-reduce:animate-none"
        : ""

  return (
    <div onMouseLeave={() => setSurvol(null)}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 z-10 flex justify-between">
          <button type="button" onClick={() => changerMois("arriere")} disabled={mois <= moisMin} aria-label="Mois précédent" className={navigation}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => changerMois("avant")} disabled={mois >= moisMax} aria-label="Mois suivant" className={navigation}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {/* Clé = mois affiché : la grille est recréée et glisse depuis le côté de la navigation */}
        <div key={mois} className={`grid gap-10 pt-2 md:grid-cols-2 ${glisse}`}>
          {rendreMois(mois)}
          {/* Deuxième mois : écrans moyens et plus */}
          {rendreMois(decalerMois(mois, 1), "hidden md:block")}
        </div>
      </div>

      <p aria-live="polite" className="mt-5 text-sm text-text-dark">
        {choixDepart
          ? `Arrivée le ${formaterDate(arrivee, { weekday: "long", month: "long" })}. Choisissez maintenant votre date de départ.`
          : arrivee && depart
            ? "Cliquez sur une autre date pour recommencer."
            : "Choisissez votre date d'arrivée."}
      </p>

      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-dark">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-4 w-4 rounded-full bg-primary-dark" /> Arrivée et départ
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-4 w-7 rounded-full bg-primary-dark/10" /> Votre séjour
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="text-xs line-through decoration-primary-accent/70 opacity-40">12</span> Complet
        </li>
      </ul>
    </div>
  )
}
