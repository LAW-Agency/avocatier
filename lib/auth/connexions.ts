import { comptes } from "@/lib/reservation"
import { empreinteJeton } from "./recuperation"
import { verifierJeton } from "./session"

// Code serveur des connexions (site et logiciel des hôtes), à part de session.ts que proxy.ts importe sans base :
// déconnexion qui révoque le jeton, et limite des tentatives de mot de passe.

// --- Déconnexion ---

// Jeton (cookie du site ou jeton du logiciel) refusé jusqu'à son expiration, même s'il a été copié
export async function revoquerJeton(valeur: string | undefined) {
  const session = verifierJeton(valeur)
  if (valeur && session) await comptes.revoquerJeton(empreinteJeton(valeur), new Date(session.expireLe))
}

export const jetonRevoque = (valeur: string) => comptes.jetonRevoque(empreinteJeton(valeur))

// --- Tentatives de connexion ---

const FENETRE_MS = 15 * 60_000
// Par adresse e-mail : de quoi se tromper plusieurs fois, pas de quoi essayer une liste de mots de passe. Par
// adresse IP, plus large (plusieurs personnes derrière la même connexion de l'hôtel)
const MAX_PAR_EMAIL = 8
const MAX_PAR_IP = 30

const cles = (email: string, ip: string | null) => [`email:${email}`, ...(ip ? [`ip:${ip}`] : [])]

// Adresse du visiteur : premier maillon de x-forwarded-for (posé par Vercel), sinon x-real-ip
export function adresseIp(entetes: Headers): string | null {
  return entetes.get("x-forwarded-for")?.split(",")[0]?.trim() || entetes.get("x-real-ip") || null
}

// Message à afficher si cette adresse e-mail ou cette IP a trop échoué ces 15 dernières minutes, sinon null.
// À vérifier avant le mot de passe : un compte bloqué ne dit pas si le mot de passe essayé était le bon
export async function connexionBloquee(email: string, ip: string | null): Promise<string | null> {
  const echecs = await comptes.echecsConnexion(cles(email, ip), new Date(Date.now() - FENETRE_MS))
  const bloquee = (echecs[`email:${email}`] ?? 0) >= MAX_PAR_EMAIL || (ip !== null && (echecs[`ip:${ip}`] ?? 0) >= MAX_PAR_IP)
  return bloquee ? "Trop de tentatives de connexion : réessayez dans un quart d'heure, ou utilisez « Mot de passe oublié »." : null
}

export const noterEchecConnexion = (email: string, ip: string | null) => comptes.noterEchecConnexion(cles(email, ip))

// Connexion réussie : les erreurs de frappe précédentes de ce compte ne comptent plus
export const noterConnexionReussie = (email: string) => comptes.effacerEchecsConnexion(`email:${email}`)

// --- Créations de compte ---

// Par adresse IP et par heure : une famille ou un groupe s'inscrit, un robot qui crée des comptes en série (pour
// multiplier les demandes en attente) est arrêté
const INSCRIPTIONS_PAR_HEURE = 5

export async function inscriptionBloquee(ip: string | null): Promise<string | null> {
  if (!ip) return null
  const comptees = await comptes.echecsConnexion([`inscription:${ip}`], new Date(Date.now() - 3_600_000))
  return (comptees[`inscription:${ip}`] ?? 0) >= INSCRIPTIONS_PAR_HEURE ? "Trop de comptes créés depuis cette connexion : réessayez dans une heure." : null
}

export const noterInscription = async (ip: string | null) => {
  if (ip) await comptes.noterEchecConnexion([`inscription:${ip}`])
}
