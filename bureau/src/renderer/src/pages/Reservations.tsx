import { Button, CounterBadge, Spinner, Tab, TabList, Tooltip, makeStyles, tokens } from "@fluentui/react-components"
import { ArrowDownloadRegular, CalendarAddRegular } from "@fluentui/react-icons"
import type { StatutReservation } from "@partage/types"
import { EnTete } from "../composants/commun"
import TableReservations from "../composants/TableReservations"
import { nomChambre, nomDe, useDonneesChargees, useLectureSeule } from "../donnees"
import { feuilleReservations } from "../exports"
import { useFichiers } from "../fichiers"

const FILTRES: { statut: StatutReservation | null; libelle: string }[] = [
  { statut: null, libelle: "Toutes" },
  { statut: "option", libelle: "À traiter" },
  { statut: "confirmee", libelle: "Confirmées" },
  { statut: "annulee", libelle: "Annulées" },
  { statut: "refusee", libelle: "Refusées" },
  { statut: "expiree", libelle: "Expirées" },
]

const useStyles = makeStyles({
  pile: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalL },
  onglet: { display: "inline-flex", alignItems: "center", columnGap: tokens.spacingHorizontalSNudge },
})

// Texte comparable : sans accents ni majuscules (« Joëlle » trouvé avec « joelle »)
const normaliser = (texte: string) => texte.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()

// Toutes les demandes et réservations, filtrables par statut et par la recherche de la barre du haut
export default function Reservations({ filtre }: { filtre: StatutReservation | null }) {
  const lectureSeule = useLectureSeule()
  const styles = useStyles()
  const { d, clientDe, naviguer, recherche, ouvrirNouvelleReservation } = useDonneesChargees()
  const { exporter, exportEnCours } = useFichiers()

  const cherche = normaliser(recherche.trim())
  const trouvees = d.reservations.filter((r) => {
    if (!cherche) return true
    const client = clientDe(r)
    return normaliser([r.reference, nomDe(client), client?.email ?? "", r.telephone, nomChambre(d, r.chambreId)].join(" ")).includes(cherche)
  })

  // À traiter d'abord (option la plus proche de l'échéance), puis par date d'arrivée, la plus récente en haut
  const liste = trouvees
    .filter((r) => !filtre || r.statut === filtre)
    .sort((a, b) => {
      if (a.statut === "option" && b.statut !== "option") return -1
      if (b.statut === "option" && a.statut !== "option") return 1
      if (a.statut === "option") return (a.expireLe ?? "").localeCompare(b.expireLe ?? "")
      return b.arrivee.localeCompare(a.arrivee)
    })

  return (
    <>
      <EnTete
        titre={cherche ? `Résultats pour « ${recherche.trim()} »` : "Réservations"}
        description="Demandes reçues sur le site et séjours confirmés. Une demande bloque les dates 48 h en attendant votre réponse."
        actions={
          <>
            <Tooltip content="Exporter la liste affichée (onglet et recherche) dans un classeur Excel (.xlsx)" relationship="description">
              <Button icon={exportEnCours ? <Spinner size="tiny" /> : <ArrowDownloadRegular />} disabled={exportEnCours || liste.length === 0} onClick={() => exporter("Réservations", feuilleReservations(liste, d, [filtre && FILTRES.find((f) => f.statut === filtre)?.libelle.toLowerCase(), cherche ? `recherche « ${recherche.trim()} »` : ""].filter(Boolean).join(", ") || undefined))}>
                Exporter
              </Button>
            </Tooltip>
            <Button appearance="primary" icon={<CalendarAddRegular />} disabled={lectureSeule} onClick={() => ouvrirNouvelleReservation()}>
              Nouvelle réservation
            </Button>
          </>
        }
      />
      <div className={styles.pile}>
        <TabList selectedValue={filtre ?? "toutes"} onTabSelect={(_e, data) => naviguer({ page: "reservations", filtre: data.value === "toutes" ? null : (data.value as StatutReservation) })}>
          {FILTRES.map((f) => {
            const nombre = trouvees.filter((r) => !f.statut || r.statut === f.statut).length
            const enAvant = f.statut === "option" && nombre > 0
            return (
              <Tab key={f.libelle} value={f.statut ?? "toutes"}>
                <span className={styles.onglet}>
                  {f.libelle}
                  <CounterBadge count={nombre} showZero size="small" appearance={enAvant ? "filled" : "ghost"} color={enAvant ? "brand" : "informative"} />
                </span>
              </Tab>
            )
          })}
        </TabList>
        <TableReservations
          // Nouvel onglet ou nouvelle recherche : la liste repart des 50 premières
          key={`${filtre ?? "toutes"}|${cherche}`}
          reservations={liste}
          vide={{
            titre: "Aucune réservation",
            texte: cherche
              ? "Aucune réservation ne correspond à cette recherche."
              : filtre
                ? "Aucune réservation avec ce statut pour l'instant."
                : "Les demandes envoyées depuis le site apparaîtront ici.",
          }}
        />
      </div>
    </>
  )
}
