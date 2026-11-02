import {
  CalculatorRegular,
  DataBarVerticalRegular,
  DocumentDismissRegular,
  DocumentTextRegular,
  FoodRegular,
  HistoryRegular,
  LockClosedRegular,
  ReceiptRegular,
  ShieldCheckmarkRegular,
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
    version: "1.2.2",
    liste: [
      {
        titre: "Annuler une facture par un avoir",
        texte: "Un séjour à corriger après sa facture ? Annulez-la par un avoir numéroté, modifiez le séjour, puis facturez de nouveau.",
        Icone: DocumentDismissRegular,
        pour: ["hote"],
      },
      {
        titre: "Carte protégée",
        texte: "Les prix de la carte se modifient par les gérants ; chacun peut retirer un article épuisé. Chaque vente reprend le prix de la carte.",
        Icone: FoodRegular,
      },
      {
        titre: "Séjours plus sûrs",
        texte: "Un client arrivé ne s'annule plus, une chambre encore occupée refuse une nouvelle arrivée, et les remises sont réservées aux gérants.",
        Icone: ShieldCheckmarkRegular,
        pour: ["hote", "reception"],
      },
      {
        titre: "Connexion renforcée",
        texte: "La déconnexion ferme vraiment la session, et les essais de mot de passe répétés sont bloqués un quart d'heure.",
        Icone: LockClosedRegular,
      },
    ],
  },
  {
    version: "1.2.1",
    liste: [
      {
        titre: "Chronologie des séjours et des clients",
        texte: "Demande, décisions, arrivée, départ, encaissements, consommations et facture, dans l'ordre et horodatés.",
        Icone: HistoryRegular,
        pour: ["hote", "reception"],
      },
      {
        titre: "Consommations sur la fiche du séjour",
        texte: "Tickets du restaurant et du bar mis sur la chambre, avec le point de vente et le caissier.",
        Icone: ReceiptRegular,
        pour: ["hote", "reception"],
      },
    ],
  },
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
