// Images de l'installateur NSIS (npm run paquet) tirées de resources/installation.png : bandeau latéral des pages
// d'accueil et de fin (164 × 314) et en-tête des autres pages (150 × 57), en BMP 24 bits comme l'exige NSIS.
// À relancer si l'image change : node scripts/images-installateur.mjs (sharp vient du site, à la racine)
import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const ressources = fileURLToPath(new URL("../resources/", import.meta.url))
const source = `${ressources}installation.png`

// BMP non compressé : lignes de bas en haut, pixels en BGR, chaque ligne complétée à un multiple de 4 octets
function versBmp({ data, info: { width, height } }) {
  const ligne = Math.ceil((width * 3) / 4) * 4
  const fichier = Buffer.alloc(54 + ligne * height)
  fichier.write("BM", 0)
  fichier.writeUInt32LE(fichier.length, 2)
  fichier.writeUInt32LE(54, 10)
  fichier.writeUInt32LE(40, 14)
  fichier.writeInt32LE(width, 18)
  fichier.writeInt32LE(height, 22)
  fichier.writeUInt16LE(1, 26)
  fichier.writeUInt16LE(24, 28)
  fichier.writeUInt32LE(ligne * height, 34)
  fichier.writeInt32LE(2835, 38) // 72 ppp
  fichier.writeInt32LE(2835, 42)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3
      const o = 54 + (height - 1 - y) * ligne + x * 3
      fichier[o] = data[i + 2]
      fichier[o + 1] = data[i + 1]
      fichier[o + 2] = data[i]
    }
  }
  return fichier
}

async function bmp(nom, image) {
  const pixels = await image.flatten({ background: "#000000" }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  writeFileSync(`${ressources}${nom}`, versBmp(pixels))
  console.log(`${nom} : ${pixels.info.width} × ${pixels.info.height}`)
}

// Bandeau latéral : image entière (même proportion, à 2 % près)
await bmp("installerSidebar.bmp", sharp(source).resize(164, 314, { fit: "cover", position: "centre", kernel: "lanczos3" }))
// En-tête : le logo « Chez L'Avocatier » sur le gazon sombre du bas de l'image
await bmp("installerHeader.bmp", sharp(source).extract({ left: 30, top: 905, width: 590, height: 224 }).resize(150, 57, { fit: "cover", kernel: "lanczos3" }))
