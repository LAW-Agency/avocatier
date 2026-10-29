import {
  CalculatorRegular,
  DataBarVerticalRegular,
  DocumentTextRegular,
  FoodRegular,
  SparkleRegular,
  type FluentIcon,
} from "@fluentui/react-icons"
import type { RoleEquipe } from "../../partage/ipc"

// Nouveautés présentées par la fenêtre de bienvenue (composants/FenetreBienvenue.tsx), une fois par version.
// À chaque publication : ajouter la version en tête (une version sans entrée n'ouvre pas la fenêtre après
// une mise à jour ; au premier lancement, la plus récente est présentée)
export type Nouveaute = {
  titre: string
  texte: string
  Icone: FluentIcon
  pour?: RoleEquipe[] // rôles concernés ; absent : toute l'équipe
}

export const NOUVEAUTES: { version: string; liste: Nouveaute[] }[] = [
  {
    version: "1.2.0",
    liste: [
      {
        titre: "Caisse Restaurant et Bar",
        texte: "Ventes au comptoir, ticket 80 mm imprimé, paiement en ariary, euros ou autre devise.",
        Icone: FoodRegular,
      },
      {
        titre: "Ouverture et clôture de caisse",
        texte: "Fond de caisse, espèces attendues, écart commenté et rapport de clôture.",
        Icone: CalculatorRegular,
      },
      {
        titre: "Note du séjour complète",
        texte: "Les consommations mises sur la chambre s'ajoutent à la facture du départ.",
        Icone: DocumentTextRegular,
        pour: ["hote", "reception"],
      },
      {
        titre: "Vue d'ensemble pour les gérants",
        texte: "Ventes par jour, poste, caissier et article.",
        Icone: DataBarVerticalRegular,
        pour: ["hote"],
      },
      {
        titre: "Nouvel écran de lancement",
        texte: "Ouverture animée et visite guidée enrichie de la caisse.",
        Icone: SparkleRegular,
      },
    ],
  },
]
