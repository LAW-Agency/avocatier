import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  MessageBar,
  MessageBarBody,
  Spinner,
  mergeClasses,
} from "@fluentui/react-components"
import { CheckmarkRegular, DismissCircleRegular, DoorArrowLeftRegular, DoorArrowRightRegular, ProhibitedRegular } from "@fluentui/react-icons"
import { useState } from "react"
import type { Reservation, StatutReservation } from "@partage/types"
import { useDonnees } from "../donnees"
import { useActionsStyles } from "./useReservationStyles.styles"

interface ActionsReservationProps {
  reservationId: string
  statut: StatutReservation
  reference: string
  taille?: "small" | "medium"
  // « fin » : pied de la fiche, action principale tout à droite ; « debut » : dans une liste
  alignement?: "debut" | "fin"
}

// Ce que l'équipe peut faire selon le statut : confirmer directement ; refuser ou annuler après confirmation
export default function ActionsReservation({ reservationId, statut, reference, taille = "medium", alignement = "debut" }: ActionsReservationProps) {
  const styles = useActionsStyles()
  const { executer } = useDonnees()
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  if (statut !== "option" && statut !== "confirmee") return null

  async function envoyer(nouveau: "confirmee" | "refusee" | "annulee") {
    setEnCours(true)
    setErreur(null)
    const resultat = await executer("PATCH", `/api/hotes/reservations/${encodeURIComponent(reservationId)}`, { statut: nouveau })
    setEnCours(false)
    if (!resultat.ok) setErreur(resultat.erreur)
  }

  const fermeture =
    statut === "option"
      ? {
          statut: "refusee" as const,
          libelle: "Refuser",
          Icone: ProhibitedRegular,
          titre: `Refuser la demande ${reference} ?`,
          texte: "Le client verra la demande comme non disponible et recevra un e-mail. Les dates seront de nouveau proposées sur le site.",
        }
      : {
          statut: "annulee" as const,
          libelle: "Annuler la réservation",
          Icone: DismissCircleRegular,
          titre: `Annuler la réservation ${reference} ?`,
          texte: "Cette réservation est confirmée. Le client sera prévenu par e-mail et les dates seront de nouveau proposées sur le site.",
        }

  const confirmer = statut === "option" && (
    <Button appearance="primary" size={taille} disabled={enCours} icon={enCours ? <Spinner size="tiny" /> : <CheckmarkRegular />} onClick={() => envoyer("confirmee")}>
      Confirmer
    </Button>
  )

  return (
    <div className={styles.pile}>
      <div className={mergeClasses(styles.boutons, alignement === "fin" && styles.fin)}>
        {alignement === "debut" && confirmer}
        <Dialog modalType="alert">
          <DialogTrigger disableButtonEnhancement>
            <Button size={taille} disabled={enCours} icon={<fermeture.Icone />} appearance={statut === "option" ? "secondary" : "subtle"}>
              {fermeture.libelle}
            </Button>
          </DialogTrigger>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>{fermeture.titre}</DialogTitle>
              <DialogContent>{fermeture.texte}</DialogContent>
              <DialogActions>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="secondary">Retour</Button>
                </DialogTrigger>
                <DialogTrigger disableButtonEnhancement>
                  <Button className={styles.danger} onClick={() => envoyer(fermeture.statut)}>
                    {fermeture.libelle}
                  </Button>
                </DialogTrigger>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
        {alignement === "fin" && confirmer}
      </div>
      {erreur && (
        <MessageBar intent="error">
          <MessageBarBody>{erreur}</MessageBarBody>
        </MessageBar>
      )}
    </div>
  )
}

// Arrivée puis départ du client, enregistrés par la réception (séjour confirmé du jour ou en cours)
export function BoutonReception({ reservation: r, aujourdhui, taille = "medium" }: { reservation: Reservation; aujourdhui: string; taille?: "small" | "medium" }) {
  const { executer } = useDonnees()
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  if (r.statut !== "confirmee" || r.departLe) return null
  const arrivee = !r.arriveeLe
  if (arrivee && r.arrivee > aujourdhui) return null

  async function enregistrer() {
    setEnCours(true)
    setErreur(null)
    const resultat = await executer("PATCH", `/api/hotes/reservations/${encodeURIComponent(r.id)}`, { mouvement: arrivee ? "arrivee" : "depart" })
    setEnCours(false)
    if (!resultat.ok) setErreur(resultat.erreur)
  }

  return (
    <>
      <Button
        size={taille}
        appearance={arrivee ? "primary" : "secondary"}
        disabled={enCours}
        icon={enCours ? <Spinner size="tiny" /> : arrivee ? <DoorArrowRightRegular /> : <DoorArrowLeftRegular />}
        onClick={enregistrer}
        title={erreur ?? undefined}
      >
        {arrivee ? "Arrivée" : "Départ"}
      </Button>
      {erreur && (
        <MessageBar intent="error">
          <MessageBarBody>{erreur}</MessageBarBody>
        </MessageBar>
      )}
    </>
  )
}
