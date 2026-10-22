import { formaterPlage } from "../../../lib/reservation/dates"
import type { ActiviteReservation, FilActivite } from "../../../lib/reservation/types"
import type { Annonce } from "../partage/ipc"
import { appeler } from "./api"

// Suivi en direct : interrogation de l'API toutes les 15 s (pas de WebSocket ni LISTEN/NOTIFY, incompatibles
// avec le pooler Neon et les fonctions Vercel). Fait dans le processus principal : il continue fenêtre
// réduite ou fermée dans la zone de notification, sans le ralentissement des pages en arrière-plan.
const INTERVALLE_MS = 15_000
// Calendriers des plateformes (Booking.com, Airbnb…) : importés toutes les 10 minutes tant que le logiciel tourne
const INTERVALLE_CALENDRIERS_MS = 10 * 60_000

// Seuls les événements venus des clients (ou de l'échéance) sont annoncés : les décisions et les modifications
// des hôtes (événements avec une note) rechargent les données sans notification
function annonce(e: ActiviteReservation): Annonce | null {
  const id = `${e.reservationId}-${e.le}`
  const detail = `${e.client} · ${e.hebergement}, ${formaterPlage(e.arrivee, e.depart)}`
  switch (e.statut) {
    case "option":
      return e.note ? null : { id, titre: "Nouvelle demande de réservation", detail, vers: { page: "reservations", filtre: "option" } }
    case "annulee":
      return e.note === "Annulée par le client" ? { id, titre: "Demande annulée par le client", detail, vers: { page: "reservations", filtre: "annulee" } } : null
    case "expiree":
      return { id, titre: "Option expirée sans réponse", detail, vers: { page: "reservations", filtre: "expiree" } }
    default:
      return null
  }
}

type Synchronisation = { changements: number; annonces: { titre: string; detail: string; conflit: boolean }[] }

let minuterie: ReturnType<typeof setTimeout> | undefined
let minuterieCalendriers: ReturnType<typeof setTimeout> | undefined
let curseur: { curseur: string; total: number } | null = null
let actif = false
let enCours = false

// `changement` : appelé à chaque nouvel événement (même sans annonce), pour recharger les données
export function demarrerSuivi(changement: (annonces: Annonce[]) => void) {
  arreterSuivi()
  actif = true

  async function verifier() {
    if (!actif || enCours) return
    enCours = true
    clearTimeout(minuterie)
    try {
      const depuis = curseur ? `?depuis=${encodeURIComponent(curseur.curseur)}` : ""
      const resultat = await appeler<FilActivite>("GET", `/api/hotes/activite${depuis}`)
      if (!resultat.ok) return // réseau coupé : nouvel essai au prochain tour
      const fil = resultat.donnees
      const precedent = curseur
      curseur = { curseur: fil.curseur, total: fil.total }
      if (!precedent || (precedent.curseur === fil.curseur && precedent.total === fil.total)) return
      changement(fil.evenements.flatMap((e) => annonce(e) ?? []))
    } finally {
      enCours = false
      if (actif) minuterie = setTimeout(verifier, INTERVALLE_MS)
    }
  }

  // Le serveur n'importe que les calendriers vus il y a plus de 10 minutes : plusieurs postes ouverts ne
  // multiplient pas les téléchargements
  async function synchroniserCalendriers() {
    if (!actif) return
    clearTimeout(minuterieCalendriers)
    try {
      const resultat = await appeler<Synchronisation>("POST", "/api/hotes/calendriers/synchroniser", {})
      if (!resultat.ok || resultat.donnees.changements === 0) return
      const instant = Date.now()
      changement(
        resultat.donnees.annonces.map((a, i) => ({ id: `calendrier-${instant}-${i}`, titre: a.titre, detail: a.detail, vers: { page: "planning" }, alerte: a.conflit })),
      )
    } finally {
      if (actif) minuterieCalendriers = setTimeout(synchroniserCalendriers, INTERVALLE_CALENDRIERS_MS)
    }
  }

  verifier()
  void synchroniserCalendriers()
  return verifier // pour relancer tout de suite (retour du réseau, fenêtre réaffichée)
}

export function arreterSuivi() {
  actif = false
  curseur = null
  clearTimeout(minuterie)
  clearTimeout(minuterieCalendriers)
}
