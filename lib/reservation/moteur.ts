import type {
  Blocage,
  Client,
  ClientPublic,
  DemandeReservation,
  Hebergement,
  NouveauClient,
  PeriodeOccupee,
  Reservation,
  ResultatAction,
  ResultatDemande,
  Saison,
  StatutReservation,
} from "./types"

// Interface prévue par le cahier des charges pour « implanter un logiciel de réservation ».
// Les pages ne parlent qu'à ces deux contrats : passer des données mock à PostgreSQL
// (ou à un logiciel externe) revient à fournir une autre implémentation dans lib/reservation/index.ts.

export interface MoteurReservation {
  listerHebergements(): Promise<Hebergement[]>
  listerSaisons(): Promise<Saison[]>
  // Réservations actives (option, confirmée) + blocages, sans donnée client
  periodesOccupees(): Promise<PeriodeOccupee[]>
  // Revérifie disponibilité, capacité et prix : ne jamais se fier au navigateur
  creerDemande(clientId: string, demande: DemandeReservation): Promise<ResultatDemande>
  reservationsDuClient(clientId: string): Promise<Reservation[]>
  // Le client ne peut annuler lui-même qu'une demande en option
  annulerDemande(clientId: string, reservationId: string): Promise<boolean>

  // Espace hôtes : à n'appeler qu'après avoir vérifié le rôle (exigerHote)
  toutesLesReservations(): Promise<Reservation[]>
  // Confirmer ou refuser une demande, annuler une réservation confirmée
  changerStatut(reservationId: string, statut: StatutReservation, note?: string): Promise<ResultatAction>
  listerBlocages(): Promise<Blocage[]>
  // Refusé s'il chevauche une réservation active
  ajouterBlocage(blocage: Omit<Blocage, "id">): Promise<ResultatAction>
  supprimerBlocage(id: string): Promise<boolean>
}

export interface DepotComptes {
  trouverParEmail(email: string): Promise<Client | null>
  trouverParId(id: string): Promise<ClientPublic | null>
  // Toujours un compte client : les comptes hôtes ne se créent pas depuis le site
  creer(client: NouveauClient): Promise<ClientPublic>
  listerClients(): Promise<ClientPublic[]>
}
