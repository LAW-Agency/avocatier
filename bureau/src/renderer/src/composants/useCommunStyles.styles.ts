import { makeStyles, tokens } from "@fluentui/react-components"

export const useEnTeteStyles = makeStyles({
  root: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", columnGap: tokens.spacingHorizontalL, rowGap: tokens.spacingVerticalM, flexWrap: "wrap" },
  texte: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXS, minWidth: 0 },
  titre: { margin: 0 },
  description: { color: tokens.colorNeutralForeground2 },
  actions: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalS, flexWrap: "wrap" },
})

export const useCarteStyles = makeStyles({
  // Surface des blocs d'un écran (cartes de Windows 11) : fond 1 et bord discret, sans ombre
  root: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalXL,
    borderRadius: tokens.borderRadiusXLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    minWidth: 0,
  },
  entete: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", columnGap: tokens.spacingHorizontalM },
  texte: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXXS, minWidth: 0 },
  titre: { margin: 0 },
  description: { color: tokens.colorNeutralForeground3 },
})

export const useVideStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    rowGap: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalXXXL} ${tokens.spacingHorizontalXXL}`,
    textAlign: "center",
    borderRadius: tokens.borderRadiusLarge,
    border: `${tokens.strokeWidthThin} dashed ${tokens.colorNeutralStroke1}`,
    color: tokens.colorNeutralForeground3,
  },
  icone: { fontSize: tokens.fontSizeHero800, color: tokens.colorBrandForeground1, marginBottom: tokens.spacingVerticalXS },
  titre: { color: tokens.colorNeutralForeground1 },
})

export const useCadreTableStyles = makeStyles({
  // Tableau posé sur une carte : coins arrondis, en-tête teinté
  root: {
    borderRadius: tokens.borderRadiusXLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    overflow: "hidden",
  },
  entete: { backgroundColor: tokens.colorNeutralBackground3 },
  premiere: { paddingLeft: tokens.spacingHorizontalL },
  derniere: { paddingRight: tokens.spacingHorizontalL },
  nombre: { fontVariantNumeric: "tabular-nums" },
  droite: { display: "flex", justifyContent: "flex-end", width: "100%" },
  secondaire: { color: tokens.colorNeutralForeground3 },
})
