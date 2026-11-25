import { createSign } from "node:crypto"

// Client minimal de l'API Google Calendar (v3), sans dépendance : compte de service de l'agence, jeton OAuth obtenu
// par une assertion JWT signée en RS256 (https://developers.google.com/identity/protocols/oauth2/service-account).
// Le compte de service possède l'agenda des réservations et le partage en lecture avec le propriétaire de l'hôtel :
// celui-ci n'a rien à configurer ni à autoriser.
// Variables : GOOGLE_COMPTE_SERVICE_EMAIL, GOOGLE_COMPTE_SERVICE_CLE (clé privée PEM, « \n » accepté), GOOGLE_AGENDA_ID.

const API = "https://www.googleapis.com/calendar/v3"
const JETON = "https://oauth2.googleapis.com/token"
const PORTEE = "https://www.googleapis.com/auth/calendar"
const DELAI_MS = 15_000

export type IdentifiantsGoogle = { email: string; cle: string }

export function identifiantsGoogle(): IdentifiantsGoogle | null {
  const email = process.env.GOOGLE_COMPTE_SERVICE_EMAIL?.trim()
  const cle = process.env.GOOGLE_COMPTE_SERVICE_CLE?.replace(/\\n/g, "\n").trim()
  return email && cle ? { email, cle } : null
}

// Jeton d'accès gardé jusqu'à une minute avant son expiration (une heure), par processus
const cache = globalThis as typeof globalThis & { __avocatierJetonGoogle?: { email: string; jeton: string; expire: number } }

function base64url(texte: string | Buffer) {
  return Buffer.from(texte).toString("base64url")
}

async function jetonAcces(id: IdentifiantsGoogle): Promise<string> {
  const garde = cache.__avocatierJetonGoogle
  if (garde && garde.email === id.email && garde.expire > Date.now() + 60_000) return garde.jeton

  const maintenant = Math.floor(Date.now() / 1000)
  const entete = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const charge = base64url(JSON.stringify({ iss: id.email, scope: PORTEE, aud: JETON, iat: maintenant, exp: maintenant + 3600 }))
  const signature = createSign("RSA-SHA256").update(`${entete}.${charge}`).sign(id.cle).toString("base64url")

  const reponse = await fetch(JETON, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${entete}.${charge}.${signature}` }),
    signal: AbortSignal.timeout(DELAI_MS),
  })
  const corps = (await reponse.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string }
  if (!reponse.ok || !corps.access_token) throw new Error(`Google refuse le compte de service : ${corps.error_description ?? reponse.status}`)
  cache.__avocatierJetonGoogle = { email: id.email, jeton: corps.access_token, expire: Date.now() + (corps.expires_in ?? 3600) * 1000 }
  return corps.access_token
}

export class ErreurGoogle extends Error {
  constructor(
    readonly statut: number,
    message: string,
  ) {
    super(message)
  }
}

// Appel de l'API ; `chemin` relatif à /calendar/v3. Réponse vide (204) : null
export async function appelGoogle<T>(id: IdentifiantsGoogle, methode: string, chemin: string, corps?: unknown): Promise<T | null> {
  const reponse = await fetch(`${API}${chemin}`, {
    method: methode,
    headers: { Authorization: `Bearer ${await jetonAcces(id)}`, ...(corps === undefined ? {} : { "Content-Type": "application/json" }) },
    body: corps === undefined ? undefined : JSON.stringify(corps),
    signal: AbortSignal.timeout(DELAI_MS),
  })
  if (reponse.status === 204) return null
  const texte = await reponse.text()
  if (!reponse.ok) {
    let message = texte.slice(0, 300)
    try {
      message = (JSON.parse(texte) as { error?: { message?: string } }).error?.message ?? message
    } catch {}
    throw new ErreurGoogle(reponse.status, `Google Agenda (${methode} ${chemin.split("?")[0]}) : ${reponse.status} ${message}`)
  }
  return texte ? (JSON.parse(texte) as T) : null
}
