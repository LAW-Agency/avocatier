import { Body1, Caption1, makeStyles, mergeClasses, tokens } from "@fluentui/react-components"
import {
  ArrowUndoRegular,
  CheckmarkRegular,
  DismissCircleRegular,
  DocumentPdfRegular,
  DoorArrowLeftRegular,
  DoorArrowRightRegular,
  DrinkBeerRegular,
  FoodRegular,
  MoneyRegular,
  PersonAddRegular,
  ProhibitedRegular,
  SendRegular,
  TimerOffRegular,
  type FluentIcon,
} from "@fluentui/react-icons"
import { formaterHeure, pluriel } from "@partage/dates"
import { formaterDansDevise } from "@partage/devises"
import { libelleEvenement } from "@partage/statuts"
import type { ClientPublic, Reservation, StatutReservation } from "@partage/types"
import { numeroRecu } from "../documents"
import { factureDe, type Donnees } from "../donnees"
import { MODES_PAIEMENT } from "../libelles"

// Tout ce qui s'est passé sur un séjour, dans l'ordre : demande et décisions, arrivée et départ (notes de
// l'historique), encaissements, tickets du restaurant et du bar mis sur la chambre, facture

type Genre = "statut" | "paiement" | "remboursement" | "restaurant" | "bar" | "facture" | "client"
export type Evenement = { cle: string; le: string; genre: Genre; titre: string; detail?: string; statut?: StatutReservation; reference?: string }

const ICONES: Record<Genre, FluentIcon> = {
  statut: SendRegular,
  paiement: MoneyRegular,
  remboursement: ArrowUndoRegular,
  restaurant: FoodRegular,
  bar: DrinkBeerRegular,
  facture: DocumentPdfRegular,
  client: PersonAddRegular,
}
const ICONES_STATUT: Partial<Record<StatutReservation, FluentIcon>> = {
  confirmee: CheckmarkRegular,
  refusee: ProhibitedRegular,
  annulee: DismissCircleRegular,
  expiree: TimerOffRegular,
}

// Poste du restaurant ou du bar d'après son nom (« Bar de la plage » → bar)
export const estBar = (poste?: string) => !!poste && /\bbar\b/i.test(poste)

type Formateur = (euros: number) => string

export function evenementsSejour(r: Reservation, d: Donnees, formaterPrix: Formateur, avecReference = false): Evenement[] {
  const membre = (id?: string) => (id === d.hote.id ? d.hote.prenom : d.equipe.find((m) => m.id === id)?.prenom)
  const reference = avecReference ? r.reference : undefined
  const evenements: Evenement[] = [
    ...r.historique.map((e, i) => ({ cle: `${r.id}-h${i}`, le: e.le, genre: "statut" as const, statut: e.statut, titre: e.note ?? libelleEvenement[e.statut], reference })),
    ...d.paiements
      .filter((p) => p.reservationId === r.id)
      .map((p) => ({
        cle: p.id,
        le: p.le,
        genre: p.montant < 0 ? ("remboursement" as const) : ("paiement" as const),
        titre: `${p.montant < 0 ? "Remboursement" : "Encaissement"} de ${p.devise !== "EUR" && p.montantDevise !== undefined ? formaterDansDevise(Math.abs(p.montantDevise), p.devise) : formaterPrix(Math.abs(p.montant))}`,
        detail: [MODES_PAIEMENT[p.mode], p.note, `reçu ${numeroRecu(p)}`, membre(p.enregistrePar) && `par ${membre(p.enregistrePar)}`].filter(Boolean).join(" · "),
        reference,
      })),
    ...d.consommations
      .filter((c) => c.reservationId === r.id)
      .map((c) => ({
        cle: c.id,
        le: c.le,
        genre: estBar(c.poste) ? ("bar" as const) : ("restaurant" as const),
        titre: `${c.poste ?? "Restaurant et bar"} : ${formaterDansDevise(c.total, "MGA")} sur la chambre`,
        detail: [
          `Ticket ${c.numero}`,
          pluriel(c.lignes.reduce((t, l) => t + l.quantite, 0), "article"),
          c.libelle,
          membre(c.caissierId) && `par ${membre(c.caissierId)}`,
        ]
          .filter(Boolean)
          .join(" · "),
        reference,
      })),
  ]
  const facture = factureDe(r, d)
  if (facture) evenements.push({ cle: `${r.id}-${facture.id}`, le: facture.le, genre: "facture", titre: `Facture ${facture.numero} éditée`, detail: formaterDansDevise(facture.total, facture.devise), reference })
  else if (r.factureNumero) evenements.push({ cle: `${r.id}-facture`, le: r.factureLe ?? r.creeLe, genre: "facture", titre: `Facture ${r.factureNumero} éditée`, reference })
  return evenements
}

