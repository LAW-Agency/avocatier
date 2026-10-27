import { app } from "electron"
import electronUpdater from "electron-updater"
import type { EtatMiseAJour } from "../partage/ipc"

// Mises à jour : nouvelle version cherchée au lancement puis toutes les 4 heures (le logiciel reste ouvert dans la
// zone de notification) et proposée dans une fenêtre de l'interface ; une fois acceptée, téléchargée puis installée
// en redémarrant le logiciel. Versions publiées dans le dépôt public LAW-Agency/avocatier-versions
// (electron-builder.yml) ; rien en développement
const { autoUpdater } = electronUpdater

const DELAI_PREMIERE_RECHERCHE = 10_000
const INTERVALLE = 4 * 60 * 60 * 1000

let etat: EtatMiseAJour = { etat: app.isPackaged ? "a-jour" : "indisponible" }
let annoncer: (etat: EtatMiseAJour) => void = () => {}
let rechercheManuelle = false
// Version proposée (gardée pour réessayer après une erreur de téléchargement)
let disponible: Extract<EtatMiseAJour, { etat: "disponible" }> | null = null
// Mise à jour acceptée : installation dès la fin du téléchargement
let installerApres: (() => void) | null = null

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

// Mise à jour acceptée par les hôtes : téléchargement (progression annoncée), puis redémarrage et installation
export function mettreAJour(avantDeQuitter: () => void) {
  if (etat.etat === "prete") return installerMiseAJour(avantDeQuitter)
  if (!disponible || (etat.etat !== "disponible" && etat.etat !== "erreur")) return
  installerApres = avantDeQuitter
  changer({ etat: "telechargement", version: disponible.version, pourcent: 0 })
  autoUpdater.downloadUpdate().catch(() => {})
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
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on("checking-for-update", () => rechercheManuelle && changer({ etat: "recherche" }))
  autoUpdater.on("update-not-available", () => {
    rechercheManuelle = false
    disponible = null
    changer({ etat: "a-jour", verifieLe: new Date().toISOString() })
  })
  autoUpdater.on("update-available", (infos) => {
    rechercheManuelle = false
    disponible = { etat: "disponible", version: infos.version, notes: texteDesNotes(infos.releaseNotes) }
    changer(disponible)
  })
  autoUpdater.on("download-progress", (progression) => {
    if (etat.etat === "telechargement") changer({ ...etat, pourcent: Math.round(progression.percent) })
  })
  autoUpdater.on("update-downloaded", (infos) => {
    changer({ etat: "prete", version: infos.version })
    const avantDeQuitter = installerApres
    installerApres = null
    // Court délai : l'interface affiche « Installation… » avant la fermeture
    if (avantDeQuitter) setTimeout(() => installerMiseAJour(avantDeQuitter), 1500)
  })
  autoUpdater.on("error", (erreur) => {
    const manuelle = rechercheManuelle
    rechercheManuelle = false
    if (etat.etat === "telechargement") {
      installerApres = null
      changer({ etat: "erreur", message: messageErreur(erreur, true) })
    } else if (manuelle) changer({ etat: "erreur", message: messageErreur(erreur, false) })
  })
  setTimeout(() => rechercherMiseAJour(), DELAI_PREMIERE_RECHERCHE)
  setInterval(() => rechercherMiseAJour(), INTERVALLE)
}

// Notes de la version (corps de la publication GitHub, en HTML) réduites à du texte
function texteDesNotes(notes: string | { version: string; note: string | null }[] | null | undefined): string | null {
  const brut = Array.isArray(notes) ? notes.map((n) => n.note ?? "").join("\n") : (notes ?? "")
  const texte = brut
    .replace(/<\/(p|li|h\d)>|<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  return texte || null
}

function messageErreur(erreur: Error, telechargement: boolean): string {
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ERR_INTERNET|net::/i.test(erreur.message)) return telechargement ? "Téléchargement interrompu : vérifiez la connexion Internet puis réessayez." : "Pas de connexion Internet : nouvel essai plus tard."
  if (telechargement) return "Téléchargement impossible pour l'instant : réessayez plus tard."
  if (/404|latest\.yml/i.test(erreur.message)) return "Aucune version publiée pour l'instant."
  return "Vérification impossible pour l'instant : nouvel essai plus tard."
}
