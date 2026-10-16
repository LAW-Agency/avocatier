import { randomUUID } from "node:crypto"
import { ajouterJours, aujourdhuiISO, chevauche, estDateISO } from "../dates"
import type { DepotComptes, MoteurReservation } from "../moteur"
import { CODES_DEVISES, DEVISE_REFERENCE, reglagesDevisesInitiaux } from "../devises"
import { calculerDevis, chevauchementSaisons, deplierSaisons, estJourAnnee, estLibre, NUITS_MAX, verifierDates } from "../regles"
import type { Client, ClientPublic, PeriodeOccupee, RegleSaison, Reservation, Saison, StatutReservation } from "../types"
import { creerBaseMock, creerCompteHote, hebergements, reglesSaisonsInitiales, type BaseMock } from "./donnees"

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
  b.devises ??= reglagesDevisesInitiaux()
  // Saisons autrefois rangées datées (`saisons`) : on n'en garde que les règles, une par nom
  const ancienne = b as BaseMock & { saisons?: Saison[] }
  if (!b.reglesSaisons) {
    const parNom = new Map<string, RegleSaison>()
    for (const s of ancienne.saisons ?? []) {
      parNom.set(s.nom, { nom: s.nom, debut: s.debut.slice(5), fin: ajouterJours(s.fin, -1).slice(5), coefficient: s.coefficient, sejourMin: s.sejourMin })
    }
    b.reglesSaisons = parNom.size > 0 ? [...parNom.values()] : structuredClone(reglesSaisonsInitiales)
    delete ancienne.saisons
  }
  // Devises ajoutées au catalogue depuis : taux par défaut, non proposées tant que les hôtes ne les activent pas
  const tauxInitiaux = reglagesDevisesInitiaux().taux
  for (const code of CODES_DEVISES) b.devises.taux[code] ??= tauxInitiaux[code]
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

// Bornes des tarifs saisis par les hôtes (contrôle serveur : une Server Action est appelable directement)
const PRIX_MAX = 10_000
const COEFFICIENT = { min: 0.5, max: 3 }
const TAUX_MAX = 1_000_000
const SAISONS_MAX = 12
const NOM_SAISON_MAX = 40

const estEntre = (n: number, min: number, max: number) => Number.isFinite(n) && n >= min && n <= max

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

// Saisons datées de l'an dernier (fêtes à cheval sur janvier) à dans deux ans (réservations à l'avance)
function saisonsDatees(b: BaseMock): Saison[] {
  const annee = Number(aujourdhuiISO().slice(0, 4))
  return deplierSaisons(b.reglesSaisons, [annee - 1, annee, annee + 1, annee + 2])
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
    return saisonsDatees(base())
  },

  async listerReglesSaisons() {
    return copie(base().reglesSaisons)
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
    const erreurDates = verifierDates(arrivee, depart, aujourdhuiISO(), saisonsDatees(b))
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
      montantTotal: calculerDevis(hebergement, arrivee, depart, saisonsDatees(b)).total,
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

  async modifierTarifs({ prix, saisons }) {
    const b = base()
    // Tout vérifier avant d'écrire : pas de modification à moitié appliquée
    for (const [id, montant] of Object.entries(prix)) {
      const h = b.hebergements.find((h) => h.id === id)
      if (!h) return { ok: false, erreur: "Hébergement inconnu." }
      if (!Number.isInteger(montant) || !estEntre(montant, 1, PRIX_MAX)) {
        return { ok: false, erreur: `${h.nom} : saisissez un prix entier entre 1 et ${PRIX_MAX.toLocaleString("fr-FR")} €.` }
      }
    }
    if (saisons.length > SAISONS_MAX) return { ok: false, erreur: `${SAISONS_MAX} saisons au maximum.` }
    const noms = new Set<string>()
    for (const { nom, debut, fin, coefficient, sejourMin } of saisons) {
      if (!nom || nom.length > NOM_SAISON_MAX) {
        return { ok: false, erreur: `Donnez à chaque saison un nom de ${NOM_SAISON_MAX} caractères au plus.` }
      }
      if (noms.has(nom.toLowerCase())) return { ok: false, erreur: `Deux saisons s’appellent « ${nom} » : renommez l’une d’elles.` }
      noms.add(nom.toLowerCase())
      if (!estJourAnnee(debut) || !estJourAnnee(fin)) return { ok: false, erreur: `${nom} : choisissez un jour et un mois valides pour le début et la fin.` }
      if (!estEntre(coefficient, COEFFICIENT.min, COEFFICIENT.max)) {
        return { ok: false, erreur: `${nom} : la majoration doit rester entre -50 % et +200 %.` }
      }
      if (!Number.isInteger(sejourMin) || !estEntre(sejourMin, 1, NUITS_MAX)) {
        return { ok: false, erreur: `${nom} : le séjour minimum doit être compris entre 1 et ${NUITS_MAX} nuits.` }
      }
    }
    const chevauchement = chevauchementSaisons(saisons)
    if (chevauchement) {
      return { ok: false, erreur: `« ${chevauchement[0]} » et « ${chevauchement[1]} » se chevauchent : une nuit ne peut appartenir qu’à une seule saison.` }
    }
    for (const h of b.hebergements) if (prix[h.id] !== undefined) h.prixNuit = prix[h.id]
    // Une saison revient chaque année : ses dates et ses règles valent pour toutes les années
    b.reglesSaisons = copie(saisons).sort((a, c) => a.debut.localeCompare(c.debut))
    return { ok: true }
  },

  async reglagesDevises() {
    return copie(base().devises)
  },

  async modifierDevises({ parDefaut, actives, taux }) {
    const b = base()
    const proposees = CODES_DEVISES.filter((code) => code === DEVISE_REFERENCE || actives.includes(code))
    if (!proposees.includes(parDefaut)) return { ok: false, erreur: "La devise par défaut doit faire partie des devises proposées." }
    for (const code of CODES_DEVISES) {
      if (code !== DEVISE_REFERENCE && !estEntre(taux[code], Number.EPSILON, TAUX_MAX)) {
        return { ok: false, erreur: `Taux invalide pour ${code} : saisissez un nombre positif.` }
      }
    }
    b.devises = { parDefaut, actives: proposees, taux: { ...taux, [DEVISE_REFERENCE]: 1 }, misAJourLe: new Date().toISOString() }
    return { ok: true }
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
