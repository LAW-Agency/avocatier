import type { EtatChambre, ModePaiement, Reservation } from "@partage/types"
import type { RoleEquipe } from "../../partage/ipc"

// Libellés affichés par le logiciel (les valeurs viennent de la base, voir lib/reservation/types.ts)

// Provenance d'une demande, à la suite de « reçue le 16 oct., 03:30 »
export const SOURCES: Record<Reservation["source"], string> = {
  site: "sur le site",
  booking: "via Booking.com",
  telephone: "par téléphone",
  whatsapp: "par WhatsApp",
  sur_place: "à la réception",
}

// Même chose, en titre (listes, statistiques)
export const NOMS_SOURCES: Record<Reservation["source"], string> = {
  site: "Site internet",
  booking: "Booking.com",
  telephone: "Téléphone",
  whatsapp: "WhatsApp",
  sur_place: "Sur place",
}

export const MODES_PAIEMENT: Record<ModePaiement, string> = {
  especes: "Espèces",
  carte: "Carte bancaire",
  mobile_money: "Mobile money",
  virement: "Virement",
  autre: "Autre",
}

export const ETATS_CHAMBRE: Record<EtatChambre, string> = {
  propre: "Propre",
  a_nettoyer: "À nettoyer",
  maintenance: "En maintenance",
}

export const ROLES: Record<RoleEquipe, string> = {
  hote: "Gérant",
  reception: "Réception",
}
