import { chevauche, nombreNuits, nuitsDuSejour } from "./dates"
import type { DateISO, Hebergement, PeriodeOccupee, Saison } from "./types"

// Règles métier pures, partagées entre le navigateur (affichage immédiat)
// et le serveur (vérification définitive au moment de l'envoi).

export const NUITS_MAX = 30

export function estLibre(hebergementId: string, arrivee: DateISO, depart: DateISO, periodes: PeriodeOccupee[]): boolean {
  return !periodes.some((p) => p.hebergementId === hebergementId && chevauche(arrivee, depart, p.debut, p.fin))
}

// Nuits où aucun hébergement n'est libre : grisées dans le calendrier tant qu'aucun n'est choisi
export function nuitsCompletes(hebergementIds: string[], periodes: PeriodeOccupee[]): Set<DateISO> {
  const occupants = new Map<DateISO, Set<string>>()
  for (const p of periodes) {
    if (!hebergementIds.includes(p.hebergementId)) continue
    for (const nuit of nuitsDuSejour(p.debut, p.fin)) {
      const ids = occupants.get(nuit) ?? new Set<string>()
      ids.add(p.hebergementId)
      occupants.set(nuit, ids)
    }
  }
  const completes = new Set<DateISO>()
  for (const [nuit, ids] of occupants) if (ids.size >= hebergementIds.length) completes.add(nuit)
  return completes
}

export function saisonDeLaNuit(nuit: DateISO, saisons: Saison[]): Saison | undefined {
  return saisons.find((s) => s.debut <= nuit && nuit < s.fin)
}

// Le séjour minimum dépend de la saison de la nuit d'arrivée
export function sejourMinimum(arrivee: DateISO, saisons: Saison[]): { nuits: number; saison?: string } {
  const saison = saisonDeLaNuit(arrivee, saisons)
  return { nuits: saison?.sejourMin ?? 1, saison: saison?.nom }
}

export type Devis = {
  nuits: number
  total: number
  prixParNuit: { nuit: DateISO; prix: number; saison?: string }[]
}

export function calculerDevis(hebergement: Hebergement, arrivee: DateISO, depart: DateISO, saisons: Saison[]): Devis {
  const prixParNuit = nuitsDuSejour(arrivee, depart).map((nuit) => {
    const saison = saisonDeLaNuit(nuit, saisons)
    return { nuit, prix: Math.round(hebergement.prixNuit * (saison?.coefficient ?? 1)), saison: saison?.nom }
  })
  return {
    nuits: prixParNuit.length,
    total: prixParNuit.reduce((somme, n) => somme + n.prix, 0),
    prixParNuit,
  }
}

// Erreur lisible si les dates ne conviennent pas, sinon null
export function verifierDates(arrivee: DateISO, depart: DateISO, aujourdhui: DateISO, saisons: Saison[]): string | null {
  if (arrivee < aujourdhui) return "La date d'arrivée est déjà passée."
  const nuits = nombreNuits(arrivee, depart)
  if (nuits < 1) return "Le départ doit suivre l'arrivée."
  if (nuits > NUITS_MAX) return `Pour un séjour de plus de ${NUITS_MAX} nuits, contactez-nous directement.`
  const minimum = sejourMinimum(arrivee, saisons)
  if (nuits < minimum.nuits) {
    return `Séjour minimum de ${minimum.nuits} nuits pour une arrivée en période « ${minimum.saison} ».`
  }
  return null
}
