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
  reglages: () => ipcRenderer.invoke("reglages:lire"),
  modifierReglages: (modification) => ipcRenderer.invoke("reglages:modifier", modification),
  infos: () => ipcRenderer.invoke("logiciel:infos"),
  signalerPrete: () => ipcRenderer.send("fenetre:prete"),
  reduire: () => ipcRenderer.send("fenetre:reduire"),
  basculerAgrandie: () => ipcRenderer.send("fenetre:agrandir"),
  fermer: () => ipcRenderer.send("fenetre:fermer"),
  surActivite: (rappel) => abonner("activite", rappel),
  surNavigation: (rappel) => abonner("naviguer", rappel),
  surSessionExpiree: (rappel) => abonner("session:expiree", rappel),
  surAgrandie: (rappel) => abonner("fenetre:agrandie", rappel),
  surReglages: (rappel) => abonner("reglages", rappel),
}

contextBridge.exposeInMainWorld("avocatier", pont)
