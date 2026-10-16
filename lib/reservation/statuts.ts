import type { DateISO, Reservation } from "./types"

// Statut tel que le client le lit dans « Mon compte »
export type StatutAffiche = {
  label: string
  description: string
  ton: "attente" | "ok" | "neutre" | "alerte"
}

export function statutAffiche(reservation: Reservation, aujourdhui: DateISO): StatutAffiche {
  switch (reservation.statut) {
    case "option":
      return {
        label: "Demande reçue",
        description:
          "Vos dates sont bloquées 48 h. Joëlle & Stéphane reviennent vers vous pour confirmer le séjour et vous indiquer les modalités d'acompte.",
        ton: "attente",
      }
    case "confirmee":
      if (reservation.depart <= aujourdhui) {
        return { label: "Séjour terminé", description: "Merci d'avoir séjourné Chez L'Avocatier.", ton: "neutre" }
      }
      if (reservation.arrivee <= aujourdhui) {
        return { label: "Séjour en cours", description: "Bon séjour à Vohilava !", ton: "ok" }
      }
      return {
        label: "Confirmée",
        description: "Votre séjour est confirmé. Les informations pratiques vous seront envoyées une semaine avant l'arrivée.",
        ton: "ok",
      }
    case "annulee":
      return { label: "Annulée", description: "Cette réservation a été annulée.", ton: "neutre" }
    case "refusee":
      return {
        label: "Non disponible",
        description: "Les hôtes n'ont pas pu accepter cette demande. N'hésitez pas à choisir d'autres dates.",
        ton: "alerte",
      }
    case "expiree":
      return {
        label: "Expirée",
        description: "L'option de 48 h est arrivée à échéance. Vous pouvez refaire une demande.",
        ton: "neutre",
      }
  }
}

// Libellés courts de l'historique
export const libelleEvenement: Record<Reservation["statut"], string> = {
  option: "Demande envoyée",
  confirmee: "Réservation confirmée par les hôtes",
  annulee: "Réservation annulée",
  refusee: "Demande déclinée par les hôtes",
  expiree: "Option expirée",
}

// Libellés côté hôtes : une demande en option est une demande « à traiter »
export const libelleStatutHote: Record<Reservation["statut"], string> = {
  option: "À traiter",
  confirmee: "Confirmée",
  annulee: "Annulée",
  refusee: "Refusée",
  expiree: "Expirée",
}
