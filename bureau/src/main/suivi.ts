import { formaterPlage } from "../../../lib/reservation/dates"
import type { ActiviteReservation, FilActivite } from "../../../lib/reservation/types"
import type { Annonce } from "../partage/ipc"
import { appeler } from "./api"

// Suivi en direct : interrogation de l'API toutes les 15 s (pas de WebSocket ni LISTEN/NOTIFY, incompatibles
// avec le pooler Neon et les fonctions Vercel). Fait dans le processus principal : il continue fenêtre
// réduite ou fermée dans la zone de notification, sans le ralentissement des pages en arrière-plan.
const INTERVALLE_MS = 15_000

// Seuls les événements venus des clients (ou de l'échéance) sont annoncés : les décisions des hôtes
// rechargent les données sans notification
function annonce(e: ActiviteReservation): Annonce | null {
  const id = `${e.reservationId}-${e.le}`
  const detail = `${e.client} · ${e.hebergement}, ${formaterPlage(e.arrivee, e.depart)}`
  switch (e.statut) {
    case "option":
      return { id, titre: "Nouvelle demande de réservation", detail, filtre: "option" }
    case "annulee":
      return e.note === "Annulée par le client" ? { id, titre: "Demande annulée par le client", detail, filtre: "annulee" } : null
    case "expiree":
      return { id, titre: "Option expirée sans réponse", detail, filtre: "expiree" }
    default:
      return null
  }
}

let minuterie: ReturnType<typeof setTimeout> | undefined
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

  verifier()
  return verifier // pour relancer tout de suite (retour du réseau, fenêtre réaffichée)
}

export function arreterSuivi() {
  actif = false
  curseur = null
  clearTimeout(minuterie)
}
