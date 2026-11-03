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

// Encaissement tel que la note le lit (un encaissement pas encore enregistré n'a ni date ni taux)
export type EncaissementNote = Pick<Paiement, "reservationId" | "montant"> & Partial<Pick<Paiement, "le" | "devise" | "montantDevise" | "taux" | "tauxAriary">>

// Impute un montant (positif : encaissement, négatif : remboursement) d'abord sur ce qui est dû dans sa devise
// (`propre`), puis sur l'autre part de la note à son propre taux (`taux` = unités propres pour une unité de l'autre) ;
// le surplus reste dans sa devise
function imputer(propre: number, autre: number, montant: number, taux: number): [number, number] {
  const sens = Math.sign(montant)
  let reste = Math.abs(montant)
  const surPropre = Math.min(reste, Math.max(sens * propre, 0))
  reste -= surPropre
  const surAutre = Math.min(reste / taux, Math.max(sens * autre, 0))
  reste -= surAutre * taux
  return [propre - sens * (surPropre + reste), autre - sens * surAutre]
}

// Reste dû d'un séjour dans ses deux devises (négatif : trop-perçu) : l'hébergement en euros, le restaurant et le bar
// en ariary. Chaque encaissement, dans l'ordre de réception, règle sa propre devise puis l'autre au taux de son jour :
// un séjour soldé le reste quel que soit le taux saisi ensuite, le taux du jour ne s'applique qu'à ce qui reste dû.
// Une réservation annulée, refusée ou expirée ne doit plus son hébergement ; le restaurant consommé reste dû
export function resteDu(r: Pick<Reservation, "id" | "statut" | "montantTotal">, paiements: EncaissementNote[], consommations: Pick<Consommation, "reservationId" | "total">[], taux: Taux) {
  let euros = r.statut === "confirmee" || r.statut === "option" ? r.montantTotal : 0
  let ariary = restaurantDe(r.id, consommations)
  const recus = paiements.filter((p) => p.reservationId === r.id).sort((a, b) => (a.le ?? "~").localeCompare(b.le ?? "~"))
  for (const p of recus) {
    const tauxAriary = p.tauxAriary ?? (p.devise === "MGA" ? p.taux : undefined) ?? pourUnEuro("MGA", taux)
    if (p.devise === "MGA" && p.montantDevise !== undefined) [ariary, euros] = imputer(ariary, euros, p.montantDevise, tauxAriary)
    // Euros, ou autre devise pour sa contre-valeur en euros figée à l'encaissement
    else [euros, ariary] = imputer(euros, ariary, p.montant, 1 / tauxAriary)
  }
  return { euros, ariary }
}

// Montant encore dû en euros (négatif : trop-perçu), l'ariary restant dû compté au taux du jour
export function soldeSejour(r: Pick<Reservation, "id" | "statut" | "montantTotal">, paiements: EncaissementNote[], consommations: Pick<Consommation, "reservationId" | "total">[], taux: Taux): number {
  const { euros, ariary } = resteDu(r, paiements, consommations, taux)
  const solde = centimes(euros + ariary / pourUnEuro("MGA", taux))
  // Écart d'arrondi des conversions : soldé
  return Math.abs(solde) < 0.01 ? 0 : solde
}

// Même solde, compté directement dans une devise (montant à proposer au client) : le restaurant reste exact en
// ariary
export function soldeEn(
  devise: CodeDevise,
  r: Pick<Reservation, "id" | "statut" | "montantTotal">,
  paiements: EncaissementNote[],
  consommations: Pick<Consommation, "reservationId" | "total">[],
  taux: Taux,
): number {
  const { euros, ariary } = resteDu(r, paiements, consommations, taux)
  const solde = arrondiDevise((euros + ariary / pourUnEuro("MGA", taux)) * pourUnEuro(devise, taux), devise)
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
