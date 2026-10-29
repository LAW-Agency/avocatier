// Animations d'ouverture : le grand logo passe d'un écran à l'autre (lancement, connexion, logiciel) sans saut.
// L'écran qui s'en va retient la position du logo à l'écran ; le suivant fait partir son propre logo de là

// Courbes : sortie douce (apparitions) et entrée-sortie (déplacement du logo)
export const SORTIE = "cubic-bezier(0.16, 1, 0.3, 1)"
export const MONTEE = "cubic-bezier(0.65, 0, 0.35, 1)"
// Logo de l'écran de connexion, et facteur du grand logo centré du lancement
export const HAUTEUR_LOGO = 72
export const AGRANDI = 1.6

// Une position ne vaut que pour l'écran affiché juste après (et pour le double rendu du mode strict).
// `retour` : le logo revient au centre (déconnexion) au lieu de rester où il était (connexion validée)
const VALIDITE = 1000
export type LogoRetenu = { rect: DOMRect; retour: boolean }
let depart: (LogoRetenu & { le: number }) | null = null

export function retenirLogo(element: Element | null, retour = false) {
  depart = element ? { rect: element.getBoundingClientRect(), retour, le: performance.now() } : null
}

export function logoRetenu(): LogoRetenu | null {
  return depart && performance.now() - depart.le < VALIDITE ? depart : null
}

// Transformation qui pose l'élément (à sa place naturelle, sans transformation) sur le rectangle donné
export function transformationVers(element: Element, cible: DOMRect): string {
  const a = element.getBoundingClientRect()
  const dx = cible.left + cible.width / 2 - (a.left + a.width / 2)
  const dy = cible.top + cible.height / 2 - (a.top + a.height / 2)
  return `translate(${dx}px, ${dy}px) scale(${cible.height / a.height})`
}

export const mouvementReduit = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
