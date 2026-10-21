import { json, pourLesGerants } from "@/lib/api/hotes"
import { recupererTauxDuJour } from "@/lib/reservation/tauxDeChange"

// Taux du jour pour pré-remplir les devises : rien n'est enregistré, les hôtes vérifient puis enregistrent
export const GET = pourLesGerants(async () => json(await recupererTauxDuJour()))
