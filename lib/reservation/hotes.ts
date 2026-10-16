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

// Arrivées, départs et hébergements occupés (ou bloqués) la nuit du jour donné :
// partagé par le tableau du jour et la barre latérale
export function situationDuJour({ reservations, hebergements, blocages }: DonneesHotes, jour: string) {
  const confirmees = reservations.filter((r) => r.statut === "confirmee")
  const occupes = new Set([
    ...reservations
      .filter((r) => (r.statut === "option" || r.statut === "confirmee") && r.arrivee <= jour && r.depart > jour)
      .map((r) => r.hebergementId),
    ...blocages.filter((b) => b.debut <= jour && b.fin > jour).map((b) => b.hebergementId),
  ])
  return {
    arrivees: confirmees.filter((r) => r.arrivee === jour),
    departs: confirmees.filter((r) => r.depart === jour),
    occupes: occupes.size,
    total: hebergements.length,
  }
}
