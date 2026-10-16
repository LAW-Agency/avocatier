import { CODES_DEVISES, DEVISE_REFERENCE } from "./devises"
import type { CodeDevise } from "./types"

// Taux du jour depuis l'API ouverte d'ExchangeRate-API (sans clé, mise à jour une fois par jour). Elle couvre
// l'ariary, contrairement aux taux de la BCE (Frankfurter). Ses conditions demandent un lien d'attribution,
// affiché sous le formulaire des devises. Appelé côté serveur uniquement (Server Action des hôtes).
const URL_TAUX = `https://open.er-api.com/v6/latest/${DEVISE_REFERENCE}`
export const SOURCE_TAUX = { nom: "ExchangeRate-API", url: "https://www.exchangerate-api.com" }

export type TauxDuJour =
  | { ok: true; taux: Record<CodeDevise, number>; date: string } // date ISO de la publication des taux
  | { ok: false; erreur: string }

type ReponseApi = { result?: string; time_last_update_unix?: number; rates?: Record<string, unknown> }

// 1,121519 → 1,1215 ; 5 072,99 → 5 073 : la précision utile pour une conversion indicative
function arrondir(taux: number): number {
  return taux >= 100 ? Math.round(taux) : Math.round(taux * 10_000) / 10_000
}

export async function recupererTauxDuJour(): Promise<TauxDuJour> {
  let donnees: ReponseApi
  try {
    const reponse = await fetch(URL_TAUX, { cache: "no-store", signal: AbortSignal.timeout(8000) })
    if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`)
    donnees = await reponse.json()
  } catch {
    return { ok: false, erreur: "Le service des taux de change ne répond pas. Réessayez plus tard ou saisissez les taux à la main." }
  }

  if (donnees.result !== "success" || !donnees.rates) {
    return { ok: false, erreur: "Le service des taux de change a renvoyé une réponse inattendue." }
  }
  const taux = {} as Record<CodeDevise, number>
  for (const code of CODES_DEVISES) {
    const valeur = code === DEVISE_REFERENCE ? 1 : donnees.rates[code]
    if (typeof valeur !== "number" || !Number.isFinite(valeur) || valeur <= 0) {
      return { ok: false, erreur: `Taux introuvable pour ${code} dans la réponse du service.` }
    }
    taux[code] = arrondir(valeur)
  }
  const date = donnees.time_last_update_unix ? new Date(donnees.time_last_update_unix * 1000) : new Date()
  return { ok: true, taux, date: date.toISOString() }
}
