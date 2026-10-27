import type { Reservation } from "@partage/types"
import { doublesReservations, soldeDe, type Donnees } from "./donnees"

// Ce qui demande l'attention de l'équipe, tiré des données chargées (rien n'est stocké) : panneau des
// notifications de la barre de titre, widget « Départs à encaisser » et pastilles de l'écran Aujourd'hui.
// Une alerte disparaît d'elle-même une fois la situation réglée (encaissement, départ enregistré…)
export type Alertes = {
  demandes: Reservation[] // options du site en attente de réponse, la plus proche de l'échéance d'abord
  aEncaisser: Reservation[] // séjours qui se terminent aujourd'hui ou plus tôt avec un reste à payer, les plus récents d'abord
  tropPercus: Reservation[] // plus encaissé que dû (séjour annulé déjà payé, montant baissé…) : à rembourser
  departsOublies: Reservation[] // client arrivé, date de départ passée, départ jamais enregistré
  arriveesOubliees: Reservation[] // séjour commencé (hier ou avant) sans arrivée enregistrée
  doubles: number // nuits vendues deux fois par une plateforme
  total: number
}

export function alertesDe(d: Donnees): Alertes {
  const confirmees = d.reservations.filter((r) => r.statut === "confirmee")
  const demandes = d.reservations.filter((r) => r.statut === "option").sort((a, b) => (a.expireLe ?? "").localeCompare(b.expireLe ?? ""))
  const aEncaisser = confirmees
    .filter((r) => (r.depart <= d.aujourdhui || r.departLe) && soldeDe(r, d.paiements) > 0)
    .sort((a, b) => b.depart.localeCompare(a.depart))
  const tropPercus = d.reservations.filter((r) => soldeDe(r, d.paiements) < 0).sort((a, b) => b.arrivee.localeCompare(a.arrivee))
  const departsOublies = confirmees.filter((r) => r.arriveeLe && !r.departLe && r.depart < d.aujourdhui).sort((a, b) => a.depart.localeCompare(b.depart))
  const arriveesOubliees = confirmees.filter((r) => !r.arriveeLe && r.arrivee < d.aujourdhui).sort((a, b) => a.arrivee.localeCompare(b.arrivee))
  const doubles = doublesReservations(d).length
  return {
    demandes,
    aEncaisser,
    tropPercus,
    departsOublies,
    arriveesOubliees,
    doubles,
    total: demandes.length + aEncaisser.length + tropPercus.length + departsOublies.length + arriveesOubliees.length + doubles,
  }
}
