import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

// Mots de passe hachés avec scrypt et un sel aléatoire : « scrypt$sel$empreinte »
// (côté PostgreSQL / Supabase Auth, ce hachage sera fait par le service d'authentification)

const LONGUEUR = 64

export function hacherMotDePasse(motDePasse: string): string {
  const sel = randomBytes(16).toString("hex")
  const empreinte = scryptSync(motDePasse, sel, LONGUEUR).toString("hex")
  return `scrypt$${sel}$${empreinte}`
}

export function verifierMotDePasse(motDePasse: string, hash: string): boolean {
  const [algo, sel, empreinte] = hash.split("$")
  if (algo !== "scrypt" || !sel || !empreinte) return false
  const attendu = Buffer.from(empreinte, "hex")
  const calcule = scryptSync(motDePasse, sel, attendu.length)
  return timingSafeEqual(attendu, calcule)
}
