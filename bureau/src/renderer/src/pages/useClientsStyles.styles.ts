import { makeStyles, tokens } from "@fluentui/react-components"

export const useClientsStyles = makeStyles({
  ligne: { cursor: "pointer" },
  fleche: { color: tokens.colorNeutralForeground3 },
  recherche: { width: "280px" },
  nom: { display: "inline-flex", alignItems: "center", columnGap: tokens.spacingHorizontalS },
})

export const useFicheClientStyles = makeStyles({
  titre: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalL },
  resume: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1.6fr)", columnGap: tokens.spacingHorizontalXXL, alignItems: "center" },
  contacts: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalMNudge },
  contact: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalMNudge, color: tokens.colorNeutralForeground2 },
  chiffres: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", columnGap: tokens.spacingHorizontalL, margin: 0 },
  chiffre: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXXS },
  valeur: { margin: 0, fontSize: tokens.fontSizeBase600, fontWeight: tokens.fontWeightSemibold, fontVariantNumeric: "tabular-nums" },
  reste: { color: tokens.colorStatusWarningForeground1 },
  libelle: { color: tokens.colorNeutralForeground3 },
  section: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalM },
  titreSection: { margin: 0 },
  note: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalS },
  actionsNote: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalS },
})
