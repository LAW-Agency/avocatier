// Textes à coller sur le site ElevenLabs pour les étapes de la visite sans voix à jour (MP3 absent, ou texte
// modifié depuis : empreintes.json) : voix-a-coller.txt, en parties de 10 étapes au plus séparées par
// <break time="3s" />, et voix-brutes/parties.json (étapes de chaque partie), lu par `npm run voix:decouper`.
// Lancement : npm run voix:textes (--tout : toutes les étapes)
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { ETAPES_VISITE, VOIX_VISITE } from "../src/renderer/src/visite/etapes.ts"

const racine = fileURLToPath(new URL("../", import.meta.url))
const dossier = `${racine}src/renderer/src/assets/visite/`
const fichierEmpreintes = `${dossier}empreintes.json`
const empreintes = existsSync(fichierEmpreintes) ? JSON.parse(readFileSync(fichierEmpreintes, "utf8")) : {}
const tout = process.argv.includes("--tout")

const empreinte = (texte) => createHash("sha256").update(`${VOIX_VISITE.voix}|${VOIX_VISITE.modele}|${texte}`).digest("hex").slice(0, 16)
const aDire = ETAPES_VISITE.filter((e) => tout || !existsSync(`${dossier}${e.id}.mp3`) || empreintes[e.id] !== empreinte(e.voix ?? e.texte))
if (aDire.length === 0) {
  console.log("Toutes les étapes ont leur voix à jour.")
  process.exit(0)
}

// Parties de taille égale, 10 étapes au plus
const nombre = Math.ceil(aDire.length / 10)
const taille = Math.ceil(aDire.length / nombre)
const parties = Array.from({ length: nombre }, (_, i) => aDire.slice(i * taille, (i + 1) * taille))

let texte = `Voix ${VOIX_VISITE.nom}, modèle Eleven Multilingual v2. Une partie par génération, à enregistrer dans bureau/voix-brutes/.\n\n`
for (const [i, etapes] of parties.entries()) {
  const corps = etapes.map((e) => e.voix ?? e.texte).join('\n<break time="3s" />\n')
  texte += `===== PARTIE ${i + 1} : ${etapes.map((e) => e.id).join(", ")} (${corps.length} caractères), à enregistrer sous partie-${i + 1}.mp3 =====\n\n${corps}\n\n`
}
// Enregistrements des textes précédents mis de côté : ils ne correspondent plus aux nouvelles parties
const brutes = `${racine}voix-brutes/`
mkdirSync(`${brutes}anciennes`, { recursive: true })
for (const nom of readdirSync(brutes)) {
  if (/^partie-\d+\.mp3$/i.test(nom)) renameSync(`${brutes}${nom}`, `${brutes}anciennes/${Date.now()}-${nom}`)
}
writeFileSync(`${racine}voix-a-coller.txt`, texte)
writeFileSync(`${racine}voix-brutes/parties.json`, `${JSON.stringify(Object.fromEntries(parties.map((etapes, i) => [`partie-${i + 1}`, etapes.map((e) => e.id)])), null, 2)}\n`)
console.log(`${aDire.length} étape(s) en ${nombre} partie(s) : voix-a-coller.txt`)
