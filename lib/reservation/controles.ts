import { ajouterJours, aujourdhuiISO, estDateISO, nombreNuits } from "./dates"
import { CODES_DEVISES, DEVISE_REFERENCE } from "./devises"
import { chevauchementSaisons, deplierSaisons, estJourAnnee, NUITS_MAX, verifierDates } from "./regles"
import type {
  Blocage,
  DateISO,
  EtatChambre,
  ModePaiement,
  NouveauClientLocal,
  ReservationDirecte,
  DemandeReservation,
  Hebergement,
  ModificationTarifs,
  ReglagesDevises,
  RegleSaison,
  Reservation,
  Saison,
  StatutReservation,
} from "./types"

// Contrôles serveur du moteur, séparés de l'accès aux données (purs) : à reprendre par toute autre implémentation.
// Chacun renvoie le message d'erreur à afficher, ou null si tout va bien.

export const DUREE_OPTION_MS = 48 * 3_600_000
// Statuts qui bloquent les dates (en PostgreSQL : contrainte d'exclusion sur ces lignes)
export const STATUTS_ACTIFS: StatutReservation[] = ["option", "confirmee"]

export const DATES_PRISES = "Ces dates viennent d'être réservées. Choisissez d'autres dates ou un autre hébergement."

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

// Saisons datées de l'an dernier (fêtes à cheval sur janvier) à dans deux ans (réservations à l'avance)
export function saisonsDatees(regles: RegleSaison[]): Saison[] {
  const annee = Number(aujourdhuiISO().slice(0, 4))
  return deplierSaisons(regles, [annee - 1, annee, annee + 1, annee + 2])
}

// Tout sauf la disponibilité, que chaque implémentation vérifie au moment d'écrire
export function controlerDemande(demande: DemandeReservation, hebergement: Hebergement | undefined, saisons: Saison[]): string | null {
  if (!hebergement) return "Cet hébergement n'existe pas."

  const { arrivee, depart, adultes, enfants } = demande
  if (!estDateISO(arrivee) || !estDateISO(depart)) return "Dates invalides."
  const erreurDates = verifierDates(arrivee, depart, aujourdhuiISO(), saisons)
  if (erreurDates) return erreurDates

  if (!Number.isInteger(adultes) || !Number.isInteger(enfants) || adultes < 1 || enfants < 0) {
    return "Nombre de voyageurs invalide."
  }
  if (adultes + enfants > hebergement.capaciteMax) {
    return `${hebergement.nom} accueille ${hebergement.capaciteMax} personnes au maximum.`
  }
  return null
}

export function controlerChangementStatut(
  reservation: Pick<Reservation, "statut" | "depart"> | undefined,
  statut: StatutReservation,
): string | null {
  if (!reservation) return "Réservation introuvable."
  if (!TRANSITIONS[reservation.statut]?.includes(statut)) {
    return "Ce changement n'est plus possible : la réservation a changé entre-temps."
  }
  if (statut === "annulee" && reservation.depart <= aujourdhuiISO()) {
    return "Ce séjour est terminé : il ne peut plus être annulé."
  }
  return null
}

// Tout sauf le chevauchement avec une réservation active (voir blocageEnConflit)
export function controlerBlocage(blocage: Omit<Blocage, "id">, hebergement: Hebergement | undefined): string | null {
  if (!hebergement) return "Choisissez un hébergement."
  if (!estDateISO(blocage.debut) || !estDateISO(blocage.fin)) return "Dates invalides."
  if (blocage.fin <= blocage.debut) return "La fin doit suivre le début."
  return null
}

export function blocageEnConflit(reference: string, hebergement: Hebergement): string {
  return `Ces dates chevauchent la réservation ${reference} de ${hebergement.nom}.`
}

// Tout vérifier avant d'écrire : pas de modification à moitié appliquée
export function controlerTarifs({ prix, saisons }: ModificationTarifs, hebergements: Hebergement[]): string | null {
  for (const [id, montant] of Object.entries(prix)) {
    const h = hebergements.find((h) => h.id === id)
    if (!h) return "Hébergement inconnu."
    if (!Number.isInteger(montant) || !estEntre(montant, 1, PRIX_MAX)) {
      return `${h.nom} : saisissez un prix entier entre 1 et ${PRIX_MAX.toLocaleString("fr-FR")} €.`
    }
  }
  if (saisons.length > SAISONS_MAX) return `${SAISONS_MAX} saisons au maximum.`
  const noms = new Set<string>()
  for (const { nom, debut, fin, coefficient, sejourMin } of saisons) {
    if (!nom || nom.length > NOM_SAISON_MAX) {
      return `Donnez à chaque saison un nom de ${NOM_SAISON_MAX} caractères au plus.`
    }
    if (noms.has(nom.toLowerCase())) return `Deux saisons s’appellent « ${nom} » : renommez l’une d’elles.`
    noms.add(nom.toLowerCase())
    if (!estJourAnnee(debut) || !estJourAnnee(fin)) return `${nom} : choisissez un jour et un mois valides pour le début et la fin.`
    if (!estEntre(coefficient, COEFFICIENT.min, COEFFICIENT.max)) {
      return `${nom} : la majoration doit rester entre -50 % et +200 %.`
    }
    if (!Number.isInteger(sejourMin) || !estEntre(sejourMin, 1, NUITS_MAX)) {
      return `${nom} : le séjour minimum doit être compris entre 1 et ${NUITS_MAX} nuits.`
    }
  }
  const chevauchement = chevauchementSaisons(saisons)
  if (chevauchement) {
    return `« ${chevauchement[0]} » et « ${chevauchement[1]} » se chevauchent : une nuit ne peut appartenir qu’à une seule saison.`
  }
  return null
}

