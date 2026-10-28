import {
  Badge,
  Body1,
  CounterBadge,
  Button,
  Caption1,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Dropdown,
  Field,
  Input,
  Menu,
  MenuDivider,
  MenuItem,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MessageBar,
  MessageBarBody,
  Option,
  Spinner,
  Subtitle1,
  Subtitle2,
  Tab,
  TabList,
  Text,
  Textarea,
  Tooltip,
  mergeClasses,
  type BadgeProps,
} from "@fluentui/react-components"
import {
  AddRegular,
  ArrowCounterclockwiseRegular,
  BedRegular,
  BroomRegular,
  CalendarAddRegular,
  CheckmarkCircleRegular,
  DeleteRegular,
  DoorArrowLeftRegular,
  DoorArrowRightRegular,
  DoorRegular,
  GridRegular,
  MoreHorizontalRegular,
  NoteRegular,
  OpenRegular,
  PersonRegular,
  ProhibitedRegular,
  RenameRegular,
  TextBulletListLtrRegular,
  WrenchRegular,
  type FluentIcon,
} from "@fluentui/react-icons"
import { useState, type FormEvent } from "react"
import { formaterDate, pluriel } from "@partage/dates"
import type { Chambre, EtatChambre } from "@partage/types"
import type { FiltreChambres, VueChambres } from "../../../partage/ipc"
import { EnTete, Vide } from "../composants/commun"
import FicheReservation from "../composants/FicheReservation"
import { Indicateur } from "../composants/graphiques"
import { useFormulairesStyles } from "../composants/useFormulairesStyles.styles"
import { chambresTriees, nomDe, useDonneesChargees, useLectureSeule, type Donnees, type HebergementCourt } from "../donnees"
import { ETATS_CHAMBRE } from "../libelles"
import { usePrix } from "../montants"
import { useReglages } from "../reglages"
import { useAnnoncer } from "../toasts"
import { useChambresStyles } from "./useChambresStyles.styles"

const STYLE_ETAT: Record<EtatChambre, { couleur: BadgeProps["color"]; Icone: FluentIcon }> = {
  propre: { couleur: "success", Icone: CheckmarkCircleRegular },
  a_nettoyer: { couleur: "warning", Icone: BroomRegular },
  maintenance: { couleur: "danger", Icone: WrenchRegular },
}

// Client présent dans la chambre ce soir (arrivé ou attendu), sans départ enregistré
const occupantDe = (d: Donnees, chambreId: string) =>
  d.reservations.find(
    (r) => r.chambreId === chambreId && r.statut === "confirmee" && !r.departLe && r.arrivee <= d.aujourdhui && r.depart > d.aujourdhui,
  )

// Situation de la chambre ce soir. Une chambre sans client n'est disponible que propre : à nettoyer ou en
// maintenance, elle n'est pas prête pour ce soir (les nuits suivantes restent réservables)
type Disponibilite = "occupee" | "disponible" | "pas_prete" | "bloquee" | "desactivee"
function disponibiliteDe(d: Donnees, c: Chambre): Disponibilite {
  if (!c.active) return "desactivee"
  if (occupantDe(d, c.id) || d.reservations.some((r) => r.chambreId === c.id && r.statut === "confirmee" && r.depart === d.aujourdhui && !r.departLe)) return "occupee"
  if (d.blocages.some((b) => b.chambreId === c.id && b.debut <= d.aujourdhui && b.fin > d.aujourdhui)) return "bloquee"
  return c.etat === "propre" ? "disponible" : "pas_prete"
}

// Filtres de l'écran : situation de ce soir ou état du ménage
const FILTRES: { valeur: FiltreChambres; libelle: string; garde: (d: Donnees, c: Chambre) => boolean }[] = [
  { valeur: "toutes", libelle: "Toutes", garde: () => true },
  { valeur: "disponibles", libelle: "Disponibles ce soir", garde: (d, c) => disponibiliteDe(d, c) === "disponible" },
  { valeur: "occupees", libelle: "Occupées", garde: (d, c) => disponibiliteDe(d, c) === "occupee" },
  { valeur: "a_nettoyer", libelle: "À nettoyer", garde: (_d, c) => c.active && c.etat === "a_nettoyer" },
  { valeur: "maintenance", libelle: "En maintenance", garde: (_d, c) => c.active && c.etat === "maintenance" },
]

