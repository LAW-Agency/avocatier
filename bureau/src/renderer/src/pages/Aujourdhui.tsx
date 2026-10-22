import {
  Avatar,
  Badge,
  Body1,
  Button,
  Caption1,
  CounterBadge,
  Link,
  Menu,
  MenuDivider,
  MenuGroup,
  MenuGroupHeader,
  MenuItem,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  ProgressBar,
  Tab,
  TabList,
  Text,
  Tooltip,
  mergeClasses,
  type BadgeProps,
} from "@fluentui/react-components"
import {
  AddRegular,
  ArrowCounterclockwiseRegular,
  ArrowNextRegular,
  ArrowPreviousRegular,
  BedRegular,
  BookOpenRegular,
  CalendarAddRegular,
  CalendarCancelRegular,
  CalendarLtrRegular,
  ChatRegular,
  CheckmarkRegular,
  DismissRegular,
  DoorArrowLeftRegular,
  DoorArrowRightRegular,
  EditRegular,
  FlashRegular,
  GridRegular,
  MailInboxCheckmarkRegular,
  MailInboxRegular,
  MoneyRegular,
  MoreHorizontalRegular,
  PeopleRegular,
  PersonAddRegular,
  ReOrderDotsVerticalRegular,
  VehicleBusRegular,
  type FluentIcon,
} from "@fluentui/react-icons"
import { useState, type DragEvent, type ReactNode } from "react"
import { ajouterJours, formaterDate, formaterHeure, formaterPlage, formaterPrix, nombreNuits, pluriel, tempsRestant } from "@partage/dates"
import type { EtatChambre, Reservation } from "@partage/types"
import type { PlaceWidget, TailleWidget } from "../../../partage/ipc"
import ActionsReservation, { BoutonReception } from "../composants/ActionsReservation"
import { Carte, EnTete, Vide } from "../composants/commun"
import FicheReservation from "../composants/FicheReservation"
import { Histogramme, Indicateur } from "../composants/graphiques"
import { doublesReservations, nomDe, soldeDe, useDonneesChargees } from "../donnees"
import { ETATS_CHAMBRE, MODES_PAIEMENT } from "../libelles"
import { useReglages } from "../reglages"
import { situationDuJour } from "../situation"
import { encaissementsDans, pourcent } from "../statistiques"
import { useAnnoncer } from "../toasts"
import { useAujourdhuiStyles } from "./useAujourdhuiStyles.styles"

type Onglet = "arrivees" | "departs" | "surPlace"

// Widgets du tableau de bord : nom, explication (menu « Ajouter un widget »), largeur par défaut sur 4 colonnes
type IdWidget = "aTraiter" | "arrivees" | "departs" | "occupation" | "demandes" | "mouvements" | "semaine" | "chambres" | "prochainesNuits" | "encaissements" | "raccourcis"

const WIDGETS: Record<IdWidget, { titre: string; description: string; Icone: FluentIcon; gerants?: boolean }> = {
  aTraiter: { titre: "À traiter", description: "Nombre de demandes en attente de réponse", Icone: MailInboxRegular },
  arrivees: { titre: "Arrivées", description: "Arrivées du jour et clients attendus", Icone: DoorArrowRightRegular },
  departs: { titre: "Départs", description: "Départs du jour à enregistrer", Icone: DoorArrowLeftRegular },
  occupation: { titre: "Taux d'occupation", description: "Hébergements occupés ce soir", Icone: BedRegular },
  demandes: { titre: "Demandes à traiter", description: "Les options du site, à confirmer ou refuser", Icone: MailInboxCheckmarkRegular },
  mouvements: { titre: "Mouvements du jour", description: "Arrivées, départs et clients sur place", Icone: DoorArrowRightRegular },
  semaine: { titre: "Cette semaine", description: "Arrivées des 7 prochains jours", Icone: CalendarLtrRegular },
  chambres: { titre: "État des chambres", description: "Ménage et maintenance de chaque hébergement", Icone: BedRegular },
  prochainesNuits: { titre: "Occupation à 7 jours", description: "Hébergements occupés les 7 prochaines nuits", Icone: CalendarLtrRegular },
  encaissements: { titre: "Derniers encaissements", description: "Paiements et remboursements récents", Icone: MoneyRegular, gerants: true },
  raccourcis: { titre: "Raccourcis", description: "Nouvelle réservation, nouveau client, dates à bloquer…", Icone: FlashRegular },
}

