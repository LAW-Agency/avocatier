import { randomBytes } from "node:crypto"
import { MOT_DE_PASSE_MIN } from "@/lib/reservation/controles"
import type { CompteDemo } from "@/lib/reservation/donnees"

// Mots de passe des comptes de démonstration : jamais dans le code (le dépôt est public), lus dans .env
// (variable `compte.variable`, voir .env.example). Variable absente ou trop courte : mot de passe tiré au hasard,
// affiché une seule fois dans le terminal (à noter), et gardé pour la suite du même lancement.
// À appeler après loadEnvConfig.
export function motDePasseDemo(compte: CompteDemo): string {
  const saisi = process.env[compte.variable]?.trim()
  if (saisi && saisi.length >= MOT_DE_PASSE_MIN) return saisi
  if (saisi) console.warn(`⚠ ${compte.variable} trop court (${MOT_DE_PASSE_MIN} caractères au moins) : mot de passe tiré au hasard.`)
  const tire = randomBytes(12).toString("base64url")
  process.env[compte.variable] = tire
  console.log(`🔑 ${compte.email} : ${tire}   (à noter ; ${compte.variable} dans .env pour le fixer)`)
  return tire
}
