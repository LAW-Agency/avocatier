import { ajouterJours, nombreNuits } from "@partage/dates"
import type { DateISO, Paiement, Reservation } from "@partage/types"
import type { Donnees } from "./donnees"

// Calculs purs des écrans Revenus et Statistiques, à partir des données déjà chargées.
// Période [debut, fin[ : nuits du debut inclus à fin exclu, comme les séjours.
// Chiffre d'affaires d'un séjour réparti nuit par nuit : un séjour à cheval sur deux mois compte pour moitié
// dans chacun s'il a autant de nuits dans l'un et l'autre.

export type Periode = { debut: DateISO; fin: DateISO }

const confirmees = (reservations: Reservation[]) => reservations.filter((r) => r.statut === "confirmee")

// Nuits d'un séjour comprises dans la période
function nuitsDans(r: Pick<Reservation, "arrivee" | "depart">, { debut, fin }: Periode): number {
  const de = r.arrivee > debut ? r.arrivee : debut
  const a = r.depart < fin ? r.depart : fin
  return Math.max(0, nombreNuits(de, a))
}

export type Indicateurs = {
  nuitsVendues: number
  nuitsDisponibles: number
  occupation: number // 0 à 1
  chiffreAffaires: number // euros, réparti par nuit
  prixMoyen: number // ADR : chiffre d'affaires / nuits vendues
  revPar: number // chiffre d'affaires / nuits disponibles
  encaisse: number // encaissements datés dans la période
  sejours: number // séjours confirmés commençant dans la période
  dureeMoyenne: number // nuits par séjour
  demandes: number // demandes et réservations créées dans la période
  annulation: number // part des demandes créées dans la période et annulées, refusées ou expirées (0 à 1)
  delaiMoyen: number // jours entre la réservation et l'arrivée
}

export function indicateurs(d: Pick<Donnees, "reservations" | "hebergements" | "paiements">, periode: Periode): Indicateurs {
  const ok = confirmees(d.reservations)
  let nuitsVendues = 0
  let chiffreAffaires = 0
  for (const r of ok) {
    const nuits = nuitsDans(r, periode)
    if (!nuits) continue
    nuitsVendues += nuits
    chiffreAffaires += (r.montantTotal * nuits) / nombreNuits(r.arrivee, r.depart)
  }
  const nuitsDisponibles = d.hebergements.length * nombreNuits(periode.debut, periode.fin)
  const commencent = ok.filter((r) => r.arrivee >= periode.debut && r.arrivee < periode.fin)
  const creees = d.reservations.filter((r) => r.creeLe.slice(0, 10) >= periode.debut && r.creeLe.slice(0, 10) < periode.fin)
  const perdues = creees.filter((r) => r.statut === "annulee" || r.statut === "refusee" || r.statut === "expiree")

  return {
    nuitsVendues,
    nuitsDisponibles,
    occupation: nuitsDisponibles ? nuitsVendues / nuitsDisponibles : 0,
    chiffreAffaires: Math.round(chiffreAffaires),
    prixMoyen: nuitsVendues ? Math.round(chiffreAffaires / nuitsVendues) : 0,
    revPar: nuitsDisponibles ? Math.round(chiffreAffaires / nuitsDisponibles) : 0,
    encaisse: encaissementsDans(d.paiements, periode).reduce((t, p) => t + p.montant, 0),
    sejours: commencent.length,
    dureeMoyenne: commencent.length ? commencent.reduce((t, r) => t + nombreNuits(r.arrivee, r.depart), 0) / commencent.length : 0,
    demandes: creees.length,
    annulation: creees.length ? perdues.length / creees.length : 0,
    delaiMoyen: commencent.length ? commencent.reduce((t, r) => t + Math.max(0, nombreNuits(r.creeLe.slice(0, 10), r.arrivee)), 0) / commencent.length : 0,
  }
}

export function encaissementsDans(paiements: Paiement[], { debut, fin }: Periode): Paiement[] {
  return paiements.filter((p) => p.le.slice(0, 10) >= debut && p.le.slice(0, 10) < fin)
}

