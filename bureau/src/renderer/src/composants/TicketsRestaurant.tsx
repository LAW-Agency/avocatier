import { Badge, Body1, Button, Caption1, Spinner, Text, Tooltip, makeStyles, mergeClasses, tokens } from "@fluentui/react-components"
import { DrinkBeerRegular, FoodRegular, PrintRegular } from "@fluentui/react-icons"
import { useState } from "react"
import { formaterHeure, pluriel } from "@partage/dates"
import { formaterDansDevise } from "@partage/devises"
import type { Consommation, Ticket } from "@partage/types"
import { nomChambre, useDonneesChargees } from "../donnees"
import { useFichiers } from "../fichiers"
import { estBar } from "./Chronologie"

const ariary = (montant: number) => formaterDansDevise(montant, "MGA")

const useStyles = makeStyles({
  liste: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalS },
  ticket: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalMNudge} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusLarge,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  entete: { display: "grid", gridTemplateColumns: "32px minmax(0, 1fr) auto auto", alignItems: "center", columnGap: tokens.spacingHorizontalM },
  icone: {
    width: "32px",
    height: "32px",
    borderRadius: tokens.borderRadiusMedium,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: tokens.fontSizeBase400,
    backgroundColor: tokens.colorPaletteMarigoldBackground1,
    color: tokens.colorPaletteMarigoldForeground2,
  },
  titre: { display: "flex", flexDirection: "column", minWidth: 0 },
  ligneTitre: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalS, flexWrap: "wrap" },
  discret: { color: tokens.colorNeutralForeground3 },
  total: { fontVariantNumeric: "tabular-nums", fontWeight: tokens.fontWeightSemibold, fontSize: tokens.fontSizeBase400 },
  // Articles du ticket : quantité, libellé, prix unitaire, montant, alignés en colonnes
  articles: {
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
    columnGap: tokens.spacingHorizontalM,
    rowGap: tokens.spacingVerticalXXS,
    marginLeft: "44px",
    paddingTop: tokens.spacingVerticalS,
    borderTop: `${tokens.strokeWidthThin} dashed ${tokens.colorNeutralStroke2}`,
  },
  quantite: { color: tokens.colorNeutralForeground3, fontVariantNumeric: "tabular-nums", textAlign: "right" },
  nombre: { fontVariantNumeric: "tabular-nums", textAlign: "right", whiteSpace: "nowrap" },
})

// Ticket complet à partir de la consommation, pour le réimprimer tel quel (sur la note de la chambre)
const versTicket = (c: Consommation): Ticket => ({
  id: c.id,
  numero: c.numero,
  posteId: "",
  le: c.le,
  recuLe: c.le,
  statut: "chambre",
  reservationId: c.reservationId,
  libelle: c.libelle,
  total: c.total,
  lignes: c.lignes,
  reglements: [],
  motifAnnulation: "",
  caissierId: c.caissierId,
  factureId: c.factureId,
})

// Tickets du restaurant et du bar mis sur la chambre, en entier : poste, heure, table, caissier et chaque article.
// `avecSejour` : rappelle la réservation et la chambre (fiche du client, plusieurs séjours)
export default function TicketsRestaurant({ consommations, avecSejour = false }: { consommations: Consommation[]; avecSejour?: boolean }) {
  const styles = useStyles()
  const { d } = useDonneesChargees()
  const { imprimerTicket } = useFichiers()
  const [impression, setImpression] = useState<string | null>(null)
  const membre = (id?: string) => (id === d.hote.id ? d.hote.prenom : d.equipe.find((m) => m.id === id)?.prenom)
  const sejour = (id: string) => d.reservations.find((r) => r.id === id)
  const chambre = (id: string) => {
    const r = sejour(id)
    return r && d.chambres.find((c) => c.id === r.chambreId)?.numero
  }

  async function reimprimer(c: Consommation) {
    setImpression(c.id)
    await imprimerTicket(versTicket(c), chambre(c.reservationId))
    setImpression(null)
  }

  return (
    <ul className={styles.liste}>
      {[...consommations]
        .sort((a, b) => b.le.localeCompare(a.le))
        .map((c) => {
          const Icone = estBar(c.poste) ? DrinkBeerRegular : FoodRegular
          const r = avecSejour ? sejour(c.reservationId) : undefined
          const articles = c.lignes.reduce((t, l) => t + l.quantite, 0)
          return (
            <li key={c.id} className={styles.ticket}>
              <div className={styles.entete}>
                <span className={styles.icone} aria-hidden>
                  <Icone />
                </span>
                <div className={styles.titre}>
                  <span className={styles.ligneTitre}>
                    <Text weight="semibold">{c.poste ?? "Restaurant et bar"}</Text>
                    <Caption1 className={styles.discret}>Ticket {c.numero}</Caption1>
                    {c.factureId && (
                      <Badge appearance="tint" color="success" size="small">
                        Facturé
                      </Badge>
                    )}
                  </span>
                  <Caption1 className={styles.discret}>
                    {[
                      formaterHeure(c.le),
                      c.libelle,
                      pluriel(articles, "article"),
                      membre(c.caissierId) && `servi par ${membre(c.caissierId)}`,
                      r && `${r.reference} · ${nomChambre(d, r.chambreId)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Caption1>
                </div>
                <span className={styles.total}>{ariary(c.total)}</span>
                <Tooltip content="Réimprimer le ticket" relationship="label">
                  <Button appearance="subtle" size="small" disabled={impression === c.id} icon={impression === c.id ? <Spinner size="tiny" /> : <PrintRegular />} onClick={() => reimprimer(c)} />
                </Tooltip>
              </div>
              <div className={styles.articles}>
                {c.lignes.map((l, i) => (
                  <Article key={i} quantite={l.quantite} libelle={l.libelle} prixUnitaire={l.prixUnitaire} />
                ))}
              </div>
            </li>
          )
        })}
    </ul>
  )
}

function Article({ quantite, libelle, prixUnitaire }: { quantite: number; libelle: string; prixUnitaire: number }) {
  const styles = useStyles()
  return (
    <>
      <Body1 className={styles.quantite}>{quantite} ×</Body1>
      <Body1>{libelle}</Body1>
      <Caption1 className={mergeClasses(styles.nombre, styles.discret)}>{quantite > 1 ? `${ariary(prixUnitaire)} l'unité` : ""}</Caption1>
      <Body1 className={styles.nombre}>{ariary(prixUnitaire * quantite)}</Body1>
    </>
  )
}
