import { app, screen, type BrowserWindow, type Rectangle } from "electron"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

// Taille, position et agrandissement de la fenêtre, retrouvés d'un lancement à l'autre (fichier fenetre.json
// du dossier utilisateur). Au tout premier lancement : fenêtre centrée de taille confortable.

type Etat = { x?: number; y?: number; width: number; height: number; agrandie: boolean }

const PAR_DEFAUT: Etat = { width: 1400, height: 900, agrandie: false }
const chemin = () => join(app.getPath("userData"), "fenetre.json")

// Position gardée seulement si elle tombe encore sur un écran (écran débranché depuis)
function visible({ x, y, width, height }: Rectangle) {
  return screen.getAllDisplays().some(({ workArea: z }) => x < z.x + z.width - 100 && x + width > z.x + 100 && y >= z.y - 10 && y < z.y + z.height - 100)
}

export function lireEtatFenetre(): Etat {
  try {
    if (!existsSync(chemin())) return PAR_DEFAUT
    const etat = { ...PAR_DEFAUT, ...(JSON.parse(readFileSync(chemin(), "utf8")) as Partial<Etat>) }
    if (etat.x === undefined || etat.y === undefined) return etat
    return visible({ x: etat.x, y: etat.y, width: etat.width, height: etat.height }) ? etat : { ...etat, x: undefined, y: undefined }
  } catch {
    return PAR_DEFAUT
  }
}

// Enregistre l'état à chaque déplacement ou redimensionnement (regroupé), et à la fermeture
export function suivreEtatFenetre(fenetre: BrowserWindow) {
  let minuterie: ReturnType<typeof setTimeout> | undefined
  const enregistrer = () => {
    if (fenetre.isDestroyed() || fenetre.isMinimized()) return
    // Fenêtre agrandie : on garde la taille « normale » pour la restauration
    const { x, y, width, height } = fenetre.getNormalBounds()
    writeFileSync(chemin(), JSON.stringify({ x, y, width, height, agrandie: fenetre.isMaximized() } satisfies Etat))
  }
  const plusTard = () => {
    clearTimeout(minuterie)
    minuterie = setTimeout(enregistrer, 500)
  }
  fenetre.on("resize", plusTard)
  fenetre.on("move", plusTard)
  fenetre.on("maximize", enregistrer)
  fenetre.on("unmaximize", enregistrer)
  fenetre.on("close", enregistrer)
}
