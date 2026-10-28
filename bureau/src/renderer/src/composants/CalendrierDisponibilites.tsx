import { Button, Caption1, Text, mergeClasses } from "@fluentui/react-components"
import { ChevronLeftRegular, ChevronRightRegular } from "@fluentui/react-icons"
import { useState } from "react"
import { ajouterJours, formaterDate, nombreNuits, pluriel } from "@partage/dates"
import type { DateISO, Reservation } from "@partage/types"
import { chambresPrises, pretePour, useDonneesChargees } from "../donnees"
import { useCalendrierStyles } from "./useCalendrierStyles.styles"
import { INITIALES_JOURS, joursDuMois, moisVoisin, nomDuMois, premierDuMois } from "./calendrierMois"

// Calendrier du mois pour choisir le séjour d'une nouvelle réservation : chaque jour montre les chambres libres
// cette nuit-là (de la catégorie choisie, sinon de tout l'hôtel). Un premier clic choisit l'arrivée, le suivant
// le départ (aperçu du séjour au survol) ; une nuit complète ne peut pas être une arrivée
export default function CalendrierDisponibilites({
  hebergementId,
  arrivee,
  depart,
  min,
  source,
  onChange,
}: {
  hebergementId: string
  arrivee: DateISO
  depart: DateISO
  min: DateISO
  source?: Reservation["source"]
  onChange: (arrivee: DateISO, depart: DateISO) => void
}) {
  const styles = useCalendrierStyles()
  const { d } = useDonneesChargees()
  const [mois, setMois] = useState(premierDuMois(arrivee || d.aujourdhui))
  // Après le choix de l'arrivée, le clic suivant donne le départ
  const [choixDepart, setChoixDepart] = useState(false)
  const [survol, setSurvol] = useState<DateISO | null>(null)
  // Arrivée changée ailleurs (champ de date) : le calendrier montre son mois
  const [arriveeSuivie, setArriveeSuivie] = useState(arrivee)
  if (arrivee !== arriveeSuivie) {
    setArriveeSuivie(arrivee)
    if (arrivee) setMois(premierDuMois(arrivee))
  }
  const hebergement = d.hebergements.find((h) => h.id === hebergementId)
  const chambres = d.chambres.filter((c) => c.active && (!hebergementId || c.hebergementId === hebergementId))
  const jours = joursDuMois(mois)

  // Chambres libres et prêtes la nuit du jour j (même règle que la liste des hébergements du formulaire)
  const libresLe = new Map(
    jours.map((j) => {
      const prises = chambresPrises(d, j, ajouterJours(j, 1), { source })
      return [j, chambres.filter((c) => !prises.has(c.id) && pretePour(c, j, d.aujourdhui)).length]
    }),
  )
  const seuilPeu = Math.max(1, Math.ceil(chambres.length / 5))
  const finApercu = choixDepart && survol && survol > arrivee ? survol : depart

  function choisir(j: DateISO) {
    if (choixDepart && j > arrivee) {
      onChange(arrivee, j)
      setChoixDepart(false)
      return
    }
    onChange(j, ajouterJours(j, 1))
    setChoixDepart(true)
  }

  return (
    <div className={styles.cadre}>
      <div className={styles.entete}>
        <div className={styles.navigation}>
          <Button appearance="subtle" size="small" icon={<ChevronLeftRegular />} aria-label="Mois précédent" disabled={mois <= premierDuMois(min)} onClick={() => setMois(moisVoisin(mois, -1))} />
          <Text weight="semibold" className={styles.mois}>
            {nomDuMois(mois)}
          </Text>
          <Button appearance="subtle" size="small" icon={<ChevronRightRegular />} aria-label="Mois suivant" onClick={() => setMois(moisVoisin(mois, 1))} />
        </div>
        <Caption1 className={styles.portee}>{hebergement ? `Chambres libres · ${hebergement.nom}` : "Chambres libres · tout l'hôtel"}</Caption1>
      </div>

      <div className={styles.grille} role="grid" aria-label={`Disponibilités de ${nomDuMois(mois)}`} onMouseLeave={() => setSurvol(null)}>
        {INITIALES_JOURS.map((i) => (
          <div key={i} className={styles.initiale} role="columnheader">
            {i}
          </div>
        ))}
        {jours.map((j) => {
          const n = libresLe.get(j) ?? 0
          const passe = j < min
          // Arrivée impossible (passé, ou complet) ; un départ reste possible tant qu'il suit l'arrivée
          const commeDepart = choixDepart && j > arrivee
          const inactif = passe || (!commeDepart && n === 0)
          const estArrivee = j === arrivee
          const estDepart = j === finApercu && !!arrivee
          const dansSejour = !!arrivee && j > arrivee && j < finApercu
          const surMarque = estArrivee || (estDepart && !(choixDepart && survol))
          return (
            <button
              key={j}
              type="button"
              role="gridcell"
              disabled={inactif}
              aria-selected={estArrivee || estDepart}
              title={`${formaterDate(j, { weekday: "long", year: undefined })} : ${passe ? "passé" : n === 0 ? "complet" : `${pluriel(n, "chambre libre", "chambres libres")} sur ${chambres.length}`}`}
              className={mergeClasses(
                styles.jour,
                j.slice(0, 7) !== mois.slice(0, 7) && styles.horsMois,
                inactif && styles.indisponible,
                passe && styles.horsMois,
                j === d.aujourdhui && styles.aujourdhui,
                dansSejour && (choixDepart && survol ? styles.apercu : styles.nuit),
                estDepart && (choixDepart && survol ? styles.apercu : styles.depart),
                estArrivee && styles.arrivee,
              )}
              onClick={() => choisir(j)}
              onMouseEnter={() => setSurvol(j)}
            >
              <span className={mergeClasses(styles.numero, n === 0 && !passe && !surMarque && styles.barre)}>{Number(j.slice(8))}</span>
              {!passe && (
                <span className={mergeClasses(styles.libres, n === 0 ? styles.complet : n <= seuilPeu && styles.peu, surMarque && styles.surMarque)}>
                  {n === 0 ? "complet" : `${n} libre${n > 1 ? "s" : ""}`}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className={styles.pied}>
        <Caption1>
          {choixDepart
            ? "Choisissez maintenant le jour du départ."
            : arrivee && depart > arrivee
              ? `Séjour du ${formaterDate(arrivee, { year: undefined })} au ${formaterDate(depart, { year: undefined })} · ${pluriel(nombreNuits(arrivee, depart), "nuit")}`
              : "Cliquez le jour d'arrivée, puis celui du départ."}
        </Caption1>
        <Caption1 className={styles.legende}>
          <span>
            <span className={mergeClasses(styles.point, styles.pointLibre)} />
            Libre
          </span>
          <span>
            <span className={mergeClasses(styles.point, styles.pointPeu)} />
            Presque complet
          </span>
          <span>
            <span className={mergeClasses(styles.point, styles.pointComplet)} />
            Complet
          </span>
        </Caption1>
      </div>
    </div>
  )
}