// Numéro proposé pour une nouvelle chambre : celui qui suit le plus grand de la catégorie (« Océan 5 » → « Océan 6 »),
// sinon le nom court de la catégorie (« Bungalow Océan » → « Océan 1 »)
function numeroSuivant(d: Donnees, hebergementId: string): string {
  const motifs = d.chambres
    .filter((c) => c.hebergementId === hebergementId)
    .map((c) => c.numero.match(/^(.*?)(\d+)$/))
    .filter((m): m is RegExpMatchArray => m !== null)
  if (motifs.length > 0) {
    const prefixe = motifs[0][1]
    const plusGrand = Math.max(...motifs.filter((m) => m[1] === prefixe).map((m) => Number(m[2])))
    return `${prefixe}${plusGrand + 1}`
  }
  const nom = d.hebergements.find((h) => h.id === hebergementId)?.nom ?? ""
  return `${nom.replace(/^(Bungalow|Chambre)\s+/i, "")} 1`.trim()
}

// Gestion des chambres : chambres numérotées de chaque catégorie (ajout, numéro, désactivation, suppression pour
// les gérants), état du ménage et de la maintenance, occupant du jour, prochaine arrivée. Le départ enregistré à la
// réception passe la chambre « À nettoyer » (côté serveur).
export default function Chambres({ filtre }: { filtre: FiltreChambres }) {
  const lectureSeule = useLectureSeule()
  const styles = useChambresStyles()
  const { d, gerant, naviguer } = useDonneesChargees()
  const { reglages, modifier } = useReglages()
  const [ajout, setAjout] = useState<string | null>(null) // catégorie de la chambre à ajouter
  const actives = d.chambres.filter((c) => c.active)
  const compte = (etat: EtatChambre) => actives.filter((c) => c.etat === etat).length
  const occupees = actives.filter((c) => occupantDe(d, c.id)).length
  const garde = FILTRES.find((f) => f.valeur === filtre)!.garde
  const triees = chambresTriees(d).filter((c) => garde(d, c))
  const disponibles = actives.filter((c) => disponibiliteDe(d, c) === "disponible").length
  const vue: VueChambres = reglages.vueChambres === "liste" ? "liste" : "cartes"

  return (
    <>
      <EnTete
        titre="Chambres"
        description="Chambres numérotées de chaque catégorie : ménage, maintenance et occupation aujourd'hui."
        actions={
          <div className={styles.actionsEnTete}>
            {/* Affichage gardé sur ce poste : cartes détaillées ou liste compacte (tout l'hôtel sur une page) */}
            <TabList data-visite="chambres-affichage" size="small" selectedValue={vue} onTabSelect={(_e, data) => void modifier({ vueChambres: data.value as VueChambres })} aria-label="Affichage">
              <Tab value="cartes" icon={<GridRegular />}>
                Cartes
              </Tab>
              <Tab value="liste" icon={<TextBulletListLtrRegular />}>
                Liste compacte
              </Tab>
            </TabList>
            {gerant && (
              <Button appearance="primary" icon={<AddRegular />} disabled={lectureSeule} onClick={() => setAjout(d.hebergements[0]?.id ?? "")}>
                Ajouter une chambre
              </Button>
            )}
          </div>
        }
      />
      {vue === "cartes" ? (
        <div className={styles.resume}>
          <Indicateur Icone={BedRegular} libelle="Occupées ce soir" valeur={`${occupees} / ${actives.length}`} />
          <Indicateur Icone={DoorRegular} libelle="Disponibles ce soir" valeur={disponibles} />
          <Indicateur Icone={CheckmarkCircleRegular} libelle="Propres" valeur={compte("propre")} />
          <Indicateur Icone={BroomRegular} libelle="À nettoyer" valeur={compte("a_nettoyer")} />
          <Indicateur Icone={WrenchRegular} libelle="En maintenance" valeur={compte("maintenance")} />
        </div>
      ) : (
        // Liste compacte : le résumé tient sur une ligne de pastilles
        <div className={styles.resumeCompact}>
          <Badge appearance="tint" color="brand" shape="rounded" size="large" icon={<BedRegular />}>
            {occupees} / {actives.length} occupées ce soir
          </Badge>
          <Badge appearance="tint" color="brand" shape="rounded" size="large" icon={<DoorRegular />}>
            {disponibles} disponible{disponibles > 1 ? "s" : ""} ce soir
          </Badge>
          {(Object.keys(ETATS_CHAMBRE) as EtatChambre[]).map((etat) => {
            const { couleur, Icone } = STYLE_ETAT[etat]
            return (
              <Badge key={etat} appearance="tint" color={couleur} shape="rounded" size="large" icon={<Icone />}>
                {compte(etat)} {ETATS_CHAMBRE[etat].toLowerCase()}
              </Badge>
            )
          })}
        </div>
      )}
      <TabList data-visite="chambres-filtres" selectedValue={filtre} onTabSelect={(_e, data) => naviguer({ page: "chambres", filtre: data.value as FiltreChambres })} aria-label="Filtrer les chambres">
        {FILTRES.map((f) => {
          const nombre = d.chambres.filter((c) => (f.valeur === "toutes" ? true : f.garde(d, c))).length
          return (
            <Tab key={f.valeur} value={f.valeur}>
              <span className={styles.onglet}>
                {f.libelle}
                <CounterBadge count={nombre} showZero size="small" appearance="ghost" color="informative" />
              </span>
            </Tab>
          )
        })}
      </TabList>
      {/* Filtré : seules les catégories qui gardent une chambre restent affichées */}
      {d.hebergements
        .filter((h) => filtre === "toutes" || triees.some((c) => c.hebergementId === h.id))
        .map((h) => (
          <Categorie key={h.id} hebergement={h} chambres={triees.filter((c) => c.hebergementId === h.id)} vue={vue} onAjouter={() => setAjout(h.id)} />
        ))}
      {filtre !== "toutes" && triees.length === 0 && (
        <Vide Icone={BedRegular} titre="Aucune chambre" texte={`Aucune chambre ne correspond au filtre « ${FILTRES.find((f) => f.valeur === filtre)!.libelle} ».`} />
      )}
      {ajout !== null && <FenetreChambre hebergementId={ajout} onFin={() => setAjout(null)} />}
    </>
  )
}

