import { Body1, Dropdown, Option } from "@fluentui/react-components"
import {
  BedRegular,
  CalendarClockRegular,
  CalendarLtrRegular,
  DismissCircleRegular,
  DoorArrowRightRegular,
  MoneyRegular,
  PeopleRegular,
  TagRegular,
} from "@fluentui/react-icons"
import { useState } from "react"
import { formaterPlage, formaterPrix, pluriel } from "@partage/dates"
import type { Reservation } from "@partage/types"
import { Carte, EnTete } from "../composants/commun"
import { Histogramme, Indicateur, Repartition } from "../composants/graphiques"
import { useDonneesChargees } from "../donnees"
import { NOMS_SOURCES } from "../libelles"
import {
  debutDeMois,
  dernierJour,
  evolution,
  indicateurs,
  nomDuMois,
  occupationParHebergement,
  parMois,
  periodes,
  PERIODES,
  pourcent,
  repartition,
  type ChoixPeriode,
} from "../statistiques"
import { useGestionStyles } from "./useGestionStyles.styles"

const unChiffre = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 })

// Tableau de bord (gérants) : occupation, prix moyen, RevPAR, durée des séjours, annulations, provenance,
// avec l'évolution en % par rapport à la période précédente de même durée
export default function Statistiques() {
  const styles = useGestionStyles()
  const { d } = useDonneesChargees()
  const [choix, setChoix] = useState<ChoixPeriode>("mois")
  const { actuelle, precedente } = periodes(choix, d.aujourdhui)
  const m = indicateurs(d, actuelle)
  const p = indicateurs(d, precedente)

  const douzeMois = parMois(d, { debut: debutDeMois(d.aujourdhui, -11), fin: debutDeMois(d.aujourdhui, 1) })
  const moisCourant = debutDeMois(d.aujourdhui)
  const parHebergement = occupationParHebergement(d, actuelle)
  const commencent = d.reservations.filter((r) => r.statut === "confirmee" && r.arrivee >= actuelle.debut && r.arrivee < actuelle.fin)
  const parSource = repartition(
    (Object.keys(NOMS_SOURCES) as Reservation["source"][]).map((source) => ({ cle: source, valeur: commencent.filter((r) => r.source === source).length })),
  ).filter((s) => s.valeur > 0)
  const pays = new Map<string, number>()
  for (const r of commencent) {
    const nom = d.clients.find((c) => c.id === r.clientId)?.pays || "Non renseigné"
    pays.set(nom, (pays.get(nom) ?? 0) + 1)
  }
  const parPays = repartition([...pays].map(([cle, valeur]) => ({ cle, valeur }))).slice(0, 6)

  return (
    <>
      <EnTete
        titre="Statistiques"
        description={`${formaterPlage(actuelle.debut, dernierJour(actuelle))} · comparé à ${formaterPlage(precedente.debut, dernierJour(precedente))}`}
        actions={
          <Dropdown className={styles.periode} value={PERIODES[choix]} selectedOptions={[choix]} onOptionSelect={(_e, data) => setChoix(data.optionValue as ChoixPeriode)} aria-label="Période">
            {(Object.keys(PERIODES) as ChoixPeriode[]).map((c) => (
              <Option key={c} value={c}>
                {PERIODES[c]}
              </Option>
            ))}
          </Dropdown>
        }
      />

      <div className={styles.chiffres}>
        <Indicateur Icone={BedRegular} libelle="Taux d'occupation" valeur={pourcent(m.occupation, 1)} evolution={evolution(m.occupation, p.occupation)} note={`${m.nuitsVendues} / ${m.nuitsDisponibles} nuits`} />
        <Indicateur Icone={TagRegular} libelle="Prix moyen par nuit" valeur={formaterPrix(m.prixMoyen)} evolution={evolution(m.prixMoyen, p.prixMoyen)} note="ADR" />
        <Indicateur Icone={MoneyRegular} libelle="Revenu par nuit disponible" valeur={formaterPrix(m.revPar)} evolution={evolution(m.revPar, p.revPar)} note="RevPAR" />
        <Indicateur Icone={DismissCircleRegular} libelle="Taux d'annulation" valeur={pourcent(m.annulation)} evolution={evolution(m.annulation, p.annulation)} inverse note={`${pluriel(m.demandes, "demande")} reçues`} />
        <Indicateur Icone={DoorArrowRightRegular} libelle="Séjours" valeur={m.sejours} evolution={evolution(m.sejours, p.sejours)} note="Arrivées confirmées" />
        <Indicateur Icone={CalendarLtrRegular} libelle="Durée moyenne" valeur={`${unChiffre.format(m.dureeMoyenne)} nuits`} evolution={evolution(m.dureeMoyenne, p.dureeMoyenne)} />
        <Indicateur Icone={CalendarClockRegular} libelle="Réservé en moyenne" valeur={`${Math.round(m.delaiMoyen)} jours`} evolution={evolution(m.delaiMoyen, p.delaiMoyen)} note="avant l'arrivée" />
        <Indicateur Icone={PeopleRegular} libelle="Chiffre d'affaires" valeur={formaterPrix(m.chiffreAffaires)} evolution={evolution(m.chiffreAffaires, p.chiffreAffaires)} />
      </div>

      <Carte titre="Taux d'occupation, 12 derniers mois" description="Nuits vendues sur nuits disponibles, tous hébergements">
        <Histogramme
          barres={douzeMois.map((x) => ({
            cle: x.debut,
            libelle: nomDuMois(x.debut, x.debut.slice(5, 7) === "01"),
            valeur: Math.round(x.indicateurs.occupation * 1000) / 10,
            actuelle: x.debut === moisCourant,
            etiquette: pourcent(x.indicateurs.occupation),
          }))}
          formater={(v) => `${unChiffre.format(v)} %`}
          legende={{ principale: "Occupation" }}
        />
      </Carte>

      <div className={styles.trois}>
        <Carte titre="Occupation par hébergement" description={PERIODES[choix]}>
          <Repartition lignes={parHebergement.map((h) => ({ cle: h.hebergement.id, libelle: h.hebergement.nom, part: h.occupation, detail: pluriel(h.nuits, "nuit") }))} />
        </Carte>
        <Carte titre="Provenance des séjours" description="Séjours confirmés commençant dans la période">
          {parSource.length ? (
            <Repartition lignes={parSource.map((s) => ({ cle: s.cle, libelle: NOMS_SOURCES[s.cle], part: s.part, detail: pluriel(s.valeur, "séjour") }))} />
          ) : (
            <Body1 className={styles.secondaire}>Aucun séjour sur la période.</Body1>
          )}
        </Carte>
        <Carte titre="Pays des clients" description="Séjours confirmés commençant dans la période">
          {parPays.length ? (
            <Repartition lignes={parPays.map((s) => ({ cle: s.cle, libelle: s.cle, part: s.part, detail: pluriel(s.valeur, "séjour") }))} />
          ) : (
            <Body1 className={styles.secondaire}>Aucun séjour sur la période.</Body1>
          )}
        </Carte>
      </div>
    </>
  )
}
