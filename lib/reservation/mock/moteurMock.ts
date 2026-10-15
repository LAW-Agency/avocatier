import { randomUUID } from "node:crypto"
import { aujourdhuiISO, chevauche, estDateISO } from "../dates"
import type { DepotComptes, MoteurReservation } from "../moteur"
import { calculerDevis, estLibre, verifierDates } from "../regles"
import type { Client, ClientPublic, PeriodeOccupee, Reservation, StatutReservation } from "../types"
import { creerBaseMock, creerCompteHote, hebergements, type BaseMock } from "./donnees"

// Implémentation en mémoire : les données repartent de zéro au redémarrage du serveur.
// Rangée sur globalThis pour survivre aux rechargements à chaud du serveur de développement.
const globalMock = globalThis as typeof globalThis & { __avocatierMock?: BaseMock }

function base(): BaseMock {
  globalMock.__avocatierMock ??= creerBaseMock()
  migrer(globalMock.__avocatierMock)
  expirerOptions(globalMock.__avocatierMock)
  return globalMock.__avocatierMock
}

// Base créée par une version précédente du code (serveur de dev resté ouvert) : on la complète
// sans perdre les comptes et demandes déjà saisis
function migrer(b: BaseMock) {
  for (const c of b.clients) c.role ??= "client"
  if (!b.clients.some((c) => c.role === "hote")) b.clients.unshift(creerCompteHote())
  b.blocages.forEach((bl, i) => (bl.id ??= `b-ancien-${i}`))
  // Hébergements ajoutés depuis, et contenu des fiches toujours repris de la source (les hôtes ne le modifient pas)
  for (const source of hebergements) {
    const existant = b.hebergements.find((h) => h.id === source.id)
    if (!existant) {
      b.hebergements.push(structuredClone(source))
      continue
    }
    const { image, description, presentation, galerie, salleDeBains, equipements } = structuredClone(source)
    Object.assign(existant, { image, description, presentation, galerie, salleDeBains, equipements })
  }
}

const DUREE_OPTION_MS = 48 * 3_600_000
// Statuts qui bloquent les dates (en PostgreSQL : contrainte d'exclusion sur ces lignes)
const STATUTS_ACTIFS: StatutReservation[] = ["option", "confirmee"]

// Changements de statut permis aux hôtes
const TRANSITIONS: Partial<Record<StatutReservation, StatutReservation[]>> = {
  option: ["confirmee", "refusee"],
  confirmee: ["annulee"],
}

// Expiration paresseuse des options dépassées (en production : tâche planifiée)
function expirerOptions(b: BaseMock) {
  const maintenant = new Date().toISOString()
  for (const r of b.reservations) {
    if (r.statut === "option" && r.expireLe && r.expireLe < maintenant) {
      changerStatut(r, "expiree")
    }
  }
}

function changerStatut(r: Reservation, statut: StatutReservation, note?: string) {
  r.statut = statut
  r.historique.push({ statut, le: new Date().toISOString(), note })
}

function occupations(b: BaseMock): PeriodeOccupee[] {
  return [
    ...b.reservations
      .filter((r) => STATUTS_ACTIFS.includes(r.statut))
      .map((r) => ({ hebergementId: r.hebergementId, debut: r.arrivee, fin: r.depart })),
    ...b.blocages.map(({ hebergementId, debut, fin }) => ({ hebergementId, debut, fin })),
  ]
}

// Copies : l'appelant ne doit pas pouvoir modifier la base par référence
const copie = <T>(valeur: T): T => structuredClone(valeur)

function versPublic(client: Client): ClientPublic {
  const { id, role, email, prenom, nom, telephone, pays, creeLe } = client
  return { id, role, email, prenom, nom, telephone, pays, creeLe }
}

