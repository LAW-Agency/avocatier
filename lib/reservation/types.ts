// Modèle de données de la réservation — reprend les futures tables PostgreSQL

export type DateISO = string // « AAAA-MM-JJ », sans fuseau

export type TypeHebergement = "bungalow" | "chambre"

export type Hebergement = {
  id: string
  slug: string
  nom: string
  type: TypeHebergement
  description: string
  image: string
  capaciteMax: number // adultes + enfants
  literie: string
  vue: string
  prixNuit: number // prix de base, en euros
}

// Période tarifaire : s'applique à tous les hébergements ; `fin` est exclue
export type Saison = {
  nom: string
  debut: DateISO
  fin: DateISO
  coefficient: number // multiplie le prix de base
  sejourMin: number // nuits minimum pour une arrivée dans la saison
}

// option : demande reçue, dates bloquées 48 h en attendant la réponse des hôtes
export type StatutReservation = "option" | "confirmee" | "annulee" | "refusee" | "expiree"

export type SourceReservation = "site" | "booking" | "telephone" | "whatsapp"

export type EvenementReservation = {
  statut: StatutReservation
  le: string // date-heure ISO
  note?: string
}

export type Reservation = {
  id: string
  reference: string // ex. AVO-2026-0042
  clientId: string
  hebergementId: string
  arrivee: DateISO
  depart: DateISO // jour du départ : la nuit n'est pas comptée
  adultes: number
  enfants: number
  navette: boolean
  telephone: string
  message: string
  montantTotal: number
  statut: StatutReservation
  source: SourceReservation
  creeLe: string
  expireLe?: string // fin de l'option
  historique: EvenementReservation[]
}

// Dates fermées sans réservation du site : import Booking.com, travaux, privatisation…
export type Blocage = {
  id: string
  hebergementId: string
  debut: DateISO
  fin: DateISO
  raison: string
}

// Nuits occupées, sans aucune donnée client : seule information envoyée au navigateur
export type PeriodeOccupee = {
  hebergementId: string
  debut: DateISO
  fin: DateISO
}

// hote : Joëlle & Stéphane, accès à l'espace /admin ; jamais attribué par l'inscription du site
export type RoleCompte = "client" | "hote"

export type Client = {
  id: string
  role: RoleCompte
  email: string
  prenom: string
  nom: string
  telephone: string
  pays: string
  motDePasseHash: string
  creeLe: string
}

// Ce qui sort de la couche de données : jamais le mot de passe
export type ClientPublic = Omit<Client, "motDePasseHash">

export type DemandeReservation = {
  hebergementId: string
  arrivee: DateISO
  depart: DateISO
  adultes: number
  enfants: number
  navette: boolean
  telephone: string
  message: string
}

export type ResultatDemande =
  | { ok: true; reservation: Reservation }
  | { ok: false; erreur: string }

export type NouveauClient = Omit<Client, "id" | "creeLe" | "role">

export type ResultatAction = { ok: true } | { ok: false; erreur: string }
