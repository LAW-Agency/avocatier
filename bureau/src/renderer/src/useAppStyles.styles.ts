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
})
