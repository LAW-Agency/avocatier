import { Body1, Button, Caption1, Dropdown, Input, MessageBar, MessageBarBody, Option, Spinner, Text, Tooltip, mergeClasses } from "@fluentui/react-components"
import { DeleteRegular, MoneyRegular, ReceiptRegular } from "@fluentui/react-icons"
import { useState, type FormEvent } from "react"
import { formaterHeure, nombreNuits, pluriel } from "@partage/dates"
import { DEVISES, formaterDansDevise } from "@partage/devises"
import { convertir, soldeEn } from "@partage/folio"
import type { CodeDevise, ModePaiement, Paiement, Reservation } from "@partage/types"
import { numeroRecu } from "../documents"
import { encaisseDe, restaurantSur, soldeDe, useDonneesChargees, useLectureSeule } from "../donnees"
import { useFichiers } from "../fichiers"
import { MODES_PAIEMENT } from "../libelles"
import { useEncaissementsStyles } from "./useReservationStyles.styles"
import { usePrix } from "../montants"
import TicketsRestaurant from "./TicketsRestaurant"

// Montant proposé dans la devise choisie : le reste à payer, ou le trop-perçu à rendre (négatif)
const proposition = (solde: number) => (solde === 0 ? "" : String(solde).replace(".", ","))

