import {
  Button,
  Caption1,
  Dropdown,
  Field,
  Input,
  Link,
  Menu,
  MenuDivider,
  MenuGroup,
  MenuGroupHeader,
  MenuItem,
  MenuItemCheckbox,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Option,
  OptionGroup,
  Spinner,
  Tab,
  TabList,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Tooltip,
  mergeClasses,
} from "@fluentui/react-components"
import {
  ArrowMaximizeVerticalRegular,
  ArrowMinimizeVerticalRegular,
  CalendarAddRegular,
  CalendarCancelRegular,
  CalendarClockRegular,
  ChevronDownRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
  LockOpenRegular,
  OptionsRegular,
} from "@fluentui/react-icons"
import { Fragment, useState, type CSSProperties, type FormEvent } from "react"
import { ajouterJours, chevauche, formaterDate, formaterPlage, nombreNuits, pluriel, versDate } from "@partage/dates"
import { libelleStatutHote } from "@partage/statuts"
import type { Blocage, Chambre, DateISO, Reservation } from "@partage/types"
import { moisVoisin, nomDuMois } from "../composants/calendrierMois"
import Calendriers from "../composants/Calendriers"
import ChampDate from "../composants/ChampDate"
import { Carte, EnTete, Vide } from "../composants/commun"
import FicheReservation from "../composants/FicheReservation"
import { blocageGene, chambresTriees, doublesReservations, nomChambre, nomDe, useDonneesChargees, useLectureSeule } from "../donnees"
import { useReglages } from "../reglages"
import {
  DENSITES_PLANNING,
  LIBELLES_PLANNING,
  TRIS_PLANNING,
  VUES_PLANNING,
  type AffichagePlanning,
  type DensitePlanning,
  type LibellePlanning,
  type TriPlanning,
  type VuePlanning,
} from "../../../partage/ipc"
import PlanningMois from "./PlanningMois"
import { usePlanningStyles } from "./usePlanningStyles.styles"

const VUES: Record<VuePlanning, { libelle: string; precedent: string; suivant: string }> = {
  1: { libelle: "Jour", precedent: "Jour précédent", suivant: "Jour suivant" },
  7: { libelle: "1 sem.", precedent: "Semaine précédente", suivant: "Semaine suivante" },
  14: { libelle: "2 sem.", precedent: "2 semaines précédentes", suivant: "2 semaines suivantes" },
  21: { libelle: "3 sem.", precedent: "3 semaines précédentes", suivant: "3 semaines suivantes" },
  mois: { libelle: "Mois", precedent: "Mois précédent", suivant: "Mois suivant" },
}

const TRIS: Record<TriPlanning, string> = {
  site: "Par catégorie",
  nom: "Par numéro",
  type: "Bungalows, puis chambres",
  occupation: "Les plus occupées d'abord",
}

const DENSITES: Record<DensitePlanning, string> = { confortable: "Confortable", compacte: "Compacte" }
const LIBELLES: Record<LibellePlanning, string> = { client: "Nom du client", reference: "Référence" }

type Barre = { cle: string; debut: DateISO; fin: DateISO; libelle: string; detail: string; genre: "option" | "confirmee" | "blocage" | "conflit"; reservation?: Reservation }

const estWeekEnd = (jour: DateISO) => [0, 6].includes(versDate(jour).getUTCDay())
const estActive = (r: Reservation) => r.statut === "option" || r.statut === "confirmee"

