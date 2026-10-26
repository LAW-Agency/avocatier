// Publication d'une version du logiciel dans le dépôt public des mises à jour (publish de electron-builder.yml).
// Remplace « electron-builder --publish always » : ses envois partent en parallèle et, quand la version n'existe
// pas encore sur GitHub, chacun créait son propre brouillon (installateur et latest.yml d'un côté, blockmap de
// l'autre). Ici : un seul brouillon « v<version> », trouvé ou créé, puis les trois fichiers envoyés l'un après
// l'autre (un fichier déjà présent est remplacé). Le brouillon reste à publier sur GitHub.
// Lancement : GH_TOKEN=… npm run publier (l'installateur est d'abord construit par npm run paquet)
import { readFileSync, statSync } from "node:fs"
import { basename } from "node:path"
import { fileURLToPath } from "node:url"

const racine = fileURLToPath(new URL("../", import.meta.url))
const { version } = JSON.parse(readFileSync(`${racine}package.json`, "utf8"))
const config = readFileSync(`${racine}electron-builder.yml`, "utf8")
const owner = config.match(/^\s+owner:\s*(\S+)/m)?.[1]
const repo = config.match(/^\s+repo:\s*(\S+)/m)?.[1]
const jeton = process.env.GH_TOKEN
const tag = `v${version}`

if (!owner || !repo) arreter("Dépôt introuvable dans la section publish de electron-builder.yml.")
if (!jeton) arreter("GH_TOKEN manquant : GH_TOKEN=… npm run publier")

const installateur = `${racine}dist/Chez-LAvocatier-${version}-installation.exe`
const fichiers = [installateur, `${installateur}.blockmap`, `${racine}dist/latest.yml`]
for (const fichier of fichiers) {
  try {
    statSync(fichier)
  } catch {
    arreter(`Fichier absent : ${fichier} (npm run paquet ne l'a pas produit ?)`)
  }
}

function arreter(message) {
  console.error(`✖ ${message}`)
  process.exit(1)
}

async function github(methode, url, corps, entetes = {}) {
  const reponse = await fetch(url.startsWith("https:") ? url : `https://api.github.com${url}`, {
    method: methode,
    headers: { Authorization: `Bearer ${jeton}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...entetes },
    body: corps,
  })
  if (!reponse.ok) arreter(`GitHub ${methode} ${url} : ${reponse.status} ${await reponse.text()}`)
  return reponse.status === 204 ? null : reponse.json()
}

// Brouillons compris (la recherche par tag de l'API ne les voit pas)
const versions = await github("GET", `/repos/${owner}/${repo}/releases?per_page=100`)
const memeTag = versions.filter((v) => v.tag_name === tag)
if (memeTag.some((v) => !v.draft)) arreter(`La version ${tag} est déjà publiée : augmentez « version » dans package.json.`)
let brouillon = memeTag[0]
if (brouillon) {
  console.log(`• brouillon ${tag} existant`)
} else {
  brouillon = await github("POST", `/repos/${owner}/${repo}/releases`, JSON.stringify({ tag_name: tag, name: version, draft: true }))
  console.log(`• brouillon ${tag} créé`)
}

for (const fichier of fichiers) {
  const nom = basename(fichier)
  const ancien = brouillon.assets.find((a) => a.name === nom)
  if (ancien) await github("DELETE", `/repos/${owner}/${repo}/releases/assets/${ancien.id}`)
  const contenu = readFileSync(fichier)
  console.log(`• envoi de ${nom} (${(contenu.length / 1e6).toFixed(1)} Mo)`)
  const url = `https://uploads.github.com/repos/${owner}/${repo}/releases/${brouillon.id}/assets?name=${encodeURIComponent(nom)}`
  await github("POST", url, contenu, { "Content-Type": "application/octet-stream" })
}

console.log(`✔ Brouillon prêt : ${brouillon.html_url}\n  Vérifiez-le puis cliquez sur « Publish release » : les logiciels installés le trouveront dans les 4 heures.`)
