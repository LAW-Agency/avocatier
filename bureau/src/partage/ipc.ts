import type { RoleEquipe, StatutReservation } from "../../../lib/reservation/types"

// Contrat entre le processus principal (src/main), le pont (src/preload) et l'interface (src/renderer).
// L'interface ne parle jamais directement au serveur : le processus principal garde le jeton (chiffré par
// Windows) et fait les appels à l'API du site (app/api/hotes/ à la racine du dépôt).

// hote : gérant (tout le logiciel) ; reception : accueil (ni tarifs, ni statistiques, ni utilisateurs) ;
// caissier : caisse Restaurant et Bar seulement
export type { RoleEquipe }

export type Hote = { prenom: string; nom: string; email: string; role: RoleEquipe }

export type Session = { hote: Hote; serveur: string }

export type Methode = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export type ResultatApi<T = unknown> = { ok: true; donnees: T } | { ok: false; erreur: string; statut?: number }

// Filtres de l'écran Chambres : situation de ce soir ou état du ménage
export const FILTRES_CHAMBRES = ["toutes", "disponibles", "occupees", "a_nettoyer", "maintenance"] as const
export type FiltreChambres = (typeof FILTRES_CHAMBRES)[number]

// Écran ouvert par un clic sur une annonce : liste des réservations filtrée, planning (calendriers des plateformes)
// ou chambres (rappels de ménage)
export type Destination = { page: "reservations"; filtre: StatutReservation } | { page: "planning" } | { page: "chambres"; filtre?: FiltreChambres }

// Nouveauté venue des clients, de l'échéance d'une option ou d'une plateforme (Booking.com, Airbnb…), annoncée
// par le suivi en direct. `alerte` : à régler sans attendre (double réservation)
export type Annonce = { id: string; titre: string; detail: string; vers: Destination; alerte?: boolean }

// Fichier enregistré par le logiciel (export, facture) : chemin choisi, ou null si l'enregistrement est abandonné
export type ResultatFichier = { chemin: string } | { erreur: string } | null

// Classeur Excel préparé par l'interface (données seules) ; mise en forme dans src/main/classeur.ts.
// Dates « AAAA-MM-JJ », dates-heures ISO (affichées à l'heure de Sainte-Marie), montants en euros
export type FormatColonne = "texte" | "entier" | "euros" | "date" | "dateHeure"
export type ColonneClasseur = { titre: string; format: FormatColonne; total?: boolean; largeur?: number }
export type ValeurCellule = string | number | null
export type FeuilleClasseur = { nom: string; titre: string; sousTitre: string; colonnes: ColonneClasseur[]; lignes: ValeurCellule[][] }
export type Classeur = { feuilles: FeuilleClasseur[] }

export type Theme ="systeme" | "clair" | "sombre"

// Tableau de bord « Aujourd'hui » : widgets affichés, dans l'ordre, avec leur largeur (colonnes sur 4)
export type TailleWidget = 1 | 2 | 3 | 4
export type PlaceWidget = { id: string; taille: TailleWidget }

// Zoom de l'interface (Ctrl + / Ctrl - / Ctrl 0, Ctrl + molette) : facteurs proposés, comme dans un navigateur
export const NIVEAUX_ZOOM = [0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2] as const

// Planning : nombre de nuits affichées (un jour, une, deux ou trois semaines), ou le mois en calendrier, et ordre
// des hébergements
export const VUES_PLANNING = [1, 7, 14, 21, "mois"] as const
export type VuePlanning = (typeof VUES_PLANNING)[number]
export const TRIS_PLANNING = ["site", "nom", "type", "occupation"] as const
export type TriPlanning = (typeof TRIS_PLANNING)[number]

// Affichage du planning (menu « Affichage ») : hauteur des lignes, texte des barres, ligne des chambres libres,
// week-ends teintés, lignes de grille entre les nuits et catégories repliées (identifiants des hébergements)
export const DENSITES_PLANNING = ["confortable", "compacte"] as const
export type DensitePlanning = (typeof DENSITES_PLANNING)[number]
export const LIBELLES_PLANNING = ["client", "reference"] as const
export type LibellePlanning = (typeof LIBELLES_PLANNING)[number]
export type AffichagePlanning = {
  densite: DensitePlanning
  libelle: LibellePlanning
  disponibilites: boolean
  weekEnds: boolean
  grille: boolean
  replies: string[]
}

// Devise des montants affichés par le logiciel : les tarifs et les encaissements restent enregistrés en euros,
// convertis au taux saisi dans Tarifs. FMG (franc malgache) : 5 FMG pour 1 ariary
export const DEVISES_LOGICIEL = ["MGA", "FMG", "EUR", "USD", "GBP", "CHF", "CAD"] as const
export type DeviseLogiciel = (typeof DEVISES_LOGICIEL)[number]

// Écran Chambres : grandes cartes, ou liste compacte (une ligne par chambre, tout l'hôtel sur une page)
export const VUES_CHAMBRES = ["cartes", "liste"] as const
export type VueChambres = (typeof VUES_CHAMBRES)[number]

