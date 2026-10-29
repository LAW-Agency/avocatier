import type { Article, DateISO, DonneesCaisse, ModificationArticle, NouveauTicket, NouvelArticle, PosteCaisse, Ticket } from "./types"

// Contrat de la caisse Restaurant et Bar (logiciel des hôtes, routes app/api/hotes/caisse/). À n'appeler qu'après
// avoir vérifié le rôle (lib/api/hotes.ts : pourLaCaisse). Montants en ariary.
// Implémentation PostgreSQL : postgres/caissePostgres.ts (schéma : migrations/007_restaurant_bar.sql).

export type Resultat<T> = ({ ok: true } & T) | { ok: false; erreur: string }

export interface CaisseRestaurant {
  // Carte, postes, tickets vendus du `du` au `au` (dates de Sainte-Marie comprises) et séjours en cours
  donnees(periode: { du: DateISO; au: DateISO }): Promise<Omit<DonneesCaisse, "devises">>

  // Poste créé à sa première connexion (identifiant choisi par le logiciel), renommé ensuite
  enregistrerPoste(id: string, nom: string): Promise<Resultat<{ poste: PosteCaisse }>>

  creerArticle(article: NouvelArticle): Promise<Resultat<{ article: Article }>>
  modifierArticle(id: string, modification: ModificationArticle): Promise<Resultat<{ article: Article }>>
  // Refusé pour un article déjà vendu (à désactiver) ; renvoie l'article supprimé
  supprimerArticle(id: string): Promise<Resultat<{ article: Article }>>

  // Vente d'un poste ; déjà reçue (même identifiant, renvoi après une coupure) : `deja`, sans rien changer
  enregistrerTicket(ticket: NouveauTicket, caissierId: string): Promise<Resultat<{ ticket: Ticket; deja: boolean }>>
  // Motif obligatoire ; hors gérants, seulement les tickets du jour ; jamais un ticket déjà facturé
  annulerTicket(id: string, motif: string, membre: { id: string; gerant: boolean }): Promise<Resultat<{ ticket: Ticket }>>
}
