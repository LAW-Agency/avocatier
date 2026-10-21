import { makeStyles, tokens } from "@fluentui/react-components"

// Hauteur de la barre de titre de Windows 11 avec recherche (Explorateur, Outlook)
export const HAUTEUR_BARRE = "48px"

export const useBarreTitreStyles = makeStyles({
  // Trois colonnes égales sur les côtés : la recherche reste au centre exact de la fenêtre.
  // Toute la barre déplace la fenêtre (double-clic : agrandir), sauf les éléments interactifs
  root: {
    height: HAUTEUR_BARRE,
    flexShrink: 0,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 560px) minmax(0, 1fr)",
    alignItems: "center",
    columnGap: tokens.spacingHorizontalL,
    paddingLeft: tokens.spacingHorizontalL,
    WebkitAppRegion: "drag",
    userSelect: "none",
  } as never,
  titre: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalMNudge, minWidth: 0 },
  centre: { WebkitAppRegion: "no-drag" } as never,
  droite: { height: "100%", display: "flex", alignItems: "center", justifyContent: "flex-end", columnGap: tokens.spacingHorizontalXS },
  actions: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalXS, paddingRight: tokens.spacingHorizontalS, WebkitAppRegion: "no-drag" } as never,
})

export const useBoutonsFenetreStyles = makeStyles({
  root: { height: "100%", display: "flex", WebkitAppRegion: "no-drag" } as never,
  // Boutons de légende de Windows 11 : 46 px de large, glyphes de la police d'icônes du système
  bouton: {
    width: "46px",
    height: "100%",
    display: "grid",
    placeItems: "center",
    border: "none",
    padding: 0,
    backgroundColor: "transparent",
    color: tokens.colorNeutralForeground1,
    fontFamily: '"Segoe Fluent Icons", "Segoe MDL2 Assets"',
    fontSize: tokens.fontSizeBase200,
    cursor: "default",
    transitionProperty: "background-color, color",
    transitionDuration: tokens.durationFaster,
    ":hover": { backgroundColor: tokens.colorSubtleBackgroundHover },
    ":active": { backgroundColor: tokens.colorSubtleBackgroundPressed, color: tokens.colorNeutralForeground2 },
    ":focus-visible": { outline: `${tokens.strokeWidthThick} solid ${tokens.colorStrokeFocus2}`, outlineOffset: `-${tokens.strokeWidthThick}` },
  },
  fermer: {
    ":hover": { backgroundColor: tokens.colorPaletteRedBackground3, color: tokens.colorNeutralForegroundOnBrand },
    ":active": { backgroundColor: tokens.colorPaletteRedForeground1, color: tokens.colorNeutralForegroundOnBrand },
  },
})
