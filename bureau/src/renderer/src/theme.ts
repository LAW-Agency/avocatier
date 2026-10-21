import { createDarkTheme, createLightTheme, type BrandVariants, type Theme } from "@fluentui/react-components"

// Thèmes Fluent aux couleurs de la marque : le vert #007f5f du logo en couleur principale (nuance 80 de
// la gamme, comme le bleu de Microsoft), du vert nuit presque noir au vert d'eau très clair.
// Police : celle des thèmes Fluent, Segoe UI (police de Windows), partout.

const VERT = [0x00, 0x7f, 0x5f]
const NUIT = [0x02, 0x0b, 0x08]
const BLANC = [0xf2, 0xfa, 0xf7]

function melange(a: number[], b: number[], t: number): string {
  return `#${a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("")}`
}

// 16 nuances, de 10 (la plus sombre) à 160 (la plus claire), le vert de la marque en 80
const marque = Object.fromEntries(
  Array.from({ length: 16 }, (_, i) => {
    const rang = (i + 1) * 10
    return [rang, rang <= 80 ? melange(NUIT, VERT, i / 7) : melange(VERT, BLANC, (i - 7) / 8)]
  }),
) as unknown as BrandVariants

export const themeClair: Theme = createLightTheme(marque)

export const themeSombre: Theme = {
  ...createDarkTheme(marque),
  // Recommandation Fluent pour une marque en thème sombre : textes et liens dans une nuance plus claire
  colorBrandForeground1: marque[110],
  colorBrandForeground2: marque[120],
  colorBrandForegroundLink: marque[120],
}
