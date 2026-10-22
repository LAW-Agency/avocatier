import { app } from "electron"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { NIVEAUX_ZOOM, type PlaceWidget, type Reglages } from "../partage/ipc"

// Préférences du poste (thème, notifications, fermeture, démarrage, connexion mémorisée), dans le dossier
// utilisateur du logiciel : propres à cet ordinateur, jamais envoyées au serveur

const PAR_DEFAUT: Reglages = {
  theme: "systeme",
  notifications: true,
  rangerDansZone: true,
  demarrage: false,
  seSouvenir: true,
  dernierEmail: "",
  zoom: 1,
  tableau: null,
}

// Disposition du tableau de bord : identifiants uniques, largeur de 1 à 4 colonnes
function lireTableau(valeur: unknown): PlaceWidget[] | null | undefined {
  if (valeur === null) return null
  if (!Array.isArray(valeur)) return undefined
  const vus = new Set<string>()
  return valeur.flatMap((w: Partial<PlaceWidget>) => {
    if (typeof w?.id !== "string" || vus.has(w.id) || ![1, 2, 3, 4].includes(w.taille as number)) return []
    vus.add(w.id)
    return [{ id: w.id.slice(0, 40), taille: w.taille as PlaceWidget["taille"] }]
  })
}

const chemin = () => join(app.getPath("userData"), "reglages.json")

let actuels: Reglages | null = null

export function lireReglages(): Reglages {
  if (actuels) return actuels
  try {
    actuels = { ...PAR_DEFAUT, ...(existsSync(chemin()) ? (JSON.parse(readFileSync(chemin(), "utf8")) as Partial<Reglages>) : {}) }
  } catch {
    actuels = { ...PAR_DEFAUT }
  }
  return actuels
}

// Seules les clés connues, avec le bon type, sont retenues (l'interface est isolée mais on ne s'y fie pas)
export function modifierReglages(modification: Partial<Reglages>): Reglages {
  const suivants = { ...lireReglages() }
  for (const cle of Object.keys(PAR_DEFAUT) as (keyof Reglages)[]) {
    const valeur = modification[cle]
    if (valeur === undefined || typeof valeur !== typeof PAR_DEFAUT[cle]) continue
    if (cle === "theme" && !["systeme", "clair", "sombre"].includes(valeur as string)) continue
    if (cle === "zoom" && !(NIVEAUX_ZOOM as readonly number[]).includes(valeur as number)) continue
    if (cle === "tableau") {
      const tableau = lireTableau(valeur)
      if (tableau !== undefined) suivants.tableau = tableau
      continue
    }
    ;(suivants as Record<string, unknown>)[cle] = valeur
  }
  actuels = suivants
  writeFileSync(chemin(), JSON.stringify(suivants, null, 2))
  return suivants
}