// Réglages à enregistrer (l'euro toujours proposé, à 1), ou l'erreur à afficher
export function normaliserDevises({
  parDefaut,
  actives,
  taux,
}: Omit<ReglagesDevises, "misAJourLe">): { erreur: string } | { reglages: ReglagesDevises } {
  const proposees = CODES_DEVISES.filter((code) => code === DEVISE_REFERENCE || actives.includes(code))
  if (!proposees.includes(parDefaut)) return { erreur: "La devise par défaut doit faire partie des devises proposées." }
  for (const code of CODES_DEVISES) {
    if (code !== DEVISE_REFERENCE && !estEntre(taux[code], Number.EPSILON, TAUX_MAX)) {
      return { erreur: `Taux invalide pour ${code} : saisissez un nombre positif.` }
    }
  }
  return {
    reglages: { parDefaut, actives: proposees, taux: { ...taux, [DEVISE_REFERENCE]: 1 }, misAJourLe: new Date().toISOString() },
  }
}

// --- Logiciel des hôtes : réception, encaissements, équipe ---

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const SOURCES_DIRECTES = ["telephone", "whatsapp", "booking", "sur_place"] as const
export const MODES_PAIEMENT: ModePaiement[] = ["especes", "carte", "mobile_money", "virement", "autre"]
export const ETATS_CHAMBRE: EtatChambre[] = ["propre", "a_nettoyer", "maintenance"]
export const MOT_DE_PASSE_MIN = 8
const MONTANT_MAX = 100_000

// Réservation saisie par l'équipe : pas de séjour minimum ni d'échéance (décision de la réception),
// arrivée possible jusqu'à la veille (client arrivé dans la nuit, saisie le lendemain matin)
export function controlerReservationDirecte(r: ReservationDirecte, hebergement: Hebergement | undefined, aujourdhui: DateISO): string | null {
  if (!hebergement) return "Choisissez un hébergement."
  if (!r.clientId) return "Choisissez ou créez le client."
  if (!estDateISO(r.arrivee) || !estDateISO(r.depart)) return "Dates invalides."
  if (r.depart <= r.arrivee) return "Le départ doit suivre l'arrivée."
  if (r.arrivee < ajouterJours(aujourdhui, -1)) return "La date d'arrivée est déjà passée."
  if (nombreNuits(r.arrivee, r.depart) > 90) return "Séjour de 90 nuits au plus."
  if (!(SOURCES_DIRECTES as readonly string[]).includes(r.source)) return "Provenance inconnue."
  if (!Number.isInteger(r.adultes) || !Number.isInteger(r.enfants) || r.adultes < 1 || r.enfants < 0) return "Nombre de voyageurs invalide."
  if (r.adultes + r.enfants > hebergement.capaciteMax) return `${hebergement.nom} accueille ${hebergement.capaciteMax} personnes au maximum.`
  if (r.montantTotal !== null && (!Number.isInteger(r.montantTotal) || !estEntre(r.montantTotal, 0, MONTANT_MAX))) {
    return "Saisissez un montant entier en euros."
  }
  return null
}

export function controlerPaiement(montant: number, mode: string): string | null {
  if (!Number.isInteger(montant) || montant === 0 || !estEntre(Math.abs(montant), 1, MONTANT_MAX)) {
    return "Saisissez un montant entier en euros (négatif pour un remboursement)."
  }
  if (!(MODES_PAIEMENT as string[]).includes(mode)) return "Choisissez le mode de paiement."
  return null
}

export function controlerClientLocal(c: NouveauClientLocal): string | null {
  if (!c.prenom.trim() && !c.nom.trim()) return "Saisissez au moins le prénom ou le nom du client."
  if (c.email && !EMAIL.test(c.email)) return "Cette adresse e-mail n'est pas valide."
  return null
}

export function controlerMembre({ prenom, email }: { prenom: string; email: string }, motDePasse: string): string | null {
  if (!prenom.trim()) return "Saisissez le prénom."
  if (!EMAIL.test(email)) return "Cette adresse e-mail n'est pas valide."
  if (motDePasse.length < MOT_DE_PASSE_MIN) return `Le mot de passe doit contenir au moins ${MOT_DE_PASSE_MIN} caractères.`
  return null
}
