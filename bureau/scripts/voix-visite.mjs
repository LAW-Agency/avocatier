// Voix de la visite guidée (src/renderer/src/visite/etapes.ts) : un MP3 par étape, dit par la voix ElevenLabs
// de VOIX_VISITE, dans src/renderer/src/assets/visite/ (livré avec le logiciel, aucune clé dans l'installateur).
// Seules les étapes dont le texte, la voix ou le modèle ont changé sont régénérées (empreintes.json) ; les MP3
// d'étapes supprimées sont effacés. Le texte de l'étape précédente et de la suivante est envoyé pour garder
// une intonation continue d'un fichier à l'autre.
// Lancement : ELEVENLABS_API_KEY=… npm run voix (ou la clé dans bureau/.env, jamais commitée ;
// sans préfixe MAIN_VITE_/RENDERER_VITE_, electron-vite ne la met dans aucun paquet). --tout : tout régénérer.
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { ETAPES_VISITE, VOIX_VISITE } from "../src/renderer/src/visite/etapes.ts"

const racine = fileURLToPath(new URL("../", import.meta.url))
const dossier = `${racine}src/renderer/src/assets/visite/`
const fichierEmpreintes = `${dossier}empreintes.json`
const tout = process.argv.includes("--tout")

const cle = process.env.ELEVENLABS_API_KEY ?? lireEnv("ELEVENLABS_API_KEY")
if (!cle) arreter("ELEVENLABS_API_KEY manquante : ELEVENLABS_API_KEY=… npm run voix, ou ajoutez-la à bureau/.env")

mkdirSync(dossier, { recursive: true })
const empreintes = existsSync(fichierEmpreintes) ? JSON.parse(readFileSync(fichierEmpreintes, "utf8")) : {}
const dits = ETAPES_VISITE.map((e) => e.voix ?? e.texte)

let generees = 0
for (const [i, etape] of ETAPES_VISITE.entries()) {
  const texte = dits[i]
  const empreinte = createHash("sha256").update(`${VOIX_VISITE.voix}|${VOIX_VISITE.modele}|${texte}`).digest("hex").slice(0, 16)
  const fichier = `${dossier}${etape.id}.mp3`
  if (!tout && empreintes[etape.id] === empreinte && existsSync(fichier)) continue

  process.stdout.write(`${etape.id}… `)
  const reponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOIX_VISITE.voix}?output_format=mp3_44100_96`, {
    method: "POST",
    headers: { "xi-api-key": cle, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text: texte,
      model_id: VOIX_VISITE.modele,
      language_code: "fr",
      previous_text: dits[i - 1],
      next_text: dits[i + 1],
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true },
    }),
  })
  if (!reponse.ok) arreter(`ElevenLabs a refusé ${etape.id} (${reponse.status}) : ${await reponse.text()}`)
  writeFileSync(fichier, Buffer.from(await reponse.arrayBuffer()))
  empreintes[etape.id] = empreinte
  // Écrit après chaque fichier : une interruption ne fait pas tout refaire
  writeFileSync(fichierEmpreintes, `${JSON.stringify(empreintes, null, 2)}\n`)
  generees++
  console.log("ok")
}

// Étapes supprimées ou renommées : leurs MP3 partent avec elles
const ids = new Set(ETAPES_VISITE.map((e) => e.id))
for (const nom of readdirSync(dossier)) {
  if (nom.endsWith(".mp3") && !ids.has(nom.slice(0, -4))) {
    unlinkSync(`${dossier}${nom}`)
    delete empreintes[nom.slice(0, -4)]
    console.log(`${nom} supprimé`)
  }
}
writeFileSync(fichierEmpreintes, `${JSON.stringify(Object.fromEntries(Object.entries(empreintes).filter(([id]) => ids.has(id))), null, 2)}\n`)
console.log(generees ? `${generees} voix générée(s) avec ${VOIX_VISITE.nom}.` : "Toutes les voix sont à jour.")

function lireEnv(nom) {
  try {
    const ligne = readFileSync(`${racine}.env`, "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith(`${nom}=`))
    return ligne?.slice(nom.length + 1).trim().replace(/^["']|["']$/g, "") || undefined
  } catch {
    return undefined
  }
}

function arreter(message) {
  console.error(message)
  process.exit(1)
}
