import type { StatutReservation } from "../../../lib/reservation/types"

// Contrat entre le processus principal (src/main), le pont (src/preload) et l'interface (src/renderer).
// L'interface ne parle jamais directement au serveur : le processus principal garde le jeton (chiffré par
// Windows) et fait les appels à l'API du site (app/api/hotes/ à la racine du dépôt).

// hote : gérant (tout le logiciel) ; reception : accueil (ni tarifs, ni statistiques, ni utilisateurs)
export type RoleEquipe = "hote" | "reception"

export type Hote = { prenom: string; nom: string; email: string; role: RoleEquipe }

export type Session = { hote: Hote; serveur: string }

export type Methode = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export type ResultatApi<T = unknown> = { ok: true; donnees: T } | { ok: false; erreur: string; statut?: number }

// Nouveauté venue des clients (ou de l'échéance d'une option), annoncée par le suivi en direct.
// `filtre` : liste des réservations à ouvrir quand on clique sur l'annonce
export type Annonce = { id: string; titre: string; detail: string; filtre: StatutReservation }

export type Theme = "systeme" | "clair" | "sombre"

// Préférences du poste, gardées par le processus principal (fichier reglages.json du dossier utilisateur)
export type Reglages = {
  theme: Theme
  notifications: boolean // notifications de Windows pour les nouveautés
  rangerDansZone: boolean // fermer la fenêtre la garde dans la zone de notification
  demarrage: boolean // lancer le logiciel à l'ouverture de la session Windows
  seSouvenir: boolean // garder la connexion d'un lancement à l'autre
  dernierEmail: string // proposé à l'écran de connexion (si seSouvenir)
}

export type InfosLogiciel = { version: string; installe: boolean }

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

  reglages(): Promise<Reglages>
  modifierReglages(modification: Partial<Reglages>): Promise<Reglages>
  infos(): Promise<InfosLogiciel>

  // Premier écran peint avec le bon thème : la fenêtre s'affiche à ce moment-là (src/main/index.ts)
  signalerPrete(): void

  // Boutons de la barre de titre (dessinés par l'interface)
  reduire(): void
  basculerAgrandie(): void
  fermer(): void

  // Abonnements : renvoient la fonction de désabonnement
  surActivite(rappel: (annonces: Annonce[]) => void): () => void
  surNavigation(rappel: (filtre: StatutReservation) => void): () => void
  surSessionExpiree(rappel: () => void): () => void
  surAgrandie(rappel: (agrandie: boolean) => void): () => void
  surReglages(rappel: (reglages: Reglages) => void): () => void
}
