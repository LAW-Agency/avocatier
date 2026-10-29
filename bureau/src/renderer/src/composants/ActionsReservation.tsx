import {
  Button,
  Caption1,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Field,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  Textarea,
  mergeClasses,
} from "@fluentui/react-components"
import { ArrowUndoRegular, CheckmarkRegular, DismissCircleRegular, DoorArrowLeftRegular, DoorArrowRightRegular, MoneyRegular, ProhibitedRegular } from "@fluentui/react-icons"
import { useState } from "react"
import { formaterPlage, nombreNuits, pluriel } from "@partage/dates"
import { formaterDansDevise } from "@partage/devises"
import type { Reservation, StatutReservation } from "@partage/types"
import { encaisseDe, nomChambre, nomDe, restaurantSur, soldeDe, useDonnees, useDonneesChargees, useLectureSeule } from "../donnees"
import { usePrix } from "../montants"
import { useAnnoncer } from "../toasts"
import BoutonFacture from "./BoutonFacture"
import Encaissements from "./Encaissements"
import { useActionsStyles } from "./useReservationStyles.styles"

interface ActionsReservationProps {
  reservationId: string
  statut: StatutReservation
  reference: string
  taille?: "small" | "medium"
  // « fin » : pied de la fiche, action principale tout à droite ; « debut » : dans une liste
  alignement?: "debut" | "fin"
}

