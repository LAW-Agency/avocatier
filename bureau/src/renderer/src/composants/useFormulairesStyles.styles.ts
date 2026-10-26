import { makeStyles, tokens } from "@fluentui/react-components"

// Formulaires des fenêtres (nouveau client, nouvelle réservation, utilisateurs, encaissements)
export const useFormulairesStyles = makeStyles({
  grille: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", columnGap: tokens.spacingHorizontalL, rowGap: tokens.spacingVerticalL, alignItems: "start" },
  pleine: { gridColumn: "1 / -1" },
  champ: { minWidth: 0, width: "100%" },
  surface: { maxWidth: "720px", width: "100%" },
  corps: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalL },
  // Pied des longues fenêtres (le contenu défile au-dessus) : filet sur toute la largeur de la fenêtre, en
  // débordant de sa marge de 24 px, et boutons calés à droite
  pied: {
    gridColumn: "1 / -1",
    justifySelf: "stretch",
    justifyContent: "flex-end",
    marginTop: tokens.spacingVerticalS,
    marginLeft: `calc(-1 * ${tokens.spacingHorizontalXXL})`,
    marginRight: `calc(-1 * ${tokens.spacingHorizontalXXL})`,
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalXXL} 0`,
    borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  encart: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  ligneEncart: { display: "flex", alignItems: "center", justifyContent: "space-between", columnGap: tokens.spacingHorizontalM },
  montant: { fontSize: tokens.fontSizeBase500, fontWeight: tokens.fontWeightSemibold, fontVariantNumeric: "tabular-nums" },
  secondaire: { color: tokens.colorNeutralForeground3 },
  nombre: { textAlign: "right", fontVariantNumeric: "tabular-nums" },
  // Résumé de ce qui change (modification d'une réservation)
  changements: { margin: 0, paddingLeft: tokens.spacingHorizontalXL, display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXS },
  // Choix entre deux fiches (fusion de clients)
  choixFiche: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXS },
})
