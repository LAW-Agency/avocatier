// Modèle de données de la réservation — reprend les futures tables PostgreSQL

export type DateISO = string // « AAAA-MM-JJ », sans fuseau

export type TypeHebergement = "bungalow" | "chambre"

// Équipements de la fiche d'un hébergement (libellés et icônes : components/hebergements/equipements.ts)
export type Equipement = "wifi" | "coffre-fort" | "bureau" | "moustiquaire" | "television" | "linge"

export type Hebergement = {
  id: string
  slug: string
  nom: string
  type: TypeHebergement
  description: string // phrase courte : cartes et parcours de réservation
  image: string
  capaciteMax: number // adultes + enfants
  literie: string
  vue: string
  prixNuit: number // prix de base, en euros
  // Fiche /hebergements/[slug]
  presentation: string
  galerie: string[] // photos en plus de `image` : chambre, salle de bains
  salleDeBains: string
  equipements: Equipement[]
}

// Jour de l'année « MM-JJ », sans année : une saison revient chaque année aux mêmes dates
export type JourAnnee = string

// Saison telle que les hôtes la définissent (logiciel, Tarifs) : mêmes dates et mêmes règles chaque année.
// `fin` est la dernière nuit comprise ; une saison peut passer le 31 décembre (du « 12-20 » au « 01-04 »).
// Hors de toute saison : prix de base, une nuit minimum (« saison normale »).
export type RegleSaison = {
  nom: string
  debut: JourAnnee
  fin: JourAnnee
  coefficient: number // multiplie le prix de base
  sejourMin: number // nuits minimum pour une arrivée dans la saison
}

// Occurrence datée d'une saison (deplierSaisons) : s'applique à tous les hébergements ; `fin` est exclue
export type Saison = {
  nom: string
  debut: DateISO
  fin: DateISO
  coefficient: number // multiplie le prix de base
  sejourMin: number // nuits minimum pour une arrivée dans la saison
}

// option : demande reçue, dates bloquées 48 h en attendant la réponse des hôtes
export type StatutReservation = "option" | "confirmee" | "annulee" | "refusee" | "expiree"

// sur_place : client venu à la réception, réservation saisie dans le logiciel
export type SourceReservation = "site" | "booking" | "airbnb" | "telephone" | "whatsapp" | "sur_place"

export type EvenementReservation = {
  statut: StatutReservation
  le: string // date-heure ISO
  note?: string
}

export type Reservation = {
  id: string
  reference: string // ex. AVO-2026-0042
  clientId: string
  hebergementId: string // catégorie réservée (prix, capacité)
  chambreId: string // chambre attribuée dans cette catégorie
  // Demande de plusieurs chambres en une fois (site) : une réservation par chambre, toutes avec le même groupe.
  // Les hôtes confirment ou refusent la demande entière ; chaque séjour s'annule ensuite seul
  groupe?: string
  arrivee: DateISO
  depart: DateISO // jour du départ : la nuit n'est pas comptée
  adultes: number
  enfants: number
  navette: boolean
  telephone: string
  message: string
  montantTotal: number // pour cette chambre
  statut: StatutReservation
  source: SourceReservation
  creeLe: string
  expireLe?: string // fin de l'option
  historique: EvenementReservation[]
  // Arrivée et départ enregistrés par la réception (date-heure ISO) ; le statut reste « confirmee »
  arriveeLe?: string
  departLe?: string
  // Facture éditée par l'équipe : numéro « FA-2026-0001 », attribué une fois pour toutes
  factureNumero?: string
  factureLe?: string
}

// Événement de l'historique d'une réservation, avec de quoi l'annoncer aux hôtes (suivi en direct du logiciel)
export type ActiviteReservation = EvenementReservation & {
  reservationId: string
  reference: string
  client: string // prénom et nom
  hebergement: string // « Bungalow Océan · Océan 3 »
  arrivee: DateISO
  depart: DateISO
}

// curseur : date-heure ISO du dernier événement connu, à renvoyer à l'appel suivant.
// total : nombre d'événements en base, pour repérer aussi un événement daté avant le curseur mais validé après
export type FilActivite = { curseur: string; total: number; evenements: ActiviteReservation[] }

