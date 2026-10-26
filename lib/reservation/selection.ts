import { estDateISO } from "./dates"
import { CHAMBRES_PAR_DEMANDE_MAX } from "./regles"
import type { DateISO } from "./types"

// Choix du visiteur dans le parcours, reflété dans l'URL de /reserver :
// un lien « Réserver » d'une page bungalow arrive prérempli et l'adresse se partage.
export type Selection = {
  arrivee: DateISO | null
  depart: DateISO | null
  adultes: number
  enfants: number
  chambres: number // chambres de la catégorie choisie, réservées ensemble
  hebergement: string | null // slug
}

type Parametres = { [cle: string]: string | string[] | undefined }

function entier(valeur: unknown, parDefaut: number, min: number, max: number): number {
  const n = Number(valeur)
  return Number.isInteger(n) && n >= min && n <= max ? n : parDefaut
}

export function lireSelection(params: Parametres, slugs: string[]): Selection {
  const { arrivee, depart, adultes, enfants, chambres, hebergement } = params
  const arriveeOk = estDateISO(arrivee) ? arrivee : null
  return {
    arrivee: arriveeOk,
    depart: arriveeOk && estDateISO(depart) && depart > arriveeOk ? depart : null,
    adultes: entier(adultes, 2, 1, 20),
    enfants: entier(enfants, 0, 0, 20),
    chambres: entier(chambres, 1, 1, CHAMBRES_PAR_DEMANDE_MAX),
    hebergement: typeof hebergement === "string" && slugs.includes(hebergement) ? hebergement : null,
  }
}

export function versParametres(selection: Selection): string {
  const params = new URLSearchParams()
  if (selection.arrivee) params.set("arrivee", selection.arrivee)
  if (selection.depart) params.set("depart", selection.depart)
  params.set("adultes", String(selection.adultes))
  if (selection.enfants) params.set("enfants", String(selection.enfants))
  if (selection.chambres > 1) params.set("chambres", String(selection.chambres))
  if (selection.hebergement) params.set("hebergement", selection.hebergement)
  return params.toString()
}
