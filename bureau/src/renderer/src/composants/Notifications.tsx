import {
  Button,
  Caption1,
  CounterBadge,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  InlineDrawer,
  Text,
  Tooltip,
  mergeClasses,
} from "@fluentui/react-components"
import {
  AlertRegular,
  ArrowMaximizeRegular,
  ArrowUndoRegular,
  BroomRegular,
  CheckmarkCircleRegular,
  DismissRegular,
  DoorArrowLeftRegular,
  DoorArrowRightRegular,
  MailInboxRegular,
  MoneyRegular,
  VehicleBusRegular,
  WrenchRegular,
  type FluentIcon,
} from "@fluentui/react-icons"
import type { ReactNode } from "react"
import { formaterDate, formaterHeure, pluriel, tempsRestant } from "@partage/dates"
import type { Reservation } from "@partage/types"
import { alertesDe, type ChambreAPreparer } from "../alertes"
import { nomChambre, nomDe, soldeDe, useDonneesChargees } from "../donnees"
import { usePrix } from "../montants"
import { Carte, Vide } from "./commun"
import FicheReservation from "./FicheReservation"
import { useNotificationsStyles } from "./useNotificationsStyles.styles"

type Ton = "danger" | "attention" | "info"

// Cloche de la barre de titre : nombre de points à régler ; ouvre ou ferme le panneau des notifications
export function BoutonNotifications({ ouvert, onBasculer }: { ouvert: boolean; onBasculer: () => void }) {
  const styles = useNotificationsStyles()
  const { d } = useDonneesChargees()
  const alertes = alertesDe(d)
  const urgentes = alertes.doubles + alertes.aEncaisser.length + alertes.departsOublies.length + alertes.rappels.chambres.filter((x) => x.arrivee).length
  return (
    <Tooltip content={alertes.total ? `Notifications : ${pluriel(alertes.total, "point")} à régler` : "Notifications"} relationship="label">
      <span className={styles.cloche} data-visite="cloche">
        <Button appearance={ouvert ? "secondary" : "subtle"} icon={<AlertRegular />} onClick={onBasculer} aria-expanded={ouvert} />
        {alertes.total > 0 && (
          <CounterBadge count={alertes.total} size="small" color={urgentes ? "danger" : "brand"} overflowCount={99} className={styles.pastille} aria-hidden />
        )}
      </span>
    </Tooltip>
  )
}

// Panneau des notifications, ancré à droite du contenu (il le pousse au lieu de le recouvrir, comme le centre de
// notifications de Windows), avec la même couche arrondie que le contenu. « Plein écran » ouvre l'écran Notifications
export function PanneauNotifications({ ouvert, onFermer }: { ouvert: boolean; onFermer: () => void }) {
  const styles = useNotificationsStyles()
  const { d, naviguer } = useDonneesChargees()
  const { total } = alertesDe(d)
  return (
    <InlineDrawer position="end" open={ouvert} className={styles.panneau}>
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <div className={styles.outils}>
              <Tooltip content="Ouvrir en plein écran" relationship="label">
                <Button
                  appearance="subtle"
                  icon={<ArrowMaximizeRegular />}
                  onClick={() => {
                    onFermer()
                    naviguer({ page: "notifications" })
                  }}
                />
              </Tooltip>
              <Tooltip content="Fermer" relationship="label">
                <Button appearance="subtle" icon={<DismissRegular />} onClick={onFermer} />
              </Tooltip>
            </div>
          }
        >
          Notifications
        </DrawerHeaderTitle>
        <Caption1 className={styles.detail}>{total ? `${pluriel(total, "point")} à régler` : "Tout est à jour"}</Caption1>
      </DrawerHeader>
      <DrawerBody className={styles.corps}>
        <ListeNotifications />
      </DrawerBody>
    </InlineDrawer>
  )
}

