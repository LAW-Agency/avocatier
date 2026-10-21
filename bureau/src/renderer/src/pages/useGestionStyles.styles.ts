import { makeStyles, tokens } from "@fluentui/react-components"

// Écrans Revenus et Statistiques
export const useGestionStyles = makeStyles({
  periode: { minWidth: "220px" },
  chiffres: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", columnGap: tokens.spacingHorizontalL, rowGap: tokens.spacingVerticalL },
  deuxColonnes: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(320px, 1fr)",
    columnGap: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalL,
    alignItems: "start",
    "@media (max-width: 1180px)": { gridTemplateColumns: "minmax(0, 1fr)" },
  },
  moitie: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    columnGap: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalL,
    alignItems: "start",
    "@media (max-width: 1180px)": { gridTemplateColumns: "minmax(0, 1fr)" },
  },
  trois: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    columnGap: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalL,
    alignItems: "start",
    "@media (max-width: 1280px)": { gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" },
  },
  secondaire: { color: tokens.colorNeutralForeground3 },
  reste: { color: tokens.colorStatusWarningForeground1, fontWeight: tokens.fontWeightSemibold },
  liste: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" },
  ligne: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "center",
    columnGap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalS} 0`,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    ":last-child": { borderBottomStyle: "none" },
  },
  montant: { fontWeight: tokens.fontWeightSemibold, fontVariantNumeric: "tabular-nums" },
  mini: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", columnGap: tokens.spacingHorizontalM, rowGap: tokens.spacingVerticalM },
  miniChiffre: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXXS },
  miniValeur: { fontSize: tokens.fontSizeBase500, fontWeight: tokens.fontWeightSemibold, fontVariantNumeric: "tabular-nums" },
})
