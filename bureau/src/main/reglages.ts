import { app } from "electron"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import {
  DENSITES_PLANNING,
  DEVISES_LOGICIEL,
  LIBELLES_PLANNING,
  NIVEAUX_ZOOM,
  TRIS_PLANNING,
  VUES_CHAMBRES,
  VUES_PLANNING,
  type AffichagePlanning,
  type PlaceWidget,
  type Reglages,
} from "../partage/ipc"

// Préférences du poste (thème, notifications, fermeture, démarrage, connexion mémorisée), dans le dossier
// utilisateur du logiciel : propres à cet ordinateur, jamais envoyées au serveur

const PAR_DEFAUT: Reglages = {
  theme: "systeme",
  notifications: true,
  rappels: true,
  rangerDansZone: true,
  demarrage: false,
  seSouvenir: true,
  dernierEmail: "",
  zoom: 1,
  tableau: null,
  vuePlanning: 21,
  triPlanning: "site",
  affichagePlanning: { densite: "confortable", libelle: "client", disponibilites: true, weekEnds: true, grille: false, replies: [] },
  vueChambres: "cartes",
  devise: "MGA",
}

// Affichage du planning : chaque option vérifiée, celles qui manquent ou sont invalides reprennent leur défaut
function lireAffichage(valeur: unknown): AffichagePlanning {
  const a = (valeur && typeof valeur === "object" ? valeur : {}) as Partial<Record<keyof AffichagePlanning, unknown>>
  const defaut = PAR_DEFAUT.affichagePlanning
  return {
    densite: (DENSITES_PLANNING as readonly unknown[]).includes(a.densite) ? (a.densite as AffichagePlanning["densite"]) : defaut.densite,
    libelle: (LIBELLES_PLANNING as readonly unknown[]).includes(a.libelle) ? (a.libelle as AffichagePlanning["libelle"]) : defaut.libelle,
    disponibilites: typeof a.disponibilites === "boolean" ? a.disponibilites : defaut.disponibilites,
    weekEnds: typeof a.weekEnds === "boolean" ? a.weekEnds : defaut.weekEnds,
    grille: typeof a.grille === "boolean" ? a.grille : defaut.grille,
    replies: Array.isArray(a.replies) ? [...new Set(a.replies.filter((id): id is string => typeof id === "string").map((id) => id.slice(0, 60)))].slice(0, 50) : [],
  }
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
    const lus = existsSync(chemin()) ? (JSON.parse(readFileSync(chemin(), "utf8")) as Partial<Reglages>) : {}
    actuels = {
      ...PAR_DEFAUT,
      ...lus,
      // Vue qui n'existe plus (4 semaines avant le 2026-10-26) : celle par défaut
      vuePlanning: (VUES_PLANNING as readonly unknown[]).includes(lus.vuePlanning) ? (lus.vuePlanning as Reglages["vuePlanning"]) : PAR_DEFAUT.vuePlanning,
      affichagePlanning: lireAffichage(lus.affichagePlanning),
    }
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
    // Vue du planning : un nombre de nuits ou « mois », vérifiée juste après
    if (valeur === undefined || (cle !== "vuePlanning" && typeof valeur !== typeof PAR_DEFAUT[cle])) continue
    if (cle === "theme" && !["systeme", "clair", "sombre"].includes(valeur as string)) continue
    if (cle === "zoom" && !(NIVEAUX_ZOOM as readonly number[]).includes(valeur as number)) continue
    if (cle === "vuePlanning" && !(VUES_PLANNING as readonly unknown[]).includes(valeur)) continue
    if (cle === "triPlanning" && !(TRIS_PLANNING as readonly string[]).includes(valeur as string)) continue
    if (cle === "vueChambres" && !(VUES_CHAMBRES as readonly string[]).includes(valeur as string)) continue
    if (cle === "devise" && !(DEVISES_LOGICIEL as readonly string[]).includes(valeur as string)) continue
    if (cle === "affichagePlanning") {
      suivants.affichagePlanning = lireAffichage(valeur)
      continue
    }
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
