import { createHash, randomBytes } from "node:crypto"

// Jetons des liens de récupération de compte : 256 bits aléatoires, envoyés par e-mail.
// La base n'en garde que l'empreinte SHA-256 (comptes.creerJetonReinitialisation).

export const DUREE_LIEN_MS = 3_600_000 // une heure

export function empreinteJeton(jeton: string): string {
  return createHash("sha256").update(jeton).digest("hex")
}

export function nouveauJeton(): { jeton: string; empreinte: string } {
  const jeton = randomBytes(32).toString("base64url")
  return { jeton, empreinte: empreinteJeton(jeton) }
}
