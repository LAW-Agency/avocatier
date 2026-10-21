import type { GestionHotel } from "./gestion"
import type { DepotComptes, MoteurReservation } from "./moteur"
import { gestionPostgres } from "./postgres/gestionPostgres"
import { comptesPostgres, moteurPostgres } from "./postgres/moteurPostgres"

// Point unique d'accès aux données (code serveur uniquement) : PostgreSQL, adresse dans DATABASE_URL.
// Un logiciel de réservation externe se brancherait ici, en respectant les contrats de moteur.ts.
export const moteur: MoteurReservation = moteurPostgres
export const comptes: DepotComptes = comptesPostgres
// Logiciel des hôtes seulement (équipe, réception, chambres, encaissements)
export const gestion: GestionHotel = gestionPostgres