export const moteurMock: MoteurReservation = {
  async listerHebergements() {
    return copie(base().hebergements)
  },

  async listerSaisons() {
    return copie(base().saisons)
  },

  async periodesOccupees() {
    return occupations(base())
  },

  async creerDemande(clientId, demande) {
    const b = base()
    const hebergement = b.hebergements.find((h) => h.id === demande.hebergementId)
    if (!hebergement) return { ok: false, erreur: "Cet hébergement n'existe pas." }

    const { arrivee, depart, adultes, enfants } = demande
    if (!estDateISO(arrivee) || !estDateISO(depart)) return { ok: false, erreur: "Dates invalides." }
    const erreurDates = verifierDates(arrivee, depart, aujourdhuiISO(), b.saisons)
    if (erreurDates) return { ok: false, erreur: erreurDates }

    if (!Number.isInteger(adultes) || !Number.isInteger(enfants) || adultes < 1 || enfants < 0) {
      return { ok: false, erreur: "Nombre de voyageurs invalide." }
    }
    if (adultes + enfants > hebergement.capaciteMax) {
      return { ok: false, erreur: `${hebergement.nom} accueille ${hebergement.capaciteMax} personnes au maximum.` }
    }

    // Vérification et insertion sans « await » entre les deux : aucune autre demande ne peut s'intercaler
    if (!estLibre(hebergement.id, arrivee, depart, occupations(b))) {
      return { ok: false, erreur: "Ces dates viennent d'être réservées. Choisissez d'autres dates ou un autre hébergement." }
    }

    b.compteur += 1
    const maintenant = new Date()
    const reservation: Reservation = {
      id: `r${b.compteur}`,
      reference: `AVO-${arrivee.slice(0, 4)}-${String(b.compteur).padStart(4, "0")}`,
      clientId,
      hebergementId: hebergement.id,
      arrivee,
      depart,
      adultes,
      enfants,
      navette: demande.navette,
      telephone: demande.telephone,
      message: demande.message,
      montantTotal: calculerDevis(hebergement, arrivee, depart, b.saisons).total,
      statut: "option",
      source: "site",
      creeLe: maintenant.toISOString(),
      expireLe: new Date(maintenant.getTime() + DUREE_OPTION_MS).toISOString(),
      historique: [{ statut: "option", le: maintenant.toISOString() }],
    }
    b.reservations.push(reservation)
    // TODO : e-mails (accusé de réception au client, alerte aux hôtes) quand l'envoi sera branché
    return { ok: true, reservation: copie(reservation) }
  },

  async reservationsDuClient(clientId) {
    return copie(
      base()
        .reservations.filter((r) => r.clientId === clientId)
        .sort((a, b) => b.arrivee.localeCompare(a.arrivee)),
    )
  },

  async annulerDemande(clientId, reservationId) {
    const r = base().reservations.find((r) => r.id === reservationId && r.clientId === clientId)
    if (!r || r.statut !== "option") return false
    changerStatut(r, "annulee", "Annulée par le client")
    return true
  },

  async toutesLesReservations() {
    return copie(base().reservations)
  },

  async changerStatut(reservationId, statut, note) {
    const r = base().reservations.find((r) => r.id === reservationId)
    if (!r) return { ok: false, erreur: "Réservation introuvable." }
    if (!TRANSITIONS[r.statut]?.includes(statut)) {
      return { ok: false, erreur: "Ce changement n'est plus possible : la réservation a changé entre-temps." }
    }
    if (statut === "annulee" && r.depart <= aujourdhuiISO()) {
      return { ok: false, erreur: "Ce séjour est terminé : il ne peut plus être annulé." }
    }
    changerStatut(r, statut, note)
    if (statut !== "option") delete r.expireLe
    // TODO : e-mail au client (confirmation et modalités d'acompte, ou refus) quand l'envoi sera branché
    return { ok: true }
  },

  async listerBlocages() {
    return copie(base().blocages)
  },

  async ajouterBlocage(blocage) {
    const b = base()
    const hebergement = b.hebergements.find((h) => h.id === blocage.hebergementId)
    if (!hebergement) return { ok: false, erreur: "Choisissez un hébergement." }
    if (!estDateISO(blocage.debut) || !estDateISO(blocage.fin)) return { ok: false, erreur: "Dates invalides." }
    if (blocage.fin <= blocage.debut) return { ok: false, erreur: "La fin doit suivre le début." }
    const conflit = b.reservations.find(
      (r) =>
        r.hebergementId === blocage.hebergementId &&
        STATUTS_ACTIFS.includes(r.statut) &&
        chevauche(r.arrivee, r.depart, blocage.debut, blocage.fin),
    )
    if (conflit) {
      return { ok: false, erreur: `Ces dates chevauchent la réservation ${conflit.reference} de ${hebergement.nom}.` }
    }
    b.blocages.push({ ...blocage, raison: blocage.raison || "Indisponible", id: randomUUID() })
    return { ok: true }
  },

  async supprimerBlocage(id) {
    const b = base()
    const avant = b.blocages.length
    b.blocages = b.blocages.filter((bl) => bl.id !== id)
    return b.blocages.length < avant
  },
}

export const comptesMock: DepotComptes = {
  async trouverParEmail(email) {
    const client = base().clients.find((c) => c.email === email.trim().toLowerCase())
    return client ? copie(client) : null
  },

  async trouverParId(id) {
    const client = base().clients.find((c) => c.id === id)
    return client ? versPublic(client) : null
  },

  async creer(nouveau) {
    const b = base()
    const client: Client = {
      ...nouveau,
      role: "client",
      email: nouveau.email.trim().toLowerCase(),
      id: `c-${randomUUID().slice(0, 8)}`,
      creeLe: new Date().toISOString(),
    }
    b.clients.push(client)
    return versPublic(client)
  },

  async listerClients() {
    return base()
      .clients.filter((c) => c.role === "client")
      .map(versPublic)
  },
}
