import { release } from "node:os"
import { join } from "node:path"
import { app, BrowserWindow, ipcMain, Menu, nativeImage, nativeTheme, Notification, shell, Tray } from "electron"
import iconeIco from "../../resources/icon.ico?asset"
import icone from "../../resources/icon.png?asset"
import type { Annonce, Hote, Methode, Reglages } from "../partage/ipc"
import { appeler, quandJetonRefuse } from "./api"
import { lireEtatFenetre, suivreEtatFenetre } from "./fenetre"
import { lireReglages, modifierReglages } from "./reglages"
import { fermer, memoriser, ouvrir, SERVEUR_PAR_DEFAUT, sessionActive } from "./session"
import { arreterSuivi, demarrerSuivi } from "./suivi"

const NOM = "Chez L'Avocatier"
const ID_APPLICATION = "mg.avocatier.hotes"
// Matériau Mica : Windows 11 22H2 (build 22621) et suivants ; ailleurs, fond opaque peint par l'interface.
// AVOCATIER_SANS_MICA=1 force le fond opaque (essais)
const MICA = process.platform === "win32" && Number(release().split(".")[2]) >= 22621 && !process.env.AVOCATIER_SANS_MICA

// Essais automatisés : dossier de données séparé, donc une instance à part (le verrou d'instance unique et la
// session sont liés à ce dossier)
if (process.env.AVOCATIER_DOSSIER) app.setPath("userData", process.env.AVOCATIER_DOSSIER)

let fenetre: BrowserWindow | null = null
let zone: Tray | null = null
let quitter = false
let aTraiter = 0
let relancerSuivi: (() => void) | null = null

// Thème choisi dans les paramètres : appliqué à Chromium (prefers-color-scheme), au Mica et aux menus natifs
function appliquerTheme(reglages: Reglages) {
  nativeTheme.themeSource = reglages.theme === "systeme" ? "system" : reglages.theme === "sombre" ? "dark" : "light"
}

function appliquerDemarrage(reglages: Reglages) {
  // En développement, l'exécutable est celui d'Electron : rien à inscrire au démarrage de Windows
  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: reglages.demarrage })
}

function afficher() {
  if (!fenetre) return
  if (fenetre.isMinimized()) fenetre.restore()
  fenetre.show()
  fenetre.focus()
}

function mettreAJourTitre() {
  const titre = aTraiter > 0 ? `(${aTraiter}) ${NOM}` : NOM
  fenetre?.setTitle(titre)
  zone?.setToolTip(aTraiter > 0 ? `${NOM} : ${aTraiter} demande${aTraiter > 1 ? "s" : ""} à traiter` : NOM)
}

function creerFenetre() {
  const etat = lireEtatFenetre()
  fenetre = new BrowserWindow({
    title: NOM,
    // Icône .ico (plusieurs tailles) : nette dans la barre des tâches et le sélecteur de fenêtres
    icon: iconeIco,
    x: etat.x,
    y: etat.y,
    width: etat.width,
    height: etat.height,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    // Fenêtre Windows 11 : matériau Mica derrière l'interface. Barre de titre entièrement dessinée par
    // l'interface, boutons réduire / agrandir / fermer compris : la zone superposée de Windows clignotait
    // au survol avec un fond transparent
    ...(MICA
      ? { backgroundMaterial: "mica" as const, backgroundColor: "#00000000" }
      : { backgroundColor: nativeTheme.shouldUseDarkColors ? "#1f1f1f" : "#f5f5f5" }),
    titleBarStyle: "hidden",
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: true,
      contextIsolation: true,
    },
  })

  // Barre des tâches : icône et regroupement de l'Avocatier, pas ceux d'Electron (en développement,
  // l'exécutable est electron.exe)
  if (process.platform === "win32") fenetre.setAppDetails({ appId: ID_APPLICATION, appIconPath: iconeIco, relaunchDisplayName: NOM })
  if (etat.agrandie) fenetre.maximize()
  suivreEtatFenetre(fenetre)

  // Affichage seulement quand l'interface a peint son premier écran avec le bon thème (signal de l'interface,
  // « fenetre:prete ») : plus de fenêtre blanche, de thème qui bascule ni de mise en page qui saute au lancement.
  // Filet de sécurité : affichage au bout de 4 s quoi qu'il arrive
  const montrer = () => {
    if (!fenetre || fenetre.isVisible()) return
    fenetre.show()
    // Mica réappliqué une fois la fenêtre visible : sinon, au premier lancement, il restait parfois blanc
    // jusqu'au premier redimensionnement
    if (MICA) fenetre.setBackgroundMaterial("mica")
  }
  ipcMain.once("fenetre:prete", montrer)
  fenetre.once("ready-to-show", () => setTimeout(montrer, 4000))
  // Aucune navigation dans la fenêtre : les liens externes partent dans le navigateur
  fenetre.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url)
    return { action: "deny" }
  })
  fenetre.webContents.on("will-navigate", (e) => e.preventDefault())
  fenetre.on("maximize", () => fenetre?.webContents.send("fenetre:agrandie", true))
  fenetre.on("unmaximize", () => fenetre?.webContents.send("fenetre:agrandie", false))

  // Fermer la fenêtre la range dans la zone de notification (réglable) : le suivi des demandes continue
  let prevenu = false
  fenetre.on("close", (e) => {
    if (quitter || !sessionActive() || !lireReglages().rangerDansZone) return
    e.preventDefault()
    fenetre?.hide()
    if (!prevenu && Notification.isSupported() && lireReglages().notifications) {
      prevenu = true
      new Notification({ title: NOM, body: "Le logiciel reste ouvert ici pour vous prévenir des nouvelles demandes.", icon: icone }).show()
    }
  })
  fenetre.on("show", () => relancerSuivi?.())

  // ?mica=1 : l'interface laisse son fond transparent
  const mica = MICA ? "1" : "0"
  if (process.env.ELECTRON_RENDERER_URL) fenetre.loadURL(`${process.env.ELECTRON_RENDERER_URL}?mica=${mica}`)
  else fenetre.loadFile(join(__dirname, "../renderer/index.html"), { query: { mica } })
}

