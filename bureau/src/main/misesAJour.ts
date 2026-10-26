import { app } from "electron"
import electronUpdater from "electron-updater"
import type { EtatMiseAJour } from "../partage/ipc"

// Mises à jour automatiques : nouvelle version cherchée au lancement puis toutes les 4 heures (le logiciel reste
// ouvert dans la zone de notification), téléchargée en arrière-plan, installée au redémarrage proposé par
// l'interface ou à la prochaine fermeture. Versions publiées dans le dépôt public LAW-Agency/avocatier-versions
// (electron-builder.yml) ; rien en développement
const { autoUpdater } = electronUpdater

const DELAI_PREMIERE_RECHERCHE = 10_000
const INTERVALLE = 4 * 60 * 60 * 1000

let etat: EtatMiseAJour = { etat: app.isPackaged ? "a-jour" : "indisponible" }
let annoncer: (etat: EtatMiseAJour) => void = () => {}
let rechercheManuelle = false

function changer(nouveau: EtatMiseAJour) {
  etat = nouveau
  annoncer(etat)
}

export function etatMiseAJour(): EtatMiseAJour {
  return etat
}

// manuelle : demandée depuis les paramètres (une erreur est alors affichée ; en arrière-plan, elle est tue
// et l'état précédent est gardé)
export function rechercherMiseAJour(manuelle = false) {
  if (!app.isPackaged || etat.etat === "recherche" || etat.etat === "telechargement" || etat.etat === "prete") return
  rechercheManuelle = manuelle
  autoUpdater.checkForUpdates().catch(() => {})
}

export function installerMiseAJour(avantDeQuitter: () => void) {
  if (etat.etat !== "prete") return
  avantDeQuitter()
  // Installation silencieuse (sans les écrans de l'installateur), puis relance du logiciel
  autoUpdater.quitAndInstall(true, true)
}

export function demarrerMisesAJour(rappel: (etat: EtatMiseAJour) => void) {
  annoncer = rappel
  if (!app.isPackaged) return
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on("checking-for-update", () => rechercheManuelle && changer({ etat: "recherche" }))
  autoUpdater.on("update-not-available", () => {
    rechercheManuelle = false
    changer({ etat: "a-jour", verifieLe: new Date().toISOString() })
  })
  autoUpdater.on("update-available", (infos) => {
    rechercheManuelle = false
    changer({ etat: "telechargement", version: infos.version, pourcent: 0 })
  })
  autoUpdater.on("download-progress", (progression) => {
    if (etat.etat === "telechargement") changer({ ...etat, pourcent: Math.round(progression.percent) })
  })
  autoUpdater.on("update-downloaded", (infos) => changer({ etat: "prete", version: infos.version }))
  autoUpdater.on("error", (erreur) => {
    const manuelle = rechercheManuelle
    rechercheManuelle = false
    if (manuelle || etat.etat === "telechargement") changer({ etat: "erreur", message: messageErreur(erreur) })
  })
  setTimeout(() => rechercherMiseAJour(), DELAI_PREMIERE_RECHERCHE)
  setInterval(() => rechercherMiseAJour(), INTERVALLE)
}

function messageErreur(erreur: Error): string {
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ERR_INTERNET|net::/i.test(erreur.message)) return "Pas de connexion Internet : nouvel essai plus tard."
  if (/404|latest\.yml/i.test(erreur.message)) return "Aucune version publiée pour l'instant."
  return "Vérification impossible pour l'instant : nouvel essai plus tard."
}
