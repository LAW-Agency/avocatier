import { useCallback } from "react"
import { formaterPrix } from "@partage/dates"
import { DEVISES } from "@partage/devises"
import type { ReglagesDevises } from "@partage/types"
import type { DeviseLogiciel } from "../../partage/ipc"
import { useDonnees } from "./donnees"
import { useReglages } from "./reglages"

// Montants affichés dans la devise choisie dans les Paramètres (ariary par défaut). Tout est enregistré en
// euros (tarifs, réservations, encaissements) : conversion au taux saisi dans Tarifs, comme sur le site.
// Saisies (encaissements, prix), factures et reçus restent en euros.

// Franc malgache : ancienne unité encore très parlée, 1 ariary = 5 FMG
const FMG_PAR_ARIARY = 5

export const DEVISES_AFFICHAGE: Record<DeviseLogiciel, { nom: string; symbole: string; arrondi: number }> = {
  MGA: { nom: "Ariary", symbole: "Ar", arrondi: 100 },
  FMG: { nom: "Franc malgache", symbole: "Fmg", arrondi: 500 },
  EUR: { nom: DEVISES.EUR.nom, symbole: DEVISES.EUR.symbole, arrondi: 1 },
  USD: { nom: DEVISES.USD.nom, symbole: DEVISES.USD.symbole, arrondi: 1 },
  GBP: { nom: DEVISES.GBP.nom, symbole: DEVISES.GBP.symbole, arrondi: 1 },
  CHF: { nom: DEVISES.CHF.nom, symbole: DEVISES.CHF.symbole, arrondi: 1 },
  CAD: { nom: DEVISES.CAD.nom, symbole: DEVISES.CAD.symbole, arrondi: 1 },
}

// Taux pour 1 € (le franc malgache se déduit de l'ariary)
export function tauxPourUnEuro(devise: DeviseLogiciel, taux: ReglagesDevises["taux"]): number {
  if (devise === "FMG") return taux.MGA * FMG_PAR_ARIARY
  return devise === "EUR" ? 1 : taux[devise]
}

export function formaterEn(euros: number, devise: DeviseLogiciel, taux: ReglagesDevises["taux"] | undefined): string {
  if (devise === "EUR" || !taux) return formaterPrix(euros)
  const { symbole, arrondi } = DEVISES_AFFICHAGE[devise]
  const montant = Math.round((euros * tauxPourUnEuro(devise, taux)) / arrondi) * arrondi
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(montant)} ${symbole}`
}

// Formateur des montants (en euros) dans la devise d'affichage du poste ; en euros tant que les taux ne sont
// pas chargés
export function usePrix(): (euros: number) => string {
  const { reglages } = useReglages()
  const taux = useDonnees().donnees?.devises.taux
  return useCallback((euros: number) => formaterEn(euros, reglages.devise, taux), [reglages.devise, taux])
}
