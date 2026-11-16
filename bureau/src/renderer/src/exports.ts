import { jourDe, nombreNuits, pluriel } from "@partage/dates"
import { libelleStatutHote } from "@partage/statuts"
import { DEVISES } from "@partage/devises"
import type { ClientPublic, CodeDevise, Paiement, Reservation } from "@partage/types"
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

// Devise et montant réellement reçus (un encaissement en euros, ou ancien sans montant d'origine : son montant)
const recuDe = (p: Paiement): { devise: CodeDevise; montant: number } =>
  p.devise !== "EUR" && p.montantDevise !== undefined ? { devise: p.devise, montant: p.montantDevise } : { devise: "EUR", montant: p.montant }

// Ariary d'abord, puis l'euro, puis les autres devises reçues
const ordreDevises = (codes: Iterable<CodeDevise>) => [...new Set(codes)].sort((a, b) => Number(b === "MGA") - Number(a === "MGA") || Number(b === "EUR") - Number(a === "EUR") || a.localeCompare(b))

const colonneDevise = (titre: string, devise: CodeDevise, total = true): ColonneClasseur => ({
  titre,
  format: "montant",
  unite: DEVISES[devise].symbole,
  decimales: devise === "MGA" ? 0 : 2,
  total,
  largeur: 14,
})

// Encaissements : contre-valeur en euros (comptabilité) et, colonne par devise, le montant réellement reçu, totalisé
// dans sa devise (ce qui doit se trouver en caisse ou sur le compte). Deuxième onglet : récapitulatif par devise et mode
export function feuilleEncaissements(paiements: Paiement[], d: Donnees, precision?: string): FeuilleClasseur[] {
  const devises = ordreDevises(paiements.map((p) => recuDe(p).devise))
  const tries = [...paiements].sort((a, b) => a.le.localeCompare(b.le))
  const detail = feuille(
    "Encaissements",
    "Encaissements",
    sousTitre(pluriel(paiements.length, "encaissement"), precision),
    [
      { titre: "N° de reçu", format: "texte", largeur: 12 },
      { titre: "Date", format: "dateHeure" },
      { titre: "Montant", format: "euros", total: true, largeur: 12 },
      { titre: "Reçu en", format: "texte", largeur: 9 },
      ...devises.map((code) => colonneDevise(`Reçu (${DEVISES[code].symbole})`, code)),
      { titre: "Taux (1 € =)", format: "montant", decimales: 2, largeur: 12 },
      { titre: "Mode", format: "texte" },
      { titre: "Note", format: "texte" },
      { titre: "Réservation", format: "texte" },
      { titre: "Client", format: "texte" },
      { titre: "Hébergement", format: "texte" },
      { titre: "Chambre", format: "texte" },
      { titre: "Enregistré par", format: "texte" },
    ],
    tries.map((p) => {
      const r = d.reservations.find((x) => x.id === p.reservationId)
      const membre = d.equipe.find((m) => m.id === p.enregistrePar)
      const recu = recuDe(p)
      return [
        numeroRecu(p),
        p.le,
        p.montant,
        recu.devise,
        ...devises.map((code) => (code === recu.devise ? recu.montant : null)),
        recu.devise !== "EUR" ? (p.taux ?? null) : null,
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

  // Récapitulatif : une ligne par devise et mode, reçu et remboursé séparés, net dans la devise et en euros
  const groupes = new Map<string, { devise: CodeDevise; mode: Paiement["mode"]; nombre: number; recu: number; rembourse: number; euros: number }>()
  for (const p of tries) {
    const { devise, montant } = recuDe(p)
    const cle = `${devise}:${p.mode}`
    const g = groupes.get(cle) ?? { devise, mode: p.mode, nombre: 0, recu: 0, rembourse: 0, euros: 0 }
    g.nombre++
    if (montant >= 0) g.recu += montant
    else g.rembourse -= montant
    g.euros += p.montant
    groupes.set(cle, g)
  }
  const arrondi = (montant: number, devise: CodeDevise) => (devise === "MGA" ? Math.round(montant) : Math.round(montant * 100) / 100)
  const ordre = ordreDevises([...groupes.values()].map((g) => g.devise))
  const lignes = [...groupes.values()].sort((a, b) => ordre.indexOf(a.devise) - ordre.indexOf(b.devise) || MODES_PAIEMENT[a.mode].localeCompare(MODES_PAIEMENT[b.mode], "fr"))
  const recap = feuille(
    "Par devise",
    "Encaissements par devise reçue",
    sousTitre(pluriel(paiements.length, "encaissement"), precision).replace("montants en euros", "montants dans la devise reçue, contre-valeur en euros"),
    [
      { titre: "Devise", format: "texte" },
      { titre: "Mode", format: "texte" },
      { titre: "Encaissements", format: "entier", total: true, largeur: 14 },
      { titre: "Reçu", format: "montant", decimales: 2, largeur: 16 },
      { titre: "Remboursé", format: "montant", decimales: 2, largeur: 14 },
      { titre: "Net", format: "montant", decimales: 2, largeur: 16 },
      { titre: "Contre-valeur", format: "euros", total: true, largeur: 14 },
    ],
    lignes.map((g) => [
      `${DEVISES[g.devise].nom} (${DEVISES[g.devise].symbole})`,
      MODES_PAIEMENT[g.mode],
      g.nombre,
      arrondi(g.recu, g.devise),
      g.rembourse ? arrondi(g.rembourse, g.devise) : null,
      arrondi(g.recu - g.rembourse, g.devise),
      Math.round(g.euros * 100) / 100,
    ]),
  )
  return [detail, recap]
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
        jourDe(c.creeLe),
        sejours.length,
        confirmes.reduce((t, r) => t + nombreNuits(r.arrivee, r.depart), 0),
        confirmes.reduce((t, r) => t + r.montantTotal, 0),
        confirmes.reduce((t, r) => t + Math.max(0, soldeDe(r, d)), 0),
        vide(c.note),
      ]
    }),
  )
}
