import { makeStyles, tokens } from "@fluentui/react-components"

export const useCoquilleStyles = makeStyles({
  coquille: { height: "100%", display: "flex", flexDirection: "column" },
  recherche: { width: "100%", maxWidth: "none" },
  horsLigne: { marginRight: tokens.spacingHorizontalXS },
  corps: { flex: 1, minHeight: 0, display: "flex" },
  // Navigation sur le Mica, sans fond propre (comme les Paramètres de Windows 11)
  nav: { backgroundColor: "transparent", borderRightStyle: "none" },
  // Survol d'un cran plus marqué que le gris « subtle » de Fluent : en clair, il se confondait avec le Mica et la
  // rubrique semblait disparaître ; la rubrique active reste un cran au-dessus, survolée ou non
  lienNav: { backgroundColor: "transparent", ":hover": { backgroundColor: tokens.colorSubtleBackgroundSelected } },
  lienNavActif: { backgroundColor: tokens.colorSubtleBackgroundPressed, ":hover": { backgroundColor: tokens.colorSubtleBackgroundPressed } },
  // Icônes de la navigation à 20 px (taille de Windows 11), plus lisibles que la taille par défaut
  iconeNav: { fontSize: tokens.fontSizeBase500, width: tokens.fontSizeBase500, height: tokens.fontSizeBase500 },
  libelleNav: { flex: 1 },
  // Compteur (16 px) et point (6 px) centrés dans le même emplacement : ils tombent sur le même axe
  // Centrée sur la ligne du libellé (le NavItem étire ses enfants : sans alignItems, la pastille restait en haut)
  pastilleNav: {
    minWidth: "20px",
    flexShrink: 0,
    alignSelf: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    columnGap: tokens.spacingHorizontalXXS,
    lineHeight: 0,
    marginRight: tokens.spacingHorizontalXS,
  },
  // Compteur des chambres à nettoyer : jaune de l'état « À nettoyer » (badge « warning » de l'écran Chambres), avec
  // son chiffre foncé, le seul lisible sur ce jaune (CounterBadge n'a pas de couleur « warning »)
  pastilleMenage: { backgroundColor: tokens.colorPaletteYellowBackground3, color: tokens.colorNeutralForeground1Static },
  piedNav: { alignItems: "stretch", rowGap: tokens.spacingVerticalXS, paddingTop: tokens.spacingVerticalM, paddingLeft: tokens.spacingHorizontalS, paddingRight: tokens.spacingHorizontalS, paddingBottom: tokens.spacingVerticalS },
  rail: {
    width: "56px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    rowGap: tokens.spacingVerticalXS,
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalM,
  },
  railEspace: { flex: 1 },
  // Avatar du compte en bas de la navigation réduite : bouton carré de 40 px comme les rubriques
  compteRail: { padding: 0, minWidth: "40px", width: "40px", height: "40px" },
  railBouton: { position: "relative" },
  railPastille: { position: "absolute", top: tokens.spacingVerticalXXS, right: tokens.spacingHorizontalXXS },
  ceSoir: {
    boxSizing: "border-box",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalSNudge,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorSubtleBackgroundHover,
  },
  // Case « Ce soir » cliquable (ouvre le Planning) : bouton sans l'apparence d'un bouton
  ceSoirBouton: {
    border: "none",
    textAlign: "left",
    color: "inherit",
    font: "inherit",
    cursor: "pointer",
    ":hover": { backgroundColor: tokens.colorSubtleBackgroundPressed },
    ":focus-visible": { outline: `${tokens.strokeWidthThick} solid ${tokens.colorStrokeFocus2}` },
  },
  ceSoirEntete: { display: "flex", justifyContent: "space-between", columnGap: tokens.spacingHorizontalS, color: tokens.colorNeutralForeground2 },
  ceSoirLibres: { display: "flex", alignItems: "baseline", columnGap: tokens.spacingHorizontalS },
  ceSoirNombre: { fontSize: tokens.fontSizeHero700, lineHeight: tokens.lineHeightHero700, fontWeight: tokens.fontWeightSemibold, color: tokens.colorBrandForeground1, fontVariantNumeric: "tabular-nums" },
  // Plus aucune chambre à vendre ce soir
  complet: { color: tokens.colorStatusDangerForeground1 },
  ceSoirPuces: { display: "flex", flexWrap: "wrap", gap: tokens.spacingHorizontalXS },
  puceChambre: {
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    padding: `1px ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
  },
  // Libre mais pas encore prête (à nettoyer, maintenance)
  puceANettoyer: { backgroundColor: tokens.colorPaletteYellowBackground1, color: tokens.colorPaletteYellowForeground2 },
  railLibres: {
    width: "48px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    rowGap: "2px",
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalXS}`,
    marginBottom: tokens.spacingVerticalS,
    border: "none",
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorSubtleBackgroundHover,
    color: "inherit",
    font: "inherit",
    cursor: "pointer",
    ":hover": { backgroundColor: tokens.colorSubtleBackgroundPressed },
    ":focus-visible": { outline: `${tokens.strokeWidthThick} solid ${tokens.colorStrokeFocus2}` },
  },
  railNombre: { fontSize: tokens.fontSizeBase500, lineHeight: tokens.lineHeightBase500, fontWeight: tokens.fontWeightSemibold, color: tokens.colorBrandForeground1, fontVariantNumeric: "tabular-nums" },
  railLegende: { fontSize: tokens.fontSizeBase100, lineHeight: tokens.lineHeightBase100, color: tokens.colorNeutralForeground2 },
  railJauge: { width: "32px", marginTop: "2px" },
  compte: { width: "100%", justifyContent: "flex-start", columnGap: tokens.spacingHorizontalMNudge, paddingTop: tokens.spacingVerticalS, paddingBottom: tokens.spacingVerticalS, minWidth: 0 },
  compteTexte: { display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0, textAlign: "left" },
  tronque: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "170px" },
  // Contenu sur une couche aux coins tous arrondis, détachée du Mica par une marge à droite et en bas
  contenu: {
    flex: 1,
    minWidth: 0,
    overflowY: "auto",
    marginRight: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusXLarge,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  page: {
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalXXXL} ${tokens.spacingVerticalXXXL}`,
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalXXL,
  },
  // Écran courant, dans la page (mêmes écarts) ; atténué pendant que le suivant se prépare
  ecran: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXXL, transitionProperty: "opacity", transitionDuration: tokens.durationFast },
  ecranSuivant: { opacity: 0.6 },
  // Navigation pendant le chargement : rubriques de gestion, situation du soir et compte en squelette
  squeletteNav: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalL, padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalMNudge}` },
  squeletteTitre: { width: "64px" },
  squeletteLigne: { display: "grid", gridTemplateColumns: "20px 120px", alignItems: "center", columnGap: tokens.spacingHorizontalM, paddingLeft: tokens.spacingHorizontalXS },
  squeletteCourt: { width: "50%" },
  squeletteNom: { width: "140px" },
  squeletteCompte: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalMNudge, padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS}` },
  squeletteRail: { display: "flex", flexDirection: "column", alignItems: "center", rowGap: tokens.spacingVerticalXS },
})
