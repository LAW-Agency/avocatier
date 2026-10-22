import {
  Button,
  Caption1,
  Dropdown,
  Field,
  Input,
  Link,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Option,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Toolbar,
  ToolbarButton,
  Tooltip,
  mergeClasses,
} from "@fluentui/react-components"
import { CalendarAddRegular, CalendarClockRegular, CalendarCancelRegular, ChevronLeftRegular, ChevronRightRegular, LockOpenRegular } from "@fluentui/react-icons"
import { useState, type CSSProperties, type FormEvent } from "react"
import { ajouterJours, chevauche, formaterDate, formaterPlage, nombreNuits, pluriel, versDate } from "@partage/dates"
import { libelleStatutHote } from "@partage/statuts"
import type { Blocage, DateISO, Reservation } from "@partage/types"
import Calendriers from "../composants/Calendriers"
import ChampDate from "../composants/ChampDate"
import { Carte, EnTete, Vide } from "../composants/commun"
import FicheReservation from "../composants/FicheReservation"
import { blocageGene, doublesReservations, nomDe, useDonneesChargees } from "../donnees"
import { usePlanningStyles } from "./usePlanningStyles.styles"

const JOURS_AFFICHES = 28


type Barre = { cle: string; debut: DateISO; fin: DateISO; libelle: string; detail: string; genre: "option" | "confirmee" | "blocage" | "conflit"; reservation?: Reservation }

const estWeekEnd = (jour: DateISO) => [0, 6].includes(versDate(jour).getUTCDay())
const estActive = (r: Reservation) => r.statut === "option" || r.statut === "confirmee"

