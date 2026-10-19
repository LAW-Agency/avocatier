import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

// Session sans état : cookie « idClient.expiration.signature » signé HMAC-SHA256.
// Écriture et suppression uniquement depuis une Server Action (contrainte de cookies()).

export const COOKIE_SESSION = "avocatier_session"
const DUREE_S = 14 * 24 * 3600 // 14 jours

function secret(): string {
  const valeur = process.env.SESSION_SECRET
  if (valeur) return valeur
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET manquant : définir la variable d'environnement en production.")
  }
  return "secret-de-developpement-avocatier" // développement uniquement
}

function signer(contenu: string): string {
  return createHmac("sha256", secret()).update(contenu).digest("base64url")
}

export async function ouvrirSession(clientId: string) {
  const expiration = Date.now() + DUREE_S * 1000
  const contenu = `${clientId}.${expiration}`
  ;(await cookies()).set(COOKIE_SESSION, `${contenu}.${signer(contenu)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DUREE_S,
  })
}

export async function fermerSession() {
  ;(await cookies()).delete(COOKIE_SESSION)
}

// `emiseLe` (ms) : ouverture de la session, déduite de l'expiration. Comparée au dernier changement
// de mot de passe par clientConnecte (lib/auth/dal.ts) pour refuser les sessions plus anciennes.
export type Session = { clientId: string; emiseLe: number }

// Session si le cookie est intact et non expiré
export async function lireSession(): Promise<Session | null> {
  return verifierJeton((await cookies()).get(COOKIE_SESSION)?.value)
}

// Vérification pure de la valeur du cookie (aussi utilisée par proxy.ts, qui n'a pas accès à cookies())
export function verifierJeton(valeur: string | undefined): Session | null {
  if (!valeur) return null
  const [clientId, expiration, signature] = valeur.split(".")
  if (!clientId || !expiration || !signature) return null

  const attendue = Buffer.from(signer(`${clientId}.${expiration}`))
  const recue = Buffer.from(signature)
  if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue)) return null
  if (Number(expiration) < Date.now()) return null
  return { clientId, emiseLe: Number(expiration) - DUREE_S * 1000 }
}