// Historique d'un client : création de sa fiche puis tout ce qui s'est passé sur ses séjours
export function evenementsClient(client: ClientPublic, sejours: Reservation[], d: Donnees, formaterPrix: Formateur): Evenement[] {
  return [
    { cle: `${client.id}-creation`, le: client.creeLe, genre: "client" as const, titre: client.origine === "site" ? "Compte créé sur le site" : "Fiche créée à la réception" },
    ...sejours.flatMap((r) => evenementsSejour(r, d, formaterPrix, true)),
  ]
}

const useStyles = makeStyles({
  liste: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" },
  evenement: {
    display: "grid",
    gridTemplateColumns: "28px minmax(0, 1fr)",
    columnGap: tokens.spacingHorizontalMNudge,
    position: "relative",
    paddingBottom: tokens.spacingVerticalM,
    // Fil vertical qui relie les pastilles
    "::before": {
      content: '""',
      position: "absolute",
      left: "13px",
      top: "28px",
      bottom: 0,
      width: tokens.strokeWidthThin,
      backgroundColor: tokens.colorNeutralStroke2,
    },
    ":last-child": { paddingBottom: 0, "::before": { display: "none" } },
  },
  pastille: {
    width: "28px",
    height: "28px",
    borderRadius: tokens.borderRadiusCircular,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: tokens.fontSizeBase300,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
  },
  argent: { backgroundColor: tokens.colorPaletteGreenBackground1, color: tokens.colorPaletteGreenForeground1 },
  rendu: { backgroundColor: tokens.colorPaletteYellowBackground1, color: tokens.colorPaletteYellowForeground2 },
  conso: { backgroundColor: tokens.colorPaletteMarigoldBackground1, color: tokens.colorPaletteMarigoldForeground2 },
  neutre: { backgroundColor: tokens.colorNeutralBackground5, color: tokens.colorNeutralForeground2 },
  danger: { backgroundColor: tokens.colorPaletteRedBackground1, color: tokens.colorPaletteRedForeground1 },
  texte: { display: "flex", flexDirection: "column", minWidth: 0, paddingTop: "3px" },
  discret: { color: tokens.colorNeutralForeground3 },
})

// Fil des événements, du plus ancien au plus récent (`recentEnHaut` : l'inverse)
export default function Chronologie({ evenements, recentEnHaut = false }: { evenements: Evenement[]; recentEnHaut?: boolean }) {
  const styles = useStyles()
  const tries = [...evenements].sort((a, b) => (recentEnHaut ? b.le.localeCompare(a.le) : a.le.localeCompare(b.le)))
  const couleur = (e: Evenement) =>
    e.genre === "paiement"
      ? styles.argent
      : e.genre === "remboursement"
        ? styles.rendu
        : e.genre === "restaurant" || e.genre === "bar"
          ? styles.conso
          : e.genre === "facture" || e.genre === "client"
            ? styles.neutre
            : e.statut === "refusee" || e.statut === "annulee" || e.statut === "expiree"
              ? styles.danger
              : undefined
  return (
    <ol className={styles.liste}>
      {tries.map((e) => {
        // Arrivée et départ : notes de l'historique enregistrées par la réception
        const porte = e.genre === "statut" && (/^Arriv/.test(e.titre) ? DoorArrowRightRegular : /^Départ/.test(e.titre) ? DoorArrowLeftRegular : null)
        const Icone = porte || (e.genre === "statut" && e.statut && ICONES_STATUT[e.statut]) || ICONES[e.genre]
        return (
          <li key={e.cle} className={styles.evenement}>
            <span className={mergeClasses(styles.pastille, couleur(e))} aria-hidden>
              <Icone />
            </span>
            <div className={styles.texte}>
              <Body1>{e.titre}</Body1>
              {e.detail && <Caption1 className={styles.discret}>{e.detail}</Caption1>}
              <Caption1 className={styles.discret}>
                {formaterHeure(e.le)}
                {e.reference && ` · ${e.reference}`}
              </Caption1>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
