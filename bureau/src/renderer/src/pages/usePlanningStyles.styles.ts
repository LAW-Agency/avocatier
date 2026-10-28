import { makeStyles, tokens } from "@fluentui/react-components"

export const usePlanningStyles = makeStyles({
  // Boutons de la période, à la hauteur des autres actions de l'en-tête (32 px, sans le cadre d'une barre d'outils)
  periode: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalXXS },
  // Barre du calendrier, au-dessus des jours : navigation et période à gauche, date et durée à droite
  barreOutils: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    rowGap: tokens.spacingVerticalS,
    columnGap: tokens.spacingHorizontalL,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  // Période affichée, en titre de la barre
  plage: { marginLeft: tokens.spacingHorizontalS, fontSize: tokens.fontSizeBase400, fontWeight: tokens.fontWeightSemibold, whiteSpace: "nowrap" },
  plageMois: { textTransform: "capitalize" },
  // Aller à une date : champ court à côté des flèches
  allerA: { width: "168px" },
  cadre: {
    borderRadius: tokens.borderRadiusXLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    overflow: "hidden",
  },
  defilement: { overflowX: "auto" },
  grille: { minWidth: "960px" },
  // Lignes séparées d'un trait très léger : la grille s'efface derrière les réservations
  rangee: { display: "grid", borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke3}`, ":last-child": { borderBottomStyle: "none" } },
  enteteRangee: { borderBottomColor: tokens.colorNeutralStroke2 },
  // Colonne des chambres collée à gauche au défilement horizontal
  nomHebergement: {
    position: "sticky",
    left: 0,
    // Au-dessus des barres (1) et du trait d'aujourd'hui (2) qui défilent dessous
    zIndex: 3,
    display: "flex",
    alignItems: "center",
    columnGap: tokens.spacingHorizontalS,
    minWidth: 0,
    padding: `0 ${tokens.spacingHorizontalL}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke3}`,
  },
  nomEntete: { color: tokens.colorNeutralForeground2, fontWeight: tokens.fontWeightSemibold, textTransform: "capitalize" },
  // Chambre : retrait sous le nom de sa catégorie
  nomChambre: { paddingLeft: "38px", color: tokens.colorNeutralForeground1 },
  texteCategorie: { overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" },
  desactivee: { color: tokens.colorNeutralForeground3 },
  // Pastille d'état du ménage à côté du numéro (rien quand la chambre est propre)
  pointEtat: { flexShrink: 0, width: "6px", height: "6px", borderRadius: tokens.borderRadiusCircular },
  a_nettoyer: { backgroundColor: tokens.colorPaletteMarigoldBorderActive },
  maintenance: { backgroundColor: tokens.colorPaletteRedBorderActive },
  // Ligne des chambres libres, sous les jours
  rangeeDisponibles: { backgroundColor: tokens.colorNeutralBackground2 },
  nomDisponibles: { backgroundColor: tokens.colorNeutralBackground2, color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
  disponible: {
    display: "grid",
    placeItems: "center",
    height: "26px",
    fontSize: tokens.fontSizeBase200,
    fontVariantNumeric: "tabular-nums",
    color: tokens.colorNeutralForeground3,
  },
  presqueComplet: { color: tokens.colorPaletteMarigoldForeground2, fontWeight: tokens.fontWeightSemibold },
  complet: { color: tokens.colorStatusDangerForeground1, fontWeight: tokens.fontWeightSemibold },
  // Titre d'une catégorie : bouton qui la replie ou la déplie
  rangeeCategorie: { backgroundColor: tokens.colorNeutralBackground2, cursor: "pointer" },
  nomCategorie: {
    position: "sticky",
    left: 0,
    // Au-dessus des barres (1) et du trait d'aujourd'hui (2) qui défilent dessous
    zIndex: 3,
    display: "flex",
    alignItems: "center",
    columnGap: tokens.spacingHorizontalS,
    minWidth: 0,
    height: "32px",
    padding: `0 ${tokens.spacingHorizontalM}`,
    border: "none",
    borderRight: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke3}`,
    backgroundColor: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    textAlign: "left",
    cursor: "pointer",
    ":hover": { backgroundColor: tokens.colorNeutralBackground2Hover },
  },
  compteCategorie: {
    marginLeft: "auto",
    padding: `0 ${tokens.spacingHorizontalSNudge}`,
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground3,
    fontVariantNumeric: "tabular-nums",
  },
  caseCategorie: { display: "flex", alignItems: "center", padding: `0 ${tokens.spacingHorizontalXXS}` },
  // Catégorie repliée : jauge des chambres prises chaque nuit
  jauge: { display: "block", width: "100%", height: "6px", borderRadius: tokens.borderRadiusCircular, backgroundColor: tokens.colorNeutralBackground4, overflow: "hidden" },
  remplissage: { display: "block", height: "100%", borderRadius: tokens.borderRadiusCircular, backgroundColor: tokens.colorBrandBackground },
  remplissagePlein: { backgroundColor: tokens.colorPaletteRedBorderActive },
  jour: {
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    rowGap: tokens.spacingVerticalXXS,
    padding: `${tokens.spacingVerticalS} 0`,
    color: tokens.colorNeutralForeground3,
  },
  initiale: { fontSize: tokens.fontSizeBase100, lineHeight: tokens.lineHeightBase100, textTransform: "uppercase", letterSpacing: "0.04em" },
  numero: {
    display: "grid",
    placeItems: "center",
    width: "24px",
    height: "24px",
    borderRadius: tokens.borderRadiusCircular,
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    fontVariantNumeric: "tabular-nums",
  },
  numeroAujourdhui: { backgroundColor: tokens.colorBrandBackground, color: tokens.colorNeutralForegroundOnBrand },
  // Case d'une nuit : cliquable si elle est libre (nouvelle réservation préremplie)
  case: { padding: 0, border: "none", backgroundColor: "transparent" },
  confortable: { height: "44px" },
  compacte: { height: "30px" },
  caseLibre: { cursor: "pointer", ":hover": { backgroundColor: tokens.colorSubtleBackgroundHover } },
  weekEnd: { backgroundColor: tokens.colorNeutralBackground2 },
  // Trait discret au début de chaque semaine, repère quand la vue fait plusieurs semaines
  // Colonne d'un jour mise en évidence sur toute la hauteur : survol (léger) ou clic sur l'en-tête (cadre)
  colonneSurvolee: { backgroundColor: tokens.colorSubtleBackgroundHover },
  colonneEpinglee: {
    backgroundColor: tokens.colorBrandBackground2,
    boxShadow: `inset ${tokens.strokeWidthThin} 0 0 ${tokens.colorBrandStroke2}, inset -${tokens.strokeWidthThin} 0 0 ${tokens.colorBrandStroke2}`,
  },
  // Option « Lignes de grille » : trait entre chaque nuit, comme un tableau
  trait: { borderLeft: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}` },
  // Mois qui commence : en couleur de la marque
  nouveauMois: { color: tokens.colorBrandForeground1, fontWeight: tokens.fontWeightSemibold },
  lundi: { boxShadow: `inset ${tokens.strokeWidthThin} 0 0 ${tokens.colorNeutralStroke2}` },
  // Aujourd'hui : trait de la couleur de la marque à gauche de la colonne
  traitAujourdhui: { zIndex: 2, pointerEvents: "none", boxShadow: `inset ${tokens.strokeWidthThick} 0 0 ${tokens.colorBrandStroke1}` },
  // Avec la grille : le trait du lundi, plus foncé, sépare les semaines
  traitLundi: { borderLeft: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}` },
  // Texte d'une barre : coupé par « … » quand la barre est trop courte
  texteBarre: { minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" },
  barre: {
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    // Nom du client ou raison du blocage centré dans la barre
    justifyContent: "center",
    minWidth: 0,
    padding: `0 ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusCircular,
    fontFamily: tokens.fontFamilyBase,
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    border: "none",
    textAlign: "center",
  },
  barre_confortable: { margin: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalXXS}`, fontSize: tokens.fontSizeBase200 },
  barre_compacte: { margin: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXXS}`, fontSize: tokens.fontSizeBase100 },
  // Séjour qui continue hors de la période affichée : bord coupé net de ce côté
  coupeGauche: { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, marginLeft: 0 },
  coupeDroite: { borderTopRightRadius: 0, borderBottomRightRadius: 0, marginRight: 0 },
  // Séjour confirmé à venir : vert pâle cerné d'un filet de la marque (le fond seul se perdait sur la grille,
  // en clair comme en sombre ; le jeton de contour suit le thème)
  confirmee: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    boxShadow: `inset 0 0 0 ${tokens.strokeWidthThin} ${tokens.colorBrandStroke1}`,
    cursor: "pointer",
    ":hover": { backgroundColor: tokens.colorBrandBackground2Hover },
  },
  // Client arrivé (enregistré à la réception) : vert plein
  surPlace: { backgroundColor: tokens.colorBrandBackground, color: tokens.colorNeutralForegroundOnBrand, boxShadow: "none", ":hover": { backgroundColor: tokens.colorBrandBackgroundHover } },
  option: {
    backgroundColor: tokens.colorPaletteMarigoldBackground1,
    color: tokens.colorPaletteMarigoldForeground2,
    boxShadow: `inset 0 0 0 ${tokens.strokeWidthThin} ${tokens.colorPaletteMarigoldBorder2}`,
    cursor: "pointer",
    ":hover": { backgroundColor: tokens.colorPaletteMarigoldBackground2 },
  },
  // Hachures : dates fermées sans réservation du site
  blocage: {
    backgroundImage: `repeating-linear-gradient(135deg, ${tokens.colorNeutralBackground4} 0 5px, ${tokens.colorNeutralBackground2} 5px 10px)`,
    color: tokens.colorNeutralForeground2,
  },
  // Dates d'une plateforme sur une de nos réservations : à régler sans attendre
  conflit: {
    backgroundColor: tokens.colorStatusDangerBackground2,
    color: tokens.colorStatusDangerForeground2,
    boxShadow: `inset 0 0 0 ${tokens.strokeWidthThick} ${tokens.colorStatusDangerBorder2}`,
  },
  legende: {
    display: "flex",
    flexWrap: "wrap",
    rowGap: tokens.spacingVerticalS,
    columnGap: tokens.spacingHorizontalXXL,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground3,
  },
  astuce: { marginLeft: "auto" },
  pastille: {
    display: "inline-block",
    width: tokens.spacingHorizontalXXL,
    height: tokens.spacingVerticalM,
    marginRight: tokens.spacingHorizontalS,
    verticalAlign: "middle",
    borderRadius: tokens.borderRadiusCircular,
  },
  bas: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
    columnGap: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalL,
    alignItems: "start",
    "@media (max-width: 1180px)": { gridTemplateColumns: "minmax(0, 1fr)" },
  },
  formulaire: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", columnGap: tokens.spacingHorizontalL, rowGap: tokens.spacingVerticalL, alignItems: "start" },
  // Listes et calendriers à la largeur de leur colonne (largeur minimale de Fluent sinon)
  champ: { minWidth: 0, width: "100%" },
  pleineLargeur: { gridColumn: "1 / -1" },
  surUneLigne: { whiteSpace: "nowrap" },
  envoi: { justifySelf: "start" },
})
