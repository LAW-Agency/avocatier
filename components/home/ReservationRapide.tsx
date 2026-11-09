"use client"

import Form from "next/form"
import { ArrowRight, ChevronDown } from "lucide-react"
import { useState, useSyncExternalStore, type ReactNode } from "react"
import { ajouterJours, aujourdhuiISO } from "@/lib/reservation/dates"

const rien = () => () => {}

// « 10 déc. 2026 » : jour civil, sans fuseau (la date ISO n'a pas d'heure)
const FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
const lisible = (iso: string) => FORMAT.format(new Date(`${iso}T00:00:00Z`))

// Barre de réservation du hero, version minimaliste : une seule pilule blanche, champs séparés par des filets,
// pas de cadres de saisie. Envoie à /reserver les paramètres que lit `lireSelection` (lib/reservation/selection.ts) ;
// sans JS, le formulaire part quand même (GET).
export default function ReservationRapide() {
  // Jour de Sainte-Marie lu dans le navigateur seulement : la page reste statique
  const aujourdhui = useSyncExternalStore(rien, aujourdhuiISO, () => "")
  const [arrivee, setArrivee] = useState("")
  const [depart, setDepart] = useState("")
  const [adultes, setAdultes] = useState("2")

  return (
    <Form
      action="/reserver"
      aria-label="Vérifier les disponibilités"
      className="grid w-full max-w-3xl grid-cols-2 md:max-w-5xl overflow-hidden rounded-panel bg-primary-light text-left shadow-[0_18px_50px_rgb(13_43_33/0.35)] md:flex md:items-stretch md:rounded-full md:p-1"
    >
      <ChampDate
        id="resa-arrivee"
        name="arrivee"
        label="Arrivée"
        valeur={arrivee}
        min={aujourdhui}
        onChange={(v) => {
          setArrivee(v)
          // Départ devenu impossible : on le vide plutôt que d'envoyer un séjour à l'envers
          if (depart && v && depart <= v) setDepart("")
        }}
        className="border-r border-b border-ink/10 md:border-b-0 md:pl-5"
      />
      <ChampDate
        id="resa-depart"
        name="depart"
        label="Départ"
        valeur={depart}
        min={arrivee ? ajouterJours(arrivee, 1) : aujourdhui}
        onChange={setDepart}
        className="border-b border-ink/10 md:border-r md:border-b-0"
      />

      <Champ htmlFor="resa-adultes" label="Voyageurs" className="col-span-2 md:col-span-1">
        <span className="pointer-events-none flex items-center justify-between gap-2 text-base text-ink md:text-[0.95rem] md:leading-snug">
          {adultes} adulte{adultes === "1" ? "" : "s"}
          <ChevronDown className="h-4 w-4 text-ink/50" aria-hidden="true" />
        </span>
        {/* Liste native posée par-dessus, invisible : clavier, lecteurs d'écran et mobiles la gèrent */}
        <select
          id="resa-adultes"
          name="adultes"
          value={adultes}
          onChange={(e) => setAdultes(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>{n} adulte{n > 1 ? "s" : ""}</option>
          ))}
        </select>
      </Champ>

      <div className="col-span-2 p-2 pt-0 md:p-0">
        <button
          type="submit"
          className="group flex h-full min-h-12 w-full cursor-pointer md:min-h-11 items-center justify-center gap-2 rounded-[calc(var(--radius-panel)-0.25rem)] bg-primary-dark px-6 text-sm font-medium tracking-wide text-text-light transition-colors duration-300 hover:bg-primary-dark/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark md:rounded-full md:px-7"
        >
          Voir les disponibilités
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </button>
      </div>
    </Form>
  )
}

// Case d'un champ : petite étiquette au-dessus, valeur en dessous ; le focus se voit sur toute la case
function Champ({ htmlFor, label, className = "", children }: { htmlFor: string; label: string; className?: string; children: ReactNode }) {
  return (
    <div
      className={`relative flex min-h-16 flex-col justify-center gap-0.5 px-4 py-2.5 md:min-h-11 md:gap-0 md:py-1 transition-colors duration-200 hover:bg-ink/[0.04] focus-within:bg-ink/[0.04] focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary-dark md:flex-1 md:rounded-full md:px-6 ${className}`}
    >
      <label htmlFor={htmlFor} className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink/70 md:text-[0.65rem] md:leading-tight">
        {label}
      </label>
      {children}
    </div>
  )
}

// Date : la valeur s'affiche en clair (« Ajouter une date » tant qu'elle est vide) ; le champ natif, invisible,
// couvre la case et ouvre son calendrier au clic
function ChampDate({
  id, name, label, valeur, min, onChange, className,
}: {
  id: string; name: string; label: string; valeur: string; min: string
  onChange: (v: string) => void; className?: string
}) {
  return (
    <Champ htmlFor={id} label={label} className={className}>
      <span className={`pointer-events-none text-base md:text-[0.95rem] md:leading-snug ${valeur ? "text-ink" : "text-ink/70"}`} aria-hidden="true">
        {valeur ? lisible(valeur) : "Ajouter une date"}
      </span>
      <input
        id={id}
        name={name}
        type="date"
        min={min || undefined}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => {
          try { e.currentTarget.showPicker() } catch { /* navigateur sans showPicker : son propre comportement */ }
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </Champ>
  )
}