// Ce que l'équipe peut faire selon le statut : confirmer directement ; refuser ou annuler après confirmation,
// avec un mot facultatif pour le client (ajouté à son e-mail : raison, autres dates proposées…)
export default function ActionsReservation({ reservationId, statut, reference, taille = "medium", alignement = "debut" }: ActionsReservationProps) {
  const lectureSeule = useLectureSeule()
  const styles = useActionsStyles()
  const { donnees, executer } = useDonnees()
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [mot, setMot] = useState("")
  // Fenêtre de refus / annulation gardée ouverte pendant l'appel, avec le Spinner sur son bouton
  const [fenetre, setFenetre] = useState(false)
  if (statut !== "option" && statut !== "confirmee") return null
  const clientId = donnees?.reservations.find((r) => r.id === reservationId)?.clientId
  const email = donnees?.clients.find((c) => c.id === clientId)?.email

  async function envoyer(nouveau: "confirmee" | "refusee" | "annulee") {
    setEnCours(true)
    setErreur(null)
    const resultat = await executer("PATCH", `/api/hotes/reservations/${encodeURIComponent(reservationId)}`, {
      statut: nouveau,
      ...(nouveau !== "confirmee" && { mot }),
    })
    setEnCours(false)
    setFenetre(false)
    if (!resultat.ok) setErreur(resultat.erreur)
    else setMot("")
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
    <Button appearance="primary" size={taille} disabled={enCours || lectureSeule} icon={enCours ? <Spinner size="tiny" /> : <CheckmarkRegular />} onClick={() => envoyer("confirmee")}>
      Confirmer
    </Button>
  )

  return (
    <div className={styles.pile}>
      <div className={mergeClasses(styles.boutons, alignement === "fin" && styles.fin)}>
        {alignement === "debut" && confirmer}
        <Dialog modalType="alert" open={fenetre} onOpenChange={(_e, data) => !enCours && setFenetre(data.open)}>
          <DialogTrigger disableButtonEnhancement>
            <Button size={taille} disabled={enCours || lectureSeule} icon={enCours && fenetre ? <Spinner size="tiny" /> : <fermeture.Icone />} appearance={statut === "option" ? "secondary" : "subtle"}>
              {fermeture.libelle}
            </Button>
          </DialogTrigger>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>{fermeture.titre}</DialogTitle>
              <DialogContent className={styles.pile}>
                {fermeture.texte}
                {email ? (
                  <Field label="Mot pour le client" hint="Facultatif : la raison, d'autres dates à proposer… Il est ajouté à l'e-mail et à l'historique.">
                    <Textarea value={mot} onChange={(_e, data) => setMot(data.value)} resize="vertical" maxLength={2000} />
                  </Field>
                ) : (
                  <span>Ce client n&apos;a pas d&apos;adresse e-mail : prévenez-le par téléphone.</span>
                )}
              </DialogContent>
              <DialogActions>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="secondary" disabled={enCours}>
                    Retour
                  </Button>
                </DialogTrigger>
                <Button className={styles.danger} disabled={enCours || lectureSeule} icon={enCours ? <Spinner size="tiny" /> : undefined} onClick={() => envoyer(fermeture.statut)}>
                  {fermeture.libelle}
                </Button>
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

// Arrivée puis départ du client, enregistrés par la réception (séjour confirmé du jour ou en cours), dans une
// fenêtre qui montre où en est le paiement : à l'arrivée, l'acompte reçu et le reste (rappel, sans blocage) ;
// au départ, un reste à payer (restaurant et bar compris) s'encaisse sur place ou ne se laisse qu'avec une raison
// (notée dans l'historique), puis la facture complète du séjour s'imprime dans la devise du client
export function BoutonReception({ reservation, aujourdhui, taille = "medium" }: { reservation: Reservation; aujourdhui: string; taille?: "small" | "medium" }) {
  const lectureSeule = useLectureSeule()
  const formaterPrix = usePrix()
  const styles = useActionsStyles()
  const { d, executer, clientDe } = useDonneesChargees()
  const { annoncer } = useAnnoncer()
  const [ouverte, setOuverte] = useState(false)
  // « encaisser » : bloc des encaissements déplié ; « sansSolder » : départ malgré le reste, raison demandée
  const [choix, setChoix] = useState<"encaisser" | "sansSolder" | null>(null)
  const [raison, setRaison] = useState("")
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  // Version à jour après un encaissement fait dans la fenêtre
  const r = d.reservations.find((x) => x.id === reservation.id) ?? reservation
  if (r.statut !== "confirmee" || r.departLe) return null
  const arrivee = !r.arriveeLe
  if (arrivee && r.arrivee > aujourdhui) return null

  const solde = soldeDe(r, d)
  const encaisse = encaisseDe(r, d)
  const restaurant = restaurantSur(r, d)
  const nom = nomDe(clientDe(r))
  const bloque = !arrivee && solde > 0 && (choix !== "sansSolder" || !raison.trim())

  function basculer(ouvrir: boolean) {
    if (enCours) return
    setOuverte(ouvrir)
    setChoix(null)
    setRaison("")
    setErreur(null)
  }

  async function enregistrer() {
    setEnCours(true)
    setErreur(null)
    const resultat = await executer("PATCH", `/api/hotes/reservations/${encodeURIComponent(r.id)}`, {
      mouvement: arrivee ? "arrivee" : "depart",
      ...(!arrivee && solde > 0 && { mot: raison.trim() }),
    })
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    setOuverte(false)
    annoncer({
      titre: arrivee ? `Arrivée de ${nom} enregistrée` : `Départ de ${nom} enregistré`,
      texte: arrivee ? (solde > 0 ? `Reste ${formaterPrix(solde)} à encaisser d'ici le départ.` : "Séjour déjà soldé.") : "La chambre passe à nettoyer.",
      intent: "success",
      duree: 5000,
    })
  }

  return (
    <Dialog open={ouverte} onOpenChange={(_e, data) => basculer(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button size={taille} appearance={arrivee ? "primary" : "secondary"} disabled={lectureSeule} icon={arrivee ? <DoorArrowRightRegular /> : <DoorArrowLeftRegular />}>
          {arrivee ? "Arrivée" : "Départ"}
        </Button>
      </DialogTrigger>
      <DialogSurface className={styles.fenetre}>
        <DialogBody>
          <DialogTitle>{arrivee ? `Arrivée de ${nom}` : `Départ de ${nom}`}</DialogTitle>
          <DialogContent className={styles.pile}>
            <Caption1 className={styles.discret}>
              {nomChambre(d, r.chambreId)} · {formaterPlage(r.arrivee, r.depart)}, {pluriel(nombreNuits(r.arrivee, r.depart), "nuit")} · {r.reference}
            </Caption1>

            {solde > 0 ? (
              <MessageBar intent={arrivee ? "info" : "warning"} layout="multiline">
                <MessageBarBody>
                  <MessageBarTitle>Reste à payer : {formaterPrix(solde)}</MessageBarTitle>
                  {restaurant > 0 && `Dont restaurant et bar sur la chambre : ${formaterDansDevise(restaurant, "MGA")}. `}
                  {encaisse > 0 ? `Déjà reçu : ${formaterPrix(encaisse)}. ` : "Aucun acompte reçu. "}
                  {arrivee ? "À encaisser au plus tard au départ." : "Encaissez le solde avant que le client parte."}
                </MessageBarBody>
              </MessageBar>
            ) : solde < 0 ? (
              <MessageBar intent="warning">
                <MessageBarBody>
                  <MessageBarTitle>Trop-perçu : {formaterPrix(-solde)}</MessageBarTitle>
                  Le client a payé plus que le séjour : remboursez-le.
                </MessageBarBody>
              </MessageBar>
            ) : (
              <MessageBar intent="success">
                <MessageBarBody>
                  <MessageBarTitle>Séjour soldé</MessageBarTitle>
                  {formaterPrix(encaisse)} encaissés.
                </MessageBarBody>
              </MessageBar>
            )}

            {solde !== 0 && choix !== "encaisser" && (
              <div className={styles.boutons}>
                <Button appearance={arrivee ? "secondary" : "primary"} icon={<MoneyRegular />} onClick={() => setChoix("encaisser")}>
                  {solde > 0 ? "Encaisser maintenant" : "Rembourser maintenant"}
                </Button>
                {!arrivee && solde > 0 && choix !== "sansSolder" && <Button onClick={() => setChoix("sansSolder")}>Départ quand même</Button>}
              </div>
            )}
            {choix === "encaisser" && <Encaissements reservation={r} />}
            {choix === "sansSolder" && solde > 0 && (
              <Field
                label="Pourquoi le client part sans avoir soldé ?"
                required
                hint="Noté dans l'historique de la réservation et le journal : virement promis, litige, geste commercial…"
              >
                <Textarea value={raison} onChange={(_e, data) => setRaison(data.value)} resize="vertical" maxLength={500} />
              </Field>
            )}

            {erreur && (
              <MessageBar intent="error">
                <MessageBarBody>{erreur}</MessageBarBody>
              </MessageBar>
            )}
          </DialogContent>
          <DialogActions>
            {/* Au départ : facture de tout le séjour (restaurant et bar, autres chambres du groupe) */}
            {!arrivee && <BoutonFacture reservation={r} appearance={solde > 0 ? "secondary" : "primary"} />}
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" disabled={enCours}>
                Retour
              </Button>
            </DialogTrigger>
            <Button
              appearance={!arrivee && solde <= 0 ? "secondary" : "primary"}
              disabled={enCours || lectureSeule || bloque}
              icon={enCours ? <Spinner size="tiny" /> : arrivee ? <DoorArrowRightRegular /> : <DoorArrowLeftRegular />}
              onClick={enregistrer}
            >
              {arrivee ? "Enregistrer l'arrivée" : solde > 0 ? "Départ sans solder" : "Enregistrer le départ"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

// Erreur de clic : un gérant revient sur le départ enregistré, ou sur l'arrivée s'il n'y a pas encore de départ
export function AnnulerMouvement({ reservation: r }: { reservation: Reservation }) {
  const lectureSeule = useLectureSeule()
  const styles = useActionsStyles()
  const { executer, gerant } = useDonneesChargees()
  const [ouverte, setOuverte] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  if (!gerant || r.statut !== "confirmee" || !r.arriveeLe) return null
  const depart = !!r.departLe
  const libelle = depart ? "Annuler le départ" : "Annuler l'arrivée"

  async function annuler() {
    setEnCours(true)
    setErreur(null)
    const resultat = await executer("PATCH", `/api/hotes/reservations/${encodeURIComponent(r.id)}`, { mouvement: depart ? "depart" : "arrivee", annuler: true })
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    setOuverte(false)
  }

  return (
    <Dialog modalType="alert" open={ouverte} onOpenChange={(_e, data) => !enCours && (setOuverte(data.open), setErreur(null))}>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="subtle" size="small" icon={<ArrowUndoRegular />} disabled={lectureSeule}>
          {libelle}
        </Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{libelle} ?</DialogTitle>
          <DialogContent className={styles.pile}>
            {depart
              ? "Le client sera de nouveau compté sur place et sa chambre occupée. L'état de ménage de la chambre ne change pas."
              : "Le séjour redevient « arrivée attendue »."}{" "}
            À utiliser après une erreur de clic : l&apos;annulation est notée dans l&apos;historique et le journal.
            {erreur && (
              <MessageBar intent="error">
                <MessageBarBody>{erreur}</MessageBarBody>
              </MessageBar>
            )}
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" disabled={enCours}>
                Retour
              </Button>
            </DialogTrigger>
            <Button className={styles.danger} disabled={enCours || lectureSeule} icon={enCours ? <Spinner size="tiny" /> : undefined} onClick={annuler}>
              {libelle}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
