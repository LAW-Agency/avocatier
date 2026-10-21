import { app, safeStorage } from "electron"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import type { Hote, Session } from "../partage/ipc"

// Session du logiciel : adresse du serveur, hôte connecté et jeton de l'API. Le jeton est chiffré par
// Windows (safeStorage, lié au compte de la session Windows) avant d'être écrit dans le dossier de l'application.

// Développement : le site lancé par `npm run dev` à la racine du dépôt ; logiciel installé : le site en ligne.
// MAIN_VITE_SERVEUR (fichier bureau/.env) remplace cette adresse à la compilation.
export const SERVEUR_PAR_DEFAUT =
  import.meta.env.MAIN_VITE_SERVEUR ?? (app.isPackaged ? "https://avocatier-livid.vercel.app" : "http://localhost:3000")

type Fichier = { serveur: string; hote: Hote | null; jetonChiffre: string | null }

const chemin = () => join(app.getPath("userData"), "session.json")

// `memoriser` : écrire la connexion sur le disque (« Se souvenir de moi ») ; sinon, elle s'arrête avec le logiciel
let etat: { serveur: string; hote: Hote | null; jeton: string | null; memoriser: boolean } | null = null

function lire() {
  if (etat) return etat
  etat = { serveur: SERVEUR_PAR_DEFAUT, hote: null, jeton: null, memoriser: true }
  try {
    if (existsSync(chemin())) {
      const fichier = JSON.parse(readFileSync(chemin(), "utf8")) as Fichier
      etat.serveur = fichier.serveur || SERVEUR_PAR_DEFAUT
      if (fichier.hote && fichier.jetonChiffre && safeStorage.isEncryptionAvailable()) {
        etat.hote = fichier.hote
        etat.jeton = safeStorage.decryptString(Buffer.from(fichier.jetonChiffre, "base64"))
      }
    }
  } catch {
    // Fichier illisible ou chiffré par un autre compte Windows : on repart de l'écran de connexion
    etat = { serveur: SERVEUR_PAR_DEFAUT, hote: null, jeton: null, memoriser: true }
  }
  return etat
}

function ecrire() {
  const { serveur, hote, jeton, memoriser } = lire()
  // Sans chiffrement disponible, le jeton n'est gardé qu'en mémoire : reconnexion au prochain lancement
  const jetonChiffre = memoriser && jeton && safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(jeton).toString("base64") : null
  writeFileSync(chemin(), JSON.stringify({ serveur, hote: jetonChiffre ? hote : null, jetonChiffre } satisfies Fichier))
}

export const serveur = () => lire().serveur
export const jeton = () => lire().jeton

export function sessionActive(): Session | null {
  const { hote, jeton, serveur } = lire()
  return hote && jeton ? { hote, serveur } : null
}

export function ouvrir(nouveauServeur: string, hote: Hote, nouveauJeton: string, memoriser: boolean) {
  etat = { serveur: nouveauServeur, hote, jeton: nouveauJeton, memoriser }
  ecrire()
}

// Déconnexion ou jeton refusé : l'adresse du serveur reste proposée à la prochaine connexion
export function fermer() {
  etat = { ...lire(), hote: null, jeton: null }
  ecrire()
}

// « Se souvenir de moi » changé dans les paramètres : connexion en cours écrite sur le disque ou effacée
export function memoriser(valeur: boolean) {
  etat = { ...lire(), memoriser: valeur }
  ecrire()
}
