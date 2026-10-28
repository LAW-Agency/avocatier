import { Dropdown, Option } from "@fluentui/react-components"
import { chambresTriees, premiereChambre, pretePour, useDonneesChargees } from "../donnees"
import { ETATS_CHAMBRE } from "../libelles"

export const CHAMBRE_AUTO = "auto"
const LIBELLE_AUTO = "Première chambre libre"

// Chambre d'une catégorie : la première libre (attribuée par le serveur au moment d'enregistrer) ou une chambre
// précise. Les chambres désactivées ne sont pas proposées, celles prises aux dates choisies sont grisées.
// Arrivée aujourd'hui : une chambre à nettoyer ou en maintenance n'est pas prête pour ce soir et n'est pas proposée,
// sauf `garder` (chambre déjà occupée par la réservation modifiée). `valeur` : identifiant de la chambre, ou CHAMBRE_AUTO
export default function ChoixChambre({
  hebergementId,
  valeur,
  onChange,
  prises,
  arrivee,
  garder,
  className,
}: {
  hebergementId: string
  valeur: string
  onChange: (valeur: string) => void
  prises: Set<string>
  arrivee: string
  garder?: string
  className?: string
}) {
  const { d } = useDonneesChargees()
  const chambres = chambresTriees(d).filter((c) => c.hebergementId === hebergementId && (c.active || c.id === valeur))
  const premiereLibre = premiereChambre(d, hebergementId, prises, arrivee, garder)
  const choisie = chambres.find((c) => c.id === valeur)

  return (
    <Dropdown
      className={className}
      disabled={!hebergementId}
      placeholder="Choisissez d'abord l'hébergement"
      value={!hebergementId ? "" : choisie ? choisie.numero : `${LIBELLE_AUTO}${premiereLibre ? ` (${premiereLibre.numero})` : ""}`}
      selectedOptions={[valeur]}
      onOptionSelect={(_e, data) => onChange(data.optionValue ?? CHAMBRE_AUTO)}
    >
      <Option value={CHAMBRE_AUTO} text={LIBELLE_AUTO}>
        {LIBELLE_AUTO}
        {premiereLibre ? ` (${premiereLibre.numero})` : " · aucune à ces dates"}
      </Option>
      {chambres.map((c) => (
        <Option key={c.id} value={c.id} text={c.numero} disabled={prises.has(c.id) || !c.active || !pretePour(c, arrivee, d.aujourdhui, garder)}>
          {c.numero}
          {!c.active
            ? " · désactivée"
            : prises.has(c.id)
              ? " · prise à ces dates"
              : !pretePour(c, arrivee, d.aujourdhui, garder)
                ? ` · ${ETATS_CHAMBRE[c.etat].toLowerCase()}, pas prête ce soir`
                : c.etat !== "propre"
                  ? ` · ${ETATS_CHAMBRE[c.etat].toLowerCase()}`
                  : ""}
        </Option>
      ))}
    </Dropdown>
  )
}