// Planning : une ligne par chambre, regroupées par catégorie (repliables : la catégorie se résume alors à son
// occupation nuit par nuit), une colonne par nuit ; réservations et blocages en barres. Vue « Mois » : le mois en
// calendrier (PlanningMois). Options d'affichage (menu « Affichage ») gardées sur ce poste.
export default function Planning() {
  const lectureSeule = useLectureSeule()
  const styles = usePlanningStyles()
  const { d, clientDe, ouvrirNouvelleReservation } = useDonneesChargees()
  const { reglages, modifier } = useReglages()
  const affichage = reglages.affichagePlanning
  // Vue « Mois » : calendrier du mois de `debut` ; sinon frise de `nbJours` nuits
  const vue = reglages.vuePlanning
  const enMois = vue === "mois"
  const nbJours = vue === "mois" ? 21 : vue
  const [debut, setDebut] = useState(d.aujourdhui)
  // Colonne d'un jour mise en évidence sur toute la hauteur : au survol de son en-tête, ou gardée par un clic dessus
  const [survole, setSurvole] = useState<DateISO | null>(null)
  const [epingle, setEpingle] = useState<DateISO | null>(null)
  const jours = Array.from({ length: nbJours }, (_, i) => ajouterJours(debut, i))
  const finVue = ajouterJours(debut, nbJours)
  // Colonne des noms assez large pour le nom complet de la plus longue catégorie (chevron, compteur et marges en
  // plus) ; nuits à largeur égale
  const plusLongNom = Math.max(...d.hebergements.map((h) => h.nom.length), ...d.chambres.map((c) => c.numero.length + 4))
  const colonnes: CSSProperties = { gridTemplateColumns: `max(160px, calc(${plusLongNom}ch + 72px)) repeat(${nbJours}, minmax(26px, 1fr))` }
  const calendrierDe = (b: Blocage) => d.calendriers.find((c) => c.id === b.calendrierId)
  const conflits = doublesReservations(d)
  const enConflit = new Set(conflits.map((c) => c.blocage.id))
  const changerAffichage = (changement: Partial<AffichagePlanning>) => void modifier({ affichagePlanning: { ...affichage, ...changement } })

  // Nuit déjà prise (réservation active ou dates bloquées)
  const occupee = (chambreId: string, nuit: DateISO) =>
    d.reservations.some((r) => r.chambreId === chambreId && estActive(r) && r.arrivee <= nuit && r.depart > nuit) ||
    d.blocages.some((b) => b.chambreId === chambreId && b.debut <= nuit && b.fin > nuit)

  function barresDe(chambreId: string): Barre[] {
    const reservations = d.reservations
      .filter((r) => r.chambreId === chambreId && estActive(r))
      .map((r): Barre => {
        const nom = clientDe(r) ? nomDe(clientDe(r)) : r.reference
        return {
          cle: r.id,
          debut: r.arrivee,
          fin: r.depart,
          libelle: affichage.libelle === "reference" ? r.reference : nom,
          detail: `${nom} · ${r.reference}\n${formaterPlage(r.arrivee, r.depart)} · ${pluriel(nombreNuits(r.arrivee, r.depart), "nuit")} · ${libelleStatutHote[r.statut]}`,
          genre: r.statut === "option" ? "option" : "confirmee",
          reservation: r,
        }
      })
    const blocages = d.blocages
      .filter((b) => b.chambreId === chambreId)
      // Réservation Booking.com saisie à la main et la même importée de Booking.com : une seule barre
      .filter((b) => !b.calendrierId || !d.reservations.some((r) => r.chambreId === chambreId && estActive(r) && chevauche(b.debut, b.fin, r.arrivee, r.depart) && !blocageGene(b, r.source, d.calendriers)))
      .map((b): Barre => {
        const libelle = calendrierDe(b)?.nom ?? (b.raison || "Bloqué")
        const conflit = enConflit.has(b.id)
        return { cle: b.id, debut: b.debut, fin: b.fin, libelle, detail: `${conflit ? "Double réservation : " : ""}${b.raison || "Dates bloquées"}\n${formaterPlage(b.debut, b.fin)}`, genre: conflit ? "conflit" : "blocage" }
      })
    return [...reservations, ...blocages]
  }

  // Nuits occupées (réservations actives et dates bloquées) dans la période affichée
  const nuitsOccupees = (chambreId: string) => jours.filter((j) => occupee(chambreId, j)).length
  // Chambres actives, et chambres désactivées seulement si la période affichée garde une trace d'elles
  const chambres = chambresTriees(d).filter((c) => c.active || barresDe(c.id).some((b) => chevauche(b.debut, b.fin, debut, finVue)))
  const typeDe = (hebergementId: string) => d.hebergements.find((h) => h.id === hebergementId)?.type
  if (reglages.triPlanning === "nom") chambres.sort((a, b) => a.numero.localeCompare(b.numero, "fr", { numeric: true }))
  // Tri stable : l'ordre des catégories et des numéros reste à l'intérieur de chaque type
  else if (reglages.triPlanning === "type") chambres.sort((a, b) => (typeDe(a.hebergementId) === typeDe(b.hebergementId) ? 0 : typeDe(a.hebergementId) === "bungalow" ? -1 : 1))
  else if (reglages.triPlanning === "occupation") {
    const nuits = new Map(chambres.map((c) => [c.id, nuitsOccupees(c.id)]))
    chambres.sort((a, b) => nuits.get(b.id)! - nuits.get(a.id)!)
  }
  // Une ligne de titre (repliable) par catégorie quand ses chambres se suivent
  const parCategorie = reglages.triPlanning === "site" || reglages.triPlanning === "type"
  const categories = [...new Set(chambres.map((c) => c.hebergementId))]
  const replie = (hebergementId: string) => parCategorie && affichage.replies.includes(hebergementId)
  const basculer = (hebergementId: string) =>
    changerAffichage({ replies: replie(hebergementId) ? affichage.replies.filter((id) => id !== hebergementId) : [...affichage.replies, hebergementId] })

  // Chambres en vente libres chaque nuit (ligne des disponibilités, catégories repliées)
  const libres = (liste: Chambre[], nuit: DateISO) => liste.filter((c) => c.active && !occupee(c.id, nuit)).length
  const enVente = chambres.filter((c) => c.active)

  // Position d'aujourd'hui dans la période affichée (-1 : hors période)
  const colonneAujourdhui = jours.indexOf(d.aujourdhui)

  // Colonne mise en évidence (clic sur l'en-tête : gardée ; survol : passagère)
  const colonneVue = (j: DateISO) => (j === epingle ? styles.colonneEpinglee : j === survole ? styles.colonneSurvolee : undefined)
  // Seul l'en-tête du jour déclenche la mise en évidence au survol (pas les cases de la grille)
  const suivre = (j: DateISO) => ({ onMouseEnter: () => setSurvole(j), onMouseLeave: () => setSurvole(null) })

  // Classes communes d'une case de nuit : week-end teinté (option), aujourd'hui, début de semaine marqué
  const classesNuit = (j: DateISO) =>
    mergeClasses(
      styles.case,
      styles[affichage.densite],
      affichage.weekEnds && estWeekEnd(j) && styles.weekEnd,
      versDate(j).getUTCDay() === 1 && (affichage.grille ? styles.traitLundi : styles.lundi),
      affichage.grille && styles.trait,
      colonneVue(j),
    )

  return (
    <>
      <EnTete
        titre="Planning"
        description={`${pluriel(enVente.length, "chambre")} en vente`}
        actions={
          <>
            <MenuAffichage parCategorie={parCategorie} categories={categories} />
            <Button appearance="primary" icon={<CalendarAddRegular />} disabled={lectureSeule} onClick={() => ouvrirNouvelleReservation()}>
              Nouvelle réservation
            </Button>
          </>
        }
      />

      {conflits.length > 0 && (
        <MessageBar intent="error" layout="multiline">
          <MessageBarBody>
            <MessageBarTitle>{conflits.length > 1 ? `${conflits.length} doubles réservations` : "Double réservation"}</MessageBarTitle>
            {conflits.map(({ blocage: b, reservation: r }) => (
              <div key={`${b.id}-${r.id}`}>
                {calendrierDe(b)?.nom ?? "Une plateforme"} bloque {nomChambre(d, b.chambreId)} {formaterPlage(b.debut, b.fin)}, déjà pris par{" "}
                <FicheReservation reservation={r} declencheur={<Link>{r.reference} ({nomDe(clientDe(r))})</Link>} />. Déplacez ou annulez l&apos;une des deux réservations.
              </div>
            ))}
          </MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.cadre}>
        {/* Barre du calendrier : période affichée et navigation à gauche, date et durée à droite */}
        <div className={styles.barreOutils} data-visite="planning-outils">
          <div className={styles.periode} role="group" aria-label="Période affichée">
            <Tooltip content={VUES[vue].precedent} relationship="label">
              <Button appearance="subtle" icon={<ChevronLeftRegular />} onClick={() => setDebut(enMois ? moisVoisin(debut, -1) : ajouterJours(debut, -nbJours))} />
            </Tooltip>
            <Tooltip content={VUES[vue].suivant} relationship="label">
              <Button appearance="subtle" icon={<ChevronRightRegular />} onClick={() => setDebut(enMois ? moisVoisin(debut, 1) : ajouterJours(debut, nbJours))} />
            </Tooltip>
            <Button appearance="outline" size="small" onClick={() => setDebut(d.aujourdhui)} disabled={enMois ? debut.slice(0, 7) === d.aujourdhui.slice(0, 7) : debut === d.aujourdhui}>
              Aujourd&apos;hui
            </Button>
            <span className={mergeClasses(styles.plage, enMois && styles.plageMois)}>
              {enMois ? nomDuMois(debut) : nbJours === 1 ? formaterDate(debut, { weekday: "long" }) : formaterPlage(debut, ajouterJours(debut, nbJours - 1))}
            </span>
          </div>
          <div className={styles.periode}>
            {/* Aller directement à une date : elle devient la première colonne (vue « Mois » : son mois) */}
            <ChampDate className={styles.allerA} valeur={debut} onChange={(v) => v && setDebut(v)} />
            <TabList
              size="small"
              selectedValue={String(vue)}
              onTabSelect={(_e, data) => void modifier({ vuePlanning: (data.value === "mois" ? "mois" : Number(data.value)) as VuePlanning })}
              aria-label="Durée affichée"
            >
              {VUES_PLANNING.map((v) => (
                <Tab key={v} value={String(v)}>
                  {VUES[v].libelle}
                </Tab>
              ))}
            </TabList>
          </div>
        </div>
        <div className={styles.defilement} data-visite="planning-grille">
          {enMois ? (
            <PlanningMois
              mois={debut}
              libresLe={(j) => libres(enVente, j)}
              total={enVente.length}
              weekEnds={affichage.weekEnds}
              onVoirSemaine={(j) => {
                setDebut(j)
                void modifier({ vuePlanning: 7 })
              }}
            />
          ) : (
          <div className={styles.grille}>
            {/* Jours : initiale, numéro (aujourd'hui entouré), mois au 1er et sur la première colonne */}
            <div className={mergeClasses(styles.rangee, styles.enteteRangee)} style={colonnes}>
              <div className={mergeClasses(styles.nomHebergement, styles.nomEntete)}>{formaterDate(debut, { weekday: undefined, day: undefined, month: "long" })}</div>
              {jours.map((j, i) => (
                <div
                  key={j}
                  role="button"
                  tabIndex={0}
                  aria-pressed={j === epingle}
                  title={j === epingle ? "Cliquer pour ne plus mettre ce jour en évidence" : `Mettre en évidence le ${formaterDate(j, { weekday: "long", year: undefined })}`}
                  className={mergeClasses(
                    styles.jour,
                    affichage.weekEnds && estWeekEnd(j) && styles.weekEnd,
                    versDate(j).getUTCDay() === 1 && (affichage.grille ? styles.traitLundi : styles.lundi),
                    affichage.grille && styles.trait,
                    colonneVue(j),
                  )}
                  onClick={() => setEpingle(j === epingle ? null : j)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setEpingle(j === epingle ? null : j))}
                  {...suivre(j)}
                >
                  {/* Initiale du jour ; au 1er du mois (hors première colonne), le mois à la place */}
                  <span className={mergeClasses(styles.initiale, i > 0 && j.endsWith("-01") && styles.nouveauMois)}>
                    {i > 0 && j.endsWith("-01")
                      ? formaterDate(j, { weekday: undefined, day: undefined, month: "short", year: undefined })
                      : nbJours === 1
                        ? formaterDate(j, { weekday: "long", day: undefined, month: undefined, year: undefined })
                        : formaterDate(j, { weekday: "short", day: undefined, month: undefined, year: undefined }).slice(0, nbJours === 21 ? 1 : 3)}
                  </span>
                  <span className={mergeClasses(styles.numero, j === d.aujourdhui && styles.numeroAujourdhui)}>{Number(j.slice(8))}</span>
                </div>
              ))}
            </div>

            {affichage.disponibilites && (
              <div className={mergeClasses(styles.rangee, styles.rangeeDisponibles)} style={colonnes}>
                <div className={mergeClasses(styles.nomHebergement, styles.nomDisponibles)}>Chambres libres</div>
                {jours.map((j) => {
                  const n = libres(enVente, j)
                  return (
                    <Tooltip key={j} content={`${formaterDate(j, { weekday: "long", year: undefined })} : ${n} libre${n > 1 ? "s" : ""} sur ${enVente.length}`} relationship="description">
                      <div className={mergeClasses(styles.disponible, affichage.grille && styles.trait, colonneVue(j), n === 0 && styles.complet, n > 0 && n <= Math.ceil(enVente.length / 5) && styles.presqueComplet)}>{n}</div>
                    </Tooltip>
                  )
                })}
              </div>
            )}

            {chambres.map((c, rang) => {
              const nouvelleCategorie = parCategorie && c.hebergementId !== chambres[rang - 1]?.hebergementId
              const ferme = replie(c.hebergementId)
              const dansCategorie = chambres.filter((x) => x.hebergementId === c.hebergementId)
              const nom = d.hebergements.find((h) => h.id === c.hebergementId)?.nom
              return (
                <Fragment key={c.id}>
                  {nouvelleCategorie && (
                    // Toute la ligne replie ou déplie la catégorie (le bouton, pour le clavier, fait de même)
                    <div className={mergeClasses(styles.rangee, styles.rangeeCategorie)} style={colonnes} onClick={() => basculer(c.hebergementId)}>
                      <button type="button" className={styles.nomCategorie} aria-expanded={!ferme} title={ferme ? `Déplier ${nom}` : `Replier ${nom}`}>
                        {ferme ? <ChevronRightRegular /> : <ChevronDownRegular />}
                        <span className={styles.texteCategorie}>{nom}</span>
                        <Caption1 className={styles.compteCategorie}>{dansCategorie.filter((x) => x.active).length}</Caption1>
                      </button>
                      {/* Repliée : occupation de la catégorie nuit par nuit (part des chambres prises) */}
                      {jours.map((j) => {
                        if (!ferme) return <div key={j} {...suivre(j)} className={mergeClasses(styles.caseCategorie, affichage.weekEnds && estWeekEnd(j) && styles.weekEnd, affichage.grille && styles.trait, colonneVue(j))} />
                        const total = dansCategorie.filter((x) => x.active).length
                        const prises = total - libres(dansCategorie, j)
                        return (
                          <Tooltip key={j} content={`${formaterDate(j, { weekday: "long", year: undefined })} : ${prises} prise${prises > 1 ? "s" : ""} sur ${total}`} relationship="description">
                            <div className={mergeClasses(styles.caseCategorie, affichage.weekEnds && estWeekEnd(j) && styles.weekEnd, affichage.grille && styles.trait, colonneVue(j))}>
                              <span className={styles.jauge}>
                                <span className={mergeClasses(styles.remplissage, prises === total && total > 0 && styles.remplissagePlein)} style={{ width: `${total ? (prises / total) * 100 : 0}%` }} />
                              </span>
                            </div>
                          </Tooltip>
                        )
                      })}
                    </div>
                  )}
                  {!ferme && (
                    <div className={styles.rangee} style={colonnes}>
                      <div className={mergeClasses(styles.nomHebergement, parCategorie && styles.nomChambre)} style={{ gridRow: 1 }} title={nomChambre(d, c.id)}>
                        <span className={styles.texteCategorie}>{c.numero}</span>
                        {!c.active && <Caption1 className={styles.desactivee}>désactivée</Caption1>}
                        {c.active && c.etat !== "propre" && (
                          <span className={mergeClasses(styles.pointEtat, styles[c.etat])} title={c.etat === "a_nettoyer" ? "À nettoyer" : "En maintenance"} />
                        )}
                      </div>
                      {jours.map((j, i) => {
                        const style = { gridColumn: i + 2, gridRow: 1 }
                        // Nuit libre à partir d'aujourd'hui : un clic ouvre la réservation préremplie, sur cette chambre
                        return c.active && j >= d.aujourdhui && !occupee(c.id, j) ? (
                          <button
                            key={j}
                            type="button"
                            style={style}
                            className={mergeClasses(classesNuit(j), styles.caseLibre)}
                            title={`Réserver ${c.numero} à partir du ${formaterDate(j, { weekday: "long", year: undefined })}`}
                            aria-label={`Réserver ${nomChambre(d, c.id)} à partir du ${formaterDate(j, { year: undefined })}`}
                            onClick={() => ouvrirNouvelleReservation({ hebergementId: c.hebergementId, chambreId: c.id, arrivee: j })}
                          />
                        ) : (
                          <div key={j} aria-hidden style={style} className={classesNuit(j)} />
                        )
                      })}
                      {barresDe(c.id).map((b) => {
                        // Barre limitée à la fenêtre affichée ; une case par nuit occupée [début, fin[. Bord droit ou
                        // gauche coupé quand le séjour continue hors de la période
                        const debutCol = Math.max(0, nombreNuits(debut, b.debut))
                        const finCol = Math.min(nbJours, nombreNuits(debut, b.fin))
                        if (finCol <= debutCol) return null
                        const style = { gridColumn: `${debutCol + 2} / ${finCol + 2}`, gridRow: 1 }
                        const classes = mergeClasses(
                          styles.barre,
                          styles[`barre_${affichage.densite}`],
                          styles[b.genre],
                          b.reservation?.arriveeLe && !b.reservation.departLe && styles.surPlace,
                          b.debut < debut && styles.coupeGauche,
                          b.fin > finVue && styles.coupeDroite,
                        )
                        return b.reservation ? (
                          <FicheReservation
                            key={b.cle}
                            reservation={b.reservation}
                            declencheur={
                              <button type="button" title={b.detail} style={style} className={classes}>
                                <span className={styles.texteBarre}>{b.libelle}</span>
                              </button>
                            }
                          />
                        ) : (
                          <div key={b.cle} title={b.detail} style={style} className={classes}>
                            <span className={styles.texteBarre}>{b.libelle}</span>
                          </div>
                        )
                      })}
                      {/* Trait d'aujourd'hui au-dessus des barres (sans gêner les clics) */}
                      {colonneAujourdhui >= 0 && <div aria-hidden className={styles.traitAujourdhui} style={{ gridColumn: colonneAujourdhui + 2, gridRow: 1 }} />}
                    </div>
                  )}
                </Fragment>
              )
            })}
          </div>
          )}
        </div>
        <div className={styles.legende}>
          <Caption1>
            <span className={mergeClasses(styles.pastille, styles.confirmee)} /> Confirmée
          </Caption1>
          <Caption1>
            <span className={mergeClasses(styles.pastille, styles.surPlace)} /> Client sur place
          </Caption1>
          <Caption1>
            <span className={mergeClasses(styles.pastille, styles.option)} /> Demande à traiter
          </Caption1>
          <Caption1>
            <span className={mergeClasses(styles.pastille, styles.blocage)} /> Dates bloquées ou plateforme
          </Caption1>
          {conflits.length > 0 && (
            <Caption1>
              <span className={mergeClasses(styles.pastille, styles.conflit)} /> Double réservation
            </Caption1>
          )}
          <Caption1 className={styles.astuce}>
            {enMois ? "Cliquez un numéro pour voir sa semaine, une arrivée pour sa fiche, « + » pour réserver." : "Cliquez une nuit libre pour réserver, un nom de catégorie pour la replier."}
          </Caption1>
        </div>
      </div>

      <div className={styles.bas}>
        <Carte data-visite="planning-blocage" titre="Bloquer des dates" description="Travaux, fermeture, privatisation : ces nuits ne seront plus proposées sur le site. Pour Booking.com ou Airbnb, reliez plutôt leur calendrier ci-dessous.">
          <FormulaireBlocage />
        </Carte>
        <BlocagesAVenir />
      </div>

      <Calendriers />
    </>
  )
}

