import { ajouterJours, formaterDate, versDate } from "@partage/dates"
import type { DateISO } from "@partage/types"

// Mois en calendrier (planning et choix des dates) : semaines complètes du lundi au dimanche, les jours des mois
// voisins compris pour remplir la première et la dernière semaine
export const INITIALES_JOURS = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."]

export const premierDuMois = (jour: DateISO): DateISO => `${jour.slice(0, 7)}-01`

// Premier du mois décalé de `n` mois
export function moisVoisin(jour: DateISO, n: number): DateISO {
  const [annee, mois] = jour.split("-").map(Number)
  const date = new Date(Date.UTC(annee, mois - 1 + n, 1))
  return date.toISOString().slice(0, 10)
}

export function joursDuMois(jour: DateISO): DateISO[] {
  const premier = premierDuMois(jour)
  // Lundi de la première semaine (getUTCDay : 0 = dimanche)
  const debut = ajouterJours(premier, -((versDate(premier).getUTCDay() + 6) % 7))
  const dernier = ajouterJours(moisVoisin(premier, 1), -1)
  const fin = ajouterJours(dernier, (7 - versDate(dernier).getUTCDay()) % 7)
  const jours: DateISO[] = []
  for (let j = debut; j <= fin; j = ajouterJours(j, 1)) jours.push(j)
  return jours
}

// « octobre 2026 »
export const nomDuMois = (jour: DateISO) => formaterDate(jour, { weekday: undefined, day: undefined, month: "long" })
