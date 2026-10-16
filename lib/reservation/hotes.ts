import { comptes, moteur } from "@/lib/reservation"
import type { Reservation } from "./types"

// Données de l'espace hôtes, chargées en une fois (code serveur, après exigerHote)
export async function donneesHotes() {
  const [reservations, clients, hebergements, blocages] = await Promise.all([
    moteur.toutesLesReservations(),
    comptes.listerClients(),
    moteur.listerHebergements(),
    moteur.listerBlocages(),
  ])
  return {
    reservations,
    clients,
    hebergements,
    blocages,
    clientDe: (r: Reservation) => clients.find((c) => c.id === r.clientId),
    hebergementDe: (r: Reservation) => hebergements.find((h) => h.id === r.hebergementId),
  }
}

export type DonneesHotes = Awaited<ReturnType<typeof donneesHotes>>
