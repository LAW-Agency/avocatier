import type { EvenementExporte } from "./ical"
import type {
  BilanSynchronisation,
  CalendrierExterne,
  Chambre,
  ClientPublic,
  EffacementJournal,
  EntreeJournal,
  EtatChambre,
  ModePaiement,
  ModificationClient,
  ModificationMembre,
  ModificationReservation,
  NouveauCalendrier,
  NouveauClientLocal,
  NouveauMembre,
  NouvelleEntreeJournal,
  Paiement,
  PeriodeImportee,
  ReglagesFacturation,
  ReservationDirecte,
  ResultatAction,
  ResultatDemande,
  ResultatModification,
} from "./types"

// Contrat du logiciel des hôtes (bureau/, via app/api/hotes/) pour ce que le site n'utilise pas : équipe,
// réception, chambres, encaissements, calendriers des plateformes, factures. À n'appeler qu'après avoir vérifié
// le rôle (lib/api/hotes.ts), sauf l'export d'un calendrier (lien secret).
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
  // Coordonnées corrigées (un compte du site garde son e-mail, qui lui sert d'identifiant)
  modifierClient(id: string, modification: ModificationClient): Promise<ResultatAction>
  // Deux fiches du même client réunies : réservations et coordonnées passent sur la fiche gardée (celle du
  // compte du site si l'une en est un), l'autre est supprimée. Renvoie la fiche gardée
  fusionnerClients(gardeId: string, doublonId: string): Promise<ResultatClient>
  // Droit à l'effacement : fiche supprimée, ou anonymisée si des réservations doivent rester en comptabilité.
  // Refusé tant qu'un séjour est en cours ou à venir
  effacerClient(id: string): Promise<ResultatAction>

  // Réservation confirmée d'office, saisie par l'équipe (`membreId` : auteur, noté dans l'historique)
  creerReservationDirecte(reservation: ReservationDirecte, auteur: string): Promise<ResultatDemande>
  // Demande ou séjour confirmé modifié (dates, hébergement, voyageurs, navette, montant), noté dans l'historique
  modifierReservation(id: string, modification: ModificationReservation, auteur: string): Promise<ResultatModification>
  // Arrivée / départ du client (réservation confirmée) ; `annuler` efface l'enregistrement (erreur de saisie)
  enregistrerMouvement(reservationId: string, mouvement: "arrivee" | "depart", annuler?: boolean): Promise<ResultatAction>

  listerChambres(): Promise<Chambre[]>
  modifierChambre(id: string, etat: EtatChambre, noteEtat: string): Promise<ResultatAction>

  listerPaiements(): Promise<Paiement[]>
  ajouterPaiement(reservationId: string, paiement: { montant: number; mode: ModePaiement; note: string }, membreId: string): Promise<ResultatAction>
  supprimerPaiement(id: string): Promise<boolean>

  // Calendriers des plateformes (Booking.com, Airbnb…) : un par hébergement et par plateforme
  listerCalendriers(): Promise<CalendrierExterne[]>
  creerCalendrier(calendrier: NouveauCalendrier): Promise<{ ok: true; calendrier: CalendrierExterne } | { ok: false; erreur: string }>
  // Supprime aussi les dates importées de ce calendrier ; renvoie le calendrier supprimé
  supprimerCalendrier(id: string): Promise<CalendrierExterne | null>
  // Remplace les dates importées du calendrier par celles lues (passées ignorées) et note la synchronisation
  remplacerImport(id: string, periodes: PeriodeImportee[]): Promise<BilanSynchronisation>
  noterErreurImport(id: string, erreur: string): Promise<void>
  // Lien d'export (/calendrier/<jeton>.ics) : nos dates occupées pour cette plateforme, sans donnée client
  exporterCalendrier(jeton: string): Promise<{ nom: string; evenements: EvenementExporte[] } | null>

  // Factures et reçus
  reglagesFacturation(): Promise<ReglagesFacturation>
  modifierFacturation(reglages: ReglagesFacturation): Promise<void>
  // Numéro de facture du séjour confirmé, attribué à la première édition
  numeroterFacture(reservationId: string): Promise<{ ok: true; numero: string; le: string } | { ok: false; erreur: string }>

  // Journal d'activité de l'équipe, du plus récent au plus ancien (`limite` entrées au plus)
  noterActivite(entree: NouvelleEntreeJournal): Promise<void>
  listerJournal(limite: number): Promise<EntreeJournal[]>
  // Nombre d'entrées effacées (réservé aux gérants, vérifié par la route)
  effacerJournal(effacement: EffacementJournal): Promise<number>
}
