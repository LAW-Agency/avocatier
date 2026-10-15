import type { DepotComptes, MoteurReservation } from "./moteur"
import { comptesMock, moteurMock } from "./mock/moteurMock"

// Point unique de choix de l'implémentation (code serveur uniquement).
// Passage à PostgreSQL : écrire lib/reservation/postgres/ et remplacer ces deux lignes.
export const moteur: MoteurReservation = moteurMock
export const comptes: DepotComptes = comptesMock
