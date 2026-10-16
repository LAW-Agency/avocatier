"use client"

import { startTransition, useActionState } from "react"
import { AlertCircle, Ban, Check, CircleSlash } from "lucide-react"
import { changerStatutReservation, type EtatAction } from "@/app/admin/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { StatutReservation } from "@/lib/reservation/types"

interface ActionsReservationProps {
  reservationId: string
  statut: StatutReservation
  reference: string
  taille?: "sm" | "default"
}

// Ce que les hôtes peuvent faire selon le statut : confirmer directement ; refuser ou annuler après confirmation
export default function ActionsReservation({ reservationId, statut, reference, taille = "default" }: ActionsReservationProps) {
  const [etat, action, enCours] = useActionState<EtatAction, FormData>(changerStatutReservation, {})
  if (statut !== "option" && statut !== "confirmee") return null

  const envoyer = (nouveau: StatutReservation) => {
    const donnees = new FormData()
    donnees.set("reservationId", reservationId)
    donnees.set("statut", nouveau)
    startTransition(() => action(donnees))
  }

  const fermeture =
    statut === "option"
      ? {
          statut: "refusee" as const,
          label: "Refuser",
          icone: Ban,
          titre: `Refuser la demande ${reference} ?`,
          texte: "Le client verra la demande comme non disponible et les dates seront de nouveau proposées sur le site.",
        }
      : {
          statut: "annulee" as const,
          label: "Annuler",
          icone: CircleSlash,
          titre: `Annuler la réservation ${reference} ?`,
          texte: "Cette réservation est confirmée. Une fois annulée, les dates seront de nouveau proposées sur le site.",
        }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        {statut === "option" && (
          <Button size={taille} disabled={enCours} onClick={() => envoyer("confirmee")}>
            {enCours ? <Spinner data-icon="inline-start" /> : <Check data-icon="inline-start" />}
            Confirmer
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant={statut === "option" ? "outline" : "destructive"} size={taille} disabled={enCours}>
              <fermeture.icone data-icon="inline-start" />
              {fermeture.label}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{fermeture.titre}</AlertDialogTitle>
              <AlertDialogDescription>{fermeture.texte}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Retour</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => envoyer(fermeture.statut)}>
                {fermeture.label}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {etat.erreur && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{etat.erreur}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
