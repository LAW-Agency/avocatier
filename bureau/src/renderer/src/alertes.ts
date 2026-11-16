import { useCallback, useMemo } from "react"
import { ajouterJours } from "@partage/dates"
import type { Chambre, Reservation } from "@partage/types"
import { doublesReservations, soldeDe, useDonneesChargees, type Donnees } from "./donnees"
import { useReglages } from "./reglages"

// Ce qui demande l'attention de l'équipe, tiré des données chargées (rien n'est stocké) : panneau des
// notifications de la barre de titre (rappels compris), widget « Départs à encaisser » et pastilles de l'écran Aujourd'hui.
// Une alerte disparaît d'elle-même une fois la situation réglée (encaissement, départ enregistré…). Une alerte
// marquée « traitée » sur ce poste (client qui paiera par virement, pourboire laissé, vieux séjour jamais clos…) est
// écartée tant que sa situation ne change pas : la clé porte le montant ou la date, un autre montant la fait revenir
export type Alertes = {
  demandes: Reservation[] // options du site en attente de réponse, la plus proche de l'échéance d'abord
  aEncaisser: Reservation[] // séjours qui se terminent aujourd'hui ou plus tôt avec un reste à payer, les plus récents d'abord
  tropPercus: Reservation[] // plus encaissé que dû (séjour annulé déjà payé, montant baissé…) : à rembourser
  departsOublies: Reservation[] // client arrivé, date de départ passée, départ jamais enregistré
  arriveesOubliees: Reservation[] // séjour commencé (hier ou avant) sans arrivée enregistrée
  doubles: number // nuits vendues deux fois par une plateforme
  rappels: Rappels
  total: number
  traitees: number // alertes actuelles écartées parce que marquées traitées
}

export type TypeAlerte = "encaisser" | "trop" | "depart" | "arrivee" | "navette"

// Clé d'une alerte : son type, le séjour et ce qui la déclenche (reste dû au centime, date)
export function cleAlerte(type: TypeAlerte, r: Reservation, d: Donnees): string {
  const detail = type === "encaisser" || type === "trop" ? String(Math.round(soldeDe(r, d) * 100)) : type === "depart" ? r.depart : r.arrivee
  return `${type}:${r.id}:${detail}`
}

// Petits rappels de la journée, pour ne rien oublier (comptés à part des points à régler) : ménage, en premier les
// chambres qui reçoivent quelqu'un aujourd'hui, et navettes de l'aéroport d'aujourd'hui et demain
export type ChambreAPreparer = { chambre: Chambre; arrivee?: Reservation } // arrivee : client attendu aujourd'hui
export type Rappels = {
  chambres: ChambreAPreparer[] // à nettoyer (ou en maintenance avec une arrivée aujourd'hui), arrivées du jour d'abord
  navettes: Reservation[] // arrivées d'aujourd'hui et demain avec navette demandée, pas encore arrivées
  total: number
}

export function rappelsDe(d: Donnees, traitees: ReadonlySet<string> = new Set()): Rappels {
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
    .filter((r) => !traitees.has(cleAlerte("navette", r, d)))
    .sort((a, b) => a.arrivee.localeCompare(b.arrivee))
  return { chambres, navettes, total: chambres.length + navettes.length }
}

// `traitees` : clés marquées traitées sur ce poste (absent : toutes les alertes, comme pour l'écran Revenus)
export function alertesDe(d: Donnees, traitees: ReadonlySet<string> = new Set()): Alertes {
  let ecartees = 0
  const garder = (type: TypeAlerte) => (r: Reservation) => {
    if (!traitees.has(cleAlerte(type, r, d))) return true
    ecartees++
    return false
  }
  const confirmees = d.reservations.filter((r) => r.statut === "confirmee")
  const demandes = d.reservations.filter((r) => r.statut === "option").sort((a, b) => (a.expireLe ?? "").localeCompare(b.expireLe ?? ""))
  const aEncaisser = confirmees
    .filter((r) => (r.depart <= d.aujourdhui || r.departLe) && soldeDe(r, d) > 0)
    .filter(garder("encaisser"))
    .sort((a, b) => b.depart.localeCompare(a.depart))
  const tropPercus = d.reservations.filter((r) => soldeDe(r, d) < 0).filter(garder("trop")).sort((a, b) => b.arrivee.localeCompare(a.arrivee))
  const departsOublies = confirmees
    .filter((r) => r.arriveeLe && !r.departLe && r.depart < d.aujourdhui)
    .filter(garder("depart"))
    .sort((a, b) => a.depart.localeCompare(b.depart))
  const arriveesOubliees = confirmees
    .filter((r) => !r.arriveeLe && r.arrivee < d.aujourdhui)
    .filter(garder("arrivee"))
    .sort((a, b) => a.arrivee.localeCompare(b.arrivee))
  const doubles = doublesReservations(d).length
  const rappels = rappelsDe(d, traitees)
  ecartees += rappelsDe(d).navettes.length - rappels.navettes.length
  return {
    demandes,
    aEncaisser,
    tropPercus,
    departsOublies,
    arriveesOubliees,
    doubles,
    rappels,
    total: demandes.length + aEncaisser.length + tropPercus.length + departsOublies.length + arriveesOubliees.length + doubles + rappels.total,
    traitees: ecartees,
  }
}

// Alertes de ce poste (sans celles marquées traitées), et marquage : « traiter » écarte une alerte, « retablir »
// fait revenir toutes celles du moment
export function useAlertes() {
  const { d } = useDonneesChargees()
  const { reglages, modifier } = useReglages()
  const traitees = useMemo(() => new Set(reglages.alertesTraitees), [reglages.alertesTraitees])
  const alertes = useMemo(() => alertesDe(d, traitees), [d, traitees])
  const traiter = useCallback(
    (type: TypeAlerte, r: Reservation) => modifier({ alertesTraitees: [...reglages.alertesTraitees, cleAlerte(type, r, d)] }),
    [modifier, reglages.alertesTraitees, d],
  )
  const retablir = useCallback(() => modifier({ alertesTraitees: [] }), [modifier])
  return { alertes, traiter, retablir }
}
