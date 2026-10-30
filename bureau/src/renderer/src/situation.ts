import type { Donnees } from "./donnees"

// Arrivées, départs, chambres occupées (ou bloquées) et chambres libres la nuit du jour donné, sur les chambres en
// vente : partagé par l'écran Aujourd'hui et la navigation (ouverte ou réduite). Un client parti plus tôt que prévu (départ
// enregistré à la réception) libère la chambre.
export function situationDuJour({ reservations, chambres, blocages }: Donnees, jour: string) {
  const confirmees = reservations.filter((r) => r.statut === "confirmee")
  const enVente = new Set(chambres.filter((c) => c.active).map((c) => c.id))
  const occupees = new Set(
    [
      ...reservations
        .filter((r) => (r.statut === "option" || r.statut === "confirmee") && !r.departLe && r.arrivee <= jour && r.depart > jour)
        .map((r) => r.chambreId),
      ...blocages.filter((b) => b.debut <= jour && b.fin > jour).map((b) => b.chambreId),
    ].filter((id) => enVente.has(id)),
  )
  return {
    arrivees: confirmees.filter((r) => r.arrivee === jour),
    departs: confirmees.filter((r) => r.depart === jour),
    occupes: occupees.size,
    total: enVente.size,
    libres: chambres.filter((c) => c.active && !occupees.has(c.id)).sort((a, b) => a.numero.localeCompare(b.numero, "fr", { numeric: true })),
  }
}