// Menu « Affichage » : ordre des chambres, densité, texte des barres, ligne des chambres libres, week-ends,
// tout replier ou déplier ; chaque choix est gardé sur ce poste
function MenuAffichage({ parCategorie, categories }: { parCategorie: boolean; categories: string[] }) {
  const { reglages, modifier } = useReglages()
  const affichage = reglages.affichagePlanning
  const changer = (changement: Partial<AffichagePlanning>) => void modifier({ affichagePlanning: { ...affichage, ...changement } })
  const options = [affichage.disponibilites && "disponibilites", affichage.weekEnds && "weekEnds", affichage.grille && "grille"].filter((o): o is string => Boolean(o))

  return (
    <Menu
      checkedValues={{ tri: [reglages.triPlanning], densite: [affichage.densite], libelle: [affichage.libelle], options }}
      onCheckedValueChange={(_e, { name, checkedItems }) => {
        if (name === "tri") void modifier({ triPlanning: checkedItems[0] as TriPlanning })
        else if (name === "densite") changer({ densite: checkedItems[0] as DensitePlanning })
        else if (name === "libelle") changer({ libelle: checkedItems[0] as LibellePlanning })
        else if (name === "options") changer({ disponibilites: checkedItems.includes("disponibilites"), weekEnds: checkedItems.includes("weekEnds"), grille: checkedItems.includes("grille") })
      }}
    >
      <MenuTrigger disableButtonEnhancement>
        <Button icon={<OptionsRegular />} data-visite="planning-affichage">
          Affichage
        </Button>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          <MenuGroup>
            <MenuGroupHeader>Ordre des chambres</MenuGroupHeader>
            {TRIS_PLANNING.map((t) => (
              <MenuItemRadio key={t} name="tri" value={t}>
                {TRIS[t]}
              </MenuItemRadio>
            ))}
          </MenuGroup>
          <MenuDivider />
          <MenuGroup>
            <MenuGroupHeader>Lignes</MenuGroupHeader>
            {DENSITES_PLANNING.map((v) => (
              <MenuItemRadio key={v} name="densite" value={v}>
                {DENSITES[v]}
              </MenuItemRadio>
            ))}
          </MenuGroup>
          <MenuDivider />
          <MenuGroup>
            <MenuGroupHeader>Texte des réservations</MenuGroupHeader>
            {LIBELLES_PLANNING.map((v) => (
              <MenuItemRadio key={v} name="libelle" value={v}>
                {LIBELLES[v]}
              </MenuItemRadio>
            ))}
          </MenuGroup>
          <MenuDivider />
          <MenuItemCheckbox name="options" value="disponibilites">
            Ligne des chambres libres
          </MenuItemCheckbox>
          <MenuItemCheckbox name="options" value="weekEnds">
            Week-ends teintés
          </MenuItemCheckbox>
          <MenuItemCheckbox name="options" value="grille">
            Lignes de grille entre les nuits
          </MenuItemCheckbox>
          <MenuDivider />
          <MenuItem icon={<ArrowMinimizeVerticalRegular />} disabled={!parCategorie} onClick={() => changer({ replies: categories })}>
            Replier toutes les catégories
          </MenuItem>
          <MenuItem icon={<ArrowMaximizeVerticalRegular />} disabled={!parCategorie || affichage.replies.length === 0} onClick={() => changer({ replies: [] })}>
            Tout déplier
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}

// Dates fermées sur une ou plusieurs chambres à la fois (toute une catégorie, tout l'hôtel pour une privatisation)
function FormulaireBlocage() {
  const lectureSeule = useLectureSeule()
  const styles = usePlanningStyles()
  const { d, executer } = useDonneesChargees()
  const [chambreIds, setChambreIds] = useState<string[]>([])
  const actives = chambresTriees(d).filter((c) => c.active)
  const [debut, setDebut] = useState<DateISO | "">("")
  const [fin, setFin] = useState<DateISO | "">("")
  const [raison, setRaison] = useState("")
  const [enCours, setEnCours] = useState(false)
  const [etat, setEtat] = useState<{ erreur?: string; ok?: boolean }>({})

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    const resultat = await executer("POST", "/api/hotes/blocages", { chambreIds, debut, fin, raison })
    setEnCours(false)
    if (!resultat.ok) return setEtat({ erreur: resultat.erreur })
    setEtat({ ok: true })
    setChambreIds([])
    setDebut("")
    setFin("")
    setRaison("")
  }

  return (
    <form className={styles.formulaire} onSubmit={envoyer}>
      <Field label="Chambres" required className={styles.pleineLargeur} hint="Plusieurs chambres possibles : toute une catégorie, ou tout l'hôtel.">
        <Dropdown
          multiselect
          className={styles.champ}
          placeholder="Choisir les chambres"
          value={
            chambreIds.length === actives.length && actives.length > 1
              ? "Toutes les chambres"
              : actives.filter((c) => chambreIds.includes(c.id)).map((c) => c.numero).join(", ")
          }
          selectedOptions={chambreIds}
          onOptionSelect={(_e, data) => setChambreIds(data.selectedOptions)}
        >
          {d.hebergements.map((h) => {
            const chambres = actives.filter((c) => c.hebergementId === h.id)
            return (
              chambres.length > 0 && (
                <OptionGroup key={h.id} label={h.nom}>
                  {chambres.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.numero}
                    </Option>
                  ))}
                </OptionGroup>
              )
            )
          })}
        </Dropdown>
      </Field>
      <Field label="Première nuit" required>
        <ChampDate valeur={debut} onChange={setDebut} min={d.aujourdhui} className={styles.champ} />
      </Field>
      <Field label="Jour de libération" required>
        <ChampDate valeur={fin} onChange={setFin} min={debut || d.aujourdhui} className={styles.champ} />
      </Field>
      <Field label="Raison" className={styles.pleineLargeur}>
        <Input value={raison} onChange={(_e, data) => setRaison(data.value)} maxLength={120} placeholder="Travaux, réservation Booking…" />
      </Field>
      {etat.erreur && (
        <MessageBar intent="error" className={styles.pleineLargeur}>
          <MessageBarBody>{etat.erreur}</MessageBarBody>
        </MessageBar>
      )}
      {etat.ok && !enCours && (
        <MessageBar intent="success" className={styles.pleineLargeur}>
          <MessageBarBody>Dates bloquées : elles ne sont plus réservables sur le site.</MessageBarBody>
        </MessageBar>
      )}
      <Button
        type="submit"
        appearance="primary"
        disabled={enCours || lectureSeule || chambreIds.length === 0 || !debut || !fin}
        icon={enCours ? <Spinner size="tiny" /> : <CalendarCancelRegular />}
        className={styles.envoi}
      >
        Bloquer ces dates
      </Button>
    </form>
  )
}