// Dates fermées sans réservation du site : import Booking.com, travaux, privatisation…
export type Blocage = {
  id: string
  hebergementId: string // catégorie de la chambre
  chambreId: string
  debut: DateISO
  fin: DateISO
  raison: string
  calendrierId?: string // importé d'un calendrier externe (Booking.com, Airbnb…) : remplacé à chaque synchronisation
}

// Dates fermées par l'équipe, sur une ou plusieurs chambres à la fois (travaux, privatisation…)
export type NouveauBlocage = { chambreIds: string[]; debut: DateISO; fin: DateISO; raison: string }

// Nuits occupées d'une chambre, sans aucune donnée client : seule information envoyée au navigateur
export type PeriodeOccupee = {
  hebergementId: string
  chambreId: string
  debut: DateISO
  fin: DateISO
}

// hote : Joëlle & Stéphane, tout le logiciel des hôtes (bureau/) ; reception : équipe d'accueil, sans tarifs,
// statistiques ni utilisateurs ; caissier : caisse Restaurant et Bar seulement. Jamais attribués par l'inscription
// du site
export type RoleCompte = "client" | "hote" | "reception" | "caissier"

// Comptes de l'équipe (logiciel des hôtes)
export type RoleEquipe = Exclude<RoleCompte, "client">

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
  // Mot de passe changé (récupération de compte) : les sessions ouvertes avant sont refusées
  sessionsValidesDepuis?: string
  actif: boolean // compte de l'équipe désactivé : plus de connexion
  origine: "site" | "reception" // reception : client créé au comptoir, sans mot de passe, e-mail facultatif ("")
  note: string // note interne des hôtes sur le client
  effaceLe?: string // données personnelles effacées à la demande du client (fiche anonymisée)
}

// Ce qui sort de la couche de données : jamais le mot de passe
export type ClientPublic = Omit<Client, "motDePasseHash">

