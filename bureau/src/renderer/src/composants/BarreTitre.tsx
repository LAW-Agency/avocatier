import { Button, Tooltip, mergeClasses } from "@fluentui/react-components"
import { WeatherMoonRegular, WeatherSunnyRegular } from "@fluentui/react-icons"
import { forwardRef, useEffect, useState, type HTMLAttributes, type ReactNode } from "react"
import { useReglages } from "../reglages"
import { Logotype } from "./Logotype"
import { useBarreTitreStyles, useBoutonsFenetreStyles } from "./useBarreTitreStyles.styles"

// Glyphes de la police d'icônes de Windows (Segoe Fluent Icons) : réduire, agrandir, restaurer, fermer
const GLYPHES = { reduire: "", agrandir: "", restaurer: "", fermer: "" }

// Réduire / agrandir / fermer, dessinés par l'interface (la fenêtre n'a pas de barre de titre native)
export function BoutonsFenetre() {
  const styles = useBoutonsFenetreStyles()
  const [agrandie, setAgrandie] = useState(false)
  useEffect(() => window.avocatier.surAgrandie(setAgrandie), [])

  return (
    <div className={styles.root}>
      <button type="button" className={styles.bouton} aria-label="Réduire" title="Réduire" onClick={() => window.avocatier.reduire()}>
        {GLYPHES.reduire}
      </button>
      <button
        type="button"
        className={styles.bouton}
        aria-label={agrandie ? "Restaurer" : "Agrandir"}
        title={agrandie ? "Restaurer" : "Agrandir"}
        onClick={() => window.avocatier.basculerAgrandie()}
      >
        {agrandie ? GLYPHES.restaurer : GLYPHES.agrandir}
      </button>
      <button type="button" className={mergeClasses(styles.bouton, styles.fermer)} aria-label="Fermer" title="Fermer" onClick={() => window.avocatier.fermer()}>
        {GLYPHES.fermer}
      </button>
    </div>
  )
}

// Bascule clair / sombre de la barre de titre (le choix « Système » se règle dans les paramètres)
export function BoutonTheme() {
  const { sombre, modifier } = useReglages()
  const libelle = sombre ? "Passer au thème clair" : "Passer au thème sombre"
  return (
    <Tooltip content={libelle} relationship="label">
      <Button appearance="subtle" icon={sombre ? <WeatherSunnyRegular /> : <WeatherMoonRegular />} onClick={() => modifier({ theme: sombre ? "clair" : "sombre" })} />
    </Tooltip>
  )
}

export type BarreTitreProps = HTMLAttributes<HTMLElement> & {
  centre?: ReactNode // recherche
  actions?: ReactNode // boutons à gauche des boutons de la fenêtre
  logo?: boolean // faux à la connexion : le logo est au centre de l'écran
}

// Barre de titre de la fenêtre : logo, recherche au centre, thème et boutons de la fenêtre
export const BarreTitre = forwardRef<HTMLElement, BarreTitreProps>(({ centre, actions, logo = true, className, ...props }, ref) => {
  const styles = useBarreTitreStyles()
  return (
    <header ref={ref} {...props} className={mergeClasses(styles.root, className)}>
      <div className={styles.titre}>{logo && <Logotype hauteur={30} couleur="origine" />}</div>
      <div className={styles.centre}>{centre}</div>
      <div className={styles.droite}>
        <div className={styles.actions}>
          {actions}
          <BoutonTheme />
        </div>
        <BoutonsFenetre />
      </div>
    </header>
  )
})
BarreTitre.displayName = "BarreTitre"
