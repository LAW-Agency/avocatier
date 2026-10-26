import type {
  Blocage,
  Chambre,
  Client,
  ClientPublic,
  DemandeReservation,
  FilActivite,
  Hebergement,
  ModificationTarifs,
  NouveauBlocage,
  NouveauClient,
  PeriodeOccupee,
  ReglagesDevises,
  RegleSaison,
  Reservation,
  ResultatAction,
  ResultatDemandeSite,
  Saison,
  StatutReservation,
} from "./types"

// Interface prévue par le cahier des charges pour « implanter un logiciel de réservation ».
// Les pages ne parlent qu'à ces deux contrats : passer de PostgreSQL à un logiciel externe
// revient à fournir une autre implémentation dans lib/reservation/index.ts.

export interface MoteurReservation {
  listerHebergements(): Promise<Hebergement[]>
  // Chambres numérotées de chaque catégorie, actives ou non (le site ne vend que les actives)
  listerChambres(): Promise<Chambre[]>
  // Occurrences datées des saisons, de l'an dernier à dans deux ans
  listerSaisons(): Promise<Saison[]>
  // Saisons telles que les hôtes les saisissent (une par nom, sans année)
  listerReglesSaisons(): Promise<RegleSaison[]>
  // Réservations actives (option, confirmée) + blocages, par chambre, sans donnée client
  periodesOccupees(): Promise<PeriodeOccupee[]>
  // Revérifie disponibilité, capacité et prix : ne jamais se fier au navigateur. Attribue automatiquement les
  // chambres libres de la catégorie : une réservation par chambre, groupées si plusieurs
  creerDemande(clientId: string, demande: DemandeReservation): Promise<ResultatDemandeSite>
  reservationsDuClient(clientId: string): Promise<Reservation[]>
  // Le client ne peut annuler lui-même qu'une demande en option (toutes les chambres de la demande)
  annulerDemande(clientId: string, reservationId: string): Promise<boolean>

  // Code serveur uniquement (e-mails) : aucune vérification de propriétaire
  trouverReservation(id: string): Promise<Reservation | null>

  // Espace hôtes : à n'appeler qu'après avoir vérifié le rôle (exigerHote)
  toutesLesReservations(): Promise<Reservation[]>
  // Suivi en direct : événements survenus après `depuis` (aucun si null : seulement le curseur de départ)
  activiteDepuis(depuis: string | null): Promise<FilActivite>
  // Confirmer ou refuser une demande (toutes ses chambres), annuler une réservation confirmée (cette chambre seule)
  changerStatut(reservationId: string, statut: StatutReservation, note?: string): Promise<ResultatAction>
  listerBlocages(): Promise<Blocage[]>
  // Sur chaque chambre choisie ; tout refusé si l'une chevauche une réservation active
  ajouterBlocage(blocage: NouveauBlocage): Promise<ResultatAction>
  supprimerBlocage(id: string): Promise<boolean>
  // Nouveaux prix pour les demandes à venir : les réservations existantes gardent leur montant
  modifierTarifs(modification: ModificationTarifs): Promise<ResultatAction>

  // Devises de la vitrine : lues par tout le site, modifiées par les hôtes
  reglagesDevises(): Promise<ReglagesDevises>
  modifierDevises(reglages: Omit<ReglagesDevises, "misAJourLe">): Promise<ResultatAction>
}

export interface DepotComptes {
  trouverParEmail(email: string): Promise<Client | null>
  trouverParId(id: string): Promise<ClientPublic | null>
  // Toujours un compte client : les comptes hôtes ne se créent pas depuis le site
  creer(client: NouveauClient): Promise<ClientPublic>
  listerClients(): Promise<ClientPublic[]>

  // Récupération de compte : le jeton envoyé par e-mail n'est jamais stocké, seulement son empreinte.
  // false si ce compte a déjà reçu trop de liens récemment (aucun e-mail à envoyer)
  creerJetonReinitialisation(clientId: string, empreinte: string, expireLe: Date): Promise<boolean>
  // Titulaire d'un jeton encore valable (ni utilisé, ni expiré), sinon null
  clientDuJeton(empreinte: string): Promise<ClientPublic | null>
  // Consomme le jeton et remplace le mot de passe ; les sessions ouvertes avant `le` sont refusées.
  // null si le jeton n'est plus valable
  reinitialiserMotDePasse(empreinte: string, motDePasseHash: string, le: Date): Promise<ClientPublic | null>
}
