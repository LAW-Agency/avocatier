import { ajouterJours, chevauche, nombreNuits } from "@partage/dates"
import type { Blocage, Chambre, ClientPublic, Paiement, Reservation, SourceReservation, StatutReservation } from "@partage/types"
import type { Donnees, HebergementCourt } from "../donnees"

// Données d'exemple de la visite guidée, quand l'hôtel n'a presque rien autour d'aujourd'hui (base neuve) :
// elles ne vivent que dans l'affichage du logiciel, jamais envoyées au serveur (écritures refusées pendant la
// visite, voir `demonstration` dans donnees.tsx) et disparaissent à la fin de la visite.

// Données réelles assez fournies pour la visite : au moins un séjour actif entre il y a une semaine et dans un mois
export function donneesAssezFournies(d: Donnees): boolean {
  const debut = ajouterJours(d.aujourdhui, -7)
  const fin = ajouterJours(d.aujourdhui, 30)
  return d.reservations.some((r) => (r.statut === "option" || r.statut === "confirmee") && chevauche(r.arrivee, r.depart, debut, fin))
}

const CLIENTS: [string, string, string, string][] = [
  ["Claire", "Fontaine", "France", "+33 6 12 34 56 78"],
  ["Hery", "Rakotomalala", "Madagascar", "+261 34 12 345 67"],
  ["Thomas", "Weber", "Allemagne", "+49 151 2345 6789"],
  ["Sofia", "Rossi", "Italie", "+39 347 123 4567"],
  ["Lalaina", "Andrianarisoa", "Madagascar", "+261 32 98 765 43"],
  ["Julien", "Moreau", "France", "+33 7 98 76 54 32"],
  ["Emma", "Dubois", "Belgique", "+32 470 12 34 56"],
  ["Noah", "Martin", "Suisse", "+41 79 123 45 67"],
  ["Anjara", "Rasolofo", "Madagascar", "+261 33 11 222 33"],
  ["Lucas", "Bernard", "France", "+33 6 55 44 33 22"],
]

// Séjours relatifs à aujourd'hui : [arrivée, départ, statut, provenance, part payée, client arrivé, client parti]
type Modele = [number, number, StatutReservation, SourceReservation, number, boolean, boolean]
const SEJOURS: Modele[] = [
  [-2, 3, "confirmee", "site", 0.3, true, false], // sur place
  [0, 4, "confirmee", "whatsapp", 0.3, false, false], // arrivée du jour
  [-4, 0, "confirmee", "telephone", 0.5, true, false], // départ du jour, reste à encaisser
  [5, 9, "option", "site", 0, false, false], // demande à traiter
  [12, 15, "option", "site", 0, false, false],
  [2, 6, "confirmee", "booking", 1, false, false],
  [8, 13, "confirmee", "whatsapp", 0.3, false, false],
  [-10, -6, "confirmee", "site", 1, true, true], // séjour passé
  [20, 23, "annulee", "site", 0, false, false],
  [16, 21, "confirmee", "telephone", 0, false, false],
  [1, 3, "confirmee", "sur_place", 0, false, false],
  [-1, 2, "confirmee", "airbnb", 1, true, false],
]

const HEBERGEMENTS_EXEMPLE: HebergementCourt[] = [
  { id: "ex-ocean", nom: "Bungalow Océan", type: "bungalow", capaciteMax: 3, prixNuit: 120, literie: "Lit double", vue: "Océan" },
  { id: "ex-jardin", nom: "Bungalow Jardin", type: "bungalow", capaciteMax: 2, prixNuit: 85, literie: "Lit double", vue: "Jardin" },
]

