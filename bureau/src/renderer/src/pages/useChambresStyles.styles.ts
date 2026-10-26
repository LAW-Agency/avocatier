import { makeStyles, tokens } from "@fluentui/react-components"

export const useChambresStyles = makeStyles({
  resume: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", columnGap: tokens.spacingHorizontalL, rowGap: tokens.spacingVerticalL },
  grille: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", columnGap: tokens.spacingHorizontalL, rowGap: tokens.spacingVerticalL },
  // Une catégorie (« Bungalow Océan ») et ses chambres
  categorie: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalM },
  enteteCategorie: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", columnGap: tokens.spacingHorizontalM },
  carte: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalXL,
    borderRadius: tokens.borderRadiusXLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    borderTopWidth: tokens.strokeWidthThicker,
  },
  // Liseré du haut à la couleur de l'état du ménage
  propre: { borderTopColor: tokens.colorPaletteGreenBorderActive },
  a_nettoyer: { borderTopColor: tokens.colorPaletteMarigoldBorderActive },
  maintenance: { borderTopColor: tokens.colorPaletteRedBorderActive },
  // Chambre retirée de la vente : estompée
  desactivee: { borderTopColor: tokens.colorNeutralStroke1, backgroundColor: tokens.colorNeutralBackground2 },
  enteteDroite: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalXS, flexShrink: 0 },
  entete: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", columnGap: tokens.spacingHorizontalM },
  titre: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXXS, minWidth: 0 },
  nom: { margin: 0 },
  secondaire: { color: tokens.colorNeutralForeground3 },
  occupation: {
    display: "flex",
    alignItems: "center",
    columnGap: tokens.spacingHorizontalM,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  occupationTexte: { display: "flex", flexDirection: "column", minWidth: 0, flex: 1 },
  icone: { fontSize: tokens.fontSizeBase500, color: tokens.colorBrandForeground1 },
  note: { display: "flex", columnGap: tokens.spacingHorizontalS, alignItems: "flex-start", color: tokens.colorNeutralForeground2 },
  pied: { display: "flex", alignItems: "center", justifyContent: "space-between", columnGap: tokens.spacingHorizontalS, marginTop: "auto" },
})
