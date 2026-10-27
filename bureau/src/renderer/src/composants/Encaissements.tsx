import { Body1, Button, Caption1, Dropdown, Input, MessageBar, MessageBarBody, Option, Spinner, Text, Tooltip, mergeClasses } from "@fluentui/react-components"
import { DeleteRegular, MoneyRegular, ReceiptRegular } from "@fluentui/react-icons"
import { useState, type FormEvent } from "react"
import { formaterHeure } from "@partage/dates"
import type { ModePaiement, Paiement, Reservation } from "@partage/types"
import { numeroRecu } from "../documents"
import { encaisseDe, soldeDe, useDonneesChargees, useLectureSeule } from "../donnees"
import { useFichiers } from "../fichiers"
import { MODES_PAIEMENT } from "../libelles"
import { useEncaissementsStyles } from "./useReservationStyles.styles"
import { usePrix } from "../montants"

// Encaissements d'une réservation : montant, déjà payé, reste dû ; saisie d'un paiement (négatif : remboursement).
// Suppression réservée aux gérants (la réception corrige par un remboursement)
export default function Encaissements({ reservation: r }: { reservation: Reservation }) {
  const lectureSeule = useLectureSeule()
  const formaterPrix = usePrix()
  const styles = useEncaissementsStyles()
  const { d, executer, gerant, paiementsDe } = useDonneesChargees()
  const { imprimerRecu } = useFichiers()
  const paiements = paiementsDe(r)
  const solde = soldeDe(r, d.paiements)
  const encaisse = encaisseDe(r, d.paiements)
  const actif = r.statut === "confirmee" || r.statut === "option"
  // Montant proposé : le reste à payer, ou le trop-perçu à rendre (négatif)
  const [montant, setMontant] = useState(solde !== 0 ? String(solde) : "")
  const [mode, setMode] = useState<ModePaiement>("especes")
  const [note, setNote] = useState("")
  const [enCours, setEnCours] = useState(false)
  // Ligne dont le reçu s'enregistre ou qui se supprime
  const [ligneEnCours, setLigneEnCours] = useState<{ id: string; action: "recu" | "suppression" } | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const membre = (id?: string) => d.equipe.find((m) => m.id === id)?.prenom

  async function encaisser(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    setErreur(null)
    const valeur = Number(montant.replace(/\s/g, "").replace(",", "."))
    const resultat = await executer("POST", "/api/hotes/paiements", { reservationId: r.id, montant: valeur, mode, note })
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    const reste = solde - valeur
    setMontant(reste !== 0 ? String(reste) : "")
    setNote("")
  }

  async function supprimer(id: string) {
    setLigneEnCours({ id, action: "suppression" })
    const resultat = await executer("DELETE", `/api/hotes/paiements/${encodeURIComponent(id)}`)
    setLigneEnCours(null)
    if (!resultat.ok) setErreur(resultat.erreur)
  }

  async function recu(p: Paiement) {
    setLigneEnCours({ id: p.id, action: "recu" })
    await imprimerRecu(p)
    setLigneEnCours(null)
  }

  return (
    <div className={styles.root}>
      <div className={styles.totaux}>
        <div className={styles.total}>
          <Caption1 className={styles.libelle}>{actif ? "Montant du séjour" : "Montant dû (séjour annulé)"}</Caption1>
          <span className={styles.chiffre}>{formaterPrix(actif ? r.montantTotal : 0)}</span>
        </div>
        <div className={styles.total}>
          <Caption1 className={styles.libelle}>Encaissé</Caption1>
          <span className={styles.chiffre}>{formaterPrix(encaisse)}</span>
        </div>
        <div className={styles.total}>
          <Caption1 className={styles.libelle}>{solde > 0 ? (r.statut === "option" ? "À payer si confirmée" : "Reste à payer") : solde < 0 ? "Trop-perçu" : "Soldé"}</Caption1>
          <span className={mergeClasses(styles.chiffre, solde > 0 ? styles.reste : styles.solde)}>{formaterPrix(Math.abs(solde))}</span>
        </div>
      </div>

      {solde < 0 && (
        <MessageBar intent="warning">
          <MessageBarBody>
            {actif ? "Le client a payé plus que le montant du séjour" : "Ce séjour n'a pas lieu mais des encaissements restent"} : rendez-lui{" "}
            {formaterPrix(-solde)} et enregistrez le remboursement (montant négatif, déjà proposé ci-dessous).
          </MessageBarBody>
        </MessageBar>
      )}

      {paiements.length > 0 && (
        <ul className={styles.liste}>
          {paiements.map((p) => (
            <li key={p.id} className={styles.ligne}>
              <div>
                <Body1 block>
                  {MODES_PAIEMENT[p.mode]}
                  {p.note && ` · ${p.note}`}
                </Body1>
                <Caption1 className={styles.libelle}>
                  {formaterHeure(p.le)}
                  {membre(p.enregistrePar) && `, par ${membre(p.enregistrePar)}`} · reçu {numeroRecu(p)}
                </Caption1>
              </div>
              <Text className={styles.montant}>{formaterPrix(p.montant)}</Text>
              <Tooltip content="Reçu (PDF)" relationship="label">
                <Button
                  appearance="subtle"
                  size="small"
                  disabled={ligneEnCours?.id === p.id}
                  icon={ligneEnCours?.id === p.id && ligneEnCours.action === "recu" ? <Spinner size="tiny" /> : <ReceiptRegular />}
                  onClick={() => recu(p)}
                />
              </Tooltip>
              {gerant ? (
                <Tooltip content="Supprimer cet encaissement" relationship="label">
                  <Button
                    appearance="subtle"
                    size="small"
                    disabled={ligneEnCours?.id === p.id || lectureSeule}
                    icon={ligneEnCours?.id === p.id && ligneEnCours.action === "suppression" ? <Spinner size="tiny" /> : <DeleteRegular />}
                    onClick={() => supprimer(p.id)}
                  />
                </Tooltip>
              ) : (
                <span />
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Saisie : séjours confirmés et demandes (acompte) ; remboursement possible sur une réservation annulée */}
      {(r.statut === "confirmee" || r.statut === "option" || paiements.length > 0) && (
        <form className={styles.formulaire} onSubmit={encaisser}>
          <Input
            className={styles.champ}
            input={{ className: styles.nombre, inputMode: "numeric" }}
            contentAfter="€"
            value={montant}
            onChange={(_e, data) => setMontant(data.value)}
            aria-label="Montant encaissé (négatif pour un remboursement)"
            placeholder="0"
          />
          <Dropdown className={styles.champ} value={MODES_PAIEMENT[mode]} selectedOptions={[mode]} onOptionSelect={(_e, data) => setMode(data.optionValue as ModePaiement)} aria-label="Mode de paiement">
            {(Object.keys(MODES_PAIEMENT) as ModePaiement[]).map((m) => (
              <Option key={m} value={m}>
                {MODES_PAIEMENT[m]}
              </Option>
            ))}
          </Dropdown>
          <Input className={styles.champ} value={note} onChange={(_e, data) => setNote(data.value)} placeholder="Note (acompte, reçu n°…)" aria-label="Note" />
          <Button type="submit" appearance="primary" disabled={enCours || lectureSeule || !montant.trim()} icon={enCours ? <Spinner size="tiny" /> : <MoneyRegular />}>
            {montant.trim().startsWith("-") ? "Rembourser" : "Encaisser"}
          </Button>
        </form>
      )}
      {erreur && (
        <MessageBar intent="error">
          <MessageBarBody>{erreur}</MessageBarBody>
        </MessageBar>
      )}
    </div>
  )
}
