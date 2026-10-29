import type { EvenementExporte } from "./ical"
import type {
  BilanSynchronisation,
  CalendrierExterne,
  Chambre,
  ClientPublic,
  EffacementJournal,
  EntreeJournal,
  CodeDevise,
  Consommation,
  Facture,
  ModePaiement,
  ModificationChambre,
  ModificationClient,
  ModificationMembre,
  ModificationReservation,
  NouveauCalendrier,
  NouvelleChambre,
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
  // Demande ou séjour confirmé modifié (dates, hébergement, chambre, voyageurs, navette, montant), noté dans l'historique
  modifierReservation(id: string, modification: ModificationReservation, auteur: string): Promise<ResultatModification>
  // Arrivée / départ du client (réservation confirmée), noté dans l'historique avec son auteur ; `annuler` efface
  // l'enregistrement (erreur de saisie). Départ avec un reste à payer : refusé sans `note` (pourquoi le client part
  // sans avoir soldé). `soldeDu` : reste à payer au moment du mouvement (euros)
  enregistrerMouvement(
    reservationId: string,
    mouvement: "arrivee" | "depart",
    options: { annuler?: boolean; auteur: string; note?: string },
  ): Promise<{ ok: true; soldeDu: number } | { ok: false; erreur: string }>

  // Chambres numérotées (liste : moteur.listerChambres). Désactiver est refusé tant qu'un séjour à venir y est
  // attribué ; supprimer, dès qu'une réservation y a été faite (désactiver plutôt). Ses dates bloquées et ses
  // calendriers de plateforme partent avec elle
  creerChambre(chambre: NouvelleChambre): Promise<{ ok: true; chambre: Chambre } | { ok: false; erreur: string }>
  modifierChambre(id: string, modification: ModificationChambre): Promise<ResultatAction>
  supprimerChambre(id: string): Promise<ResultatAction>

  listerPaiements(): Promise<Paiement[]>
  // Montant dans la devise reçue ; contre-valeur en euros calculée au taux du jour
  ajouterPaiement(reservationId: string, paiement: { montantDevise: number; devise: CodeDevise; mode: ModePaiement; note: string }, membreId: string): Promise<ResultatAction>
  // Restaurant et bar mis sur la note des séjours (tickets non annulés)
  listerConsommations(): Promise<Consommation[]>
  supprimerPaiement(id: string): Promise<boolean>

  // Calendriers des plateformes (Booking.com, Airbnb…) : un par chambre et par plateforme
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
  // Factures figées (séjours, restaurant, règlements) ; une seule par séjour, réimprimée à l'identique
  listerFactures(): Promise<Facture[]>
  // Facture du séjour (et des autres chambres de son groupe au nom du même client) dans la devise choisie ;
  // déjà facturé : la même (`deja`)
  editerFacture(reservationId: string, devise: CodeDevise, membreId: string): Promise<{ ok: true; facture: Facture; deja: boolean } | { ok: false; erreur: string }>
  // Facture éditée avant la caisse du restaurant (numéro sur la réservation) : réimpression seulement
  numeroterFacture(reservationId: string): Promise<{ ok: true; numero: string; le: string } | { ok: false; erreur: string }>

  // Journal d'activité de l'équipe, du plus récent au plus ancien (`limite` entrées au plus)
  noterActivite(entree: NouvelleEntreeJournal): Promise<void>
  listerJournal(limite: number): Promise<EntreeJournal[]>
  // Nombre d'entrées effacées (réservé aux gérants, vérifié par la route)
  effacerJournal(effacement: EffacementJournal): Promise<number>
}
