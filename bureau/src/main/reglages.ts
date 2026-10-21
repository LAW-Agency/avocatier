import { app } from "electron"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import type { Reglages } from "../partage/ipc"

// Préférences du poste (thème, notifications, fermeture, démarrage, connexion mémorisée), dans le dossier
// utilisateur du logiciel : propres à cet ordinateur, jamais envoyées au serveur

const PAR_DEFAUT: Reglages = {
  theme: "systeme",
  notifications: true,
  rangerDansZone: true,
  demarrage: false,
  seSouvenir: true,
  dernierEmail: "",
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
    ;(suivants as Record<string, unknown>)[cle] = valeur
  }
  actuels = suivants
  writeFileSync(chemin(), JSON.stringify(suivants, null, 2))
  return suivants
}