function Categorie({ hebergement: h, chambres, vue, onAjouter }: { hebergement: HebergementCourt; chambres: Chambre[]; vue: VueChambres; onAjouter: () => void }) {
  const lectureSeule = useLectureSeule()
  const styles = useChambresStyles()
  const formaterPrix = usePrix()
  const { gerant } = useDonneesChargees()
  const actives = chambres.filter((c) => c.active).length
  const compacte = vue === "liste"
  const Titre = compacte ? Subtitle2 : Subtitle1

  return (
    <section className={mergeClasses(styles.categorie, compacte && styles.categorieCompacte)} aria-labelledby={`categorie-${h.id}`} data-visite="chambres-categorie">
      <div className={styles.enteteCategorie}>
        <div className={compacte ? styles.titreLigne : styles.titre}>
          <Titre as="h2" id={`categorie-${h.id}`} className={styles.nom}>
            {h.nom}
          </Titre>
          <Caption1 className={styles.secondaire}>
            {actives === 0 ? "Aucune chambre en vente" : `${pluriel(actives, "chambre")} en vente`}
            {chambres.length > actives && ` (+ ${pluriel(chambres.length - actives, "désactivée")})`} · {pluriel(h.capaciteMax, "personne")} par chambre ·{" "}
            {formaterPrix(h.prixNuit)} / nuit
          </Caption1>
        </div>
        {gerant && (
          <Button appearance="subtle" size={compacte ? "small" : "medium"} icon={<AddRegular />} disabled={lectureSeule} onClick={onAjouter}>
            Ajouter
          </Button>
        )}
      </div>
      {chambres.length === 0 ? (
        <Body1 className={styles.secondaire}>
          Cette catégorie n&apos;a aucune chambre : elle n&apos;est pas proposée sur le site.
          {gerant ? " Ajoutez-en une pour l'ouvrir à la réservation." : " Un gérant peut en ajouter."}
        </Body1>
      ) : compacte ? (
        <div className={styles.lignes}>
          {chambres.map((c) => (
            <LigneChambre key={c.id} chambre={c} />
          ))}
        </div>
      ) : (
        <div className={styles.grille}>
          {chambres.map((c) => (
            <CarteChambre key={c.id} chambre={c} hebergement={h} />
          ))}
        </div>
      )}
    </section>
  )
}

