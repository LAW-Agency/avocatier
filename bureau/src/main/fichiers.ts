import { writeFile } from "node:fs/promises"
import { join } from "node:path"
import { app, BrowserWindow, dialog, shell } from "electron"
import type { ResultatFichier } from "../partage/ipc"

// Fichiers produits par le logiciel : exports pour un tableur (CSV) et factures ou reçus (PDF). L'interface
// prépare le contenu ; ici, la boîte « Enregistrer sous » de Windows et l'écriture sur le disque.

// Nom proposé sans caractère interdit par Windows
const nomSur = (nom: string) => nom.replace(/[\\/:*?"<>|]+/g, "-").trim() || "export"

async function choisirChemin(fenetre: BrowserWindow | null, nom: string, filtre: { name: string; extensions: string[] }) {
  const options = { defaultPath: join(app.getPath("documents"), nomSur(nom)), filters: [filtre] }
  const choix = fenetre ? await dialog.showSaveDialog(fenetre, options) : await dialog.showSaveDialog(options)
  return choix.canceled || !choix.filePath ? null : choix.filePath
}

// BOM UTF-8 en tête : sans lui, Excel lit les accents de travers
export async function enregistrerCsv(fenetre: BrowserWindow | null, nom: string, contenu: string): Promise<ResultatFichier> {
  const chemin = await choisirChemin(fenetre, nom, { name: "Tableur (CSV)", extensions: ["csv"] })
  if (!chemin) return null
  try {
    await writeFile(chemin, `﻿${contenu}`, "utf8")
    return { chemin }
  } catch {
    return { erreur: "Impossible d'écrire le fichier : il est peut-être ouvert dans Excel. Fermez-le et réessayez." }
  }
}

// Page mise en PDF dans une fenêtre cachée, sans JavaScript ni accès à quoi que ce soit : le HTML est produit par
// l'interface (textes échappés), images comprises (en ligne). Le PDF enregistré s'ouvre dans le lecteur de Windows
export async function enregistrerPdf(fenetre: BrowserWindow | null, nom: string, html: string): Promise<ResultatFichier> {
  const chemin = await choisirChemin(fenetre, nom, { name: "Document PDF", extensions: ["pdf"] })
  if (!chemin) return null
  const page = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true, javascript: false } })
  page.webContents.on("will-navigate", (e) => e.preventDefault())
  page.webContents.setWindowOpenHandler(() => ({ action: "deny" }))
  try {
    await page.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    const pdf = await page.webContents.printToPDF({
      pageSize: "A4",
      printBackground: true,
      // Marges de 15 mm environ (en pouces)
      margins: { top: 0.6, bottom: 0.6, left: 0.6, right: 0.6 },
    })
    await writeFile(chemin, pdf)
  } catch {
    return { erreur: "Impossible d'enregistrer le PDF : le fichier est peut-être déjà ouvert. Fermez-le et réessayez." }
  } finally {
    // Fermeture attendue : détruite d'un coup, la fenêtre emportait son processus pendant que la suivante s'y
    // installait, et le PDF suivant de la session échouait
    await new Promise<void>((fin) => {
      page.once("closed", () => fin())
      page.close()
    })
  }
  void shell.openPath(chemin)
  return { chemin }
}
