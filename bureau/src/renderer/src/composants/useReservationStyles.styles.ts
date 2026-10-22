import { makeStyles, tokens } from "@fluentui/react-components"

export const useActionsStyles = makeStyles({
  pile: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalS },
  boutons: { display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: tokens.spacingHorizontalS, rowGap: tokens.spacingVerticalS },
  fin: { justifyContent: "flex-end" },
  // Action destructive : pas de variante « danger » dans Fluent, couleurs d'état de la palette
  danger: {
    backgroundColor: tokens.colorStatusDangerBackground3,
    color: tokens.colorNeutralForegroundOnBrand,
    ":hover": { backgroundColor: tokens.colorStatusDangerForeground1, color: tokens.colorNeutralForegroundOnBrand },
    ":hover:active": { backgroundColor: tokens.colorStatusDangerForeground2, color: tokens.colorNeutralForegroundOnBrand },
  },
})

export const useFicheStyles = makeStyles({
  surface: { maxWidth: "900px", width: "100%", padding: 0, overflow: "hidden" },
  corps: { rowGap: 0, maxHeight: "calc(100vh - 96px)" },
  entete: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalXXL} ${tokens.spacingVerticalXL}`,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  ligneStatut: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalS, flexWrap: "wrap", paddingRight: tokens.spacingHorizontalXXXL },
  fermer: { position: "absolute", top: tokens.spacingVerticalL, right: tokens.spacingHorizontalL },
  expire: { color: tokens.colorStatusDangerForeground1 },
  description: { color: tokens.colorNeutralForeground3 },
  contenu: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", padding: 0, overflowY: "auto" },
  principal: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXL, padding: tokens.spacingHorizontalXXL },
  faits: { display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: tokens.spacingVerticalL, columnGap: tokens.spacingHorizontalXXL, margin: 0 },
  fait: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXXS },
  dd: { margin: 0 },
  libelle: { color: tokens.colorNeutralForeground3 },
  citation: { margin: 0, paddingLeft: tokens.spacingHorizontalM, borderLeft: `${tokens.strokeWidthThicker} solid ${tokens.colorBrandStroke1}`, whiteSpace: "pre-wrap" },
  navette: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalS, color: tokens.colorNeutralForeground2 },
  panneau: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalXL,
    padding: tokens.spacingHorizontalXXL,
    backgroundColor: tokens.colorNeutralBackground2,
    borderLeft: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  section: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalS },
  client: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalMNudge },
  contacts: { display: "flex", flexDirection: "column", alignItems: "flex-start", rowGap: tokens.spacingVerticalXS },
  historique: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalM },
  evenement: {
    display: "flex",
    flexDirection: "column",
    paddingLeft: tokens.spacingHorizontalL,
    position: "relative",
    "::before": {
      content: '""',
      position: "absolute",
      left: 0,
      top: tokens.spacingVerticalSNudge,
      width: tokens.spacingHorizontalSNudge,
      height: tokens.spacingHorizontalSNudge,
      borderRadius: tokens.borderRadiusCircular,
      backgroundColor: tokens.colorBrandBackground,
    },
  },
  pied: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    columnGap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalXXL}`,
    borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  // Modifier, facture : à gauche du pied ; la décision (confirmer, refuser, annuler) reste à droite
  outils: { display: "flex", flexWrap: "wrap", columnGap: tokens.spacingHorizontalS, rowGap: tokens.spacingVerticalS },
})

export const useEncaissementsStyles = makeStyles({
  root: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalM },
  totaux: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", columnGap: tokens.spacingHorizontalM },
  total: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXXS, padding: tokens.spacingHorizontalM, borderRadius: tokens.borderRadiusLarge, backgroundColor: tokens.colorNeutralBackground3 },
  chiffre: { fontSize: tokens.fontSizeBase400, fontWeight: tokens.fontWeightSemibold, fontVariantNumeric: "tabular-nums" },
  reste: { color: tokens.colorStatusWarningForeground1 },
  solde: { color: tokens.colorStatusSuccessForeground1 },
  libelle: { color: tokens.colorNeutralForeground3 },
  liste: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" },
  ligne: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto auto auto",
    alignItems: "center",
    columnGap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalS} 0`,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  montant: { fontVariantNumeric: "tabular-nums", fontWeight: tokens.fontWeightSemibold },
  formulaire: { display: "grid", gridTemplateColumns: "120px minmax(0, 1fr) minmax(0, 1fr) auto", columnGap: tokens.spacingHorizontalS, alignItems: "end" },
  nombre: { textAlign: "right", fontVariantNumeric: "tabular-nums" },
  champ: { minWidth: 0, width: "100%" },
})