// Situation du jour d'une chambre : occupant (arrivé ou attendu), départ du jour, dates bloquées, désactivée ou libre
function useSituation(c: Chambre) {
  const { d, clientDe } = useDonneesChargees()
  const actives = d.reservations.filter((r) => r.chambreId === c.id && r.statut === "confirmee")
  const occupant = occupantDe(d, c.id)
  const departAujourdhui = actives.find((r) => r.depart === d.aujourdhui && !r.departLe)
  const prochaine = actives.filter((r) => r.arrivee > d.aujourdhui).sort((a, b) => a.arrivee.localeCompare(b.arrivee))[0]
  const bloquee = d.blocages.find((b) => b.chambreId === c.id && b.debut <= d.aujourdhui && b.fin > d.aujourdhui)

  let situation: { Icone: FluentIcon; titre: string; detail: string }
  if (occupant) {
    situation = {
      Icone: occupant.arriveeLe ? PersonRegular : DoorArrowRightRegular,
      titre: nomDe(clientDe(occupant)),
      detail: `${occupant.arriveeLe ? "Sur place" : occupant.arrivee === d.aujourdhui ? "Arrivée attendue aujourd'hui" : "Arrivée non enregistrée"} · départ le ${formaterDate(occupant.depart, { year: undefined })}`,
    }
  } else if (departAujourdhui) {
    situation = { Icone: DoorArrowLeftRegular, titre: nomDe(clientDe(departAujourdhui)), detail: "Départ aujourd'hui, pas encore enregistré" }
  } else if (bloquee) {
    situation = { Icone: NoteRegular, titre: "Dates bloquées", detail: `${bloquee.raison} · jusqu'au ${formaterDate(bloquee.fin, { year: undefined })}` }
  } else if (!c.active) {
    situation = { Icone: ProhibitedRegular, titre: "Désactivée", detail: "Plus proposée sur le site ni attribuée aux réservations" }
  } else if (c.etat !== "propre") {
    // Personne ce soir, mais chambre pas prête : pas disponible pour ce soir tant qu'elle n'est pas propre
    situation = {
      Icone: c.etat === "a_nettoyer" ? BroomRegular : WrenchRegular,
      titre: "Pas disponible ce soir",
      detail: c.etat === "a_nettoyer" ? "À nettoyer : disponible dès qu'elle est propre" : "En maintenance",
    }
  } else {
    const suite = prochaine ? `Prochaine arrivée le ${formaterDate(prochaine.arrivee, { year: undefined })}` : "Aucune arrivée prévue"
    situation = { Icone: BedRegular, titre: "Libre ce soir", detail: suite }
  }
  return { situation, reservationDuJour: occupant ?? departAujourdhui }
}

type EnCours = "etat" | "noteEtat" | "active" | null
type Modifier = (modification: Partial<Pick<Chambre, "etat" | "noteEtat" | "active">>) => Promise<void>

