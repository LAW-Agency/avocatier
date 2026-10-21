import { makeStyles, tokens } from "@fluentui/react-components"

export const useLogotypeStyles = makeStyles({
  // Logo blanc du site utilisé comme masque : il prend la couleur voulue ; logo en couleurs en image de fond
  root: {
    display: "block",
    flexShrink: 0,
    maskRepeat: "no-repeat",
    maskSize: "contain",
    maskPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    backgroundPosition: "center",
  },
  marque: { backgroundColor: tokens.colorBrandForeground1 },
  texte: { backgroundColor: tokens.colorNeutralForeground1 },
  inverse: { backgroundColor: tokens.colorNeutralForegroundInverted },
})