// Planning : une ligne par hébergement, une colonne par nuit ; réservations et blocages en barres
export default function Planning() {
  const styles = usePlanningStyles()
  const { d, clientDe, ouvrirNouvelleReservation } = useDonneesChargees()
  const [debut, setDebut] = useState(d.aujourdhui)
  const jours = Array.from({ length: JOURS_AFFICHES }, (_, i) => ajouterJours(debut, i))
  const colonnes: CSSProperties = { gridTemplateColumns: `168px repeat(${JOURS_AFFICHES}, minmax(28px, 1fr))` }
  const calendrierDe = (b: Blocage) => d.calendriers.find((c) => c.id === b.calendrierId)
  const conflits = doublesReservations(d)
  const enConflit = new Set(conflits.map((c) => c.blocage.id))

  // Nuit déjà prise (réservation active ou dates bloquées)
  const occupee = (hebergementId: string, nuit: DateISO) =>
    d.reservations.some((r) => r.hebergementId === hebergementId && estActive(r) && r.arrivee <= nuit && r.depart > nuit) ||
    d.blocages.some((b) => b.hebergementId === hebergementId && b.debut <= nuit && b.fin > nuit)

  function barresDe(hebergementId: string): Barre[] {
    const reservations = d.reservations
      .filter((r) => r.hebergementId === hebergementId && estActive(r))
      .map((r): Barre => {
        const nom = clientDe(r) ? nomDe(clientDe(r)) : r.reference
        return { cle: r.id, debut: r.arrivee, fin: r.depart, libelle: nom, detail: `${nom}, ${formaterPlage(r.arrivee, r.depart)}, ${libelleStatutHote[r.statut]}`, genre: r.statut === "option" ? "option" : "confirmee", reservation: r }
      })
    const blocages = d.blocages
      .filter((b) => b.hebergementId === hebergementId)
      // Réservation Booking.com saisie à la main et la même importée de Booking.com : une seule barre
      .filter((b) => !b.calendrierId || !d.reservations.some((r) => r.hebergementId === hebergementId && estActive(r) && chevauche(b.debut, b.fin, r.arrivee, r.depart) && !blocageGene(b, r.source, d.calendriers)))
      .map((b): Barre => {
        const libelle = calendrierDe(b)?.nom ?? (b.raison || "Bloqué")
        const conflit = enConflit.has(b.id)
        return { cle: b.id, debut: b.debut, fin: b.fin, libelle, detail: `${conflit ? "Double réservation : " : ""}${b.raison || "Dates bloquées"}, ${formaterPlage(b.debut, b.fin)}`, genre: conflit ? "conflit" : "blocage" }
      })
    return [...reservations, ...blocages]
  }

  return (
    <>
      <EnTete
        titre="Planning"
        description={formaterPlage(debut, ajouterJours(debut, JOURS_AFFICHES - 1))}
        actions={
          <>
          <Toolbar aria-label="Période affichée">
            <Tooltip content="4 semaines avant" relationship="label">
              <ToolbarButton icon={<ChevronLeftRegular />} onClick={() => setDebut(ajouterJours(debut, -JOURS_AFFICHES))} />
            </Tooltip>
            <ToolbarButton onClick={() => setDebut(d.aujourdhui)}>Aujourd&apos;hui</ToolbarButton>
            <Tooltip content="4 semaines après" relationship="label">
              <ToolbarButton icon={<ChevronRightRegular />} onClick={() => setDebut(ajouterJours(debut, JOURS_AFFICHES))} />
            </Tooltip>
          </Toolbar>
            <Button appearance="primary" icon={<CalendarAddRegular />} onClick={() => ouvrirNouvelleReservation()}>
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
                {calendrierDe(b)?.nom ?? "Une plateforme"} bloque {d.hebergements.find((h) => h.id === b.hebergementId)?.nom} {formaterPlage(b.debut, b.fin)}, déjà pris par{" "}
                <FicheReservation reservation={r} declencheur={<Link>{r.reference} ({nomDe(clientDe(r))})</Link>} />. Déplacez ou annulez l&apos;une des deux réservations.
              </div>
            ))}
          </MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.cadre}>
        <div className={styles.defilement}>
          <div className={styles.grille}>
            <div className={mergeClasses(styles.rangee, styles.enteteRangee)} style={colonnes}>
              <div className={mergeClasses(styles.nomHebergement, styles.nomEntete)}>Hébergement</div>
              {jours.map((j) => (
                <div key={j} className={mergeClasses(styles.jour, estWeekEnd(j) && styles.weekEnd)}>
                  <Caption1>{formaterDate(j, { weekday: "short", day: undefined, month: undefined, year: undefined }).slice(0, 2)}</Caption1>
                  <span className={mergeClasses(styles.numero, j === d.aujourdhui && styles.numeroAujourdhui)}>{Number(j.slice(8))}</span>
                </div>
              ))}
            </div>

            {d.hebergements.map((h) => (
              <div key={h.id} className={styles.rangee} style={colonnes}>
                <div className={styles.nomHebergement} style={{ gridRow: 1 }}>
                  {h.nom}
                </div>
                {jours.map((j, i) => {
                  const classes = mergeClasses(styles.case, estWeekEnd(j) && styles.weekEnd, j === d.aujourdhui && styles.aujourdhui)
                  const style = { gridColumn: i + 2, gridRow: 1 }
                  // Nuit libre à partir d'aujourd'hui : un clic ouvre la réservation préremplie
                  return j >= d.aujourdhui && !occupee(h.id, j) ? (
                    <button
                      key={j}
                      type="button"
                      style={style}
                      className={mergeClasses(classes, styles.caseLibre)}
                      title={`Réserver ${h.nom} à partir du ${formaterDate(j, { weekday: "long", year: undefined })}`}
                      aria-label={`Réserver ${h.nom} à partir du ${formaterDate(j, { year: undefined })}`}
                      onClick={() => ouvrirNouvelleReservation({ hebergementId: h.id, arrivee: j })}
                    />
                  ) : (
                    <div key={j} aria-hidden style={style} className={classes} />
                  )
                })}
                {barresDe(h.id).map((b) => {
                  // Barre limitée à la fenêtre affichée ; une case par nuit occupée [début, fin[
                  const debutCol = Math.max(0, nombreNuits(debut, b.debut))
                  const finCol = Math.min(JOURS_AFFICHES, nombreNuits(debut, b.fin))
                  if (finCol <= debutCol) return null
                  const style = { gridColumn: `${debutCol + 2} / ${finCol + 2}`, gridRow: 1 }
                  const classes = mergeClasses(styles.barre, styles[b.genre], b.reservation?.arriveeLe && !b.reservation.departLe && styles.surPlace)
                  return b.reservation ? (
                    <FicheReservation
                      key={b.cle}
                      reservation={b.reservation}
                      declencheur={
                        <button type="button" title={b.detail} style={style} className={classes}>
                          {b.libelle}
                        </button>
                      }
                    />
                  ) : (
                    <div key={b.cle} title={b.detail} style={style} className={classes}>
                      {b.libelle}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.legende}>
          <Caption1>
            <span className={mergeClasses(styles.pastille, styles.confirmee)} /> Confirmée
          </Caption1>
          <Caption1>
            <span className={mergeClasses(styles.pastille, styles.option)} /> Demande à traiter
          </Caption1>
          <Caption1>
            <span className={mergeClasses(styles.pastille, styles.blocage)} /> Dates bloquées (ou importées d&apos;une plateforme)
          </Caption1>
          {conflits.length > 0 && (
            <Caption1>
              <span className={mergeClasses(styles.pastille, styles.conflit)} /> Double réservation
            </Caption1>
          )}
        </div>
      </div>

      <div className={styles.bas}>
        <Carte titre="Bloquer des dates" description="Travaux, fermeture, privatisation : ces nuits ne seront plus proposées sur le site. Pour Booking.com ou Airbnb, reliez plutôt leur calendrier ci-dessous.">
          <FormulaireBlocage />
        </Carte>
        <BlocagesAVenir />
      </div>

      <Calendriers />
    </>
  )
}

function FormulaireBlocage() {
  const styles = usePlanningStyles()
  const { d, executer } = useDonneesChargees()
  const [hebergementId, setHebergementId] = useState(d.hebergements[0]?.id ?? "")
  const [debut, setDebut] = useState<DateISO | "">("")
  const [fin, setFin] = useState<DateISO | "">("")
  const [raison, setRaison] = useState("")
  const [enCours, setEnCours] = useState(false)
  const [etat, setEtat] = useState<{ erreur?: string; ok?: boolean }>({})

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    const resultat = await executer("POST", "/api/hotes/blocages", { hebergementId, debut, fin, raison })
    setEnCours(false)
    if (!resultat.ok) return setEtat({ erreur: resultat.erreur })
    setEtat({ ok: true })
    setDebut("")
    setFin("")
    setRaison("")
  }

  return (
    <form className={styles.formulaire} onSubmit={envoyer}>
      <Field label="Hébergement" required className={styles.pleineLargeur}>
        <Dropdown
          className={styles.champ}
          value={d.hebergements.find((h) => h.id === hebergementId)?.nom ?? ""}
          selectedOptions={[hebergementId]}
          onOptionSelect={(_e, data) => setHebergementId(data.optionValue ?? "")}
        >
          {d.hebergements.map((h) => (
            <Option key={h.id} value={h.id}>
              {h.nom}
            </Option>
          ))}
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
      <Button type="submit" appearance="primary" disabled={enCours || !debut || !fin} icon={enCours ? <Spinner size="tiny" /> : <CalendarCancelRegular />} className={styles.envoi}>
        Bloquer ces dates
      </Button>
    </form>
  )
}

function BlocagesAVenir() {
  const styles = usePlanningStyles()
  const { d, executer } = useDonneesChargees()
  const [erreur, setErreur] = useState<string | null>(null)
  // Dates fermées à la main ; celles des plateformes se gèrent dans la carte des calendriers
  const blocages = d.blocages.filter((b) => !b.calendrierId && b.fin > d.aujourdhui).sort((a, b) => a.debut.localeCompare(b.debut))

  async function liberer(id: string) {
    const resultat = await executer("DELETE", `/api/hotes/blocages/${encodeURIComponent(id)}`)
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
        <Vide Icone={CalendarClockRegular} titre="Aucune date bloquée" texte="Tous les hébergements sont ouverts à la réservation en ligne." />
      ) : (
        <Table size="small" aria-label="Dates bloquées">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Hébergement</TableHeaderCell>
              <TableHeaderCell>Période</TableHeaderCell>
              <TableHeaderCell>Raison</TableHeaderCell>
              <TableHeaderCell style={{ width: "120px" }} aria-label="Actions" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {blocages.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <TableCellLayout truncate>{d.hebergements.find((h) => h.id === b.hebergementId)?.nom}</TableCellLayout>
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
                  <Button appearance="subtle" size="small" icon={<LockOpenRegular />} onClick={() => liberer(b.id)}>
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
