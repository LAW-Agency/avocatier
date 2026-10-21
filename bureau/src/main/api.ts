import type { Methode, ResultatApi } from "../partage/ipc"
import { jeton, serveur } from "./session"

// Appels à l'API des hôtes du site (app/api/hotes/), faits ici plutôt que dans l'interface : pas de CORS,
// et le jeton ne quitte jamais le processus principal

const DELAI_MS = 20_000 // connexion de l'île parfois lente

let surJetonRefuse = () => {}
export function quandJetonRefuse(rappel: () => void) {
  surJetonRefuse = rappel
}

export async function appeler<T>(methode: Methode, chemin: string, corps?: unknown, adresse = serveur()): Promise<ResultatApi<T>> {
  // L'interface ne peut joindre que l'API des hôtes, sur le serveur choisi à la connexion
  if (!chemin.startsWith("/api/hotes/")) return { ok: false, erreur: "Adresse refusée." }
  const valeurJeton = jeton()

  let reponse: Response
  try {
    reponse = await fetch(new URL(chemin, adresse), {
      method: methode,
      headers: {
        ...(valeurJeton && { Authorization: `Bearer ${valeurJeton}` }),
        ...(corps !== undefined && { "Content-Type": "application/json" }),
      },
      body: corps !== undefined ? JSON.stringify(corps) : undefined,
      signal: AbortSignal.timeout(DELAI_MS),
    })
  } catch {
    return { ok: false, erreur: "Serveur injoignable : vérifiez la connexion Internet, puis réessayez." }
  }

  const contenu = (await reponse.json().catch(() => null)) as (T & { erreur?: string }) | null
  if (reponse.status === 401 && chemin !== "/api/hotes/connexion") surJetonRefuse()
  if (!reponse.ok || contenu === null) {
    return { ok: false, statut: reponse.status, erreur: contenu?.erreur ?? `Réponse inattendue du serveur (${reponse.status}).` }
  }
  return { ok: true, donnees: contenu }
}
