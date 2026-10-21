import { makeStyles, tokens } from "@fluentui/react-components"

// Formulaires des fenêtres (nouveau client, nouvelle réservation, utilisateurs, encaissements)
export const useFormulairesStyles = makeStyles({
  grille: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", columnGap: tokens.spacingHorizontalL, rowGap: tokens.spacingVerticalL, alignItems: "start" },
  pleine: { gridColumn: "1 / -1" },
  champ: { minWidth: 0, width: "100%" },
  surface: { maxWidth: "720px", width: "100%" },
  corps: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalL },
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
})
