import {
  Badge,
  Body1,
  Button,
  Caption1,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  MessageBar,
  MessageBarBody,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Textarea,
  Tooltip,
  mergeClasses,
} from "@fluentui/react-components"
import { DismissCircleRegular, ReceiptRegular, TextBulletListSquareRegular } from "@fluentui/react-icons"
import { useState, type FormEvent } from "react"
import { formaterDate } from "@partage/dates"
import { formaterDansDevise } from "@partage/devises"
import type { DateISO, Ticket } from "@partage/types"
import { resumeTicket, type Caisse, type DonneesEcranCaisse } from "../caisse"
import { useDonneesChargees } from "../donnees"
import { useFichiers } from "../fichiers"
import { MODES_PAIEMENT } from "../libelles"
import { useRestaurantStyles } from "../pages/useRestaurantStyles.styles"
import ChampDate from "./ChampDate"
import { Carte, Vide } from "./commun"
import { useCadreTableStyles } from "./useCommunStyles.styles"
import { useFormulairesStyles } from "./useFormulairesStyles.styles"

const ariary = (montant: number) => formaterDansDevise(montant, "MGA")

const heure = (instant: string) =>
  new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Indian/Antananarivo" }).format(new Date(instant))

// Tickets d'un jour : ce qui a été encaissé, mis sur les chambres et annulé ; réimpression et annulation (motif
// obligatoire, ticket barré mais gardé)
export default function CaisseTickets({ caisse, donnees, jour, onJour }: { caisse: Caisse; donnees: DonneesEcranCaisse; jour: DateISO; onJour: (jour: DateISO) => void }) {
  const styles = useRestaurantStyles()
  const cadre = useCadreTableStyles()
  const { d, gerant } = useDonneesChargees()
  const { imprimerTicket } = useFichiers()
  const [aAnnuler, setAAnnuler] = useState<Ticket | null>(null)
  const [impression, setImpression] = useState<string | null>(null)

  const valides = donnees.tickets.filter((t) => t.statut !== "annule")
  const encaisse = valides.filter((t) => t.statut === "paye").reduce((s, t) => s + t.total, 0)
  const surChambres = valides.filter((t) => t.statut === "chambre").reduce((s, t) => s + t.total, 0)
  const annules = donnees.tickets.length - valides.length

  // Chambre d'un ticket : séjour en cours, ou réservation connue de la réception et des gérants
  function chambreDe(t: Ticket): string | undefined {
    if (!t.reservationId) return undefined
    const sejour = donnees.sejours.find((s) => s.reservationId === t.reservationId)
    if (sejour) return sejour.chambre
    const r = d.reservations.find((x) => x.id === t.reservationId)
    return r ? d.chambres.find((c) => c.id === r.chambreId)?.numero : undefined
  }

  const caissierDe = (t: Ticket) => d.equipe.find((m) => m.id === t.caissierId)?.prenom ?? (t.caissierId === d.hote.id ? d.hote.prenom : undefined)

  async function reimprimer(t: Ticket) {
    setImpression(t.id)
    await imprimerTicket(t, chambreDe(t))
    setImpression(null)
  }

  // Hors gérants, seuls les tickets du jour s'annulent (vérifié aussi par le serveur)
  const annulable = (t: Ticket) => t.statut !== "annule" && !t.factureId && (gerant || jour === donnees.aujourdhui)

  return (
    <div className={styles.page}>
      <div className={styles.barreOutils}>
        <Field label="Jour">
          <ChampDate valeur={jour} onChange={(valeur) => valeur && onJour(valeur)} />
        </Field>
        <Caption1 className={styles.secondaire}>{jour === donnees.aujourdhui ? "Aujourd'hui" : formaterDate(jour, { month: "long" })}</Caption1>
      </div>

      <div className={styles.resume}>
        <Carte titre="Encaissé sur place">
          <span className={styles.chiffre}>{ariary(encaisse)}</span>
        </Carte>
        <Carte titre="Sur les chambres">
          <span className={styles.chiffre}>{ariary(surChambres)}</span>
        </Carte>
        <Carte titre="Tickets">
          <span className={styles.chiffre}>{valides.length}</span>
        </Carte>
        <Carte titre="Annulés">
          <span className={styles.chiffre}>{annules}</span>
        </Carte>
      </div>

      {donnees.tickets.length === 0 ? (
        <Vide Icone={TextBulletListSquareRegular} titre="Aucun ticket ce jour-là" texte="Les ventes de tous les postes de caisse s'affichent ici." />
      ) : (
        <div className={cadre.root}>
          <Table aria-label="Tickets du jour">
            <TableHeader className={cadre.entete}>
              <TableRow>
                <TableHeaderCell className={cadre.premiere} style={{ width: "72px" }}>
                  Heure
                </TableHeaderCell>
                <TableHeaderCell style={{ width: "120px" }}>Ticket</TableHeaderCell>
                <TableHeaderCell>Détail</TableHeaderCell>
                <TableHeaderCell style={{ width: "190px" }}>Règlement</TableHeaderCell>
                <TableHeaderCell style={{ width: "120px" }}>
                  <span className={cadre.droite}>Total</span>
                </TableHeaderCell>
                <TableHeaderCell style={{ width: "88px" }} aria-label="Actions" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {donnees.tickets.map((t) => {
                const chambre = chambreDe(t)
                const caissier = caissierDe(t)
                const annule = t.statut === "annule"
                return (
                  <TableRow key={t.id}>
                    <TableCell className={mergeClasses(cadre.premiere, cadre.nombre)}>{heure(t.le)}</TableCell>
                    <TableCell>
                      <Body1 block className={annule ? styles.annule : undefined}>
                        {t.numero}
                      </Body1>
                      {caissier && <Caption1 className={styles.secondaire}>{caissier}</Caption1>}
                    </TableCell>
                    <TableCell>
                      <Body1 block className={annule ? styles.annule : undefined}>
                        {t.libelle && <strong>{t.libelle} · </strong>}
                        {resumeTicket(t)}
                      </Body1>
                      {annule && <Caption1 className={styles.secondaire}>Annulé : « {t.motifAnnulation} »</Caption1>}
                    </TableCell>
                    <TableCell>
                      {t.reservationId ? (
                        <Badge appearance="tint" color={annule ? "subtle" : "informative"} shape="rounded">
                          Chambre {chambre ?? ""}
                        </Badge>
                      ) : (
                        <Caption1>
                          {t.reglements.map((r) => `${MODES_PAIEMENT[r.mode]} ${formaterDansDevise(r.montant, r.devise)}`).join(", ")}
                          {t.reglements.some((r) => r.rendu) && ` · rendu ${ariary(t.reglements.reduce((s, r) => s + r.rendu, 0))}`}
                        </Caption1>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={mergeClasses(cadre.droite, cadre.nombre, annule && styles.annule)}>{ariary(t.total)}</span>
                    </TableCell>
                    <TableCell>
                      <div className={styles.actionsLigne}>
                        <Tooltip content="Réimprimer le ticket" relationship="label">
                          <Button appearance="subtle" size="small" disabled={impression === t.id} icon={impression === t.id ? <Spinner size="tiny" /> : <ReceiptRegular />} onClick={() => reimprimer(t)} />
                        </Tooltip>
                        {annulable(t) && (
                          <Tooltip content="Annuler le ticket" relationship="label">
                            <Button appearance="subtle" size="small" disabled={caisse.lectureSeule} icon={<DismissCircleRegular />} onClick={() => setAAnnuler(t)} />
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
      {aAnnuler && <FenetreAnnulation ticket={aAnnuler} caisse={caisse} onFin={() => setAAnnuler(null)} />}
    </div>
  )
}

function FenetreAnnulation({ ticket: t, caisse, onFin }: { ticket: Ticket; caisse: Caisse; onFin: () => void }) {
  const formulaire = useFormulairesStyles()
  const [motif, setMotif] = useState("")
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    const resultat = await caisse.ecrire("PATCH", `/api/hotes/caisse/tickets/${encodeURIComponent(t.id)}`, { annuler: true, motif })
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    onFin()
  }

  return (
    <Dialog open onOpenChange={(_e, data) => !data.open && onFin()}>
      <DialogSurface style={{ maxWidth: "480px" }}>
        <form onSubmit={envoyer}>
          <DialogBody>
            <DialogTitle>Annuler le ticket {t.numero}</DialogTitle>
            <DialogContent className={formulaire.corps}>
              <Body1>
                {resumeTicket(t)} · {ariary(t.total)}.{" "}
                {t.reservationId ? "Le montant est retiré de la note de la chambre." : "Rendez l'argent au client si besoin."} Le ticket reste dans la liste, barré, avec le motif.
              </Body1>
              <Field label="Motif" required>
                <Textarea value={motif} onChange={(_e, data) => setMotif(data.value)} placeholder="Erreur de saisie, plat renvoyé…" autoFocus />
              </Field>
              {erreur && (
                <MessageBar intent="error">
                  <MessageBarBody>{erreur}</MessageBarBody>
                </MessageBar>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={onFin}>Garder le ticket</Button>
              <Button type="submit" appearance="primary" disabled={enCours || !motif.trim() || caisse.lectureSeule} icon={enCours ? <Spinner size="tiny" /> : <DismissCircleRegular />}>
                Annuler le ticket
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  )
}