export type DemandeReservation = {
  hebergementId: string
  chambres: number // chambres de cette catégorie demandées ensemble, attribuées automatiquement
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

// Demande du site : une réservation par chambre demandée
export type ResultatDemandeSite = { ok: true; reservations: Reservation[] } | { ok: false; erreur: string }

export type NouveauClient = Omit<Client, "id" | "creeLe" | "role" | "sessionsValidesDepuis" | "actif" | "origine" | "note">

export type ResultatAction = { ok: true } | { ok: false; erreur: string }

// Tarifs modifiés par les hôtes (logiciel, Tarifs) : prix de base en euros et liste complète des saisons
export type ModificationTarifs = {
  prix: Record<string, number> // hebergementId → prix de base par nuit
  saisons: RegleSaison[] // remplace toutes les saisons
}

// Devises proposées aux visiteurs (catalogue : lib/reservation/devises.ts). Les tarifs restent en euros,
// les autres devises ne sont qu'une conversion indicative au taux saisi par les hôtes.
export type CodeDevise = "EUR" | "USD" | "MGA" | "GBP" | "CHF" | "CAD"

export type ReglagesDevises = {
  parDefaut: CodeDevise // affichée tant que le visiteur n'a rien choisi
  actives: CodeDevise[] // proposées dans le pied de page ; l'euro l'est toujours
  taux: Record<CodeDevise, number> // 1 € = taux × devise
  misAJourLe: string // date-heure ISO de la dernière modification des taux
}

// --- Logiciel des hôtes : réception, chambres, encaissements, équipe ---

// Ménage et maintenance d'une chambre
export type EtatChambre = "propre" | "a_nettoyer" | "maintenance"

// Chambre physique d'une catégorie d'hébergement : « Océan 3 » dans « Bungalow Océan ». Le site vend la catégorie,
// le moteur attribue la chambre (l'équipe peut en choisir une autre)
export type Chambre = {
  id: string
  hebergementId: string
  numero: string // unique dans l'hôtel
  etat: EtatChambre
  noteEtat: string
  active: boolean // désactivée : plus vendue ni attribuée, son historique reste
}

export type NouvelleChambre = Pick<Chambre, "hebergementId" | "numero">

// Ce qui change ; seuls l'état et la note sont ouverts à la réception
export type ModificationChambre = Partial<Pick<Chambre, "numero" | "etat" | "noteEtat" | "active">>

export type ModePaiement = "especes" | "carte" | "mobile_money" | "virement" | "autre"

// Encaissement d'une réservation, en euros ; montant négatif : remboursement
export type Paiement = {
  id: string
  reservationId: string
  montant: number
  mode: ModePaiement
  note: string
  le: string // date-heure ISO
  enregistrePar?: string // compte de l'équipe
  numero: number // numéro du reçu
}

// Journal d'activité de l'équipe (logiciel des hôtes) : qui a fait quoi, et quand
export type CategorieJournal = "connexion" | "reservation" | "client" | "chambre" | "paiement" | "planning" | "tarifs" | "equipe" | "journal" | "restaurant"

export type EntreeJournal = {
  id: string
  le: string // date-heure ISO
  membreId?: string // absent si le compte a été supprimé
  auteur: string // prénom et nom au moment de l'action
  categorie: CategorieJournal
  action: string // « Demande confirmée »
  detail: string // « AVO-2026-0042, Joëlle Martin »
}

export type NouvelleEntreeJournal = Omit<EntreeJournal, "id" | "le">

// Entrées à effacer : une sélection, celles d'avant une date, ou tout le journal
export type EffacementJournal = { ids: string[] } | { avant: string } | { tout: true }

// Réservation saisie dans le logiciel (téléphone, WhatsApp, Booking.com, comptoir) : confirmée d'office
export type ReservationDirecte = {
  clientId: string
  hebergementId: string
  chambreId: string | null // null : première chambre libre de la catégorie
  arrivee: DateISO
  depart: DateISO
  adultes: number
  enfants: number
  navette: boolean
  source: Exclude<SourceReservation, "site">
  montantTotal: number | null // null : tarif calculé (saisons comprises)
  telephone: string
  message: string
}

export type NouveauClientLocal = Pick<Client, "prenom" | "nom" | "email" | "telephone" | "pays" | "note">

export type NouveauMembre = Pick<Client, "prenom" | "nom" | "email"> & { role: RoleEquipe; motDePasseHash: string }

export type ModificationMembre = { role?: RoleEquipe; actif?: boolean; motDePasseHash?: string }


// Modification d'une réservation active par l'équipe : tout le séjour est renvoyé, pas seulement ce qui change
export type ModificationReservation = {
  hebergementId: string
  chambreId: string | null // null : chambre actuelle si elle reste libre, sinon une autre de la catégorie
  arrivee: DateISO
  depart: DateISO
  adultes: number
  enfants: number
  navette: boolean
  montantTotal: number | null // null : tarif recalculé (saisons comprises)
}

// `changements` : ce qui a changé, en clair (« Dates : 12 – 15 nov. → 13 – 16 nov. »), vide si rien
export type ResultatModification = { ok: true; changements: string[] } | { ok: false; erreur: string }

// Coordonnées d'un client corrigées par l'équipe
export type ModificationClient = Pick<Client, "prenom" | "nom" | "email" | "telephone" | "pays">

// --- Calendriers des plateformes (iCal) ---

export type Plateforme = "booking" | "airbnb" | "autre"

// Calendrier d'une plateforme pour une chambre (une annonce = une chambre) : import de ses dates (urlImport) et export des nôtres
// (lien secret construit avec `jeton`, à donner à la plateforme)
export type CalendrierExterne = {
  id: string
  hebergementId: string // catégorie de la chambre
  chambreId: string
  plateforme: Plateforme
  nom: string // « Booking.com »
  urlImport: string // vide : export seulement
  jeton: string
  synchroniseLe?: string // dernière importation réussie
  erreur: string // dernière importation en échec ("" sinon)
  creeLe: string
}

export type NouveauCalendrier = Pick<CalendrierExterne, "chambreId" | "plateforme" | "nom" | "urlImport">

// Période lue dans un fichier iCal (`fin` exclue, comme `depart`)
export type PeriodeImportee = { uid: string; debut: DateISO; fin: DateISO; raison: string }

// Bilan d'une importation : périodes ajoutées et retirées depuis la précédente
export type BilanSynchronisation = { calendrierId: string; ajoutees: PeriodeImportee[]; retirees: number; erreur?: string }

// --- Factures et reçus ---

// Coordonnées de l'hôtel imprimées sur les factures et les reçus
export type ReglagesFacturation = {
  raisonSociale: string
  adresse: string
  telephone: string
  email: string
  identifiants: string // NIF, STAT, RCS…
  mentions: string // pied des factures
}
