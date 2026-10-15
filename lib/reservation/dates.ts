import type { DateISO } from "./types"

// Dates « AAAA-MM-JJ » manipulées en UTC : pas de décalage de fuseau entre serveur et navigateur.
// Le format ISO se compare directement en chaîne (« 2026-12-20 » < « 2026-12-27 »).

const MS_PAR_JOUR = 86_400_000
const FORMAT_ISO = /^\d{4}-\d{2}-\d{2}$/

export function estDateISO(valeur: unknown): valeur is DateISO {
  if (typeof valeur !== "string" || !FORMAT_ISO.test(valeur)) return false
  return versISO(versDate(valeur)) === valeur // refuse les dates impossibles (31 février…)
}

export function versDate(iso: DateISO): Date {
  return new Date(`${iso}T00:00:00Z`)
}

export function versISO(date: Date): DateISO {
  return date.toISOString().slice(0, 10)
}

export function ajouterJours(iso: DateISO, jours: number): DateISO {
  return versISO(new Date(versDate(iso).getTime() + jours * MS_PAR_JOUR))
}

export function nombreNuits(arrivee: DateISO, depart: DateISO): number {
  return Math.round((versDate(depart).getTime() - versDate(arrivee).getTime()) / MS_PAR_JOUR)
}

// Une nuit = la date du soir : un séjour occupe [arrivée, départ[
export function nuitsDuSejour(arrivee: DateISO, depart: DateISO): DateISO[] {
  const nuits: DateISO[] = []
  for (let nuit = arrivee; nuit < depart; nuit = ajouterJours(nuit, 1)) nuits.push(nuit)
  return nuits
}

// Deux séjours se chevauchent si chacun commence avant la fin de l'autre
export function chevauche(debutA: DateISO, finA: DateISO, debutB: DateISO, finB: DateISO): boolean {
  return debutA < finB && debutB < finA
}

// Date du jour à Sainte-Marie (UTC+3), quel que soit le fuseau du serveur
export function aujourdhuiISO(): DateISO {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Indian/Antananarivo" }).format(new Date())
}

export function formaterDate(iso: DateISO, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
    ...options,
  }).format(versDate(iso))
}

export function formaterPeriode(arrivee: DateISO, depart: DateISO): string {
  const court: Intl.DateTimeFormatOptions = { weekday: undefined, year: undefined }
  return `du ${formaterDate(arrivee, court)} au ${formaterDate(depart, { weekday: undefined })}`
}

// Période compacte : « 1 – 4 novembre 2026 », « 28 oct. – 2 nov. 2026 », « 30 déc. 2026 – 3 janv. 2027 »
export function formaterPlage(arrivee: DateISO, depart: DateISO): string {
  const memeAnnee = arrivee.slice(0, 4) === depart.slice(0, 4)
  const memeMois = memeAnnee && arrivee.slice(5, 7) === depart.slice(5, 7)
  const sans = { weekday: undefined } as const
  if (memeMois) return `${Number(arrivee.slice(8))} – ${formaterDate(depart, { ...sans, month: "long" })}`
  if (memeAnnee) return `${formaterDate(arrivee, { ...sans, year: undefined })} – ${formaterDate(depart, sans)}`
  return `${formaterDate(arrivee, sans)} – ${formaterDate(depart, sans)}`
}

export function pluriel(nombre: number, singulier: string, plurielForme = `${singulier}s`): string {
  return `${nombre} ${nombre > 1 ? plurielForme : singulier}`
}

export function formaterPrix(montant: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(montant)
}

// Date-heure d'un événement (demande, confirmation…), à l'heure de Sainte-Marie : « 15 oct., 09:25 »
export function formaterHeure(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Indian/Antananarivo",
  }).format(new Date(iso))
}

// Temps restant avant une échéance (fin d'option) : « 7 h », « 1 j 18 h », ou null si dépassée
export function tempsRestant(iso: string): string | null {
  const heures = Math.floor((new Date(iso).getTime() - Date.now()) / 3_600_000)
  if (heures < 0) return null
  if (heures < 24) return `${heures} h`
  return `${Math.floor(heures / 24)} j ${heures % 24} h`
}