// Modification d'une chambre (état, note, mise en vente) ; `enCours` : Spinner sur le bouton qui l'a lancée
function useModifierChambre(c: Chambre) {
  const { executer } = useDonneesChargees()
  const { annoncer } = useAnnoncer()
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState<EnCours>(null)

  const modifier: Modifier = async (modification) => {
    setEnCours(modification.active !== undefined ? "active" : modification.etat !== undefined ? "etat" : "noteEtat")
    const resultat = await executer("PATCH", `/api/hotes/chambres/${encodeURIComponent(c.id)}`, modification)
    setEnCours(null)
    setErreur(resultat.ok ? null : resultat.erreur)
    if (resultat.ok && modification.active !== undefined) {
      annoncer({
        titre: modification.active ? `${c.numero} remise en vente` : `${c.numero} désactivée`,
        texte: modification.active ? "Elle est de nouveau proposée sur le site." : "Elle n'est plus proposée sur le site ni attribuée ; son historique reste.",
        intent: "success",
      })
    }
  }
  return { modifier, enCours, erreur }
}

function BadgeEtat({ chambre: c, taille = "medium" }: { chambre: Chambre; taille?: BadgeProps["size"] }) {
  const { couleur, Icone } = STYLE_ETAT[c.etat]
  return c.active ? (
    <Badge appearance="tint" color={couleur} icon={<Icone />} shape="rounded" size={taille}>
      {ETATS_CHAMBRE[c.etat]}
    </Badge>
  ) : (
    <Badge appearance="tint" color="subtle" icon={<ProhibitedRegular />} shape="rounded" size={taille}>
      Désactivée
    </Badge>
  )
}

// Menu de gestion des gérants : numéro, mise en vente, suppression
function MenuGestion({ chambre: c, enCours, modifier }: { chambre: Chambre; enCours: EnCours; modifier: Modifier }) {
  const lectureSeule = useLectureSeule()
  const [renommer, setRenommer] = useState(false)
  const [supprimer, setSupprimer] = useState(false)
  return (
    <>
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <Tooltip content={`Gérer ${c.numero}`} relationship="label">
            <Button appearance="subtle" size="small" disabled={enCours === "active" || lectureSeule} icon={enCours === "active" ? <Spinner size="tiny" /> : <MoreHorizontalRegular />} />
          </Tooltip>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem icon={<RenameRegular />} onClick={() => setRenommer(true)}>
              Changer le numéro
            </MenuItem>
            {c.active ? (
              <MenuItem icon={<ProhibitedRegular />} onClick={() => modifier({ active: false })}>
                Désactiver (plus proposée)
              </MenuItem>
            ) : (
              <MenuItem icon={<ArrowCounterclockwiseRegular />} onClick={() => modifier({ active: true })}>
                Remettre en vente
              </MenuItem>
            )}
            <MenuDivider />
            <MenuItem icon={<DeleteRegular />} onClick={() => setSupprimer(true)}>
              Supprimer
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
      {renommer && <FenetreChambre chambre={c} onFin={() => setRenommer(false)} />}
      {supprimer && <SupprimerChambre chambre={c} onFin={() => setSupprimer(false)} />}
    </>
  )
}

