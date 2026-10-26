import ExcelJS from "exceljs"
import type { Classeur, ColonneClasseur, FeuilleClasseur, FormatColonne, ValeurCellule } from "../partage/ipc"

// Classeurs Excel des exports (réservations, encaissements, clients) : titre et date d'export en tête, en-tête
// vert de la marque figé avec filtres, lignes alternées, vraies dates et montants (triables, additionnables),
// ligne de total, et mise en page prête à imprimer (paysage, une page de large, en-tête répété).

const COULEURS = { marque: "FF007F5F", nuit: "FF0D2B21", gris: "FF5F6964", filet: "FFD5DDD8", alterne: "FFF2F7F4", total: "FFE3EFE9" }
const LIGNE_ENTETE = 4 // titre, sous-titre, ligne vide, puis l'en-tête des colonnes

const FORMATS: Record<FormatColonne, string | undefined> = {
  texte: undefined,
  entier: "#,##0",
  euros: '#,##0 "€";-#,##0 "€"',
  date: "dd/mm/yyyy",
  dateHeure: "dd/mm/yyyy hh:mm",
}

// Sainte-Marie : UTC+3 toute l'année. Excel n'a pas de fuseau : on écrit l'heure locale de l'hôtel
const DECALAGE_MS = 3 * 3_600_000

function versCellule(valeur: ValeurCellule, format: FormatColonne): ExcelJS.CellValue {
  if (valeur === null || valeur === "") return null
  if (format === "date" && typeof valeur === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valeur)) return new Date(`${valeur}T00:00:00Z`)
  if (format === "dateHeure" && typeof valeur === "string") {
    const instant = Date.parse(valeur)
    return Number.isNaN(instant) ? valeur : new Date(instant + DECALAGE_MS)
  }
  return valeur
}

// Largeur d'une colonne : celle demandée, sinon d'après le plus long contenu (bornée)
function largeur(colonne: ColonneClasseur, index: number, lignes: ValeurCellule[][]): number {
  if (colonne.largeur) return colonne.largeur
  if (colonne.format === "date") return 12
  if (colonne.format === "dateHeure") return 17
  const plusLong = Math.max(colonne.titre.length, ...lignes.map((l) => String(l[index] ?? "").length))
  return Math.min(48, Math.max(10, plusLong + 2))
}

// Nom d'onglet accepté par Excel : 31 caractères, sans : \ / ? * [ ]
const nomOnglet = (nom: string) => nom.replace(/[:\\/?*[\]]/g, "-").slice(0, 31) || "Export"

function ajouterFeuille(classeur: ExcelJS.Workbook, f: FeuilleClasseur) {
  const n = f.colonnes.length
  const feuille = classeur.addWorksheet(nomOnglet(f.nom), {
    views: [{ state: "frozen", ySplit: LIGNE_ENTETE, showGridLines: false }],
    pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: `${LIGNE_ENTETE}:${LIGNE_ENTETE}` },
    headerFooter: { oddFooter: `&L&8Chez L'Avocatier · ${f.titre}&R&8Page &P / &N` },
  })
  feuille.properties.defaultRowHeight = 18
  feuille.columns = f.colonnes.map((c, i) => {
    const numFmt = FORMATS[c.format]
    return { width: largeur(c, i, f.lignes), style: numFmt ? { numFmt } : {} }
  })

  // Titre et sous-titre sur toute la largeur du tableau
  feuille.mergeCells(1, 1, 1, n)
  feuille.mergeCells(2, 1, 2, n)
  const titre = feuille.getCell(1, 1)
  titre.value = f.titre
  titre.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: COULEURS.nuit } }
  feuille.getRow(1).height = 28
  const sousTitre = feuille.getCell(2, 1)
  sousTitre.value = f.sousTitre
  sousTitre.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: COULEURS.gris } }

  // En-tête des colonnes
  const entete = feuille.getRow(LIGNE_ENTETE)
  entete.values = f.colonnes.map((c) => c.titre)
  entete.height = 24
  entete.eachCell((cellule, numero) => {
    const format = f.colonnes[numero - 1].format
    cellule.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } }
    cellule.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COULEURS.marque } }
    cellule.alignment = { vertical: "middle", horizontal: format === "texte" ? "left" : "right", wrapText: true }
    cellule.numFmt = "@"
  })

  // Données
  f.lignes.forEach((ligne, i) => {
    const rangee = feuille.addRow(f.colonnes.map((c, j) => versCellule(ligne[j] ?? null, c.format)))
    rangee.eachCell({ includeEmpty: true }, (cellule, numero) => {
      if (numero > n) return
      cellule.font = { name: "Segoe UI", size: 10 }
      cellule.alignment = { vertical: "middle", horizontal: f.colonnes[numero - 1].format === "texte" ? "left" : "right" }
      cellule.border = { bottom: { style: "thin", color: { argb: COULEURS.filet } } }
      if (i % 2 === 1) cellule.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COULEURS.alterne } }
    })
  })

  const premiere = LIGNE_ENTETE + 1
  const derniere = LIGNE_ENTETE + f.lignes.length
  if (f.lignes.length > 0) feuille.autoFilter = { from: { row: LIGNE_ENTETE, column: 1 }, to: { row: derniere, column: n } }

  // Total des colonnes qui s'additionnent : formule, toujours juste après un tri ou une correction dans Excel
  if (f.lignes.length > 0 && f.colonnes.some((c) => c.total)) {
    const total = feuille.addRow([])
    total.height = 22
    f.colonnes.forEach((c, j) => {
      const cellule = total.getCell(j + 1)
      if (j === 0) cellule.value = "Total"
      else if (c.total) {
        const lettre = feuille.getColumn(j + 1).letter
        cellule.value = { formula: `SUBTOTAL(109,${lettre}${premiere}:${lettre}${derniere})` }
        cellule.numFmt = FORMATS[c.format] ?? "General"
      }
      cellule.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: COULEURS.nuit } }
      cellule.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COULEURS.total } }
      cellule.alignment = { vertical: "middle", horizontal: j === 0 || c.format === "texte" ? "left" : "right" }
      cellule.border = { top: { style: "medium", color: { argb: COULEURS.marque } } }
    })
  }
}

export async function construireClasseur(donnees: Classeur): Promise<Buffer> {
  const classeur = new ExcelJS.Workbook()
  classeur.creator = "Chez L'Avocatier"
  classeur.company = "Chez L'Avocatier"
  classeur.created = new Date()
  for (const feuille of donnees.feuilles) ajouterFeuille(classeur, feuille)
  return Buffer.from(await classeur.xlsx.writeBuffer())
}

// Le classeur vient de l'interface (isolée) : forme vérifiée avant de l'écrire
export function estClasseur(valeur: unknown): valeur is Classeur {
  const c = valeur as Classeur
  return (
    Array.isArray(c?.feuilles) &&
    c.feuilles.length > 0 &&
    c.feuilles.every(
      (f) =>
        typeof f?.nom === "string" &&
        typeof f.titre === "string" &&
        typeof f.sousTitre === "string" &&
        Array.isArray(f.colonnes) &&
        f.colonnes.length > 0 &&
        f.colonnes.every((col) => typeof col?.titre === "string" && col.format in FORMATS) &&
        Array.isArray(f.lignes) &&
        f.lignes.every((l) => Array.isArray(l) && l.every((v) => v === null || typeof v === "string" || typeof v === "number")),
    )
  )
}
