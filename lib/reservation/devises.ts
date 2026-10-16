import type { CodeDevise, ReglagesDevises } from "./types"

// Catalogue des devises (pur, partagé navigateur/serveur). Les tarifs sont fixés en euros : les autres
// devises sont une conversion indicative, au taux saisi par les hôtes dans /admin/tarifs.

export const DEVISE_REFERENCE: CodeDevise = "EUR"

type InfoDevise = {
  nom: string
  region: string // libellé du choix de région dans le pied de page
  symbole: string
  arrondi: number // montant converti arrondi à ce pas : l'ariary à 1 000 près, plus lisible
}

export const DEVISES: Record<CodeDevise, InfoDevise> = {
  EUR: { nom: "Euro", region: "Europe et La Réunion", symbole: "€", arrondi: 1 },
  MGA: { nom: "Ariary", region: "Madagascar", symbole: "Ar", arrondi: 1000 },
  USD: { nom: "Dollar américain", region: "États-Unis et international", symbole: "$US", arrondi: 1 },
  GBP: { nom: "Livre sterling", region: "Royaume-Uni", symbole: "£", arrondi: 1 },
  CHF: { nom: "Franc suisse", region: "Suisse", symbole: "CHF", arrondi: 1 },
  CAD: { nom: "Dollar canadien", region: "Canada", symbole: "$CA", arrondi: 1 },
}

// Ordre d'affichage (pied de page, espace hôtes)
export const CODES_DEVISES = Object.keys(DEVISES) as CodeDevise[]

export function estCodeDevise(valeur: unknown): valeur is CodeDevise {
  return typeof valeur === "string" && valeur in DEVISES
}

// TODO client : taux indicatifs d'octobre 2026, à tenir à jour par les hôtes
export function reglagesDevisesInitiaux(): ReglagesDevises {
  return {
    parDefaut: "EUR",
    actives: ["EUR", "MGA", "USD"],
    taux: { EUR: 1, MGA: 5150, USD: 1.16, GBP: 0.87, CHF: 0.93, CAD: 1.61 },
    misAJourLe: new Date().toISOString(),
  }
}

export function convertir(montantEuros: number, devise: CodeDevise, reglages: ReglagesDevises): number {
  if (devise === DEVISE_REFERENCE) return Math.round(montantEuros)
  const { arrondi } = DEVISES[devise]
  return Math.round((montantEuros * reglages.taux[devise]) / arrondi) * arrondi
}

// « 85 € », « 438 000 Ar », « 99 $US » : espaces insécables comme Intl, symbole après le montant
export function formaterMontant(montantEuros: number, devise: CodeDevise, reglages: ReglagesDevises): string {
  const nombre = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(convertir(montantEuros, devise, reglages))
  return `${nombre} ${DEVISES[devise].symbole}`
}

// Devise affichée : le choix du visiteur s'il est encore proposé, sinon celle par défaut des hôtes
export function deviseAffichee(choix: string | null, reglages: ReglagesDevises): CodeDevise {
  return estCodeDevise(choix) && reglages.actives.includes(choix) ? choix : reglages.parDefaut
}
