import { nombreNuits } from "@partage/dates"
import { libelleStatutHote } from "@partage/statuts"
import type { ClientPublic, Paiement, Reservation } from "@partage/types"
import { nomDe, soldeDe, type Donnees } from "./donnees"
import { MODES_PAIEMENT, NOMS_SOURCES } from "./libelles"

// Exports pour un tableur (Excel, LibreOffice) : CSV à la française (séparateur « ; », dates JJ/MM/AAAA,
// montants entiers en euros), écrit en UTF-8 avec BOM par le processus principal.

type Cellule = string | number | null | undefined

// Texte commençant par = + - @ : Excel le prendrait pour une formule (nom ou message saisi sur le site)
function cellule(valeur: Cellule): string {
  if (valeur === null || valeur === undefined) return ""
  if (typeof valeur === "number") return String(valeur)
  const texte = /^[=+\-@\t\r]/.test(valeur) ? `'${valeur}` : valeur
  return /[;"\r\n]/.test(texte) ? `"${texte.replaceAll('"', '""')}"` : texte
}

export function versCsv(entetes: string[], lignes: Cellule[][]): string {
  return [entetes, ...lignes].map((l) => l.map(cellule).join(";")).join("\r\n")
}

const jour = (iso?: string) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "")
// Date-heure à l'heure de Sainte-Marie : « 21/10/2026 14:05 »
const instant = (iso?: string) =>
  iso
    ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Indian/Antananarivo" })
        .format(new Date(iso))
        .replace(",", "")
    : ""

// Nom de fichier proposé : « Réservations 2026-10-21.csv »
export const nomExport = (quoi: string, aujourdhui: string) => `${quoi} ${aujourdhui}.csv`

export function csvReservations(reservations: Reservation[], d: Donnees): string {
  return versCsv(
    [
      "Référence",
      "Statut",
      "Provenance",
      "Client",
      "E-mail",
      "Téléphone",
      "Pays",
      "Hébergement",
      "Arrivée",
      "Départ",
      "Nuits",
      "Adultes",
      "Enfants",
      "Navette",
      "Montant (€)",
      "Encaissé (€)",
      "Reste à payer (€)",
      "Reçue le",
      "Facture",
    ],
    reservations.map((r) => {
      const client = d.clients.find((c) => c.id === r.clientId)
      const solde = soldeDe(r, d.paiements)
      return [
        r.reference,
        libelleStatutHote[r.statut],
        NOMS_SOURCES[r.source],
        nomDe(client),
        client?.email,
        r.telephone || client?.telephone,
        client?.pays,
        d.hebergements.find((h) => h.id === r.hebergementId)?.nom,
        jour(r.arrivee),
        jour(r.depart),
        nombreNuits(r.arrivee, r.depart),
        r.adultes,
        r.enfants,
        r.navette ? "Oui" : "Non",
        r.montantTotal,
        r.montantTotal - solde,
        r.statut === "confirmee" ? solde : null,
        instant(r.creeLe),
        r.factureNumero,
      ]
    }),
  )
}

export function csvEncaissements(paiements: Paiement[], d: Donnees): string {
  return versCsv(
    ["N° de reçu", "Date", "Montant (€)", "Mode", "Note", "Réservation", "Client", "Hébergement", "Enregistré par"],
    [...paiements]
      .sort((a, b) => a.le.localeCompare(b.le))
      .map((p) => {
        const r = d.reservations.find((x) => x.id === p.reservationId)
        const membre = d.equipe.find((m) => m.id === p.enregistrePar)
        return [
          p.numero,
          instant(p.le),
          p.montant,
          MODES_PAIEMENT[p.mode],
          p.note,
          r?.reference,
          r && nomDe(d.clients.find((c) => c.id === r.clientId)),
          r && d.hebergements.find((h) => h.id === r.hebergementId)?.nom,
          membre && nomDe(membre),
        ]
      }),
  )
}

export function csvClients(clients: ClientPublic[], d: Donnees): string {
  return versCsv(
    ["Prénom", "Nom", "E-mail", "Téléphone", "Pays", "Fiche", "Créée le", "Réservations", "Nuits confirmées", "Montant confirmé (€)", "Reste à payer (€)", "Note interne"],
    clients.map((c) => {
      const sejours = d.reservations.filter((r) => r.clientId === c.id)
      const confirmes = sejours.filter((r) => r.statut === "confirmee")
      return [
        c.prenom,
        c.nom,
        c.email,
        c.telephone,
        c.pays,
        c.origine === "site" ? "Compte du site" : "Réception",
        instant(c.creeLe).slice(0, 10),
        sejours.length,
        confirmes.reduce((t, r) => t + nombreNuits(r.arrivee, r.depart), 0),
        confirmes.reduce((t, r) => t + r.montantTotal, 0),
        confirmes.reduce((t, r) => t + Math.max(0, soldeDe(r, d.paiements)), 0),
        c.note,
      ]
    }),
  )
}
