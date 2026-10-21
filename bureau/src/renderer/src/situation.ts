import type { Donnees } from "./donnees"

// Arrivées, départs et hébergements occupés (ou bloqués) la nuit du jour donné :
// partagé par l'écran Aujourd'hui et le bas de la navigation. Un client parti plus tôt que prévu (départ
// enregistré à la réception) libère la chambre.
export function situationDuJour({ reservations, hebergements, blocages }: Donnees, jour: string) {
  const confirmees = reservations.filter((r) => r.statut === "confirmee")
  const occupes = new Set([
    ...reservations
      .filter((r) => (r.statut === "option" || r.statut === "confirmee") && !r.departLe && r.arrivee <= jour && r.depart > jour)
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