// Encaissements d'une réservation : hébergement, restaurant et bar mis sur la chambre, déjà payé, reste dû ; saisie
// d'un paiement en ariary, en euros ou en dollars (négatif : remboursement), contre-valeur en euros au taux du jour.
// Suppression réservée aux gérants (la réception corrige par un remboursement)
export default function Encaissements({ reservation: r }: { reservation: Reservation }) {
  const lectureSeule = useLectureSeule()
  const formaterPrix = usePrix()
  const styles = useEncaissementsStyles()
  const { d, executer, gerant, paiementsDe } = useDonneesChargees()
  const { imprimerRecu } = useFichiers()
  const paiements = paiementsDe(r)
  const solde = soldeDe(r, d)
  const encaisse = encaisseDe(r, d)
  const restaurant = restaurantSur(r, d)
  const tickets = d.consommations.filter((c) => c.reservationId === r.id)
  const actif = r.statut === "confirmee" || r.statut === "option"
  const nuits = nombreNuits(r.arrivee, r.depart)
  const restaurantEuros = convertir(restaurant, "MGA", "EUR", d.devises.taux)
  const du = (actif ? r.montantTotal : 0) + restaurantEuros
  const choixDevises = [...new Set<CodeDevise>(["MGA", "EUR", ...d.devises.actives])]
  const [devise, setDevise] = useState<CodeDevise>("MGA")
  const soldeDans = (code: CodeDevise) => soldeEn(code, r, d.paiements, d.consommations, d.devises.taux)
  const [montant, setMontant] = useState(() => proposition(soldeDans("MGA")))
  const [mode, setMode] = useState<ModePaiement>("especes")
  const [note, setNote] = useState("")
  const [enCours, setEnCours] = useState(false)
  // Ligne dont le reçu s'enregistre ou qui se supprime
  const [ligneEnCours, setLigneEnCours] = useState<{ id: string; action: "recu" | "suppression" } | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const membre = (id?: string) => d.equipe.find((m) => m.id === id)?.prenom

  function choisirDevise(code: CodeDevise) {
    setDevise(code)
    setMontant(proposition(soldeDans(code)))
  }

  async function encaisser(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    setErreur(null)
    const valeur = Number(montant.replace(/\s/g, "").replace(",", "."))
    const resultat = await executer("POST", "/api/hotes/paiements", { reservationId: r.id, montant: valeur, devise, mode, note })
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    // Les données rechargées arrivent juste après : reste calculé sur ce qui vient d'être reçu
    setMontant(proposition(soldeEn(devise, r, [...d.paiements, { reservationId: r.id, montant: convertir(valeur, devise, "EUR", d.devises.taux), devise, montantDevise: valeur }], d.consommations, d.devises.taux)))
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
      {/* Note du séjour, ligne à ligne : ce qui est dû, ce qui a été reçu, ce qui reste */}
      <dl className={styles.note}>
        <div className={styles.ligneNote}>
          <dt>
            Hébergement · {pluriel(nuits, "nuit")}
            {!actif && " (séjour annulé)"}
          </dt>
          <dd className={styles.montantNote}>{formaterPrix(actif ? r.montantTotal : 0)}</dd>
        </div>
        {tickets.length > 0 && (
          <div className={styles.ligneNote}>
            <dt>
              Restaurant et bar · {pluriel(tickets.length, "ticket")}
              {tickets.every((t) => t.factureId) ? " (facturés)" : ""}
            </dt>
            <dd className={styles.montantNote}>{formaterPrix(restaurantEuros)}</dd>
          </div>
        )}
        <div className={mergeClasses(styles.ligneNote, styles.sousTotal)}>
          <dt>Total</dt>
          <dd className={styles.montantNote}>{formaterPrix(du)}</dd>
        </div>
        <div className={styles.ligneNote}>
          <dt>Encaissé{paiements.length > 0 && ` · ${pluriel(paiements.length, "règlement")}`}</dt>
          <dd className={mergeClasses(styles.montantNote, encaisse > 0 && styles.solde)}>{encaisse ? `− ${formaterPrix(encaisse)}` : formaterPrix(0)}</dd>
        </div>
        <div className={mergeClasses(styles.ligneNote, styles.reste)}>
          <dt>{solde > 0 ? (r.statut === "option" ? "À payer si confirmée" : "Reste à payer") : solde < 0 ? "Trop-perçu" : "Soldé"}</dt>
          <dd className={mergeClasses(styles.montantNote, styles.grandMontant, solde > 0 ? styles.du : styles.solde)}>{formaterPrix(Math.abs(solde))}</dd>
        </div>
      </dl>

      {tickets.length > 0 && (
        <div className={styles.bloc}>
          <Text weight="semibold">Restaurant et bar sur la chambre</Text>
          <TicketsRestaurant consommations={tickets} />
        </div>
      )}

      {solde < 0 && (
        <MessageBar intent="warning">
          <MessageBarBody>
            {actif ? "Le client a payé plus que le montant dû" : "Ce séjour n'a pas lieu mais des encaissements restent"} : rendez-lui {formaterPrix(-solde)} et
            enregistrez le remboursement (montant négatif, déjà proposé ci-dessous).
          </MessageBarBody>
        </MessageBar>
      )}

      {paiements.length > 0 && <Text weight="semibold">Règlements reçus</Text>}
      {paiements.length > 0 && (
        <ul className={styles.liste}>
          {paiements.map((p) => (
            <li key={p.id} className={styles.ligne}>
              <div>
                <Body1 block>
                  {MODES_PAIEMENT[p.mode]}
                  {p.devise !== "EUR" && p.montantDevise !== undefined && ` · ${formaterDansDevise(p.montantDevise, p.devise)}`}
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
            input={{ className: styles.nombre, inputMode: "decimal" }}
            contentAfter={DEVISES[devise].symbole}
            value={montant}
            onChange={(_e, data) => setMontant(data.value)}
            aria-label="Montant encaissé (négatif pour un remboursement)"
            placeholder="0"
          />
          <Dropdown className={styles.champ} value={DEVISES[devise].nom} selectedOptions={[devise]} onOptionSelect={(_e, data) => choisirDevise(data.optionValue as CodeDevise)} aria-label="Devise">
            {choixDevises.map((code) => (
              <Option key={code} value={code} text={DEVISES[code].nom}>
                {`${DEVISES[code].nom} (${DEVISES[code].symbole})`}
              </Option>
            ))}
          </Dropdown>
          <Dropdown className={styles.champ} value={MODES_PAIEMENT[mode]} selectedOptions={[mode]} onOptionSelect={(_e, data) => setMode(data.optionValue as ModePaiement)} aria-label="Mode de paiement">
            {(Object.keys(MODES_PAIEMENT) as ModePaiement[]).map((m) => (
              <Option key={m} value={m}>
                {MODES_PAIEMENT[m]}
              </Option>
            ))}
          </Dropdown>
          <Input className={styles.champ} value={note} onChange={(_e, data) => setNote(data.value)} placeholder="Note (acompte…)" aria-label="Note" />
          <Button type="submit" appearance="primary" disabled={enCours || lectureSeule || !montant.trim()} icon={enCours ? <Spinner size="tiny" /> : <MoneyRegular />}>
            {montant.trim().startsWith("-") ? "Rembourser" : "Encaisser"}
          </Button>
        </form>
      )}
      {devise !== "EUR" && (
        <Caption1 className={styles.libelle}>
          Au taux de Tarifs : 1 € = {formaterDansDevise(convertir(1, "EUR", devise, d.devises.taux), devise)}. Le reçu indique le montant dans sa devise.
        </Caption1>
      )}
      {erreur && (
        <MessageBar intent="error">
          <MessageBarBody>{erreur}</MessageBarBody>
        </MessageBar>
      )}
    </div>
  )
}
