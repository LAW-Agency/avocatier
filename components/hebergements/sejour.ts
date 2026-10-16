import { BugOff, LampDesk, Bath, Tv, Vault, Wifi, type LucideIcon } from "lucide-react"
import type { Equipement, Saison } from "@/lib/reservation/types"

// Libellés et icônes des équipements d'un hébergement
export const equipements: Record<Equipement, { label: string; icon: LucideIcon }> = {
  wifi: { label: "Wi-Fi", icon: Wifi },
  "coffre-fort": { label: "Coffre-fort", icon: Vault },
  bureau: { label: "Coin bureau", icon: LampDesk },
  moustiquaire: { label: "Lit à moustiquaire", icon: BugOff },
  television: { label: "Télévision", icon: Tv },
  linge: { label: "Linge de lit et de toilette", icon: Bath },
}

// TODO client : horaires d'arrivée et de départ absents du cahier des charges — valeurs provisoires
export const HORAIRES = { arrivee: "À partir de 14 h", depart: "Avant 11 h" }

// Conditions communes à tous les hébergements. Séjours minimums tirés des saisons du moteur de réservation.
export function conditionsSejour(saisons: Saison[]): { label: string; valeur: string }[] {
  const minimums = new Map<string, number>()
  for (const s of saisons) if (s.sejourMin > 1) minimums.set(s.nom, s.sejourMin)

  return [
    { label: "Arrivée", valeur: HORAIRES.arrivee },
    { label: "Départ", valeur: HORAIRES.depart },
    ...[...minimums].map(([nom, nuits]) => ({ label: nom, valeur: `${nuits} nuits minimum` })),
    {
      label: "Réservation",
      valeur: "Demande en ligne : vos dates vous sont réservées 48 h, le temps que Joëlle et Stéphane confirment votre séjour",
    },
    { label: "Navette aéroport", valeur: "Sur demande, avec supplément" },
  ]
}
