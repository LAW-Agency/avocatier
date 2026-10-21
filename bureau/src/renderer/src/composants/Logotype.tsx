import { mergeClasses } from "@fluentui/react-components"
import { forwardRef, type HTMLAttributes } from "react"
import logoCouleur from "../assets/logo-couleur.svg"
import logoBlanc from "../assets/logo-texte-blanc.svg"
import { useReglages } from "../reglages"
import { useLogotypeStyles } from "./useLogotypeStyles.styles"

// Logo typographique du site (public/) : en couleurs, ou blanc utilisé comme masque d'une seule teinte
const RAPPORT = 2036 / 530

export type LogotypeProps = HTMLAttributes<HTMLSpanElement> & {
  hauteur: number
  // « origine » : vert et bordeaux du logo (thème clair seulement : en sombre, le bordeaux ne se lit pas, logo en couleur de la marque)
  couleur?: "origine" | "marque" | "texte" | "inverse"
}

export const Logotype = forwardRef<HTMLSpanElement, LogotypeProps>(({ hauteur, couleur = "marque", className, style, ...props }, ref) => {
  const styles = useLogotypeStyles()
  const { sombre } = useReglages()
  const enCouleurs = couleur === "origine" && !sombre
  const teinte = couleur === "origine" ? "marque" : couleur
  return (
    <span
      ref={ref}
      role="img"
      aria-label="Chez L'Avocatier"
      {...props}
      className={mergeClasses(styles.root, !enCouleurs && styles[teinte], className)}
      style={{
        height: hauteur,
        width: hauteur * RAPPORT,
        ...(enCouleurs ? { backgroundImage: `url("${logoCouleur}")` } : { maskImage: `url("${logoBlanc}")` }),
        ...style,
      }}
    />
  )
})
Logotype.displayName = "Logotype"
