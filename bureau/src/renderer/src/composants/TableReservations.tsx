import {
  Avatar,
  Button,
  Caption1,
  Link,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components"
import { CalendarCancelRegular } from "@fluentui/react-icons"
import { useState, type ReactNode } from "react"
import { formaterPlage, nombreNuits, pluriel, tempsRestant } from "@partage/dates"
import type { Reservation } from "@partage/types"
import { estTermine, nomChambre, nomDe, soldeDe, useDonneesChargees } from "../donnees"
import { AfficherPlus, BadgeStatut, PAR_PAQUET, Vide } from "./commun"
import FicheReservation from "./FicheReservation"
import { useApparitionStyles, useCadreTableStyles } from "./useCommunStyles.styles"
import { usePrix } from "../montants"

const useStyles = makeStyles({
  table: { tableLayout: "fixed" },
  expire: { color: tokens.colorStatusDangerForeground1 },
  reste: { color: tokens.colorStatusWarningForeground1 },
  statut: { display: "flex", flexDirection: "column", alignItems: "flex-start", rowGap: tokens.spacingVerticalXXS },
  // Fenêtre étroite (navigation ouverte sur un petit portable) : la colonne Hébergement passe sous les dates
  colHebergement: { "@media (max-width: 1240px)": { display: "none" } },
  hebergementSous: { "@media (min-width: 1241px)": { display: "none" } },
})

interface TableReservationsProps {
  reservations: Reservation[]
  vide: { titre: string; texte: string; action?: ReactNode }
  avecClient?: boolean // masqué sur la fiche du client, où il est déjà affiché
}

// Liste dense des réservations : une ligne par séjour, détail, encaissements et actions dans la fiche
export default function TableReservations({ reservations, vide, avecClient = true }: TableReservationsProps) {
  const formaterPrix = usePrix()
  const styles = useStyles()
  const cadre = useCadreTableStyles()
  const apparition = useApparitionStyles()
  const { d, clientDe, naviguer } = useDonneesChargees()
  const [affichees, setAffichees] = useState(PAR_PAQUET)

  if (reservations.length === 0) return <Vide Icone={CalendarCancelRegular} titre={vide.titre} texte={vide.texte} action={vide.action} />

  // Nouvel onglet ou nouvelle recherche (clé donnée par l'écran) : la liste apparaît en fondu
  return (
    <div className={apparition.root}>
      <div className={cadre.root}>
        <Table className={styles.table} aria-label="Réservations">
          <TableHeader className={cadre.entete}>
            <TableRow>
              <TableHeaderCell className={cadre.premiere}>Séjour</TableHeaderCell>
              {avecClient && <TableHeaderCell style={{ width: "22%" }}>Client</TableHeaderCell>}
              <TableHeaderCell className={styles.colHebergement} style={{ width: "16%" }}>
                Hébergement
              </TableHeaderCell>
              <TableHeaderCell style={{ width: "110px" }}>
                <span className={cadre.droite}>Montant</span>
              </TableHeaderCell>
              <TableHeaderCell style={{ width: "160px" }}>Statut</TableHeaderCell>
              <TableHeaderCell className={cadre.derniere} style={{ width: "120px" }} aria-label="Actions" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.slice(0, affichees).map((r) => {
              const client = clientDe(r)
              const hebergement = nomChambre(d, r.chambreId)
              const termine = estTermine(r, d.aujourdhui)
              const restant = r.statut === "option" && r.expireLe ? tempsRestant(r.expireLe) : null
              const solde = r.statut === "confirmee" ? soldeDe(r, d.paiements) : 0
              return (
                <TableRow key={r.id}>
                  <TableCell className={cadre.premiere}>
                    <TableCellLayout
                      description={
                        <>
                          <span className={styles.hebergementSous}>{hebergement}, </span>
                          {pluriel(nombreNuits(r.arrivee, r.depart), "nuit")}, {pluriel(r.adultes + r.enfants, "voyageur")}
                        </>
                      }
                    >
                      <Text weight="semibold">{formaterPlage(r.arrivee, r.depart)}</Text>
                    </TableCellLayout>
                  </TableCell>
                  {avecClient && (
                    <TableCell>
                      <TableCellLayout truncate media={<Avatar name={nomDe(client)} color="colorful" size={28} />} description={client?.pays}>
                        {client ? <Link onClick={() => naviguer({ page: "client", id: client.id })}>{nomDe(client)}</Link> : nomDe(client)}
                      </TableCellLayout>
                    </TableCell>
                  )}
                  <TableCell className={styles.colHebergement}>
                    <TableCellLayout truncate>{hebergement}</TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <span className={mergeClasses(cadre.droite, cadre.nombre)}>{formaterPrix(r.montantTotal)}</span>
                  </TableCell>
                  <TableCell>
                    <div className={styles.statut}>
                      <BadgeStatut reservation={r} termine={termine} />
                      {restant && <Caption1 className={styles.expire}>Expire dans {restant}</Caption1>}
                      {solde > 0 && <Caption1 className={styles.reste}>Reste {formaterPrix(solde)}</Caption1>}
                    </div>
                  </TableCell>
                  <TableCell className={cadre.derniere}>
                    <span className={cadre.droite}>
                      {/* Demande en option : la fiche s'ouvre avec Confirmer / Refuser en pied */}
                      <FicheReservation
                        reservation={r}
                        declencheur={
                          r.statut === "option" ? (
                            <Button appearance="primary" size="small">
                              Traiter
                            </Button>
                          ) : undefined
                        }
                      />
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <AfficherPlus affichees={affichees} total={reservations.length} unite={["réservation", "réservations"]} onPlus={() => setAffichees(affichees + PAR_PAQUET)} />
    </div>
  )
}
