import type { Methode, ResultatApi } from "../partage/ipc"
import { jeton, serveur } from "./session"

// Appels à l'API des hôtes du site (app/api/hotes/), faits ici plutôt que dans l'interface : pas de CORS,
// et le jeton ne quitte jamais le processus principal

const DELAI_MS = 20_000 // connexion de l'île parfois lente
const PREFIXE = "/api/hotes/"

let surJetonRefuse = () => {}
export function quandJetonRefuse(rappel: () => void) {
  surJetonRefuse = rappel
}

// Serveur joignable ou non : le dernier appel décide (une réponse, même une erreur, prouve que le réseau passe)
let enLigne = true
let surConnexion: (enLigne: boolean) => void = () => {}
export function quandConnexionChange(rappel: (enLigne: boolean) => void) {
  surConnexion = rappel
}
export const estEnLigne = () => enLigne
function noterConnexion(valeur: boolean) {
  if (valeur === enLigne) return
  enLigne = valeur
  surConnexion(valeur)
}

export async function appeler<T>(methode: Methode, chemin: string, corps?: unknown, adresse = serveur()): Promise<ResultatApi<T>> {
  // L'interface ne peut joindre que l'API des hôtes, sur le serveur choisi à la connexion : chemin vérifié après
  // résolution des « .. » par URL, qui sinon le feraient sortir de /api/hotes/
  let url: URL
  try {
    url = new URL(chemin, adresse)
  } catch {
    return { ok: false, erreur: "Adresse refusée." }
  }
  if (!chemin.startsWith(PREFIXE) || !url.pathname.startsWith(PREFIXE) || url.origin !== new URL(adresse).origin) return { ok: false, erreur: "Adresse refusée." }
  const valeurJeton = jeton()

  let reponse: Response
  try {
    reponse = await fetch(url, {
      method: methode,
      headers: {
        ...(valeurJeton && { Authorization: `Bearer ${valeurJeton}` }),
        ...(corps !== undefined && { "Content-Type": "application/json" }),
      },
      body: corps !== undefined ? JSON.stringify(corps) : undefined,
      signal: AbortSignal.timeout(DELAI_MS),
    })
  } catch {
    noterConnexion(false)
    return { ok: false, erreur: "Serveur injoignable : vérifiez la connexion Internet, puis réessayez." }
  }
  noterConnexion(true)

  const contenu = (await reponse.json().catch(() => null)) as (T & { erreur?: string }) | null
  // Connexion refusée ou déconnexion déjà faite : pas de « session expirée »
  if (reponse.status === 401 && chemin !== "/api/hotes/connexion" && chemin !== "/api/hotes/deconnexion") surJetonRefuse()
  if (!reponse.ok || contenu === null) {
    // Route inconnue du serveur : site pas à jour (ancien build lancé en local, déploiement en retard)
    if (reponse.status === 404 && !contenu?.erreur) {
      return { ok: false, statut: 404, erreur: `Cette fonction n'existe pas encore sur le serveur ${url.host} : le site doit être mis à jour (nouveau déploiement, ou « npm run dev » en local).` }
    }
    return { ok: false, statut: reponse.status, erreur: contenu?.erreur ?? `Réponse inattendue du serveur (${reponse.status}).` }
  }
  return { ok: true, donnees: contenu }
}
