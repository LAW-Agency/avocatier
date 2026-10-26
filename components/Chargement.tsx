"use client"

import { LoaderCircle } from "lucide-react"
import { useFormStatus } from "react-dom"
import type { ButtonHTMLAttributes, ReactNode } from "react"

// Indicateur de chargement des boutons : cercle qui tourne, à la couleur du texte (immobile si mouvement réduit)
export function Rotateur({ className = "h-4 w-4" }: { className?: string }) {
  return <LoaderCircle className={`shrink-0 motion-safe:animate-spin ${className}`} aria-hidden="true" />
}

// Contenu d'un bouton en cours d'envoi : rotateur devant le libellé (espacé par le `gap` du bouton)
export function ContenuEnCours({ enCours, children }: { enCours: boolean; children: ReactNode }) {
  return (
    <>
      {enCours && <Rotateur />}
      {children}
    </>
  )
}

type BoutonEnvoiProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  // Texte pendant l'envoi (sinon le libellé reste)
  enCours?: ReactNode
}

// Bouton d'envoi d'un formulaire à Server Action (pages serveur) : désactivé avec le rotateur tant que l'action
// tourne. Avec `formAction`, seul le bouton qui a lancé l'envoi tourne ; les autres sont simplement désactivés.
export function BoutonEnvoi({ children, enCours: libelleEnCours, formAction, disabled, ...props }: BoutonEnvoiProps) {
  const statut = useFormStatus()
  const actif = statut.pending && (formAction === undefined || statut.action === formAction)
  return (
    <button type="submit" formAction={formAction} disabled={disabled || statut.pending} aria-busy={actif || undefined} {...props}>
      <ContenuEnCours enCours={actif}>{actif && libelleEnCours ? libelleEnCours : children}</ContenuEnCours>
    </button>
  )
}
