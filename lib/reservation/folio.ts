import { formaterPlage, nombreNuits, pluriel } from "./dates"
import type { CodeDevise, Consommation, ContenuFacture, LigneFacture, Paiement, ReglagesDevises, ReglagesFacturation, Reservation } from "./types"

// Note d'un séjour (pur, partagé entre le serveur et le logiciel des hôtes) : hébergement en euros, restaurant et
// bar mis sur la chambre en ariary, encaissements dans n'importe quelle devise (contre-valeur en euros au centime).
// Le solde se compte en euros ; la facture se dresse dans la devise choisie par le client, au taux du jour.

type Taux = ReglagesDevises["taux"] | Partial<Record<CodeDevise, number>>

const pourUnEuro = (devise: CodeDevise, taux: Taux) => (devise === "EUR" ? 1 : (taux[devise] ?? 1))

// Ariary sans décimales, autres devises au centime
export const arrondiDevise = (montant: number, devise: CodeDevise) => (devise === "MGA" ? Math.round(montant) : Math.round(montant * 100) / 100)

export const convertir = (montant: number, de: CodeDevise, vers: CodeDevise, taux: Taux) =>
  de === vers ? arrondiDevise(montant, vers) : arrondiDevise((montant / pourUnEuro(de, taux)) * pourUnEuro(vers, taux), vers)

const centimes = (euros: number) => Math.round(euros * 100) / 100

// Restaurant et bar sur la note de la réservation (ariary)
export const restaurantDe = (reservationId: string, consommations: Pick<Consommation, "reservationId" | "total">[]) =>
  consommations.filter((c) => c.reservationId === reservationId).reduce((t, c) => t + c.total, 0)

// Total encaissé sur la réservation, en euros (remboursements déduits)
export const encaisseSur = (reservationId: string, paiements: Pick<Paiement, "reservationId" | "montant">[]) =>
  centimes(paiements.filter((p) => p.reservationId === reservationId).reduce((t, p) => t + p.montant, 0))

// Montant encore dû en euros (négatif : trop-perçu). Une réservation annulée, refusée ou expirée ne doit plus son
// hébergement ; le restaurant consommé reste dû
export function soldeSejour(r: Pick<Reservation, "id" | "statut" | "montantTotal">, paiements: Pick<Paiement, "reservationId" | "montant">[], consommations: Pick<Consommation, "reservationId" | "total">[], taux: Taux): number {
  const hebergement = r.statut === "confirmee" || r.statut === "option" ? r.montantTotal : 0
  const restaurant = convertir(restaurantDe(r.id, consommations), "MGA", "EUR", taux)
  const solde = centimes(hebergement + restaurant - encaisseSur(r.id, paiements))
  // Écart d'arrondi des conversions : soldé
  return Math.abs(solde) < 0.01 ? 0 : solde
}

// Même solde, compté directement dans une devise (montant à proposer au client) : le restaurant reste exact en
// ariary, un encaissement fait dans cette devise compte pour son montant exact
export function soldeEn(
  devise: CodeDevise,
  r: Pick<Reservation, "id" | "statut" | "montantTotal">,
  paiements: Pick<Paiement, "reservationId" | "montant" | "devise" | "montantDevise">[],
  consommations: Pick<Consommation, "reservationId" | "total">[],
  taux: Taux,
): number {
  const hebergement = r.statut === "confirmee" || r.statut === "option" ? r.montantTotal : 0
  const du = convertir(hebergement, "EUR", devise, taux) + convertir(restaurantDe(r.id, consommations), "MGA", devise, taux)
  const paye = paiements
    .filter((p) => p.reservationId === r.id)
    .reduce((t, p) => t + (p.devise === devise && p.montantDevise !== undefined ? p.montantDevise : convertir(p.montant, "EUR", devise, taux)), 0)
  const solde = arrondiDevise(du - paye, devise)
  return estSoldee(solde, devise) && soldeSejour(r, paiements, consommations, taux) === 0 ? 0 : solde
}

// Reste d'une facture assez petit pour être un arrondi de conversion
export const estSoldee = (reste: number, devise: CodeDevise) => Math.abs(reste) < (devise === "MGA" ? 50 : 0.05)

export type SejourFacture = Pick<Reservation, "id" | "reference" | "arrivee" | "depart" | "adultes" | "enfants" | "navette" | "montantTotal"> & {
  hebergement: string // « Bungalow Océan »
  chambre: string // « Océan 3 »
}

// Contenu d'une facture : une ligne par chambre, une par ticket du restaurant ou du bar, les règlements reçus
export function contenuFacture(entree: {
  devise: CodeDevise
  taux: Taux
  client: ContenuFacture["client"]
  facturation: ReglagesFacturation
  sejours: SejourFacture[]
  consommations: Consommation[]
  paiements: Paiement[]
}): ContenuFacture {
  const { devise, taux } = entree
  const sejours: LigneFacture[] = entree.sejours.map((s) => ({
    libelle: `Séjour · ${s.hebergement} (${s.chambre})`,
    detail: [formaterPlage(s.arrivee, s.depart), pluriel(s.adultes, "adulte"), s.enfants ? pluriel(s.enfants, "enfant") : "", s.navette ? "navette aéroport" : "", s.reference]
      .filter(Boolean)
      .join(" · "),
    quantite: pluriel(nombreNuits(s.arrivee, s.depart), "nuit"),
    montant: convertir(s.montantTotal, "EUR", devise, taux),
  }))
  const chambreDe = (reservationId: string) => entree.sejours.find((s) => s.id === reservationId)?.chambre ?? ""
  const consommations: LigneFacture[] = [...entree.consommations]
    .sort((a, b) => a.le.localeCompare(b.le))
    .map((c) => ({
      libelle: `Ticket ${c.numero}`,
      detail: [c.lignes.map((l) => (l.quantite > 1 ? `${l.quantite} × ${l.libelle}` : l.libelle)).join(", "), entree.sejours.length > 1 ? chambreDe(c.reservationId) : ""]
        .filter(Boolean)
        .join(" · "),
      quantite: new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Indian/Antananarivo" }).format(new Date(c.le)),
      montant: convertir(c.total, "MGA", devise, taux),
    }))
  const reglements = [...entree.paiements]
    .sort((a, b) => a.le.localeCompare(b.le))
    .map((p) => ({
      le: p.le,
      mode: p.mode,
      note: p.note,
      recu: p.numero,
      devise: p.devise,
      montantDevise: p.montantDevise ?? p.montant,
      // Reçu dans la devise de la facture : le montant exact ; sinon sa contre-valeur en euros convertie
      montant: p.devise === devise && p.montantDevise !== undefined ? p.montantDevise : convertir(p.montant, "EUR", devise, taux),
    }))
  const somme = (lignes: { montant: number }[]) => arrondiDevise(lignes.reduce((t, l) => t + l.montant, 0), devise)
  const total = somme([...sejours, ...consommations])
  const regle = somme(reglements)
  const reste = arrondiDevise(total - regle, devise)
  return {
    client: entree.client,
    facturation: entree.facturation,
    references: entree.sejours.map((s) => s.reference),
    sejours,
    consommations,
    reglements,
    total,
    regle,
    reste: estSoldee(reste, devise) ? 0 : reste,
  }
}
