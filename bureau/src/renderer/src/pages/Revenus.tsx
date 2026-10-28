import {
  Avatar,
  Body1,
  Button,
  Caption1,
  Dropdown,
  Option,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  mergeClasses,
} from "@fluentui/react-components"
import { ArrowDownloadRegular, ArrowUndoRegular, MoneyRegular, ReceiptMoneyRegular, TagRegular, WalletRegular, CheckmarkCircleRegular } from "@fluentui/react-icons"
import { useState } from "react"
import { formaterHeure, formaterPlage } from "@partage/dates"
import { libelleStatutHote } from "@partage/statuts"
import type { ModePaiement, Reservation } from "@partage/types"
import { alertesDe } from "../alertes"
import { Carte, EnTete, Vide } from "../composants/commun"
import FicheReservation from "../composants/FicheReservation"
import { Histogramme, Indicateur, Repartition } from "../composants/graphiques"
import { useCadreTableStyles } from "../composants/useCommunStyles.styles"
import { nomChambre, nomDe, soldeDe, useDonneesChargees } from "../donnees"
import { feuilleEncaissements } from "../exports"
import { useFichiers } from "../fichiers"
import { MODES_PAIEMENT, NOMS_SOURCES } from "../libelles"
import { debutDeMois, encaissementsDans, evolution, indicateurs, nomDuMois, parMois, periodes, PERIODES, repartition, type ChoixPeriode } from "../statistiques"
import { useGestionStyles } from "./useGestionStyles.styles"
import { usePrix } from "../montants"

