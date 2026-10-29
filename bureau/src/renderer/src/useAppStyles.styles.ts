import { makeStaticStyles, tokens } from "@fluentui/react-components"


// Barres de défilement fines et arrondies, à la manière de Windows 11 : piste invisible, poignée grise qui
// fonce au survol, sans flèches ; marge en haut et en bas pour ne pas mordre sur les coins arrondis du panneau
export const useBarresDeDefilement = makeStaticStyles({
  "::-webkit-scrollbar": { width: "10px", height: "10px" },
  "::-webkit-scrollbar-track": { backgroundColor: "transparent", margin: tokens.spacingVerticalS },
  "::-webkit-scrollbar-thumb": {
    backgroundColor: tokens.colorNeutralStroke1,
    borderRadius: tokens.borderRadiusCircular,
    // Bord transparent : poignée de 4 px dans une zone de 10 px, plus facile à attraper
    border: "3px solid transparent",
    backgroundClip: "padding-box",
  },
  "::-webkit-scrollbar-thumb:hover": { backgroundColor: tokens.colorNeutralStroke1Hover, borderWidth: "2px" },
  "::-webkit-scrollbar-button": { display: "none" },
  "::-webkit-scrollbar-corner": { backgroundColor: "transparent" },
})

// Fenêtres (Dialog) jamais plus hautes que la fenêtre du logiciel : marge en haut (barre de titre) et en bas ;
// le titre et les boutons restent visibles, seul le contenu défile
const MARGE_FENETRE = "48px"
export const useFenetresLimitees = makeStaticStyles({
  ".fui-DialogSurface": { maxHeight: `calc(100dvh - 2 * ${MARGE_FENETRE})` },
  ".fui-DialogBody": { maxHeight: `calc(100dvh - 2 * ${MARGE_FENETRE} - 2 * 24px)` },
  ".fui-DialogContent": { minHeight: 0 },
  // Fluent cantonne les boutons à la moitié droite de la fenêtre (colonnes 2 à 4) : leurs libellés passaient
  // sur plusieurs lignes. Toute la largeur, libellés sur une ligne, et s'il manque vraiment de place c'est le
  // bouton entier qui passe à la ligne. Deux classes pour l'emporter sur les classes atomiques de Fluent.
  ".fui-DialogBody > .fui-DialogActions": { gridColumnStart: 1, flexWrap: "wrap" },
  ".fui-DialogActions .fui-Button, .fui-DialogActions .fui-MenuButton, .fui-DialogActions .fui-SplitButton": {
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
})
