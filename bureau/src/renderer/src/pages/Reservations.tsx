import { Button, CounterBadge, Tab, TabList, makeStyles, tokens } from "@fluentui/react-components"
import { CalendarAddRegular } from "@fluentui/react-icons"
import type { StatutReservation } from "@partage/types"
import { EnTete } from "../composants/commun"
import TableReservations from "../composants/TableReservations"
import { nomDe, useDonneesChargees } from "../donnees"

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
  const styles = useStyles()
  const { d, clientDe, hebergementDe, naviguer, recherche, ouvrirNouvelleReservation } = useDonneesChargees()

  const cherche = normaliser(recherche.trim())
  const trouvees = d.reservations.filter((r) => {
    if (!cherche) return true
    const client = clientDe(r)
    return normaliser([r.reference, nomDe(client), client?.email ?? "", r.telephone, hebergementDe(r)?.nom ?? ""].join(" ")).includes(cherche)
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
          <Button appearance="primary" icon={<CalendarAddRegular />} onClick={() => ouvrirNouvelleReservation()}>
            Nouvelle réservation
          </Button>
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