// Points à régler, par rubrique : impayés au départ, oublis de la réception, trop-perçus, demandes. Calculés à partir
// des données chargées : une ligne disparaît d'elle-même une fois la situation réglée. Chaque ligne ouvre la fiche.
// `pleinePage` : rubriques en cartes (écran Notifications) ; sinon, listes serrées du panneau
export function ListeNotifications({ pleinePage = false }: { pleinePage?: boolean }) {
  const styles = useNotificationsStyles()
  const formaterPrix = usePrix()
  const { d, clientDe, naviguer } = useDonneesChargees()
  const alertes = alertesDe(d)

  const jour = (date: string) => formaterDate(date, { year: undefined })
  const ligne = (r: Reservation, Icone: FluentIcon, ton: Ton, detail: ReactNode, montant?: number) => (
    <li key={r.id}>
      <FicheReservation
        reservation={r}
        declencheur={
          <button type="button" className={styles.ligne}>
            <span className={mergeClasses(styles.icone, styles[ton])}>
              <Icone />
            </span>
            <span className={styles.texte}>
              <Text weight="semibold" truncate wrap={false} block>
                {nomDe(clientDe(r))}
              </Text>
              <Caption1 className={styles.detail} truncate wrap={false} block>
                {detail}
              </Caption1>
            </span>
            {montant !== undefined && <Text className={mergeClasses(styles[ton], styles.montant)}>{formaterPrix(montant)}</Text>}
          </button>
        }
      />
    </li>
  )

  // Rappel de ménage : ouvre l'écran Chambres, filtré sur l'état de la chambre
  const ligneChambre = ({ chambre: c, arrivee }: ChambreAPreparer) => (
    <li key={c.id}>
      <button type="button" className={styles.ligne} onClick={() => naviguer({ page: "chambres", filtre: c.etat === "maintenance" ? "maintenance" : "a_nettoyer" })}>
        <span className={mergeClasses(styles.icone, styles[arrivee ? "danger" : "info"])}>{c.etat === "maintenance" ? <WrenchRegular /> : <BroomRegular />}</span>
        <span className={styles.texte}>
          <Text weight="semibold" truncate wrap={false} block>
            {nomChambre(d, c.id)}
          </Text>
          <Caption1 className={styles.detail} truncate wrap={false} block>
            {arrivee
              ? `${c.etat === "maintenance" ? "En maintenance" : "À nettoyer"} avant l'arrivée de ${nomDe(clientDe(arrivee))} aujourd'hui`
              : "N'oubliez pas de la nettoyer"}
            {c.noteEtat && ` · ${c.noteEtat}`}
          </Caption1>
        </span>
      </button>
    </li>
  )

  const sections: { titre: string; aide: string; lignes: ReactNode[]; action?: ReactNode }[] = [
    {
      titre: "Départs à encaisser",
      aide: "Séjours qui se terminent avec un reste à payer",
      lignes: alertes.aEncaisser.map((r) =>
        ligne(
          r,
          MoneyRegular,
          "danger",
          r.departLe ? `Parti le ${formaterHeure(r.departLe)}` : r.depart === d.aujourdhui ? `Départ aujourd'hui · ${nomChambre(d, r.chambreId)}` : `Départ prévu le ${jour(r.depart)}`,
          soldeDe(r, d.paiements),
        ),
      ),
    },
    {
      titre: "Chambres à préparer",
      aide: "Rappel de ménage : passez-les à « Propre » une fois prêtes",
      lignes: alertes.rappels.chambres.map(ligneChambre),
      action: (
        <Button appearance="transparent" size="small" onClick={() => naviguer({ page: "chambres", filtre: "a_nettoyer" })}>
          Chambres
        </Button>
      ),
    },
    {
      titre: "Réception à régulariser",
      aide: "Arrivée ou départ jamais enregistré",
      lignes: [
        ...alertes.departsOublies.map((r) => ligne(r, DoorArrowLeftRegular, "attention", `Départ du ${jour(r.depart)} non enregistré`)),
        ...alertes.arriveesOubliees.map((r) => ligne(r, DoorArrowRightRegular, "attention", `Arrivée du ${jour(r.arrivee)} non enregistrée`)),
      ],
    },
    {
      titre: "Trop-perçus à rembourser",
      aide: "Encaissé plus que le montant dû",
      lignes: alertes.tropPercus.map((r) => ligne(r, ArrowUndoRegular, "attention", `${r.reference} · ${r.statut === "confirmee" ? "séjour" : "réservation annulée"}`, -soldeDe(r, d.paiements))),
    },
    {
      titre: "Navettes à prévoir",
      aide: "Arrivées d'aujourd'hui et de demain avec navette depuis l'aéroport",
      lignes: alertes.rappels.navettes.map((r) =>
        ligne(r, VehicleBusRegular, "info", `${r.arrivee === d.aujourdhui ? "Arrivée aujourd'hui" : "Arrivée demain"} · ${pluriel(r.adultes + r.enfants, "voyageur")}`),
      ),
    },
    {
      titre: "Demandes à traiter",
      aide: "Options du site à confirmer ou refuser",
      lignes: alertes.demandes.map((r) => {
        const restant = r.expireLe ? tempsRestant(r.expireLe) : null
        return ligne(r, MailInboxRegular, "info", `${jour(r.arrivee)} · ${restant ? `expire dans ${restant}` : "option échue"}`)
      }),
      action: (
        <Button appearance="transparent" size="small" onClick={() => naviguer({ page: "reservations", filtre: "option" })}>
          Tout voir
        </Button>
      ),
    },
  ]

  const visibles = sections.filter((s) => s.lignes.length > 0)
  return (
    <>
      {alertes.doubles > 0 && (
        <MessageBar intent="error" layout="multiline">
          <MessageBarBody>
            <MessageBarTitle>{alertes.doubles > 1 ? `${alertes.doubles} doubles réservations` : "Double réservation"}</MessageBarTitle>
            Une plateforme a vendu des nuits déjà prises ici.
          </MessageBarBody>
          <MessageBarActions>
            <Button size="small" onClick={() => naviguer({ page: "planning" })}>
              Planning
            </Button>
          </MessageBarActions>
        </MessageBar>
      )}

      {alertes.total === 0 ? (
        <Vide Icone={CheckmarkCircleRegular} titre="Rien à signaler" texte="Les départs non soldés, remboursements à faire, oublis de la réception et rappels de ménage apparaîtront ici." />
      ) : pleinePage ? (
        <div className={styles.grille}>
          {visibles.map((s) => (
            <Carte key={s.titre} titre={`${s.titre} (${s.lignes.length})`} description={s.aide} action={s.action}>
              <ul className={styles.liste}>{s.lignes}</ul>
            </Carte>
          ))}
        </div>
      ) : (
        visibles.map((s) => (
          <section key={s.titre} className={styles.section} aria-label={s.titre}>
            <div className={styles.enteteSection}>
              <div className={styles.texte}>
                <Text weight="semibold">
                  {s.titre} <span className={styles.nombre}>{s.lignes.length}</span>
                </Text>
                <Caption1 className={styles.detail}>{s.aide}</Caption1>
              </div>
              {s.action}
            </div>
            <ul className={styles.liste}>{s.lignes}</ul>
          </section>
        ))
      )}
    </>
  )
}
