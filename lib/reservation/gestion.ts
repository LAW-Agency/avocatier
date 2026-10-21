import type {
  Chambre,
  ClientPublic,
  EtatChambre,
  ModePaiement,
  ModificationMembre,
  NouveauClientLocal,
  NouveauMembre,
  Paiement,
  ReservationDirecte,
  ResultatAction,
  ResultatDemande,
} from "./types"

// Contrat du logiciel des hôtes (bureau/, via app/api/hotes/) pour ce que le site n'utilise pas : équipe,
// réception, chambres, encaissements. À n'appeler qu'après avoir vérifié le rôle (lib/api/hotes.ts).
// Implémentation PostgreSQL : postgres/gestionPostgres.ts.

export type ResultatClient = { ok: true; client: ClientPublic } | { ok: false; erreur: string }

export interface GestionHotel {
  // Équipe : comptes « hote » et « reception », actifs ou non
  listerEquipe(): Promise<ClientPublic[]>
  creerMembre(membre: NouveauMembre): Promise<ResultatAction>
  // Refusé s'il retirerait le dernier gérant actif
  modifierMembre(id: string, modification: ModificationMembre): Promise<ResultatAction>

  // Client venu au comptoir ou au téléphone, sans compte sur le site
  creerClientLocal(client: NouveauClientLocal): Promise<ResultatClient>
  modifierNoteClient(id: string, note: string): Promise<ResultatAction>

  // Réservation confirmée d'office, saisie par l'équipe (`membreId` : auteur, noté dans l'historique)
  creerReservationDirecte(reservation: ReservationDirecte, auteur: string): Promise<ResultatDemande>
  // Arrivée / départ du client (réservation confirmée) ; `annuler` efface l'enregistrement (erreur de saisie)
  enregistrerMouvement(reservationId: string, mouvement: "arrivee" | "depart", annuler?: boolean): Promise<ResultatAction>

  listerChambres(): Promise<Chambre[]>
  modifierChambre(id: string, etat: EtatChambre, noteEtat: string): Promise<ResultatAction>

  listerPaiements(): Promise<Paiement[]>
  ajouterPaiement(reservationId: string, paiement: { montant: number; mode: ModePaiement; note: string }, membreId: string): Promise<ResultatAction>
  supprimerPaiement(id: string): Promise<boolean>
}