export function donneesDeDemonstration(reel: Donnees): Donnees {
  const jour = reel.aujourdhui
  const le = (decalage: number, heure = "09:00") => `${ajouterJours(jour, decalage)}T${heure}:00.000+03:00`

  // Catégories et chambres réelles si l'hôtel en a, sinon deux catégories d'exemple de trois chambres
  const hebergements = reel.hebergements.length > 0 ? reel.hebergements : HEBERGEMENTS_EXEMPLE
  let chambres: Chambre[] = reel.chambres.filter((c) => c.active)
  if (chambres.length === 0) {
    chambres = hebergements.flatMap((h, i) =>
      [1, 2, 3].map((n) => ({ id: `ex-ch-${i}-${n}`, hebergementId: h.id, numero: `${h.nom.split(" ").pop()} ${n}`, etat: "propre" as const, noteEtat: "", active: true })),
    )
  }
  // Un peu de ménage et une maintenance, pour que l'écran Chambres ait de quoi montrer
  chambres = chambres.map((c, i, toutes) =>
    i === toutes.length - 1 && toutes.length > 2
      ? { ...c, etat: "maintenance", noteEtat: "Moustiquaire à changer (exemple)" }
      : i === toutes.length - 2 && toutes.length > 3
        ? { ...c, etat: "a_nettoyer", noteEtat: "" }
        : c,
  )
  const autresChambres = reel.chambres.filter((c) => !chambres.some((x) => x.id === c.id))

  const clients: ClientPublic[] = CLIENTS.map(([prenom, nom, pays, telephone], i) => ({
    id: `ex-client-${i + 1}`,
    role: "client",
    email: `${prenom}.${nom}`.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "") + "@exemple.test",
    prenom,
    nom,
    telephone,
    pays,
    creeLe: le(-60 + i * 3),
    actif: true,
    origine: i % 3 === 2 ? "reception" : "site",
    note: i === 0 ? "Allergique aux fruits de mer (exemple)" : "",
  }))

  // Chaque séjour va dans la première chambre libre à ses dates (réservations réelles comprises)
  const occupees = reel.reservations.filter((r) => r.statut === "option" || r.statut === "confirmee")
  const reservations: Reservation[] = []
  const paiements: Paiement[] = []
  SEJOURS.forEach(([a, dep, statut, source, part, arrive, parti], i) => {
    const arrivee = ajouterJours(jour, a)
    const depart = ajouterJours(jour, dep)
    const actif = statut === "option" || statut === "confirmee"
    const prises = [...occupees, ...reservations.filter((r) => r.statut === "option" || r.statut === "confirmee")]
    // Départ décalé d'une chambre à l'autre, pour étaler les séjours sur tout le planning
    const ordre = [...chambres.slice(i % chambres.length), ...chambres.slice(0, i % chambres.length)]
    const chambre = ordre.find((c) => !(actif && c.etat === "maintenance") && !prises.some((r) => r.chambreId === c.id && chevauche(r.arrivee, r.depart, arrivee, depart)))
    if (!chambre) return
    const hebergement = hebergements.find((h) => h.id === chambre.hebergementId) ?? hebergements[0]
    const montantTotal = nombreNuits(arrivee, depart) * hebergement.prixNuit
    const client = clients[i % clients.length]
    const creeLe = le(Math.min(a, 0) - 12)
    const id = `ex-resa-${i + 1}`
    reservations.push({
      id,
      reference: `AVO-EX-${String(i + 1).padStart(3, "0")}`,
      clientId: client.id,
      hebergementId: hebergement.id,
      chambreId: chambre.id,
      arrivee,
      depart,
      adultes: Math.min(2, hebergement.capaciteMax),
      enfants: i % 4 === 1 && hebergement.capaciteMax > 2 ? 1 : 0,
      navette: i % 3 === 0,
      telephone: client.telephone,
      message: statut === "option" ? "Bonjour, pourrions-nous arriver vers 15 h ? Merci ! (exemple)" : "",
      montantTotal,
      statut,
      source,
      creeLe,
      expireLe: statut === "option" ? le(1, "18:00") : undefined,
      historique:
        statut === "option"
          ? [{ statut: "option", le: creeLe }]
          : [
              { statut: "option", le: creeLe },
              { statut, le: le(Math.min(a, 0) - 11), ...(statut === "annulee" ? { note: "Vol annulé (exemple)" } : {}) },
            ],
      arriveeLe: arrive ? le(a, "14:30") : undefined,
      departLe: parti ? le(dep, "10:00") : undefined,
    })
    if (part > 0) paiements.push({ id: `ex-paiement-${i + 1}`, reservationId: id, montant: Math.round(montantTotal * part), mode: i % 2 ? "mobile_money" : "especes", note: "", le: le(Math.min(a, 0) - 5, "11:00"), numero: 9000 + i })
  })

  // Une fermeture à venir sur une chambre libre à ces dates
  const debutBlocage = ajouterJours(jour, 25)
  const finBlocage = ajouterJours(jour, 28)
  const libre = chambres.find((c) => ![...occupees, ...reservations].some((r) => r.chambreId === c.id && chevauche(r.arrivee, r.depart, debutBlocage, finBlocage)))
  const blocages: Blocage[] = libre
    ? [...reel.blocages, { id: "ex-blocage", hebergementId: libre.hebergementId, chambreId: libre.id, debut: debutBlocage, fin: finBlocage, raison: "Travaux de toiture (exemple)" }]
    : reel.blocages

  return {
    ...reel,
    hebergements,
    chambres: [...chambres, ...autresChambres],
    clients: [...reel.clients, ...clients],
    reservations: [...reel.reservations, ...reservations],
    paiements: [...reel.paiements, ...paiements],
    blocages,
  }
}
