import { makeStyles, tokens } from "@fluentui/react-components"

export const useEnTeteStyles = makeStyles({
  root: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", columnGap: tokens.spacingHorizontalL, rowGap: tokens.spacingVerticalM, flexWrap: "wrap" },
  texte: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXS, minWidth: 0 },
  titre: { margin: 0 },
  description: { color: tokens.colorNeutralForeground2 },
  actions: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalS, flexWrap: "wrap" },
})

export const useCarteStyles = makeStyles({
  // Surface des blocs d'un écran (cartes de Windows 11) : fond 1 et bord discret, sans ombre
  root: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalXL,
    borderRadius: tokens.borderRadiusXLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    minWidth: 0,
  },
  entete: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", columnGap: tokens.spacingHorizontalM },
  texte: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXXS, minWidth: 0 },
  titre: { margin: 0 },
  description: { color: tokens.colorNeutralForeground3 },
  // Action (bouton, badge) centrée sur la première ligne du titre, quelle que soit sa hauteur, sans retour à la ligne
  action: { flexShrink: 0, whiteSpace: "nowrap", height: tokens.lineHeightBase400, display: "flex", alignItems: "center" },
})

export const useVideStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    rowGap: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalXXXL} ${tokens.spacingHorizontalXXL}`,
    textAlign: "center",
    borderRadius: tokens.borderRadiusLarge,
    border: `${tokens.strokeWidthThin} dashed ${tokens.colorNeutralStroke1}`,
    color: tokens.colorNeutralForeground3,
  },
  icone: { fontSize: tokens.fontSizeHero800, color: tokens.colorBrandForeground1, marginBottom: tokens.spacingVerticalXS },
  titre: { color: tokens.colorNeutralForeground1 },
})

// Chargement : emblème de l'avocat en squelette, parcouru d'une vague aux couleurs du Skeleton de Fluent (immobile si
// mouvement réduit)
export const useChargementStyles = makeStyles({
  root: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", rowGap: tokens.spacingVerticalXXL },
  // Écran entier (premier chargement, changement d'écran) ou bloc dans un écran (journal…)
  grand: { height: "100%" },
  moyen: { padding: `${tokens.spacingVerticalXXXL} 0`, rowGap: tokens.spacingVerticalL },
  embleme: {
    display: "block",
    aspectRatio: "824 / 973",
    maskRepeat: "no-repeat",
    maskSize: "contain",
    maskPosition: "center",
    backgroundColor: tokens.colorNeutralStencil1,
    backgroundImage: `linear-gradient(to right, ${tokens.colorNeutralStencil1} 0%, ${tokens.colorNeutralStencil2} 50%, ${tokens.colorNeutralStencil1} 100%)`,
    backgroundSize: "300% 100%",
    backgroundRepeat: "no-repeat",
    animationName: { from: { backgroundPositionX: "300%" }, to: { backgroundPositionX: "0%" } },
    animationDuration: "1.6s",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
    "@media (prefers-reduced-motion: reduce)": { animationName: "none" },
  },
  emblemeGrand: { height: "min(320px, 50vh)" },
  emblemeMoyen: { height: "min(140px, 25vh)" },
  texte: { color: tokens.colorNeutralForeground3 },
})

// Apparition d'un écran ou d'une liste (changement de rubrique, d'onglet) : fondu et léger glissement vers le haut
export const useApparitionStyles = makeStyles({
  root: {
    animationName: { from: { opacity: 0, transform: "translateY(6px)" }, to: { opacity: 1, transform: "none" } },
    animationDuration: tokens.durationNormal,
    animationTimingFunction: tokens.curveDecelerateMid,
    "@media (prefers-reduced-motion: reduce)": { animationName: "none" },
  },
})

// Suite d'une longue liste, sous le tableau
export const useAfficherPlusStyles = makeStyles({
  root: { display: "flex", alignItems: "center", justifyContent: "center", columnGap: tokens.spacingHorizontalM, paddingTop: tokens.spacingVerticalM },
  compte: { color: tokens.colorNeutralForeground3 },
})

export const useCadreTableStyles = makeStyles({
  // Tableau posé sur une carte : coins arrondis, en-tête teinté. « clip » plutôt que « hidden » : coupe les coins
  // sans créer de zone de défilement, l'en-tête reste donc collé en haut quand l'écran défile
  root: {
    borderRadius: tokens.borderRadiusXLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    overflowX: "clip",
    overflowY: "clip",
  },
  // Long tableau dans une carte voisine d'autres blocs : défilement dans le cadre, en-tête collé tout en haut du cadre
  defile: {
    maxHeight: "min(560px, 60vh)",
    overflowX: "hidden",
    overflowY: "auto",
    "& > table > thead": { top: 0 },
  },
  // En-tête collé sous la bande de 24 px qui masque le haut de la zone de défilement (voir `masqueHaut`, coquille)
  entete: { position: "sticky", top: tokens.spacingVerticalXXL, zIndex: 1, backgroundColor: tokens.colorNeutralBackground3 },
  premiere: { paddingLeft: tokens.spacingHorizontalL },
  derniere: { paddingRight: tokens.spacingHorizontalL },
  nombre: { fontVariantNumeric: "tabular-nums" },
  droite: { display: "flex", justifyContent: "flex-end", width: "100%" },
  secondaire: { color: tokens.colorNeutralForeground3 },
})