function BlocagesAVenir() {
  const lectureSeule = useLectureSeule()
  const styles = usePlanningStyles()
  const { d, executer } = useDonneesChargees()
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState<string | null>(null) // blocage en cours de libération
  // Dates fermées à la main ; celles des plateformes se gèrent dans la carte des calendriers
  const blocages = d.blocages.filter((b) => !b.calendrierId && b.fin > d.aujourdhui).sort((a, b) => a.debut.localeCompare(b.debut))

  async function liberer(id: string) {
    setEnCours(id)
    const resultat = await executer("DELETE", `/api/hotes/blocages/${encodeURIComponent(id)}`)
    setEnCours(null)
    setErreur(resultat.ok ? null : resultat.erreur)
  }

  return (
    <Carte titre="Dates bloquées à venir" description={`${pluriel(blocages.length, "période fermée", "périodes fermées")} à la réservation en ligne`}>
      {erreur && (
        <MessageBar intent="error">
          <MessageBarBody>{erreur}</MessageBarBody>
        </MessageBar>
      )}
      {blocages.length === 0 ? (
        <Vide Icone={CalendarClockRegular} titre="Aucune date bloquée" texte="Toutes les chambres sont ouvertes à la réservation en ligne." />
      ) : (
        <Table size="small" aria-label="Dates bloquées">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Chambre</TableHeaderCell>
              <TableHeaderCell>Période</TableHeaderCell>
              <TableHeaderCell>Raison</TableHeaderCell>
              <TableHeaderCell style={{ width: "120px" }} aria-label="Actions" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {blocages.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <TableCellLayout truncate description={d.hebergements.find((h) => h.id === b.hebergementId)?.nom}>
                    {d.chambres.find((c) => c.id === b.chambreId)?.numero}
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout className={styles.surUneLigne} description={pluriel(nombreNuits(b.debut, b.fin), "nuit")}>
                    {formaterPlage(b.debut, b.fin)}
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout truncate>{b.raison || "—"}</TableCellLayout>
                </TableCell>
                <TableCell>
                  <Button
                    appearance="subtle"
                    size="small"
                    disabled={enCours === b.id || lectureSeule}
                    icon={enCours === b.id ? <Spinner size="tiny" /> : <LockOpenRegular />}
                    onClick={() => liberer(b.id)}
                  >
                    Libérer
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Carte>
  )
}