// Revenus (gérants) : chiffre d'affaires réparti par nuit, encaissements, reste à encaisser, par mois
// et par mode de paiement. Montants en euros, comme les tarifs.
export default function Revenus() {
  const formaterPrix = usePrix()
  const styles = useGestionStyles()
  const cadre = useCadreTableStyles()
  const { d, clientDe } = useDonneesChargees()
  const { exporter, exportEnCours } = useFichiers()
  const [choix, setChoix] = useState<ChoixPeriode>("mois")
  const { actuelle, precedente } = periodes(choix, d.aujourdhui)
  const maintenant = indicateurs(d, actuelle)
  const avant = indicateurs(d, precedente)

  const douzeMois = parMois(d, { debut: debutDeMois(d.aujourdhui, -11), fin: debutDeMois(d.aujourdhui, 1) })
  const moisCourant = debutDeMois(d.aujourdhui)
  const encaissements = encaissementsDans(d.paiements, actuelle)
  const parMode = repartition(
    (Object.keys(MODES_PAIEMENT) as ModePaiement[]).map((mode) => ({ cle: mode, valeur: encaissements.filter((p) => p.mode === mode).reduce((t, p) => t + p.montant, 0) })),
  ).filter((m) => m.valeur > 0)
  const confirmees = d.reservations.filter((r) => r.statut === "confirmee")
  const parSource = repartition(
    (Object.keys(NOMS_SOURCES) as Reservation["source"][]).map((source) => ({
      cle: source,
      valeur: confirmees.filter((r) => r.source === source && r.arrivee >= actuelle.debut && r.arrivee < actuelle.fin).reduce((t, r) => t + r.montantTotal, 0),
    })),
  ).filter((s) => s.valeur > 0)
  // Impayés : séjours confirmés non soldés, les plus anciens d'abord
  const impayes = confirmees
    .map((r) => ({ r, solde: soldeDe(r, d.paiements) }))
    .filter(({ solde }) => solde > 0)
    .sort((a, b) => a.r.arrivee.localeCompare(b.r.arrivee))
  const resteTotal = impayes.reduce((t, { solde }) => t + solde, 0)
  // Trop-perçus : tout statut (une réservation annulée déjà payée ne doit plus rien)
  const { tropPercus } = alertesDe(d)
  const tropPercuTotal = tropPercus.reduce((t, r) => t - soldeDe(r, d.paiements), 0)

  return (
    <>
      <EnTete
        titre="Revenus"
        description="Chiffre d'affaires des séjours confirmés (réparti nuit par nuit), encaissements et reste à encaisser."
        actions={
          <>
            <Dropdown className={styles.periode} value={PERIODES[choix]} selectedOptions={[choix]} onOptionSelect={(_e, data) => setChoix(data.optionValue as ChoixPeriode)} aria-label="Période">
              {(Object.keys(PERIODES) as ChoixPeriode[]).map((c) => (
                <Option key={c} value={c}>
                  {PERIODES[c]}
                </Option>
              ))}
            </Dropdown>
            <Button
              icon={exportEnCours ? <Spinner size="tiny" /> : <ArrowDownloadRegular />}
              disabled={exportEnCours || encaissements.length === 0}
              onClick={() => exporter(`Encaissements ${PERIODES[choix].toLowerCase()}`, feuilleEncaissements(encaissements, d, PERIODES[choix].toLowerCase()))}
            >
              Exporter les encaissements
            </Button>
          </>
        }
      />

      <div className={styles.chiffres}>
        <Indicateur Icone={MoneyRegular} libelle="Chiffre d'affaires" valeur={formaterPrix(maintenant.chiffreAffaires)} evolution={evolution(maintenant.chiffreAffaires, avant.chiffreAffaires)} note="Nuits de la période" />
        <Indicateur Icone={WalletRegular} libelle="Encaissé" valeur={formaterPrix(maintenant.encaisse)} evolution={evolution(maintenant.encaisse, avant.encaisse)} note={`${encaissements.length} encaissements`} />
        <Indicateur Icone={ReceiptMoneyRegular} libelle="Reste à encaisser" valeur={formaterPrix(resteTotal)} note={`${impayes.length} séjours non soldés, toutes dates`} />
        <Indicateur Icone={TagRegular} libelle="Prix moyen par nuit" valeur={formaterPrix(maintenant.prixMoyen)} evolution={evolution(maintenant.prixMoyen, avant.prixMoyen)} note={`RevPAR ${formaterPrix(maintenant.revPar)}`} />
      </div>

      <Carte data-visite="revenus-mois" titre="Les 12 derniers mois" description="Chiffre d'affaires des nuits du mois et encaissements datés du mois">
        <Histogramme
          barres={douzeMois.map((m) => ({
            cle: m.debut,
            libelle: nomDuMois(m.debut, m.debut.slice(5, 7) === "01"),
            valeur: m.indicateurs.chiffreAffaires,
            secondaire: m.indicateurs.encaisse,
            actuelle: m.debut === moisCourant,
            etiquette: m.indicateurs.chiffreAffaires >= 1000 ? `${Math.round(m.indicateurs.chiffreAffaires / 100) / 10} k` : String(m.indicateurs.chiffreAffaires),
          }))}
          formater={formaterPrix}
          legende={{ principale: "Chiffre d'affaires", secondaire: "Encaissé" }}
        />
      </Carte>

      <div className={styles.moitie}>
        <Carte titre="Encaissements par mode" description={PERIODES[choix]}>
          {parMode.length ? (
            <Repartition lignes={parMode.map((m) => ({ cle: m.cle, libelle: MODES_PAIEMENT[m.cle], part: m.part, detail: formaterPrix(m.valeur) }))} />
          ) : (
            <Body1 className={styles.secondaire}>Aucun encaissement sur la période.</Body1>
          )}
        </Carte>
        <Carte titre="Chiffre d'affaires par provenance" description="Séjours confirmés commençant dans la période">
          {parSource.length ? (
            <Repartition lignes={parSource.map((s) => ({ cle: s.cle, libelle: NOMS_SOURCES[s.cle], part: s.part, detail: formaterPrix(s.valeur) }))} />
          ) : (
            <Body1 className={styles.secondaire}>Aucun séjour confirmé sur la période.</Body1>
          )}
        </Carte>
      </div>

      {tropPercus.length > 0 && (
        <Carte titre="Trop-perçus à rembourser" description="Séjours annulés déjà payés, ou payés plus que leur montant" action={<Text className={styles.reste}>{formaterPrix(tropPercuTotal)}</Text>}>
          <div className={cadre.root}>
            <Table size="small" aria-label="Trop-perçus à rembourser">
              <TableHeader className={cadre.entete}>
                <TableRow>
                  <TableHeaderCell className={cadre.premiere}>Client</TableHeaderCell>
                  <TableHeaderCell>Séjour</TableHeaderCell>
                  <TableHeaderCell style={{ width: "120px" }}>
                    <span className={cadre.droite}>À rendre</span>
                  </TableHeaderCell>
                  <TableHeaderCell style={{ width: "140px" }} aria-label="Rembourser" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tropPercus.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className={cadre.premiere}>
                      <TableCellLayout truncate media={<Avatar name={nomDe(clientDe(r))} color="colorful" size={24} />}>
                        {nomDe(clientDe(r))}
                      </TableCellLayout>
                    </TableCell>
                    <TableCell>
                      <TableCellLayout truncate description={`${libelleStatutHote[r.statut]} · ${nomChambre(d, r.chambreId)}`}>{formaterPlage(r.arrivee, r.depart)}</TableCellLayout>
                    </TableCell>
                    <TableCell>
                      <span className={mergeClasses(cadre.droite, styles.reste)}>{formaterPrix(-soldeDe(r, d.paiements))}</span>
                    </TableCell>
                    <TableCell>
                      <span className={cadre.droite}>
                        <FicheReservation
                          reservation={r}
                          declencheur={
                            <Button size="small" icon={<ArrowUndoRegular />}>
                              Rembourser
                            </Button>
                          }
                        />
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Carte>
      )}

      <div className={styles.deuxColonnes}>
        <Carte data-visite="revenus-reste" titre="Reste à encaisser" description="Séjours confirmés non soldés">
          {impayes.length === 0 ? (
            <Vide Icone={CheckmarkCircleRegular} titre="Tout est encaissé" texte="Aucun séjour confirmé n'attend de paiement." />
          ) : (
            <div className={mergeClasses(cadre.root, cadre.defile)}>
              <Table size="small" aria-label="Séjours non soldés">
                <TableHeader className={cadre.entete}>
                  <TableRow>
                    <TableHeaderCell className={cadre.premiere}>Client</TableHeaderCell>
                    <TableHeaderCell>Séjour</TableHeaderCell>
                    <TableHeaderCell style={{ width: "110px" }}>
                      <span className={cadre.droite}>Reste</span>
                    </TableHeaderCell>
                    <TableHeaderCell style={{ width: "100px" }} aria-label="Fiche" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {impayes.map(({ r, solde }) => (
                    <TableRow key={r.id}>
                      <TableCell className={cadre.premiere}>
                        <TableCellLayout truncate media={<Avatar name={nomDe(clientDe(r))} color="colorful" size={24} />}>
                          {nomDe(clientDe(r))}
                        </TableCellLayout>
                      </TableCell>
                      <TableCell>
                        <TableCellLayout truncate description={nomChambre(d, r.chambreId)}>
                          {formaterPlage(r.arrivee, r.depart)}
                        </TableCellLayout>
                      </TableCell>
                      <TableCell>
                        <span className={mergeClasses(cadre.droite, styles.reste)}>{formaterPrix(solde)}</span>
                      </TableCell>
                      <TableCell>
                        <span className={cadre.droite}>
                          <FicheReservation reservation={r} />
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Carte>

        <Carte titre="Derniers encaissements" description={PERIODES[choix]}>
          {encaissements.length === 0 ? (
            <Body1 className={styles.secondaire}>Aucun encaissement sur la période.</Body1>
          ) : (
            <ul className={styles.liste}>
              {[...encaissements]
                .reverse()
                .slice(0, 12)
                .map((p) => {
                  const r = d.reservations.find((x) => x.id === p.reservationId)
                  return (
                    <li key={p.id} className={styles.ligne}>
                      <div>
                        <Text block truncate wrap={false}>
                          {r ? nomDe(clientDe(r)) : "Réservation supprimée"}
                        </Text>
                        <Caption1 className={styles.secondaire}>
                          {MODES_PAIEMENT[p.mode]} · {formaterHeure(p.le)}
                        </Caption1>
                      </div>
                      <Text className={styles.montant}>{formaterPrix(p.montant)}</Text>
                    </li>
                  )
                })}
            </ul>
          )}
        </Carte>
      </div>
    </>
  )
}
