// Voix de la visite générées à la main sur le site ElevenLabs (compte sans accès API aux voix de la
// bibliothèque) : chaque « partie » (voix-a-coller.txt, 10 étapes séparées par <break time="3s" />) est
// enregistrée en voix-brutes/partie-N.mp3, puis découpée ici en un MP3 par étape, dans
// src/renderer/src/assets/visite/ (mêmes fichiers et empreintes que `npm run voix`). Pauses de 3 s si le
// modèle les a dites, sinon alignement des fins de phrase sur la longueur des textes : écouter le résultat.
// Lancement : npm run voix:decouper
import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { ETAPES_VISITE, VOIX_VISITE } from "../src/renderer/src/visite/etapes.ts"

const ffmpeg = createRequire(import.meta.url)("ffmpeg-static")
const racine = fileURLToPath(new URL("../", import.meta.url))
const brutes = `${racine}voix-brutes/`
const dossier = `${racine}src/renderer/src/assets/visite/`
const fichierEmpreintes = `${dossier}empreintes.json`
const PAR_PARTIE = 10

if (!existsSync(brutes)) arreter(`Dossier absent : ${brutes} (y mettre partie-1.mp3, partie-2.mp3…)`)
const parties = readdirSync(brutes)
  .map((nom) => Number(nom.match(/^partie-(\d+)\.mp3$/i)?.[1]))
  .filter((n) => n > 0)
  .sort((a, b) => a - b)
if (parties.length === 0) arreter(`Aucun fichier partie-N.mp3 dans ${brutes}`)

mkdirSync(dossier, { recursive: true })
const empreintes = existsSync(fichierEmpreintes) ? JSON.parse(readFileSync(fichierEmpreintes, "utf8")) : {}

for (const n of parties) {
  const etapes = ETAPES_VISITE.slice((n - 1) * PAR_PARTIE, n * PAR_PARTIE)
  const source = `${brutes}partie-${n}.mp3`
  const duree = dureeDe(source)
  const textes = etapes.map((e) => e.voix ?? e.texte)
  // Pauses de 3 s dites entre les étapes (<break> respectés) : les plus longs silences ; sinon (modèle qui les
  // ignore), les fins de phrase qui rendent le débit de chaque étape le plus régulier
  const longues = silencesDe(source, 1.5)
  const silences =
    longues.length >= etapes.length - 1
      ? longues
          .sort((a, b) => b.fin - b.debut - (a.fin - a.debut))
          .slice(0, etapes.length - 1)
          .sort((a, b) => a.debut - b.debut)
      : coupuresParDebit(silencesDe(source, 0.4).filter((s) => s.debut > 0.5), textes, duree)
  if (silences.length < etapes.length - 1) arreter(`partie-${n}.mp3 : pas assez de pauses pour ${etapes.length} étapes. La partie contient-elle bien ces ${etapes.length} textes ?`)
  console.log(`partie-${n}.mp3 : ${longues.length >= etapes.length - 1 ? "pauses de 3 s" : "alignement sur le débit"}, coupures à ${silences.map((s) => s.debut.toFixed(1)).join(", ")} s`)
  for (const [i, etape] of etapes.entries()) {
    // Un peu de marge autour de la voix, sans garder toute la pause
    const debut = i === 0 ? 0 : Math.max(0, silences[i - 1].fin - 0.15)
    const fin = i === etapes.length - 1 ? duree : silences[i].debut + 0.3
    execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-i", source, "-ss", debut.toFixed(3), "-to", fin.toFixed(3), "-c:a", "libmp3lame", "-b:a", "96k", `${dossier}${etape.id}.mp3`])
    const texte = etape.voix ?? etape.texte
    empreintes[etape.id] = createHash("sha256").update(`${VOIX_VISITE.voix}|${VOIX_VISITE.modele}|${texte}`).digest("hex").slice(0, 16)
    console.log(`${etape.id}.mp3  ${(fin - debut).toFixed(1)} s`)
  }
}
writeFileSync(fichierEmpreintes, `${JSON.stringify(empreintes, null, 2)}\n`)
console.log(`${parties.length} partie(s) découpée(s) dans ${dossier}`)

// Choix des coupures parmi les pauses (programmation dynamique) : chaque étape doit durer à peu près sa part
// du texte (même débit de parole d'une étape à l'autre) ; écart relatif au carré, minimisé sur toute la partie
function coupuresParDebit(pauses, textes, duree) {
  const N = textes.length
  const M = pauses.length
  if (M < N - 1) return []
  const total = textes.reduce((somme, t) => somme + t.length, 0)
  const milieu = (k) => (k < 0 ? 0 : k === M ? duree : (pauses[k].debut + pauses[k].fin) / 2)
  const ecart = (i, a, b) => {
    const prevue = (textes[i].length * duree) / total
    return ((milieu(b) - milieu(a) - prevue) / prevue) ** 2
  }
  const cout = Array.from({ length: N }, () => new Array(M + 1).fill(Infinity))
  const avant = Array.from({ length: N }, () => new Array(M + 1).fill(-1))
  for (let b = 0; b < M; b++) cout[0][b] = ecart(0, -1, b)
  for (let i = 1; i < N; i++) {
    for (let b = i; b <= M; b++) {
      if ((i === N - 1) !== (b === M)) continue // la dernière étape finit avec le fichier
      for (let a = i - 1; a < b; a++) {
        const v = cout[i - 1][a] + ecart(i, a, b)
        if (v < cout[i][b]) {
          cout[i][b] = v
          avant[i][b] = a
        }
      }
    }
  }
  const choisies = []
  for (let i = N - 1, b = M; i > 0; i--) {
    b = avant[i][b]
    choisies.unshift(pauses[b])
  }
  return choisies
}

function silencesDe(fichier, dureeMin) {
  const { stderr } = spawnSync(ffmpeg, ["-hide_banner", "-i", fichier, "-af", `silencedetect=noise=-35dB:d=${dureeMin}`, "-f", "null", "-"], { encoding: "utf8" })
  const silences = []
  for (const ligne of stderr.split(/\r?\n/)) {
    const debut = ligne.match(/silence_start: ([\d.]+)/)
    const fin = ligne.match(/silence_end: ([\d.]+)/)
    if (debut) silences.push({ debut: Number(debut[1]), fin: Infinity })
    else if (fin && silences.length) silences[silences.length - 1].fin = Number(fin[1])
  }
  // Silence final (jusqu'au bout du fichier) : ce n'est pas une pause entre deux étapes
  return silences.filter((s) => Number.isFinite(s.fin))
}

function dureeDe(fichier) {
  const { stderr } = spawnSync(ffmpeg, ["-hide_banner", "-i", fichier], { encoding: "utf8" })
  const [, h, m, s] = stderr.match(/Duration: (\d+):(\d+):([\d.]+)/) ?? arreter(`Durée illisible : ${fichier}`)
  return Number(h) * 3600 + Number(m) * 60 + Number(s)
}

function arreter(message) {
  console.error(message)
  process.exit(1)
}
