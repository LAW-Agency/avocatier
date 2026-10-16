"use client"

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react"
import { DEVISE_REFERENCE, deviseAffichee, formaterMontant } from "@/lib/reservation/devises"
import type { CodeDevise, ReglagesDevises } from "@/lib/reservation/types"

// Devise d'affichage des prix de la vitrine. Réglages (taux, devises proposées, devise par défaut) fournis par
// le serveur depuis le layout ; choix du visiteur dans le pied de page, gardé dans ce navigateur.
// Pas de cookie : les pages restent statiques. Le rendu serveur et l'hydratation utilisent la devise par
// défaut, puis le choix du visiteur s'applique (useSyncExternalStore, sans erreur d'hydratation).

const CLE = "avocatier-devise"
const EVENEMENT = "avocatier-devise" // même onglet ; « storage » ne prévient que les autres onglets

function lireChoix(): string | null {
  try {
    return localStorage.getItem(CLE)
  } catch {
    return null // stockage bloqué (navigation privée stricte) : devise par défaut
  }
}

function abonner(rappel: () => void) {
  window.addEventListener("storage", rappel)
  window.addEventListener(EVENEMENT, rappel)
  return () => {
    window.removeEventListener("storage", rappel)
    window.removeEventListener(EVENEMENT, rappel)
  }
}

type ContexteDevise = {
  reglages: ReglagesDevises
  devise: CodeDevise // affichée
  personnalisee: boolean // le visiteur a choisi une devise (sinon : celle par défaut)
  choisir: (code: CodeDevise | null) => void // null : revenir à la devise par défaut
  formater: (montantEuros: number) => string
}

const Contexte = createContext<ContexteDevise | null>(null)

export function FournisseurDevise({ reglages, children }: { reglages: ReglagesDevises; children: ReactNode }) {
  const choix = useSyncExternalStore(abonner, lireChoix, () => null)
  const devise = deviseAffichee(choix, reglages)

  const choisir = useCallback((code: CodeDevise | null) => {
    try {
      if (code) localStorage.setItem(CLE, code)
      else localStorage.removeItem(CLE)
    } catch {
      // stockage bloqué : le choix ne peut pas être retenu
    }
    window.dispatchEvent(new Event(EVENEMENT))
  }, [])

  const valeur = useMemo<ContexteDevise>(
    () => ({
      reglages,
      devise,
      personnalisee: choix !== null && devise === choix,
      choisir,
      formater: (montant) => formaterMontant(montant, devise, reglages),
    }),
    [reglages, devise, choix, choisir],
  )

  return <Contexte value={valeur}>{children}</Contexte>
}

export function useDevise(): ContexteDevise {
  const contexte = useContext(Contexte)
  if (!contexte) throw new Error("useDevise doit être utilisé sous <FournisseurDevise>")
  return contexte
}

// Prix de la vitrine dans la devise du visiteur ; montant toujours fourni en euros
export function Prix({ montant }: { montant: number }) {
  return <>{useDevise().formater(montant)}</>
}

// Rappel sous un total converti : montant en euros, celui des tarifs
export function MentionConversion({ montant, className }: { montant: number; className?: string }) {
  const { devise, reglages } = useDevise()
  if (devise === DEVISE_REFERENCE) return null
  return (
    <span className={className}>
      soit {formaterMontant(montant, DEVISE_REFERENCE, reglages)}
    </span>
  )
}
