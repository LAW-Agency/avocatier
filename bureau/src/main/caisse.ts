import { randomUUID } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { app, BrowserWindow } from "electron"
import type { PosteLocal, ResultatImpression } from "../partage/ipc"

// Caisse Restaurant et Bar, côté poste : identifiant de cet ordinateur (créé une fois pour toutes), préfixe de
// numérotation donné par le serveur et dernier numéro de ticket attribué, dans caisse.json du dossier utilisateur.
// Les numéros sont attribués ici, un par un : deux ventes rapides ou une vente hors connexion n'ont jamais le même.
// Et l'impression des tickets (rouleau de 80 mm).

const chemin = () => join(app.getPath("userData"), "caisse.json")

let actuel: PosteLocal | null = null

export function lirePoste(): PosteLocal {
  if (actuel) return actuel
  try {
    const lu = existsSync(chemin()) ? (JSON.parse(readFileSync(chemin(), "utf8")) as Partial<PosteLocal>) : {}
    if (typeof lu.posteId === "string" && lu.posteId.length >= 8) {
      actuel = {
        posteId: lu.posteId,
        prefixe: typeof lu.prefixe === "string" ? lu.prefixe : null,
        dernier: Number.isInteger(lu.dernier) ? (lu.dernier as number) : 0,
      }
      return actuel
    }
  } catch {
    // Fichier illisible : nouveau poste (le serveur lui donnera un autre préfixe)
  }
  return ecrire({ posteId: randomUUID(), prefixe: null, dernier: 0 })
}

function ecrire(poste: PosteLocal): PosteLocal {
  actuel = poste
  writeFileSync(chemin(), JSON.stringify(poste, null, 2))
  return poste
}

// Préfixe et plus haut numéro connus du serveur (poste réinstallé : la numérotation reprend après)
export function noterPoste(prefixe: string, dernierServeur: number): PosteLocal {
  const poste = lirePoste()
  const dernier = prefixe === poste.prefixe ? Math.max(poste.dernier, dernierServeur) : dernierServeur
  return ecrire({ ...poste, prefixe, dernier })
}

// Numéro du prochain ticket (« C1-000042 »), ou null si le poste n'est pas encore enregistré
export function numeroterTicket(): string | null {
  const poste = lirePoste()
  if (!poste.prefixe) return null
  const suivant = ecrire({ ...poste, dernier: poste.dernier + 1 })
  // Même format que numeroTicket (lib/reservation/controles.ts), vérifié par le serveur
  return `${poste.prefixe}-${String(suivant.dernier).padStart(6, "0")}`
}

export async function listerImprimantes(fenetre: BrowserWindow | null): Promise<string[]> {
  if (!fenetre) return []
  return (await fenetre.webContents.getPrintersAsync()).map((p) => p.name)
}

// Ticket mis en page par l'interface (largeur 80 mm, hauteur calculée), imprimé dans une fenêtre cachée sans
// JavaScript. Sans imprimante choisie : boîte d'impression de Windows
export async function imprimerTicket(html: string, hauteurMm: number, imprimante: string): Promise<ResultatImpression> {
  const page = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true, javascript: false } })
  page.webContents.on("will-navigate", (e) => e.preventDefault())
  page.webContents.setWindowOpenHandler(() => ({ action: "deny" }))
  try {
    await page.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    return await new Promise<ResultatImpression>((fin) => {
      page.webContents.print(
        {
          silent: imprimante !== "",
          ...(imprimante && { deviceName: imprimante }),
          printBackground: true,
          margins: { marginType: "none" },
          // Dimensions en microns : rouleau de 80 mm, coupé sous le dernier texte
          pageSize: { width: 80_000, height: Math.max(60, Math.min(2000, Math.round(hauteurMm))) * 1000 },
        },
        (reussi, raison) => fin(reussi ? { ok: true } : raison === "Print job canceled" || raison === "cancelled" ? { ok: false, annule: true } : { ok: false, erreur: raison || "Impression impossible." }),
      )
    })
  } catch {
    return { ok: false, erreur: "Impression impossible." }
  } finally {
    await new Promise<void>((fin) => {
      page.once("closed", () => fin())
      page.close()
    })
  }
}