function creerZoneDeNotification() {
  zone = new Tray(nativeImage.createFromPath(icone).resize({ width: 16, height: 16 }))
  zone.setContextMenu(
    Menu.buildFromTemplate([
      { label: `Ouvrir ${NOM}`, click: afficher },
      { type: "separator" },
      {
        label: "Quitter",
        click: () => {
          quitter = true
          app.quit()
        },
      },
    ]),
  )
  zone.on("click", afficher)
  mettreAJourTitre()
}

// Nouveautés : l'interface recharge ses données et affiche ses propres annonces ; fenêtre au second plan,
// notification de Windows en plus si les hôtes l'ont gardée (un clic ouvre la liste concernée)
function annoncer(annonces: Annonce[]) {
  fenetre?.webContents.send("activite", annonces)
  if (fenetre?.isFocused() || !Notification.isSupported() || !lireReglages().notifications) return
  if (annonces.length > 0) fenetre?.flashFrame(true)
  for (const a of annonces) {
    const notification = new Notification({ title: a.titre, body: a.detail, icon: icone })
    notification.on("click", () => {
      afficher()
      fenetre?.webContents.send("naviguer", a.filtre)
    })
    notification.show()
  }
}

function suivre() {
  relancerSuivi = demarrerSuivi(annoncer)
}

function deconnecter() {
  arreterSuivi()
  relancerSuivi = null
  fermer()
  aTraiter = 0
  mettreAJourTitre()
}

// Adresse du serveur saisie à la connexion : http(s) seulement, sans chemin
function lireServeur(valeur: string): string | null {
  try {
    const url = new URL(valeur.trim())
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null
  } catch {
    return null
  }
}

ipcMain.handle("session:lire", () => ({ session: sessionActive(), serveurParDefaut: SERVEUR_PAR_DEFAUT }))

ipcMain.handle("session:connexion", async (_e, email: string, motDePasse: string, adresse: string, seSouvenir: boolean) => {
  const serveur = lireServeur(adresse)
  if (!serveur) return { ok: false, erreur: "Adresse du serveur invalide (ex. https://avocatier.mg)." }
  const resultat = await appeler<{ jeton: string; hote: Hote }>("POST", "/api/hotes/connexion", { email, motDePasse }, serveur)
  if (!resultat.ok) return resultat
  const garder = seSouvenir === true
  ouvrir(serveur, resultat.donnees.hote, resultat.donnees.jeton, garder)
  modifierReglages({ seSouvenir: garder, dernierEmail: garder ? resultat.donnees.hote.email : "" })
  suivre()
  return { ok: true, donnees: resultat.donnees.hote }
})

ipcMain.handle("session:deconnexion", () => deconnecter())

ipcMain.handle("api", (_e, methode: Methode, chemin: string, corps?: unknown) => appeler(methode, chemin, corps))

ipcMain.handle("lien:ouvrir", (_e, url: string) => {
  if (/^(https?:|mailto:|tel:)/.test(url)) return shell.openExternal(url)
})

ipcMain.handle("reglages:lire", () => lireReglages())
ipcMain.handle("reglages:modifier", (_e, modification: Partial<Reglages>) => {
  const avant = lireReglages().seSouvenir
  const reglages = modifierReglages(modification)
  if (reglages.seSouvenir !== avant) memoriser(reglages.seSouvenir)
  appliquerTheme(reglages)
  appliquerDemarrage(reglages)
  fenetre?.webContents.send("reglages", reglages)
  return reglages
})
ipcMain.handle("logiciel:infos", () => ({ version: app.getVersion(), installe: app.isPackaged }))

ipcMain.on("fenetre:reduire", () => fenetre?.minimize())
ipcMain.on("fenetre:agrandir", () => (fenetre?.isMaximized() ? fenetre.unmaximize() : fenetre?.maximize()))
ipcMain.on("fenetre:fermer", () => fenetre?.close())

ipcMain.on("hotes:a-traiter", (_e, nombre: number) => {
  aTraiter = Number.isInteger(nombre) && nombre > 0 ? nombre : 0
  mettreAJourTitre()
})

// Un seul exemplaire du logiciel : relancer l'icône réaffiche la fenêtre ouverte
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on("second-instance", afficher)

  app.whenReady().then(() => {
    // Notifications de Windows au nom du logiciel (en développement, l'exécutable d'Electron)
    app.setAppUserModelId(app.isPackaged ? ID_APPLICATION : process.execPath)
    Menu.setApplicationMenu(null)
    appliquerTheme(lireReglages())

    quandJetonRefuse(() => {
      deconnecter()
      fenetre?.webContents.send("session:expiree")
    })

    creerFenetre()
    creerZoneDeNotification()
    if (sessionActive()) suivre()
  })

  app.on("before-quit", () => {
    quitter = true
  })
  app.on("window-all-closed", () => app.quit())
}