// Choix de l'état du ménage ; `compact` : bouton icône seule (liste compacte)
function MenuEtat({ chambre: c, enCours, modifier, compact = false }: { chambre: Chambre; enCours: EnCours; modifier: Modifier; compact?: boolean }) {
  const lectureSeule = useLectureSeule()
  const bouton = (
    <Button
      appearance={compact ? "subtle" : "secondary"}
      size={compact ? "small" : "medium"}
      disabled={enCours === "etat" || lectureSeule}
      icon={enCours === "etat" ? <Spinner size="tiny" /> : <BroomRegular />}
    >
      {compact ? undefined : "État"}
    </Button>
  )
  return (
    <Menu checkedValues={{ etat: [c.etat] }} onCheckedValueChange={(_e, data) => modifier({ etat: data.checkedItems[0] as EtatChambre })}>
      <MenuTrigger disableButtonEnhancement>
        {compact ? (
          <Tooltip content={`Changer l'état de ${c.numero}`} relationship="label">
            {bouton}
          </Tooltip>
        ) : (
          bouton
        )}
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {(Object.keys(ETATS_CHAMBRE) as EtatChambre[]).map((etat) => {
            const { Icone: IconeEtat } = STYLE_ETAT[etat]
            return (
              <MenuItemRadio key={etat} name="etat" value={etat} icon={<IconeEtat />}>
                {ETATS_CHAMBRE[etat]}
              </MenuItemRadio>
            )
          })}
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}

function CarteChambre({ chambre: c, hebergement: h }: { chambre: Chambre; hebergement: HebergementCourt }) {
  const lectureSeule = useLectureSeule()
  const styles = useChambresStyles()
  const { gerant, ouvrirNouvelleReservation } = useDonneesChargees()
  const { modifier, enCours, erreur } = useModifierChambre(c)
  const { situation, reservationDuJour } = useSituation(c)

  return (
    <section className={mergeClasses(styles.carte, c.active ? styles[c.etat] : styles.desactivee)}>
      <div className={styles.entete}>
        <div className={styles.titre}>
          <Subtitle2 as="h3" className={styles.nom}>
            {c.numero}
          </Subtitle2>
          <Caption1 className={styles.secondaire} truncate wrap={false} title={h.literie}>
            {h.type === "bungalow" ? "Bungalow" : "Chambre"} · {pluriel(h.capaciteMax, "personne")} · {h.literie}
          </Caption1>
        </div>
        {/* État, puis le menu de gestion des gérants : en haut à droite, le pied garde la place des trois actions */}
        <div className={styles.enteteDroite}>
          <BadgeEtat chambre={c} />
          {gerant && <MenuGestion chambre={c} enCours={enCours} modifier={modifier} />}
        </div>
      </div>

      <div className={styles.occupation}>
        <situation.Icone className={styles.icone} />
        <div className={styles.occupationTexte}>
          <Text weight="semibold" truncate wrap={false}>
            {situation.titre}
          </Text>
          <Caption1 className={styles.secondaire}>{situation.detail}</Caption1>
        </div>
        {reservationDuJour && <FicheReservation reservation={reservationDuJour} />}
      </div>

      {c.noteEtat && (
        <Body1 className={styles.note}>
          <NoteRegular /> {c.noteEtat}
        </Body1>
      )}
      {erreur && (
        <MessageBar intent="error">
          <MessageBarBody>{erreur}</MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.pied}>
        {c.active && (
          <>
            <MenuEtat chambre={c} enCours={enCours} modifier={modifier} />
            <NoteChambre chambre={c} onEnregistrer={(noteEtat) => modifier({ noteEtat })} />
            <Button
              appearance="subtle"
              icon={<CalendarAddRegular />}
              disabled={lectureSeule}
              onClick={() => ouvrirNouvelleReservation({ hebergementId: c.hebergementId, chambreId: c.id })}
            >
              Réserver
            </Button>
          </>
        )}
      </div>
    </section>
  )
}

// Liste compacte : une ligne par chambre (numéro, état, situation du jour, note, actions en icônes)
function LigneChambre({ chambre: c }: { chambre: Chambre }) {
  const lectureSeule = useLectureSeule()
  const styles = useChambresStyles()
  const { gerant, ouvrirNouvelleReservation } = useDonneesChargees()
  const { modifier, enCours, erreur } = useModifierChambre(c)
  const { situation, reservationDuJour } = useSituation(c)

  return (
    <div className={mergeClasses(styles.ligne, c.active ? styles[`ligne_${c.etat}`] : styles.ligneDesactivee)}>
      <Text weight="semibold" truncate wrap={false} className={styles.numeroLigne}>
        {c.numero}
      </Text>
      <div className={styles.etatLigne}>
        <BadgeEtat chambre={c} taille="small" />
      </div>
      <div className={styles.situationLigne} title={`${situation.titre} · ${situation.detail}`}>
        <situation.Icone className={styles.iconeLigne} />
        <Text truncate wrap={false} className={styles.texteLigne}>
          <strong>{situation.titre}</strong>
          <span className={styles.secondaire}> · {situation.detail}</span>
        </Text>
      </div>
      <Caption1 truncate wrap={false} className={styles.noteLigne} title={c.noteEtat || undefined}>
        {c.noteEtat && (
          <>
            <NoteRegular /> {c.noteEtat}
          </>
        )}
      </Caption1>
      <div className={styles.actionsLigne}>
        {reservationDuJour && (
          <FicheReservation
            reservation={reservationDuJour}
            declencheur={
              <Tooltip content="Détails du séjour" relationship="label">
                <Button appearance="subtle" size="small" icon={<OpenRegular />} />
              </Tooltip>
            }
          />
        )}
        {c.active && (
          <>
            <MenuEtat chambre={c} enCours={enCours} modifier={modifier} compact />
            <NoteChambre chambre={c} onEnregistrer={(noteEtat) => modifier({ noteEtat })} compact />
            <Tooltip content={`Réserver ${c.numero}`} relationship="label">
              <Button
                appearance="subtle"
                size="small"
                icon={<CalendarAddRegular />}
                disabled={lectureSeule}
                onClick={() => ouvrirNouvelleReservation({ hebergementId: c.hebergementId, chambreId: c.id })}
              />
            </Tooltip>
          </>
        )}
        {gerant && <MenuGestion chambre={c} enCours={enCours} modifier={modifier} />}
      </div>
      {erreur && (
        <MessageBar intent="error" className={styles.erreurLigne}>
          <MessageBarBody>{erreur}</MessageBarBody>
        </MessageBar>
      )}
    </div>
  )
}

// Note de ménage ou de maintenance (« ampoule salle de bains », « moustiquaire à changer »…)
function NoteChambre({ chambre: c, onEnregistrer, compact = false }: { chambre: Chambre; onEnregistrer: (note: string) => Promise<void>; compact?: boolean }) {
  const lectureSeule = useLectureSeule()
  const [note, setNote] = useState(c.noteEtat)
  const [ouvert, setOuvert] = useState(false)
  const [enCours, setEnCours] = useState(false)

  async function enregistrer() {
    setEnCours(true)
    await onEnregistrer(note)
    setEnCours(false)
    setOuvert(false)
  }

  return (
    <Dialog
      open={ouvert}
      onOpenChange={(_e, data) => {
        if (enCours) return
        if (data.open) setNote(c.noteEtat)
        setOuvert(data.open)
      }}
    >
      <DialogTrigger disableButtonEnhancement>
        {compact ? (
          <Tooltip content={`Note de ${c.numero}`} relationship="label">
            <Button appearance="subtle" size="small" icon={<NoteRegular />} disabled={lectureSeule} />
          </Tooltip>
        ) : (
          <Button appearance="subtle" icon={<NoteRegular />} disabled={lectureSeule}>
            Note
          </Button>
        )}
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Note : {c.numero}</DialogTitle>
          <DialogContent>
            <Field label="Ménage ou maintenance" hint="Visible par toute l'équipe sur la carte de la chambre.">
              <Textarea value={note} onChange={(_e, data) => setNote(data.value)} maxLength={200} resize="vertical" />
            </Field>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button disabled={enCours}>Annuler</Button>
            </DialogTrigger>
            <Button appearance="primary" disabled={enCours || lectureSeule} icon={enCours ? <Spinner size="tiny" /> : undefined} onClick={enregistrer}>
              Enregistrer
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

// Nouvelle chambre (`hebergementId` : catégorie proposée) ou nouveau numéro d'une chambre existante (`chambre`)
function FenetreChambre({ hebergementId: categorieInitiale = "", chambre, onFin }: { hebergementId?: string; chambre?: Chambre; onFin: () => void }) {
  const lectureSeule = useLectureSeule()
  const styles = useFormulairesStyles()
  const { d, executer } = useDonneesChargees()
  const { annoncer } = useAnnoncer()
  const [hebergementId, setHebergementId] = useState(chambre?.hebergementId ?? categorieInitiale)
  const [numero, setNumero] = useState(chambre?.numero ?? numeroSuivant(d, categorieInitiale))
  // Numéro proposé tant que l'équipe ne l'a pas changé : il suit la catégorie choisie
  const [numeroSaisi, setNumeroSaisi] = useState(Boolean(chambre))
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const hebergement = d.hebergements.find((h) => h.id === hebergementId)

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    const resultat = chambre
      ? await executer("PATCH", `/api/hotes/chambres/${encodeURIComponent(chambre.id)}`, { numero })
      : await executer("POST", "/api/hotes/chambres", { hebergementId, numero })
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    annoncer({
      titre: chambre ? `${chambre.numero} s'appelle maintenant ${numero.trim()}` : `${numero.trim()} ajoutée à ${hebergement?.nom}`,
      texte: chambre ? undefined : "Elle est proposée sur le site dès maintenant, au prix de sa catégorie.",
      intent: "success",
    })
    onFin()
  }

  return (
    <Dialog open onOpenChange={(_e, data) => !data.open && onFin()}>
      <DialogSurface>
        <form onSubmit={envoyer}>
          <DialogBody>
            <DialogTitle>{chambre ? `Changer le numéro de ${chambre.numero}` : "Ajouter une chambre"}</DialogTitle>
            <DialogContent className={styles.corps}>
              {!chambre && (
                <Field label="Catégorie" required hint="Prix, capacité et photos du site sont ceux de la catégorie.">
                  <Dropdown
                    value={hebergement?.nom ?? ""}
                    selectedOptions={hebergementId ? [hebergementId] : []}
                    onOptionSelect={(_e, data) => {
                      const id = data.optionValue ?? ""
                      setHebergementId(id)
                      if (!numeroSaisi) setNumero(numeroSuivant(d, id))
                    }}
                  >
                    {d.hebergements.map((h) => (
                      <Option key={h.id} value={h.id}>
                        {h.nom}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
              )}
              <Field label="Numéro" required hint="Unique dans l'hôtel, par exemple « Océan 3 ». Les clients ne le voient pas sur le site.">
                <Input
                  value={numero}
                  maxLength={30}
                  onChange={(_e, data) => {
                    setNumero(data.value)
                    setNumeroSaisi(true)
                  }}
                />
              </Field>
              {erreur && (
                <MessageBar intent="error">
                  <MessageBarBody>{erreur}</MessageBarBody>
                </MessageBar>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={onFin}>Annuler</Button>
              <Button type="submit" appearance="primary" disabled={enCours || lectureSeule || !numero.trim() || !hebergementId} icon={enCours ? <Spinner size="tiny" /> : undefined}>
                {chambre ? "Enregistrer" : "Ajouter"}
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  )
}

// Suppression : seulement pour une chambre sans aucune réservation (créée par erreur) ; sinon le serveur refuse et
// propose de la désactiver
function SupprimerChambre({ chambre: c, onFin }: { chambre: Chambre; onFin: () => void }) {
  const lectureSeule = useLectureSeule()
  const { d, executer } = useDonneesChargees()
  const { annoncer } = useAnnoncer()
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const historique = d.reservations.some((r) => r.chambreId === c.id)
  const calendriers = d.calendriers.filter((k) => k.chambreId === c.id).length

  async function confirmer() {
    setEnCours(true)
    const resultat = await executer("DELETE", `/api/hotes/chambres/${encodeURIComponent(c.id)}`)
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    annoncer({ titre: `${c.numero} supprimée`, intent: "success" })
    onFin()
  }

  return (
    <Dialog open onOpenChange={(_e, data) => !data.open && onFin()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Supprimer {c.numero} ?</DialogTitle>
          <DialogContent>
            {historique ? (
              <MessageBar intent="warning">
                <MessageBarBody>
                  Des réservations ont déjà été faites dans cette chambre : elle ne peut pas être supprimée. Désactivez-la plutôt, son historique
                  restera.
                </MessageBarBody>
              </MessageBar>
            ) : (
              <Body1>
                La chambre disparaît du logiciel et du site, avec ses dates bloquées
                {calendriers > 0 && ` et ${pluriel(calendriers, "calendrier")} de plateforme`}. Cette action est définitive.
              </Body1>
            )}
            {erreur && (
              <MessageBar intent="error">
                <MessageBarBody>{erreur}</MessageBarBody>
              </MessageBar>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onFin}>Annuler</Button>
            {!historique && (
              <Button appearance="primary" disabled={enCours || lectureSeule} icon={enCours ? <Spinner size="tiny" /> : <DeleteRegular />} onClick={confirmer}>
                Supprimer
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
