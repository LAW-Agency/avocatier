import { makeStyles, tokens } from "@fluentui/react-components"

// Paramètres à la manière de Windows 11 : groupes titrés, une ligne par réglage (icône, titre, explication,
// commande à droite)
export const useParametresStyles = makeStyles({
  groupe: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXS },
  titreGroupe: { margin: `0 0 ${tokens.spacingVerticalS}`, },
  ligne: {
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr) auto",
    alignItems: "center",
    columnGap: tokens.spacingHorizontalL,
    minHeight: "68px",
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalXL}`,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  icone: { fontSize: tokens.fontSizeBase600, color: tokens.colorNeutralForeground2 },
  texte: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXXS, minWidth: 0 },
  explication: { color: tokens.colorNeutralForeground3 },
  commande: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalS },
  choix: { minWidth: "180px" },
  zoom: { minWidth: "72px", fontVariantNumeric: "tabular-nums" },
  page: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXXL },
  // Réglage en plusieurs champs (factures) : même surface qu'une ligne, champs sur deux colonnes
  formulaire: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
    columnGap: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalM,
    alignItems: "start",
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalXL}`,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  colonne: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalM },
  pleine: { gridColumn: "1 / -1" },
})