// Préférences du poste, gardées par le processus principal (fichier reglages.json du dossier utilisateur)
export type Reglages = {
  theme: Theme
  notifications: boolean // notifications de Windows pour les nouveautés
  rappels: boolean // petits rappels de l'interface (ménage avant une arrivée, navettes)
  rangerDansZone: boolean // fermer la fenêtre la garde dans la zone de notification
  demarrage: boolean // lancer le logiciel à l'ouverture de la session Windows
  seSouvenir: boolean // garder la connexion d'un lancement à l'autre
  dernierEmail: string // proposé à l'écran de connexion (si seSouvenir)
  zoom: number // facteur de NIVEAUX_ZOOM
  tableau: PlaceWidget[] | null // null : disposition d'origine
  vuePlanning: VuePlanning
  triPlanning: TriPlanning
  affichagePlanning: AffichagePlanning
  vueChambres: VueChambres
  devise: DeviseLogiciel
  imprimanteTicket: string // imprimante des tickets de caisse ; "" : boîte d'impression de Windows
  impressionAuto: boolean // imprimer le ticket dès l'encaissement
  versionPresentee: string // dernière version présentée par la fenêtre de bienvenue ; "" : jamais (premier lancement)
}

// Poste de caisse de cet ordinateur (src/main/caisse.ts) : préfixe donné par le serveur à son enregistrement
export type PosteLocal = { posteId: string; prefixe: string | null; dernier: number }

export type ResultatImpression = { ok: true } | { ok: false; annule?: boolean; erreur?: string }

export type InfosLogiciel = { version: string; installe: boolean }

// Mises à jour (src/main/misesAJour.ts) : indisponible en développement ; verifieLe en ISO ; « disponible » attend
// l'accord des hôtes (notes : texte de la version publiée sur GitHub, sans balises)
export type EtatMiseAJour =
  | { etat: "indisponible" }
  | { etat: "a-jour"; verifieLe?: string }
  | { etat: "recherche" }
  | { etat: "disponible"; version: string; notes: string | null }
  | { etat: "telechargement"; version: string; pourcent: number }
  | { etat: "prete"; version: string }
  | { etat: "erreur"; message: string }

export interface PontAvocatier {
  // Session gardée depuis la dernière connexion, et adresse du serveur proposée à l'écran de connexion
  session(): Promise<{ session: Session | null; serveurParDefaut: string }>
  connexion(email: string, motDePasse: string, serveur: string, seSouvenir: boolean): Promise<ResultatApi<Hote>>
  deconnexion(): Promise<void>
  // Appel à l'API des hôtes : chemin commençant par /api/hotes/
  api<T>(methode: Methode, chemin: string, corps?: unknown): Promise<ResultatApi<T>>
  // Liens https, mailto: et tel: ouverts dans le navigateur ou l'application du système
  ouvrirLien(url: string): Promise<void>
  // Nombre de demandes à traiter : titre de la fenêtre et info-bulle de l'icône de notification
  signalerATraiter(nombre: number): void
  // Rappel de l'interface (ménage, navette) : notification de Windows si la fenêtre est au second plan
  rappeler(annonce: Annonce): void
  // Export pour Excel : classeur .xlsx mis en forme par le processus principal, à l'endroit choisi dans
  // « Enregistrer sous »
  enregistrerXlsx(nom: string, classeur: Classeur): Promise<ResultatFichier>
  // Facture ou reçu : page HTML complète mise en PDF A4, enregistrée puis ouverte
  enregistrerPdf(nom: string, html: string): Promise<ResultatFichier>

  // Caisse : poste de cet ordinateur, préfixe et dernier numéro connus du serveur, numéro du prochain ticket
  // (null tant que le poste n'est pas enregistré), imprimantes et impression d'un ticket de 80 mm
  posteCaisse(): Promise<PosteLocal>
  noterPosteCaisse(prefixe: string, dernier: number): Promise<PosteLocal>
  numeroterTicket(): Promise<string | null>
  imprimantes(): Promise<string[]>
  imprimerTicket(html: string, hauteurMm: number): Promise<ResultatImpression>

  reglages(): Promise<Reglages>
  modifierReglages(modification: Partial<Reglages>): Promise<Reglages>
  infos(): Promise<InfosLogiciel>
  // Serveur joignable lors du dernier appel (suivi en direct compris, toutes les 15 s)
  etatConnexion(): Promise<boolean>
  // Mises à jour : état actuel, recherche demandée par les hôtes, mise à jour acceptée (téléchargement puis
  // redémarrage et installation), redémarrage pour installer une version déjà téléchargée
  etatMiseAJour(): Promise<EtatMiseAJour>
  rechercherMiseAJour(): void
  mettreAJour(): void
  installerMiseAJour(): void

  // Premier écran peint avec le bon thème : la fenêtre s'affiche à ce moment-là (src/main/index.ts)
  signalerPrete(): void

  // Boutons de la barre de titre (dessinés par l'interface)
  reduire(): void
  basculerAgrandie(): void
  fermer(): void
  // Mêmes effets que F11 et Ctrl + / Ctrl - / Ctrl 0 (paramètres, menu du compte)
  basculerPleinEcran(): void
  zoomer(sens: "plus" | "moins" | "initial"): void

  // Abonnements : renvoient la fonction de désabonnement
  surActivite(rappel: (annonces: Annonce[]) => void): () => void
  surNavigation(rappel: (vers: Destination) => void): () => void
  surSessionExpiree(rappel: () => void): () => void
  surAgrandie(rappel: (agrandie: boolean) => void): () => void
  surReglages(rappel: (reglages: Reglages) => void): () => void
  // Zoom changé (facteur) et passage en plein écran : annoncés par l'interface
  surZoom(rappel: (facteur: number) => void): () => void
  surPleinEcran(rappel: (pleinEcran: boolean) => void): () => void
  // Connexion au serveur perdue (false) ou retrouvée (true)
  surConnexion(rappel: (enLigne: boolean) => void): () => void
  surMiseAJour(rappel: (etat: EtatMiseAJour) => void): () => void
}