// Évolution relative entre deux valeurs (null si la précédente est nulle : pas de pourcentage)
export function evolution(actuelle: number, precedente: number): number | null {
  return precedente ? (actuelle - precedente) / precedente : null
}

// Premier jour du mois d'une date, décalé de `mois`
export function debutDeMois(jour: DateISO, mois = 0): DateISO {
  const [a, m] = jour.split("-").map(Number)
  const total = a * 12 + (m - 1) + mois
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-01`
}

export type ChoixPeriode = "mois" | "moisPrecedent" | "trimestre" | "annee" | "douzeMois"

export const PERIODES: Record<ChoixPeriode, string> = {
  mois: "Ce mois-ci",
  moisPrecedent: "Le mois dernier",
  trimestre: "Les 3 derniers mois",
  annee: "Cette année",
  douzeMois: "Les 12 derniers mois",
}

// Période choisie et période précédente de même durée (pour les évolutions en %)
export function periodes(choix: ChoixPeriode, aujourdhui: DateISO): { actuelle: Periode; precedente: Periode } {
  const mois = debutDeMois(aujourdhui)
  const annee = `${aujourdhui.slice(0, 4)}-01-01`
  const anneeSuivante = `${Number(aujourdhui.slice(0, 4)) + 1}-01-01`
  const avecPrecedente = (actuelle: Periode, decalageMois: number) => ({
    actuelle,
    precedente: { debut: debutDeMois(actuelle.debut, -decalageMois), fin: actuelle.debut },
  })
  switch (choix) {
    case "mois":
      return avecPrecedente({ debut: mois, fin: debutDeMois(mois, 1) }, 1)
    case "moisPrecedent":
      return avecPrecedente({ debut: debutDeMois(mois, -1), fin: mois }, 1)
    case "trimestre":
      return avecPrecedente({ debut: debutDeMois(mois, -2), fin: debutDeMois(mois, 1) }, 3)
    case "annee":
      return { actuelle: { debut: annee, fin: anneeSuivante }, precedente: { debut: `${Number(aujourdhui.slice(0, 4)) - 1}-01-01`, fin: annee } }
    case "douzeMois":
      return avecPrecedente({ debut: debutDeMois(mois, -11), fin: debutDeMois(mois, 1) }, 12)
  }
}

// Mois de la période, chacun avec ses indicateurs (histogrammes)
export function parMois(d: Pick<Donnees, "reservations" | "hebergements" | "paiements">, { debut, fin }: Periode) {
  const mois: { debut: DateISO; indicateurs: Indicateurs }[] = []
  for (let m = debutDeMois(debut); m < fin; m = debutDeMois(m, 1)) {
    mois.push({ debut: m, indicateurs: indicateurs(d, { debut: m, fin: debutDeMois(m, 1) }) })
  }
  return mois
}

// Part de chaque valeur dans le total (répartitions en %)
export function repartition<K extends string>(valeurs: { cle: K; valeur: number }[]) {
  const total = valeurs.reduce((t, v) => t + v.valeur, 0)
  return valeurs.map((v) => ({ ...v, part: total ? v.valeur / total : 0 })).sort((a, b) => b.valeur - a.valeur)
}

// Occupation de chaque hébergement sur la période (0 à 1)
export function occupationParHebergement(d: Pick<Donnees, "reservations" | "hebergements">, periode: Periode) {
  const nuits = nombreNuits(periode.debut, periode.fin)
  return d.hebergements.map((h) => {
    const vendues = confirmees(d.reservations)
      .filter((r) => r.hebergementId === h.id)
      .reduce((t, r) => t + nuitsDans(r, periode), 0)
    return { hebergement: h, nuits: vendues, occupation: nuits ? vendues / nuits : 0 }
  })
}

// Libellés courts : « janv. 26 »
export function nomDuMois(debut: DateISO, avecAnnee = false): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "short", ...(avecAnnee && { year: "2-digit" }), timeZone: "UTC" }).format(new Date(`${debut}T00:00:00Z`))
}

export const pourcent = (part: number, decimales = 0) =>
  new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: decimales, minimumFractionDigits: decimales }).format(part)

// Dernier jour de la période (affichage « 1er – 31 oct. »)
export const dernierJour = (p: Periode) => ajouterJours(p.fin, -1)
