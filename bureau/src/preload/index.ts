import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron"
import type { PontAvocatier } from "../partage/ipc"

// Seul pont entre l'interface (isolée, sans Node) et le processus principal
function abonner<T extends unknown[]>(canal: string, rappel: (...valeurs: T) => void) {
  const ecouteur = (_e: IpcRendererEvent, ...valeurs: unknown[]) => rappel(...(valeurs as T))
  ipcRenderer.on(canal, ecouteur)
  return () => {
    ipcRenderer.removeListener(canal, ecouteur)
  }
}

const pont: PontAvocatier = {
  session: () => ipcRenderer.invoke("session:lire"),
  connexion: (email, motDePasse, serveur, seSouvenir) => ipcRenderer.invoke("session:connexion", email, motDePasse, serveur, seSouvenir),
  deconnexion: () => ipcRenderer.invoke("session:deconnexion"),
  api: (methode, chemin, corps) => ipcRenderer.invoke("api", methode, chemin, corps),
  ouvrirLien: (url) => ipcRenderer.invoke("lien:ouvrir", url),
  signalerATraiter: (nombre) => ipcRenderer.send("hotes:a-traiter", nombre),
  rappeler: (annonce) => ipcRenderer.send("hotes:rappel", annonce),
  enregistrerXlsx: (nom, classeur) => ipcRenderer.invoke("fichier:xlsx", nom, classeur),
  enregistrerPdf: (nom, html) => ipcRenderer.invoke("fichier:pdf", nom, html),
  posteCaisse: () => ipcRenderer.invoke("caisse:poste"),
  noterPosteCaisse: (prefixe, dernier) => ipcRenderer.invoke("caisse:noter-poste", prefixe, dernier),
  numeroterTicket: () => ipcRenderer.invoke("caisse:numeroter"),
  imprimantes: () => ipcRenderer.invoke("caisse:imprimantes"),
  imprimerTicket: (html, hauteurMm) => ipcRenderer.invoke("caisse:imprimer", html, hauteurMm),
  reglages: () => ipcRenderer.invoke("reglages:lire"),
  modifierReglages: (modification) => ipcRenderer.invoke("reglages:modifier", modification),
  infos: () => ipcRenderer.invoke("logiciel:infos"),
  etatConnexion: () => ipcRenderer.invoke("connexion:etat"),
  etatMiseAJour: () => ipcRenderer.invoke("mise-a-jour:etat"),
  rechercherMiseAJour: () => ipcRenderer.send("mise-a-jour:rechercher"),
  mettreAJour: () => ipcRenderer.send("mise-a-jour:mettre-a-jour"),
  installerMiseAJour: () => ipcRenderer.send("mise-a-jour:installer"),
  signalerPrete: () => ipcRenderer.send("fenetre:prete"),
  reduire: () => ipcRenderer.send("fenetre:reduire"),
  basculerAgrandie: () => ipcRenderer.send("fenetre:agrandir"),
  fermer: () => ipcRenderer.send("fenetre:fermer"),
  basculerPleinEcran: () => ipcRenderer.send("fenetre:plein-ecran"),
  zoomer: (sens) => ipcRenderer.send("fenetre:zoom", sens),
  surActivite: (rappel) => abonner("activite", rappel),
  surNavigation: (rappel) => abonner("naviguer", rappel),
  surSessionExpiree: (rappel) => abonner("session:expiree", rappel),
  surAgrandie: (rappel) => abonner("fenetre:agrandie", rappel),
  surReglages: (rappel) => abonner("reglages", rappel),
  surZoom: (rappel) => abonner("fenetre:zoom", rappel),
  surPleinEcran: (rappel) => abonner("fenetre:plein-ecran", rappel),
  surConnexion: (rappel) => abonner("connexion", rappel),
  surMiseAJour: (rappel) => abonner("mise-a-jour", rappel),
}

contextBridge.exposeInMainWorld("avocatier", pont)
