import { makeStyles, tokens } from "@fluentui/react-components"

export const useIndicateurStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalXS,
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalXL}`,
    borderRadius: tokens.borderRadiusXLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    minWidth: 0,
  },
  entete: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalS, color: tokens.colorNeutralForeground3 },
  icone: { fontSize: tokens.fontSizeBase500, color: tokens.colorBrandForeground1 },
  valeur: { fontSize: tokens.fontSizeHero800, lineHeight: tokens.lineHeightHero800, fontWeight: tokens.fontWeightSemibold, fontVariantNumeric: "tabular-nums" },
  pied: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalS, flexWrap: "wrap", color: tokens.colorNeutralForeground3 },
})

export const useHistogrammeStyles = makeStyles({
  root: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalS },
  graphique: { display: "block", width: "100%", overflow: "visible" },
  barre: { fill: tokens.colorBrandBackground, transitionProperty: "opacity", transitionDuration: tokens.durationFast, ":hover": { opacity: 0.8 } },
  barreSecondaire: { fill: tokens.colorBrandBackground2Hover },
  barreActuelle: { fill: tokens.colorBrandBackgroundPressed },
  grille: { stroke: tokens.colorNeutralStroke2, strokeWidth: 1 },
  axe: { fill: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase100, fontFamily: tokens.fontFamilyBase },
  valeur: { fill: tokens.colorNeutralForeground2, fontSize: tokens.fontSizeBase100, fontFamily: tokens.fontFamilyBase, fontWeight: tokens.fontWeightSemibold },
  legende: { display: "flex", columnGap: tokens.spacingHorizontalL, color: tokens.colorNeutralForeground3 },
  pastille: { display: "inline-block", width: tokens.spacingHorizontalM, height: tokens.spacingVerticalS, marginRight: tokens.spacingHorizontalXS, borderRadius: tokens.borderRadiusSmall },
  pastillePrincipale: { backgroundColor: tokens.colorBrandBackground },
  pastilleSecondaire: { backgroundColor: tokens.colorBrandBackground2Hover },
})

export const useRepartitionStyles = makeStyles({
  root: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalM },
  ligne: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", rowGap: tokens.spacingVerticalXS, columnGap: tokens.spacingHorizontalM, alignItems: "baseline" },
  part: { fontVariantNumeric: "tabular-nums", color: tokens.colorNeutralForeground2 },
  barre: { gridColumn: "1 / -1" },
})