const estIdWidget = (id: string): id is IdWidget => id in WIDGETS

const DISPOSITION_ORIGINE: PlaceWidget[] = [
  { id: "aTraiter", taille: 1 },
  { id: "arrivees", taille: 1 },
  { id: "departs", taille: 1 },
  { id: "occupation", taille: 1 },
  { id: "demandes", taille: 2 },
  { id: "mouvements", taille: 2 },
  { id: "semaine", taille: 2 },
  { id: "chambres", taille: 2 },
  { id: "prochainesNuits", taille: 2 },
  { id: "encaissements", taille: 2 },
]

const TAILLES: Record<TailleWidget, string> = { 1: "Petit (1 colonne)", 2: "Moyen (2 colonnes)", 3: "Large (3 colonnes)", 4: "Pleine largeur" }

const COULEURS_ETAT: Record<EtatChambre, BadgeProps["color"]> = { propre: "success", a_nettoyer: "warning", maintenance: "danger" }

// Tableau du jour en widgets : chiffres clés, demandes à traiter, mouvements du jour (avec l'arrivée et le
// départ à enregistrer), semaine, chambres… « Personnaliser » permet de les déplacer (glisser-déposer ou
// menu), de changer leur largeur, d'en masquer ou d'en ajouter ; la disposition est gardée sur ce poste
export default function Aujourdhui() {
  const styles = useAujourdhuiStyles()
  const donnees = useDonneesChargees()
  const { d, naviguer, ouvrirNouvelleReservation, gerant } = donnees
  const { reglages, modifier } = useReglages()
  const { annoncer } = useAnnoncer()
  const { arrivees, departs, occupes, total } = situationDuJour(d, d.aujourdhui)
  const [onglet, setOnglet] = useState<Onglet>("arrivees")
  const [edition, setEdition] = useState(false)
  const [deplace, setDeplace] = useState<string | null>(null)
  const [survol, setSurvol] = useState<string | null>(null)
  const classesTaille: Record<TailleWidget, string> = { 1: styles.taille1, 2: styles.taille2, 3: styles.taille3, 4: styles.taille4 }

  const aTraiter = d.reservations.filter((r) => r.statut === "option").sort((a, b) => (a.expireLe ?? "").localeCompare(b.expireLe ?? ""))
  const doubles = doublesReservations(d)
  const confirmees = d.reservations.filter((r) => r.statut === "confirmee")
  const surPlace = confirmees.filter((r) => r.arrivee <= d.aujourdhui && r.depart > d.aujourdhui && !arrivees.includes(r))
  const semaine = confirmees
    .filter((r) => r.arrivee > d.aujourdhui && r.arrivee <= ajouterJours(d.aujourdhui, 7))
    .sort((a, b) => a.arrivee.localeCompare(b.arrivee))
  const aNettoyer = d.hebergements.filter((h) => h.etat === "a_nettoyer").length
  const encaisse = encaissementsDans(d.paiements, { debut: d.aujourdhui, fin: ajouterJours(d.aujourdhui, 1) }).reduce((t, p) => t + p.montant, 0)
  const arriveesAttendues = arrivees.filter((r) => !r.arriveeLe).length
  const departsAttendus = departs.filter((r) => !r.departLe).length
  const listes: Record<Onglet, Reservation[]> = { arrivees, departs, surPlace }
  const vides: Record<Onglet, string> = { arrivees: "Aucune arrivée aujourd'hui.", departs: "Aucun départ aujourd'hui.", surPlace: "Aucun client sur place." }

  // Disposition du poste (widgets inconnus ignorés), réduite aux widgets permis pour ce rôle
  const disposition = (reglages.tableau ?? DISPOSITION_ORIGINE).filter((w) => estIdWidget(w.id))
  const visibles = disposition.filter((w) => gerant || !WIDGETS[w.id as IdWidget].gerants)
  const masques = (Object.keys(WIDGETS) as IdWidget[]).filter((id) => (gerant || !WIDGETS[id].gerants) && !disposition.some((w) => w.id === id))

  const enregistrer = (suivante: PlaceWidget[]) => void modifier({ tableau: suivante })
  const changerTaille = (id: string, taille: TailleWidget) => enregistrer(disposition.map((w) => (w.id === id ? { ...w, taille } : w)))
  const masquer = (id: string) => enregistrer(disposition.filter((w) => w.id !== id))
  const ajouter = (id: IdWidget) => enregistrer([...disposition, { id, taille: id === "aTraiter" || id === "arrivees" || id === "departs" || id === "occupation" || id === "raccourcis" ? 1 : 2 }])
  // Place `id` à la position de `cible` (avant elle si on vient d'après, après sinon)
  function deplacer(id: string, cible: string) {
    if (id === cible) return
    const depart = disposition.findIndex((w) => w.id === id)
    const arrivee = disposition.findIndex((w) => w.id === cible)
    if (depart === -1 || arrivee === -1) return
    const suivante = [...disposition]
    const [widget] = suivante.splice(depart, 1)
    suivante.splice(arrivee, 0, widget)
    enregistrer(suivante)
  }
  function decaler(id: string, pas: number) {
    const rang = disposition.findIndex((w) => w.id === id)
    const cible = disposition[Math.min(disposition.length - 1, Math.max(0, rang + pas))]
    if (cible) deplacer(id, cible.id)
  }

  function contenu(id: IdWidget): ReactNode {
    switch (id) {
      case "aTraiter":
        return <Indicateur Icone={MailInboxRegular} libelle="À traiter" valeur={aTraiter.length} note="Demandes en attente de réponse" className={styles.remplir} />
      case "arrivees":
        return (
          <Indicateur
            Icone={DoorArrowRightRegular}
            libelle="Arrivées"
            valeur={arrivees.length}
            className={styles.remplir}
            note={
              arriveesAttendues
                ? `${pluriel(arriveesAttendues, "client attendu", "clients attendus")}`
                : arrivees.length
                  ? "Tous arrivés"
                  : semaine.length
                    ? `${pluriel(semaine.length, "autre", "autres")} sous 7 jours`
                    : "Aucune autre sous 7 jours"
            }
          />
        )
      case "departs":
        return (
          <Indicateur
            Icone={DoorArrowLeftRegular}
            libelle="Départs"
            valeur={departs.length}
            className={styles.remplir}
            note={departsAttendus ? `${pluriel(departsAttendus, "départ", "départs")} à enregistrer` : `${pluriel(surPlace.length, "séjour en cours", "séjours en cours")}`}
          />
        )
      case "occupation":
        return (
          <Indicateur
            Icone={BedRegular}
            libelle="Taux d'occupation ce soir"
            valeur={pourcent(total ? occupes / total : 0)}
            className={styles.remplir}
            note={`${occupes} / ${pluriel(total, "hébergement")}${aNettoyer ? ` · ${pluriel(aNettoyer, "chambre")} à nettoyer` : " · chambres prêtes"}`}
          >
            <ProgressBar value={total ? occupes / total : 0} thickness="large" aria-label="Taux d'occupation" />
          </Indicateur>
        )
      case "demandes":
        return (
          <Carte
            className={styles.remplir}
            titre="Demandes à traiter"
            description="Les dates sont bloquées 48 h : confirmez ou refusez avant l'échéance."
            action={
              <Button appearance="subtle" onClick={() => naviguer({ page: "reservations", filtre: "option" })}>
                Toutes les demandes
              </Button>
            }
          >
            {aTraiter.length === 0 ? (
              <Vide Icone={MailInboxCheckmarkRegular} titre="Rien à traiter" texte="Les nouvelles demandes envoyées depuis le site apparaîtront ici." />
            ) : (
              <ul className={styles.liste}>
                {aTraiter.map((r) => (
                  <Demande key={r.id} reservation={r} donnees={donnees} />
                ))}
              </ul>
            )}
          </Carte>
        )
      case "mouvements":
        return (
          <Carte
            className={styles.remplir}
            titre="Aujourd'hui"
            action={gerant ? <Badge appearance="tint" color="success" icon={<MoneyRegular />}>{`${formaterPrix(encaisse)} encaissés`}</Badge> : undefined}
          >
            <TabList selectedValue={onglet} onTabSelect={(_e, data) => setOnglet(data.value as Onglet)} size="small">
              <Tab value="arrivees">
                Arrivées <CounterBadge count={arrivees.length} showZero appearance="ghost" color="informative" size="small" />
              </Tab>
              <Tab value="departs">
                Départs <CounterBadge count={departs.length} showZero appearance="ghost" color="informative" size="small" />
              </Tab>
              <Tab value="surPlace">
                Sur place <CounterBadge count={surPlace.length} showZero appearance="ghost" color="informative" size="small" />
              </Tab>
            </TabList>
            <Sejours reservations={listes[onglet]} vide={vides[onglet]} donnees={donnees} reception />
          </Carte>
        )
      case "semaine":
        return (
          <Carte className={styles.remplir} titre="Cette semaine" description="Arrivées des 7 prochains jours" action={<Badge appearance="outline">{semaine.length}</Badge>}>
            <Sejours reservations={semaine} vide="Aucune arrivée prévue cette semaine." donnees={donnees} avecDate />
          </Carte>
        )
      case "chambres":
        return (
          <Carte
            className={styles.remplir}
            titre="État des chambres"
            description={aNettoyer ? `${pluriel(aNettoyer, "chambre")} à nettoyer` : "Toutes les chambres sont prêtes"}
            action={
              <Button appearance="subtle" onClick={() => naviguer({ page: "chambres" })}>
                Gérer
              </Button>
            }
          >
            <ul className={mergeClasses(styles.liste, styles.listeSerree)}>
              {d.hebergements.map((h) => (
                <li key={h.id} className={styles.sejour}>
                  <BedRegular className={styles.iconeLigne} />
                  <div className={styles.infos}>
                    <Text weight="semibold" truncate wrap={false}>
                      {h.nom}
                    </Text>
                    {h.noteEtat && (
                      <Caption1 className={styles.secondaire} truncate wrap={false}>
                        {h.noteEtat}
                      </Caption1>
                    )}
                  </div>
                  <Badge appearance="tint" shape="rounded" color={COULEURS_ETAT[h.etat]}>
                    {ETATS_CHAMBRE[h.etat]}
                  </Badge>
                </li>
              ))}
            </ul>
          </Carte>
        )
      case "prochainesNuits": {
        const nuits = Array.from({ length: 7 }, (_, i) => ajouterJours(d.aujourdhui, i))
        return (
          <Carte className={styles.remplir} titre="Occupation à 7 jours" description="Hébergements occupés ou bloqués, nuit par nuit">
            <Histogramme
              hauteur={170}
              formater={(v) => `${v} / ${total}`}
              barres={nuits.map((jour, i) => {
                const n = situationDuJour(d, jour).occupes
                return { cle: jour, libelle: formaterDate(jour, { month: undefined, year: undefined }), valeur: n, etiquette: `${n}/${total}`, actuelle: i === 0 }
              })}
            />
          </Carte>
        )
      }
      case "encaissements": {
        const derniers = [...d.paiements].sort((a, b) => b.le.localeCompare(a.le)).slice(0, 5)
        return (
          <Carte
            className={styles.remplir}
            titre="Derniers encaissements"
            description={`${formaterPrix(encaisse)} encaissés aujourd'hui`}
            action={
              <Button appearance="subtle" onClick={() => naviguer({ page: "revenus" })}>
                Revenus
              </Button>
            }
          >
            {derniers.length === 0 ? (
              <Body1 className={styles.aucun}>
                <MoneyRegular /> Aucun encaissement enregistré.
              </Body1>
            ) : (
              <ul className={mergeClasses(styles.liste, styles.listeSerree)}>
                {derniers.map((p) => {
                  const r = d.reservations.find((x) => x.id === p.reservationId)
                  return (
                    <li key={p.id} className={styles.sejour}>
                      <MoneyRegular className={styles.iconeLigne} />
                      <div className={styles.infos}>
                        <Text weight="semibold" truncate wrap={false}>
                          {r ? nomDe(donnees.clientDe(r)) : "Réservation supprimée"}
                        </Text>
                        <Caption1 className={styles.secondaire} truncate wrap={false}>
                          {formaterHeure(p.le)} · {MODES_PAIEMENT[p.mode]}
                          {r && ` · ${r.reference}`}
                        </Caption1>
                      </div>
                      <Text className={styles.prix}>{formaterPrix(p.montant)}</Text>
                    </li>
                  )
                })}
              </ul>
            )}
          </Carte>
        )
      }
      case "raccourcis":
        return (
          <Carte className={styles.remplir} titre="Raccourcis">
            <div className={styles.raccourcis}>
              <Button appearance="primary" icon={<CalendarAddRegular />} onClick={() => ouvrirNouvelleReservation()}>
                Nouvelle réservation
              </Button>
              <Button icon={<PersonAddRegular />} onClick={() => naviguer({ page: "clients" })}>
                Nouveau client
              </Button>
              <Button icon={<CalendarCancelRegular />} onClick={() => naviguer({ page: "planning" })}>
                Bloquer des dates
              </Button>
              <Button icon={<PeopleRegular />} onClick={() => naviguer({ page: "clients" })}>
                Clients
              </Button>
              <Button icon={<BookOpenRegular />} onClick={() => naviguer({ page: "guide" })}>
                Guide
              </Button>
            </div>
          </Carte>
        )
    }
  }

  return (
    <>
      <EnTete
        titre={`Bonjour ${d.hote.prenom}`}
        description={`${formaterDate(d.aujourdhui, { weekday: "long", month: "long" })} · ${
          aTraiter.length > 0 ? `${pluriel(aTraiter.length, "demande attend", "demandes attendent")} votre réponse` : "aucune demande en attente"
        }`}
        actions={
          edition ? undefined : (
            <>
              <Button icon={<GridRegular />} onClick={() => setEdition(true)}>
                Personnaliser
              </Button>
              <Button icon={<CalendarLtrRegular />} onClick={() => naviguer({ page: "planning" })}>
                Planning
              </Button>
              <Button appearance="primary" icon={<CalendarAddRegular />} onClick={() => ouvrirNouvelleReservation()}>
                Nouvelle réservation
              </Button>
            </>
          )
        }
      />

      {doubles.length > 0 && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>{doubles.length > 1 ? `${doubles.length} doubles réservations` : "Double réservation"}</MessageBarTitle>
            Une plateforme (Booking.com, Airbnb…) a vendu des nuits déjà prises ici.
          </MessageBarBody>
          <MessageBarActions>
            <Button onClick={() => naviguer({ page: "planning" })}>Voir le planning</Button>
          </MessageBarActions>
        </MessageBar>
      )}

      {edition && (
        <div className={styles.barreEdition} role="toolbar" aria-label="Personnalisation du tableau de bord">
          <EditRegular className={styles.iconeEdition} />
          <div className={styles.infos}>
            <Text weight="semibold">Personnalisation du tableau de bord</Text>
            <Caption1 className={styles.secondaire}>Glissez un widget par sa poignée pour le déplacer ; son menu change sa largeur. La disposition est gardée sur cet ordinateur.</Caption1>
          </div>
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button icon={<AddRegular />} disabled={masques.length === 0}>
                Ajouter un widget
              </Button>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                {masques.map((id) => {
                  const { titre, description, Icone } = WIDGETS[id]
                  return (
                    <MenuItem key={id} icon={<Icone />} onClick={() => ajouter(id)}>
                      <span className={styles.infos}>
                        <Text>{titre}</Text>
                        <Caption1 className={styles.secondaire}>{description}</Caption1>
                      </span>
                    </MenuItem>
                  )
                })}
              </MenuList>
            </MenuPopover>
          </Menu>
          <Button
            icon={<ArrowCounterclockwiseRegular />}
            disabled={reglages.tableau === null}
            onClick={() => {
              void modifier({ tableau: null })
              annoncer({ titre: "Disposition d'origine rétablie", intent: "success", duree: 3000 })
            }}
          >
            Réinitialiser
          </Button>
          <Button appearance="primary" icon={<CheckmarkRegular />} onClick={() => setEdition(false)}>
            Terminé
          </Button>
        </div>
      )}

      {visibles.length === 0 ? (
        <Vide
          Icone={GridRegular}
          titre="Aucun widget"
          texte="Le tableau de bord est vide."
          action={
            <Button appearance="primary" icon={<AddRegular />} onClick={() => setEdition(true)}>
              Ajouter des widgets
            </Button>
          }
        />
      ) : (
        <div className={styles.tableau}>
          {visibles.map((w, rang) => {
            const id = w.id as IdWidget
            const { titre } = WIDGETS[id]
            const glisser = {
              draggable: edition,
              onDragStart: (e: DragEvent) => {
                e.dataTransfer.effectAllowed = "move"
                e.dataTransfer.setData("text/plain", id)
                setDeplace(id)
              },
              onDragEnd: () => {
                setDeplace(null)
                setSurvol(null)
              },
              onDragOver: (e: DragEvent) => {
                if (!deplace) return
                e.preventDefault()
                e.dataTransfer.dropEffect = "move"
                if (survol !== id) setSurvol(id)
              },
              onDrop: (e: DragEvent) => {
                e.preventDefault()
                if (deplace) deplacer(deplace, id)
                setDeplace(null)
                setSurvol(null)
              },
            }
            return (
              <div
                key={id}
                className={mergeClasses(
                  styles.widget,
                  classesTaille[w.taille],
                  edition && styles.widgetEdition,
                  deplace === id && styles.widgetDeplace,
                  survol === id && deplace !== id && styles.widgetCible,
                )}
                {...(edition ? glisser : {})}
              >
                {edition && (
                  <div className={styles.outils}>
                    <Tooltip content={`Glisser pour déplacer « ${titre} »`} relationship="label">
                      <span className={styles.poignee} aria-hidden>
                        <ReOrderDotsVerticalRegular />
                      </span>
                    </Tooltip>
                    <Caption1 className={styles.nomWidget}>{titre}</Caption1>
                    <Menu checkedValues={{ taille: [String(w.taille)] }} onCheckedValueChange={(_e, data) => changerTaille(id, Number(data.checkedItems[0]) as TailleWidget)}>
                      <MenuTrigger disableButtonEnhancement>
                        <Button size="small" appearance="subtle" icon={<MoreHorizontalRegular />} aria-label={`Options du widget « ${titre} »`} />
                      </MenuTrigger>
                      <MenuPopover>
                        <MenuList>
                          <MenuGroup>
                            <MenuGroupHeader>Largeur</MenuGroupHeader>
                            {([1, 2, 3, 4] as TailleWidget[]).map((t) => (
                              <MenuItemRadio key={t} name="taille" value={String(t)}>
                                {TAILLES[t]}
                              </MenuItemRadio>
                            ))}
                          </MenuGroup>
                          <MenuDivider />
                          <MenuItem icon={<ArrowPreviousRegular />} disabled={rang === 0} onClick={() => decaler(id, -1)}>
                            Déplacer avant
                          </MenuItem>
                          <MenuItem icon={<ArrowNextRegular />} disabled={rang === visibles.length - 1} onClick={() => decaler(id, 1)}>
                            Déplacer après
                          </MenuItem>
                          <MenuDivider />
                          <MenuItem icon={<DismissRegular />} onClick={() => masquer(id)}>
                            Masquer ce widget
                          </MenuItem>
                        </MenuList>
                      </MenuPopover>
                    </Menu>
                    <Tooltip content="Masquer" relationship="label">
                      <Button size="small" appearance="subtle" icon={<DismissRegular />} onClick={() => masquer(id)} />
                    </Tooltip>
                  </div>
                )}
                <div className={mergeClasses(styles.contenuWidget, edition && styles.contenuInerte)} inert={edition}>
                  {contenu(id)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

type Donnees = ReturnType<typeof useDonneesChargees>

// Demande en option : l'essentiel pour décider sans ouvrir la fiche, et les actions
function Demande({ reservation: r, donnees }: { reservation: Reservation; donnees: Donnees }) {
  const styles = useAujourdhuiStyles()
  const client = donnees.clientDe(r)
  const restant = r.expireLe ? tempsRestant(r.expireLe) : null

  return (
    <li className={styles.demande}>
      <div className={styles.ligne}>
        <Avatar name={nomDe(client)} color="colorful" />
        <div className={styles.infos}>
          <div className={styles.nom}>
            {client ? (
              <Link onClick={() => donnees.naviguer({ page: "client", id: client.id })}>
                <Text weight="semibold">{nomDe(client)}</Text>
              </Link>
            ) : (
              <Text weight="semibold">{nomDe(client)}</Text>
            )}
            <Badge appearance="tint" color={restant ? "warning" : "danger"} shape="rounded" size="small">
              {restant ? `Expire dans ${restant}` : "Option échue"}
            </Badge>
          </div>
          <Body1>
            {formaterPlage(r.arrivee, r.depart)}, {donnees.hebergementDe(r)?.nom}
          </Body1>
          <Caption1 className={styles.secondaire}>
            {pluriel(nombreNuits(r.arrivee, r.depart), "nuit")}, {pluriel(r.adultes + r.enfants, "voyageur")}
            {client?.pays && `, ${client.pays}`}
          </Caption1>
        </div>
        <Text className={styles.prix}>{formaterPrix(r.montantTotal)}</Text>
      </div>
      {(r.message || r.navette) && (
        <div className={styles.extrait}>
          {r.navette && (
            <span className={styles.extraitLigne}>
              <VehicleBusRegular /> Navette aéroport demandée
            </span>
          )}
          {r.message && (
            <span className={styles.extraitLigne}>
              <ChatRegular />
              <span className={styles.message}>« {r.message} »</span>
            </span>
          )}
        </div>
      )}
      <div className={styles.piedDemande}>
        <ActionsReservation reservationId={r.id} statut={r.statut} reference={r.reference} taille="small" />
        <FicheReservation
          reservation={r}
          declencheur={
            <Button appearance="subtle" size="small">
              Détails
            </Button>
          }
        />
      </div>
    </li>
  )
}

// Liste courte de séjours : une ligne par client ; à la réception, bouton d'arrivée ou de départ
function Sejours({ reservations, vide, donnees, avecDate = false, reception = false }: { reservations: Reservation[]; vide: string; donnees: Donnees; avecDate?: boolean; reception?: boolean }) {
  const styles = useAujourdhuiStyles()
  if (reservations.length === 0) {
    return (
      <Body1 className={styles.aucun}>
        <CalendarLtrRegular /> {vide}
      </Body1>
    )
  }
  return (
    <ul className={mergeClasses(styles.liste, styles.listeSerree)}>
      {reservations.map((r) => {
        const client = donnees.clientDe(r)
        const solde = soldeDe(r, donnees.d.paiements)
        return (
          <li key={r.id} className={styles.sejour}>
            <Avatar name={nomDe(client)} color="colorful" size={32} />
            <div className={styles.infos}>
              <Text weight="semibold" truncate wrap={false}>
                {nomDe(client)}
              </Text>
              <Caption1 className={styles.secondaire} truncate wrap={false}>
                {avecDate ? `${formaterDate(r.arrivee, { year: undefined })}, ` : ""}
                {donnees.hebergementDe(r)?.nom}, {pluriel(nombreNuits(r.arrivee, r.depart), "nuit")}
                {r.navette && ", navette"}
                {solde > 0 && `, reste ${formaterPrix(solde)}`}
              </Caption1>
            </div>
            {reception && <BoutonReception reservation={r} aujourdhui={donnees.d.aujourdhui} taille="small" />}
            <FicheReservation reservation={r} />
          </li>
        )
      })}
    </ul>
  )
}
