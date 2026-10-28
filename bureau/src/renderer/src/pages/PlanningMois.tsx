import { Button, Caption1, Tooltip, mergeClasses } from "@fluentui/react-components"
import { AddRegular } from "@fluentui/react-icons"
import { formaterDate, pluriel, versDate } from "@partage/dates"
import type { DateISO, Reservation } from "@partage/types"
import { INITIALES_JOURS, joursDuMois, nomDuMois } from "../composants/calendrierMois"
import FicheReservation from "../composants/FicheReservation"
import { nomDe, useDonneesChargees, useLectureSeule } from "../donnees"
import { usePlanningMoisStyles } from "./usePlanningMoisStyles.styles"

// Arrivées affichées par case, les autres derrière « + n autres »
const ARRIVEES_MAX = 3

const estActive = (r: Reservation) => r.statut === "option" || r.statut === "confirmee"

// Vue « Mois » du planning : le mois en calendrier, chaque jour avec l'occupation de la nuit (chambres libres sur
// celles en vente), les arrivées (fiche au clic) et le nombre de départs. Le numéro ouvre la semaine qui commence
// ce jour-là ; le « + » (au survol) une réservation arrivant ce jour-là
export default function PlanningMois({
  mois,
  libresLe,
  total,
  weekEnds,
  onVoirSemaine,
}: {
  mois: DateISO
  libresLe: (nuit: DateISO) => number
  total: number
  weekEnds: boolean
  onVoirSemaine: (jour: DateISO) => void
}) {
  const styles = usePlanningMoisStyles()
  const lectureSeule = useLectureSeule()
  const { d, clientDe, ouvrirNouvelleReservation } = useDonneesChargees()
  const jours = joursDuMois(mois)
  const actives = d.reservations.filter(estActive)
  const seuilPresque = Math.ceil(total / 5)
  const nomChambreCourt = (r: Reservation) => d.chambres.find((c) => c.id === r.chambreId)?.numero ?? ""

  return (
    <div className={styles.grille} role="grid" aria-label={`Planning de ${nomDuMois(mois)}`}>
      {INITIALES_JOURS.map((i) => (
        <div key={i} className={styles.initiale} role="columnheader">
          {i}
        </div>
      ))}
      {jours.map((j) => {
        const n = libresLe(j)
        const prises = total - n
        const passe = j < d.aujourdhui
        const arrivees = actives.filter((r) => r.arrivee === j).sort((a, b) => nomDe(clientDe(a)).localeCompare(nomDe(clientDe(b)), "fr"))
        const departs = actives.filter((r) => r.depart === j).length
        const jourSemaine = versDate(j).getUTCDay()
        return (
          <div
            key={j}
            role="gridcell"
            className={mergeClasses(
              styles.jour,
              weekEnds && (jourSemaine === 0 || jourSemaine === 6) && styles.weekEnd,
              j.slice(0, 7) !== mois.slice(0, 7) && styles.horsMois,
            )}
          >
            <div className={styles.haut}>
              <Tooltip content={`Voir la semaine du ${formaterDate(j, { weekday: "long", year: undefined })}`} relationship="label">
                <button type="button" className={mergeClasses(styles.numero, j === d.aujourdhui && styles.numeroAujourdhui)} onClick={() => onVoirSemaine(j)}>
                  {j.endsWith("-01") ? formaterDate(j, { weekday: undefined, year: undefined }) : Number(j.slice(8))}
                </button>
              </Tooltip>
              {!passe && n > 0 && (
                <Tooltip content={`Réserver à partir du ${formaterDate(j, { weekday: "long", year: undefined })}`} relationship="label">
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<AddRegular />}
                    disabled={lectureSeule}
                    className={mergeClasses(styles.ajouter, "ajouter")}
                    onClick={() => ouvrirNouvelleReservation({ arrivee: j })}
                  />
                </Tooltip>
              )}
            </div>

            <Tooltip content={`${formaterDate(j, { weekday: "long", year: undefined })} : ${prises} prise${prises > 1 ? "s" : ""}, ${n} libre${n > 1 ? "s" : ""} sur ${total}`} relationship="description">
              <div className={mergeClasses(styles.occupation, passe && styles.estompe)}>
                <span className={styles.jauge}>
                  <span
                    className={mergeClasses(styles.remplissage, n === 0 && total > 0 ? styles.remplissagePlein : n <= seuilPresque && styles.remplissagePresque)}
                    style={{ width: `${total ? (prises / total) * 100 : 0}%` }}
                  />
                </span>
                <span className={mergeClasses(styles.libres, n === 0 ? styles.complet : n <= seuilPresque && styles.presqueComplet)}>{n === 0 ? "Complet" : `${n} libre${n > 1 ? "s" : ""}`}</span>
              </div>
            </Tooltip>

            {arrivees.length > 0 && (
              <div className={styles.arrivees}>
                {arrivees.slice(0, ARRIVEES_MAX).map((r) => (
                  <FicheReservation
                    key={r.id}
                    reservation={r}
                    declencheur={
                      <button
                        type="button"
                        className={mergeClasses(styles.arrivee, r.statut === "option" && styles.option)}
                        title={`${nomDe(clientDe(r))} · ${r.reference} · arrivée${r.statut === "option" ? " (demande à traiter)" : ""}`}
                      >
                        <span className={styles.texteArrivee}>{nomDe(clientDe(r))}</span>
                        <span className={styles.chambreArrivee}>{nomChambreCourt(r)}</span>
                      </button>
                    }
                  />
                ))}
                {arrivees.length > ARRIVEES_MAX && (
                  <button type="button" className={styles.autres} onClick={() => onVoirSemaine(j)}>
                    + {arrivees.length - ARRIVEES_MAX} autre{arrivees.length - ARRIVEES_MAX > 1 ? "s" : ""}
                  </button>
                )}
              </div>
            )}
            {departs > 0 && <Caption1 className={styles.departs}>{pluriel(departs, "départ")}</Caption1>}
          </div>
        )
      })}
    </div>
  )
}
