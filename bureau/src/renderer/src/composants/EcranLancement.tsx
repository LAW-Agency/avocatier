import { useLayoutEffect, useRef } from "react"
import { AGRANDI, HAUTEUR_LOGO, MONTEE, logoRetenu, mouvementReduit, retenirLogo, transformationVers } from "../ouverture"
import { useConnexionStyles } from "../useConnexionStyles.styles"
import { BarreTitre } from "./BarreTitre"
import { Logotype } from "./Logotype"

// Écran d'attente (lancement, connexion validée, déconnexion) : le logo seul, grand et centré, là où l'ouverture
// de la connexion le reprend. Juste après la connexion, il reste là où il était au-dessus du formulaire ; à la
// déconnexion, il revient de la barre de titre jusqu'au centre. En partant, il retient sa position (même en vol)
// pour que l'écran suivant reparte de là
export function EcranLancement() {
  const styles = useConnexionStyles()
  const logo = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const l = logo.current
    if (!l) return
    const depart = logoRetenu()
    l.style.transform = ""
    let retour: Animation | undefined
    if (depart?.retour) {
      if (!mouvementReduit()) retour = l.animate([{ transform: transformationVers(l, depart.rect) }, { transform: "none" }], { duration: 950, easing: MONTEE })
    } else if (depart) l.style.transform = transformationVers(l, depart.rect)
    return () => {
      retenirLogo(l, depart?.retour)
      retour?.cancel()
    }
  }, [])

  return (
    <div className={styles.ecran} role="status" aria-label="Un instant…">
      <BarreTitre logo={false} />
      <div className={styles.centre}>
        <Logotype ref={logo} hauteur={HAUTEUR_LOGO * AGRANDI} couleur="origine" />
      </div>
    </div>
  )
}
