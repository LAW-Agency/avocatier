import { ajouterJours } from "@partage/dates"
import type { Chambre, Reservation } from "@partage/types"
import { doublesReservations, soldeDe, type Donnees } from "./donnees"

// Ce qui demande l'attention de l'équipe, tiré des données chargées (rien n'est stocké) : panneau des
// notifications de la barre de titre (rappels compris), widget « Départs à encaisser » et pastilles de l'écran Aujourd'hui.
// Une alerte disparaît d'elle-même une fois la situation réglée (encaissement, départ enregistré…)
export type Alertes = {
  demandes: Reservation[] // options du site en attente de réponse, la plus proche de l'échéance d'abord
  aEncaisser: Reservation[] // séjours qui se terminent aujourd'hui ou plus tôt avec un reste à payer, les plus récents d'abord
  tropPercus: Reservation[] // plus encaissé que dû (séjour annulé déjà payé, montant baissé…) : à rembourser
  departsOublies: Reservation[] // client arrivé, date de départ passée, départ jamais enregistré
  arriveesOubliees: Reservation[] // séjour commencé (hier ou avant) sans arrivée enregistrée
  doubles: number // nuits vendues deux fois par une plateforme
  rappels: Rappels
  total: number
}

// Petits rappels de la journée, pour ne rien oublier (comptés à part des points à régler) : ménage, en premier les
// chambres qui reçoivent quelqu'un aujourd'hui, et navettes de l'aéroport d'aujourd'hui et demain
export type ChambreAPreparer = { chambre: Chambre; arrivee?: Reservation } // arrivee : client attendu aujourd'hui
export type Rappels = {
  chambres: ChambreAPreparer[] // à nettoyer (ou en maintenance avec une arrivée aujourd'hui), arrivées du jour d'abord
  navettes: Reservation[] // arrivées d'aujourd'hui et demain avec navette demandée, pas encore arrivées
  total: number
}

export function rappelsDe(d: Donnees): Rappels {
  const arriveeDuJour = (c: Chambre) =>
    d.reservations.find((r) => r.chambreId === c.id && (r.statut === "confirmee" || r.statut === "option") && r.arrivee === d.aujourdhui && !r.arriveeLe)
  const chambres = d.chambres
    .filter((c) => c.active && c.etat !== "propre")
    .map((c) => ({ chambre: c, arrivee: arriveeDuJour(c) }))
    .filter((x) => x.chambre.etat === "a_nettoyer" || x.arrivee)
    .sort((a, b) => Number(Boolean(b.arrivee)) - Number(Boolean(a.arrivee)) || a.chambre.numero.localeCompare(b.chambre.numero, "fr", { numeric: true }))
  const demain = ajouterJours(d.aujourdhui, 1)
  const navettes = d.reservations
    .filter((r) => r.statut === "confirmee" && r.navette && !r.arriveeLe && (r.arrivee === d.aujourdhui || r.arrivee === demain))
    .sort((a, b) => a.arrivee.localeCompare(b.arrivee))
  return { chambres, navettes, total: chambres.length + navettes.length }
}

export function alertesDe(d: Donnees): Alertes {
  const confirmees = d.reservations.filter((r) => r.statut === "confirmee")
  const demandes = d.reservations.filter((r) => r.statut === "option").sort((a, b) => (a.expireLe ?? "").localeCompare(b.expireLe ?? ""))
  const aEncaisser = confirmees
    .filter((r) => (r.depart <= d.aujourdhui || r.departLe) && soldeDe(r, d) > 0)
    .sort((a, b) => b.depart.localeCompare(a.depart))
  const tropPercus = d.reservations.filter((r) => soldeDe(r, d) < 0).sort((a, b) => b.arrivee.localeCompare(a.arrivee))
  const departsOublies = confirmees.filter((r) => r.arriveeLe && !r.departLe && r.depart < d.aujourdhui).sort((a, b) => a.depart.localeCompare(b.depart))
  const arriveesOubliees = confirmees.filter((r) => !r.arriveeLe && r.arrivee < d.aujourdhui).sort((a, b) => a.arrivee.localeCompare(b.arrivee))
  const doubles = doublesReservations(d).length
  const rappels = rappelsDe(d)
  return {
    demandes,
    aEncaisser,
    tropPercus,
    departsOublies,
    arriveesOubliees,
    doubles,
    rappels,
    total: demandes.length + aEncaisser.length + tropPercus.length + departsOublies.length + arriveesOubliees.length + doubles + rappels.total,
  }
}
