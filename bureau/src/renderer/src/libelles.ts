import type { EtatChambre, ModePaiement, Plateforme, Reservation } from "@partage/types"
import type { RoleEquipe } from "../../partage/ipc"

// Libellés affichés par le logiciel (les valeurs viennent de la base, voir lib/reservation/types.ts)

// Provenance d'une demande, à la suite de « reçue le 16 oct., 03:30 »
export const SOURCES: Record<Reservation["source"], string> = {
  site: "sur le site",
  booking: "via Booking.com",
  airbnb: "via Airbnb",
  telephone: "par téléphone",
  whatsapp: "par WhatsApp",
  sur_place: "à la réception",
}

// Même chose, en titre (listes, statistiques)
export const NOMS_SOURCES: Record<Reservation["source"], string> = {
  site: "Site internet",
  booking: "Booking.com",
  airbnb: "Airbnb",
  telephone: "Téléphone",
  whatsapp: "WhatsApp",
  sur_place: "Sur place",
}

// Provenance en clair dans la liste et la fiche : demande du site, ou réservation saisie à la main par l'équipe
// (Booking.com et Airbnb compris : leurs calendriers importés ne deviennent que des dates bloquées)
export const provenance = (source: Reservation["source"]) => (source === "site" ? "Site internet" : `Saisie manuelle · ${NOMS_SOURCES[source]}`)

// Plateformes dont on importe le calendrier
export const PLATEFORMES: Record<Plateforme, string> = {
  booking: "Booking.com",
  airbnb: "Airbnb",
  autre: "Autre plateforme",
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
