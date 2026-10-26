import { makeStyles, tokens } from "@fluentui/react-components"

export const useCoquilleStyles = makeStyles({
  coquille: { height: "100%", display: "flex", flexDirection: "column" },
  recherche: { width: "100%", maxWidth: "none" },
  horsLigne: { marginRight: tokens.spacingHorizontalXS },
  corps: { flex: 1, minHeight: 0, display: "flex" },
  // Navigation sur le Mica, sans fond propre (comme les Paramètres de Windows 11)
  nav: { backgroundColor: "transparent", borderRightStyle: "none" },
  lienNav: { backgroundColor: "transparent", ":hover": { backgroundColor: tokens.colorSubtleBackgroundHover } },
  lienNavActif: { backgroundColor: tokens.colorSubtleBackgroundSelected },
  // Icônes de la navigation à 20 px (taille de Windows 11), plus lisibles que la taille par défaut
  iconeNav: { fontSize: tokens.fontSizeBase500, width: tokens.fontSizeBase500, height: tokens.fontSizeBase500 },
  libelleNav: { flex: 1 },
  // Compteur (16 px) et point (6 px) centrés dans le même emplacement : ils tombent sur le même axe
  pastilleNav: { width: "20px", flexShrink: 0, display: "flex", justifyContent: "center", marginRight: tokens.spacingHorizontalXS },
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
