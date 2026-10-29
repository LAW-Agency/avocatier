import { nombreNuits, pluriel } from "@partage/dates"
import { libelleStatutHote } from "@partage/statuts"
import type { ClientPublic, Paiement, Reservation } from "@partage/types"
import type { ColonneClasseur, FeuilleClasseur, ValeurCellule } from "../../partage/ipc"
import { numeroRecu } from "./documents"
import { nomDe, soldeDe, type Donnees } from "./donnees"
import { MODES_PAIEMENT, NOMS_SOURCES } from "./libelles"

// Exports pour Excel : l'interface prépare les données (dates ISO, montants en euros), le processus principal
// met en forme le classeur .xlsx (src/main/classeur.ts). Montants toujours en euros, comme la comptabilité.

// Nom de fichier proposé : « Réservations 2026-10-21.xlsx »
export const nomExport = (quoi: string, aujourdhui: string) => `${quoi} ${aujourdhui}.xlsx`

// « Exporté le 21 octobre 2026 à 14:05 · 12 réservations · montants en euros »
function sousTitre(nombre: string, precision?: string): string {
  const le = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Indian/Antananarivo" })
    .format(new Date())
  return ["Chez L'Avocatier", `exporté le ${le}`, nombre, precision, "montants en euros"].filter(Boolean).join(" · ")
}

const feuille = (nom: string, titre: string, sousTitreFeuille: string, colonnes: ColonneClasseur[], lignes: ValeurCellule[][]): FeuilleClasseur => ({
  nom,
  titre,
  sousTitre: sousTitreFeuille,
  colonnes,
  lignes,
})

const vide = (valeur: string | null | undefined) => valeur || null

export function feuilleReservations(reservations: Reservation[], d: Donnees, precision?: string): FeuilleClasseur {
  return feuille(
    "Réservations",
    "Réservations",
    sousTitre(pluriel(reservations.length, "réservation"), precision),
    [
      { titre: "Référence", format: "texte" },
      { titre: "Statut", format: "texte" },
      { titre: "Provenance", format: "texte" },
      { titre: "Client", format: "texte" },
      { titre: "E-mail", format: "texte" },
      { titre: "Téléphone", format: "texte" },
      { titre: "Pays", format: "texte" },
      { titre: "Hébergement", format: "texte" },
      { titre: "Chambre", format: "texte" },
      { titre: "Arrivée", format: "date" },
      { titre: "Départ", format: "date" },
      { titre: "Nuits", format: "entier", total: true, largeur: 8 },
      { titre: "Adultes", format: "entier", total: true, largeur: 9 },
      { titre: "Enfants", format: "entier", total: true, largeur: 9 },
      { titre: "Navette", format: "texte", largeur: 9 },
      { titre: "Montant", format: "euros", total: true, largeur: 12 },
      { titre: "Encaissé", format: "euros", total: true, largeur: 12 },
      { titre: "Reste à payer", format: "euros", total: true, largeur: 13 },
      { titre: "Reçue le", format: "dateHeure" },
      { titre: "Facture", format: "texte", largeur: 14 },
    ],
    reservations.map((r) => {
      const client = d.clients.find((c) => c.id === r.clientId)
      const solde = soldeDe(r, d)
      return [
        r.reference,
        libelleStatutHote[r.statut],
        NOMS_SOURCES[r.source],
        nomDe(client),
        vide(client?.email),
        vide(r.telephone || client?.telephone),
        vide(client?.pays),
        vide(d.hebergements.find((h) => h.id === r.hebergementId)?.nom),
        vide(d.chambres.find((c) => c.id === r.chambreId)?.numero),
        r.arrivee,
        r.depart,
        nombreNuits(r.arrivee, r.depart),
        r.adultes,
        r.enfants,
        r.navette ? "Oui" : "Non",
        r.montantTotal,
        r.montantTotal - solde,
        r.statut === "confirmee" ? solde : null,
        r.creeLe,
        vide(r.factureNumero),
      ]
    }),
  )
}

export function feuilleEncaissements(paiements: Paiement[], d: Donnees, precision?: string): FeuilleClasseur {
  return feuille(
    "Encaissements",
    "Encaissements",
    sousTitre(pluriel(paiements.length, "encaissement"), precision),
    [
      { titre: "N° de reçu", format: "texte", largeur: 12 },
      { titre: "Date", format: "dateHeure" },
      { titre: "Montant", format: "euros", total: true, largeur: 12 },
      { titre: "Mode", format: "texte" },
      { titre: "Note", format: "texte" },
      { titre: "Réservation", format: "texte" },
      { titre: "Client", format: "texte" },
      { titre: "Hébergement", format: "texte" },
      { titre: "Chambre", format: "texte" },
      { titre: "Enregistré par", format: "texte" },
    ],
    [...paiements]
      .sort((a, b) => a.le.localeCompare(b.le))
      .map((p) => {
        const r = d.reservations.find((x) => x.id === p.reservationId)
        const membre = d.equipe.find((m) => m.id === p.enregistrePar)
        return [
          numeroRecu(p),
          p.le,
          p.montant,
          MODES_PAIEMENT[p.mode],
          vide(p.note),
          vide(r?.reference),
          r ? nomDe(d.clients.find((c) => c.id === r.clientId)) : null,
          vide(r && d.hebergements.find((h) => h.id === r.hebergementId)?.nom),
          vide(r && d.chambres.find((c) => c.id === r.chambreId)?.numero),
          membre ? nomDe(membre) : null,
        ]
      }),
  )
}

export function feuilleClients(clients: ClientPublic[], d: Donnees, precision?: string): FeuilleClasseur {
  return feuille(
    "Clients",
    "Clients",
    sousTitre(pluriel(clients.length, "client"), precision),
    [
      { titre: "Prénom", format: "texte" },
      { titre: "Nom", format: "texte" },
      { titre: "E-mail", format: "texte" },
      { titre: "Téléphone", format: "texte" },
      { titre: "Pays", format: "texte" },
      { titre: "Fiche", format: "texte" },
      { titre: "Créée le", format: "date" },
      { titre: "Réservations", format: "entier", total: true, largeur: 13 },
      { titre: "Nuits confirmées", format: "entier", total: true, largeur: 11 },
      { titre: "Montant confirmé", format: "euros", total: true, largeur: 13 },
      { titre: "Reste à payer", format: "euros", total: true, largeur: 13 },
      { titre: "Note interne", format: "texte" },
    ],
    clients.map((c) => {
      const sejours = d.reservations.filter((r) => r.clientId === c.id)
      const confirmes = sejours.filter((r) => r.statut === "confirmee")
      return [
        c.prenom,
        c.nom,
        vide(c.email),
        vide(c.telephone),
        vide(c.pays),
        c.origine === "site" ? "Compte du site" : "Réception",
        c.creeLe.slice(0, 10),
        sejours.length,
        confirmes.reduce((t, r) => t + nombreNuits(r.arrivee, r.depart), 0),
        confirmes.reduce((t, r) => t + r.montantTotal, 0),
        confirmes.reduce((t, r) => t + Math.max(0, soldeDe(r, d)), 0),
        vide(c.note),
      ]
    }),
  )
}
