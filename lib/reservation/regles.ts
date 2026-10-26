import { ajouterJours, chevauche, estDateISO, nombreNuits, nuitsDuSejour } from "./dates"
import type { Chambre, DateISO, Hebergement, JourAnnee, PeriodeOccupee, RegleSaison, Saison } from "./types"

// Règles métier pures, partagées entre le navigateur (affichage immédiat)
// et le serveur (vérification définitive au moment de l'envoi).

export const NUITS_MAX = 30
// Chambres d'une même catégorie demandées en une fois sur le site (au-delà : contacter l'hôtel)
export const CHAMBRES_PAR_DEMANDE_MAX = 5

// Ce que le navigateur sait d'une chambre : sa catégorie (seules les chambres actives lui sont envoyées)
export type ChambreVendue = Pick<Chambre, "id" | "hebergementId">

// Chambres de la catégorie libres sur tout le séjour : un client garde la même chambre du début à la fin
export function chambresLibres(
  hebergementId: string,
  arrivee: DateISO,
  depart: DateISO,
  chambres: ChambreVendue[],
  periodes: PeriodeOccupee[],
): ChambreVendue[] {
  return chambres.filter(
    (c) => c.hebergementId === hebergementId && !periodes.some((p) => p.chambreId === c.id && chevauche(arrivee, depart, p.debut, p.fin)),
  )
}

// Nuits où aucune des catégories n'a `nombre` chambres libres : grisées dans le calendrier
export function nuitsCompletes(hebergementIds: string[], chambres: ChambreVendue[], periodes: PeriodeOccupee[], nombre = 1): Set<DateISO> {
  const vendues = chambres.filter((c) => hebergementIds.includes(c.hebergementId))
  const occupees = new Map<DateISO, Set<string>>() // nuit → chambres prises
  for (const p of periodes) {
    if (!vendues.some((c) => c.id === p.chambreId)) continue
    for (const nuit of nuitsDuSejour(p.debut, p.fin)) {
      const ids = occupees.get(nuit) ?? new Set<string>()
      ids.add(p.chambreId)
      occupees.set(nuit, ids)
    }
  }
  const libres = (hebergementId: string, prises: Set<string>) =>
    vendues.filter((c) => c.hebergementId === hebergementId && !prises.has(c.id)).length
  const completes = new Set<DateISO>()
  for (const [nuit, prises] of occupees) {
    if (!hebergementIds.some((id) => libres(id, prises) >= nombre)) completes.add(nuit)
  }
  return completes
}

// Voyageurs répartis entre les chambres d'une même demande : au moins un adulte par chambre, adultes au plus
// égaux, puis les enfants dans les places qui restent. null si la capacité ne suffit pas
export function repartirVoyageurs(
  adultes: number,
  enfants: number,
  chambres: number,
  capacite: number,
): { adultes: number; enfants: number }[] | null {
  if (chambres < 1 || adultes < chambres || adultes + enfants > chambres * capacite) return null
  const repartition = Array.from({ length: chambres }, (_, i) => ({
    adultes: Math.floor(adultes / chambres) + (i < adultes % chambres ? 1 : 0),
    enfants: 0,
  }))
  let restants = enfants
  for (const r of repartition) {
    const places = Math.min(capacite - r.adultes, restants)
    r.enfants = places
    restants -= places
  }
  return repartition
}

// Vérifié sur une année non bissextile : pas de saison qui commence ou finit un 29 février
export function estJourAnnee(valeur: unknown): valeur is JourAnnee {
  return typeof valeur === "string" && /^\d{2}-\d{2}$/.test(valeur) && estDateISO(`2025-${valeur}`)
}

// Occurrences datées des saisons pour les années demandées ; une saison qui passe le 31 décembre
// commence l'année indiquée et finit la suivante
export function deplierSaisons(regles: RegleSaison[], annees: number[]): Saison[] {
  return annees
    .flatMap((a) =>
      regles.map(({ nom, debut, fin, coefficient, sejourMin }) => ({
        nom,
        debut: `${a}-${debut}`,
        fin: ajouterJours(`${fin < debut ? a + 1 : a}-${fin}`, 1),
        coefficient,
        sejourMin,
      })),
    )
    .sort((a, b) => a.debut.localeCompare(b.debut))
}

// Premier couple de saisons qui se partagent une nuit, sinon null : une nuit n'a qu'un seul prix
export function chevauchementSaisons(regles: RegleSaison[]): [string, string] | null {
  const occurrences = deplierSaisons(regles, [2025, 2026, 2027])
  for (const a of occurrences) {
    const b = occurrences.find((b) => b.nom !== a.nom && chevauche(a.debut, a.fin, b.debut, b.fin))
    if (b) return [a.nom, b.nom]
  }
  return null
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

export function calculerDevis(hebergement: Pick<Hebergement, "prixNuit">, arrivee: DateISO, depart: DateISO, saisons: Saison[]): Devis {
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
