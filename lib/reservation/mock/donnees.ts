import { hacherMotDePasse } from "@/lib/auth/motDePasse"
import { ajouterJours, aujourdhuiISO } from "../dates"
import { calculerDevis } from "../regles"
import type { Blocage, Client, Hebergement, Reservation, Saison, StatutReservation } from "../types"

// DONNÉES MOCK — base en mémoire en attendant PostgreSQL.
// TODO client : noms, capacités, literie, équipements et prix des hébergements sont fictifs, à remplacer.
// Les photos sont celles du client, mais leur attribution à chaque hébergement est à confirmer.

export const hebergements: Hebergement[] = [
  {
    id: "h1",
    slug: "bungalow-ocean",
    nom: "Bungalow Océan",
    type: "bungalow",
    description: "Au premier rang du jardin, la terrasse ouvre sur le lagon.",
    image: "/images/rooms/bungalow-ocean.jpeg",
    capaciteMax: 2,
    literie: "1 lit double",
    vue: "Vue mer",
    prixNuit: 85,
    presentation:
      "Murs vert profond, charpente blanche et suspensions tressées : le Bungalow Océan est pensé pour deux. Le lit à baldaquin, voilé de sa moustiquaire, fait face à la terrasse ; au réveil, l’océan est à quelques pas à travers le jardin.",
    galerie: ["/images/rooms/bungalow-ocean-2.jpeg", "/images/rooms/sdb-palmiers.jpeg"],
    salleDeBains: "Salle d’eau privative, double vasque, fresque de palmiers",
    equipements: ["moustiquaire", "wifi", "coffre-fort", "linge"],
  },
  {
    id: "h2",
    slug: "bungalow-jardin",
    nom: "Bungalow Jardin",
    type: "bungalow",
    description: "Niché sous les arbres fruitiers, au calme, à quelques pas de la piscine.",
    image: "/images/rooms/bungalow-jardin.jpeg",
    capaciteMax: 3,
    literie: "1 lit double + 1 lit simple",
    vue: "Vue jardin",
    prixNuit: 70,
    presentation:
      "Un bungalow aux murs violine, où un lit double et un lit simple trouvent chacun leur place sous la moustiquaire. Au calme du jardin, à quelques pas de la piscine : idéal pour un couple avec un enfant, ou trois amis.",
    galerie: ["/images/rooms/bungalow-jardin-2.jpeg", "/images/rooms/sdb-bambous.jpeg", "/images/rooms/douche-blanche.jpeg"],
    salleDeBains: "Salle d’eau privative, double vasque, douche à l’italienne",
    equipements: ["moustiquaire", "wifi", "coffre-fort", "linge"],
  },
  {
    id: "h3",
    slug: "bungalow-famille",
    nom: "Bungalow Famille",
    type: "bungalow",
    description: "Un grand espace lumineux sous la charpente, avec coin bureau, pour les séjours en famille.",
    image: "/images/rooms/bungalow-famille.jpeg",
    capaciteMax: 5,
    literie: "1 lit double + 3 lits simples",
    vue: "Vue jardin et piscine",
    prixNuit: 110,
    presentation:
      "Le plus grand de nos hébergements : un vaste espace sous une haute charpente blanche, ouvert sur la végétation. Le lit double à baldaquin, les lits simples et un coin bureau laissent à chacun son espace, pour des vacances en famille sans se marcher dessus.",
    galerie: ["/images/rooms/bungalow-famille-2.jpeg", "/images/rooms/sdb-jungle.jpeg", "/images/rooms/douche-ardoise.jpeg"],
    salleDeBains: "Salle d’eau privative, double vasque, douche en ardoise",
    equipements: ["moustiquaire", "wifi", "coffre-fort", "bureau", "television", "linge"],
  },
  {
    id: "h4",
    slug: "chambre-verte",
    nom: "Chambre Verte",
    type: "chambre",
    description: "Une chambre simple et lumineuse, idéale pour une escale sur l'île.",
    image: "/images/rooms/chambre-verte.jpeg",
    capaciteMax: 2,
    literie: "1 lit double",
    vue: "Vue jardin",
    prixNuit: 55,
    presentation:
      "Murs vert forêt, lit à baldaquin et quelques fleurs fraîches posées sur les draps : une chambre simple et soignée, parfaite pour une escale sur l’île. La salle d’eau est peinte d’un paysage de collines.",
    galerie: ["/images/rooms/chambre-verte-2.jpeg", "/images/rooms/sdb-paysage.jpeg", "/images/rooms/sdb-paysage-2.jpeg"],
    salleDeBains: "Salle d’eau privative, douche à l’italienne, fresque de collines",
    equipements: ["moustiquaire", "wifi", "coffre-fort", "linge"],
  },
  {
    id: "h5",
    slug: "chambre-ocre",
    nom: "Chambre Ocre",
    type: "chambre",
    description: "Des murs couleur terre et un grand lit à baldaquin, au calme du jardin.",
    image: "/images/rooms/chambre-ocre.jpeg",
    capaciteMax: 2,
    literie: "1 lit double",
    vue: "Vue jardin",
    prixNuit: 60,
    presentation:
      "Murs ocre, parquet sombre et branches blanches en décor : la Chambre Ocre a la douceur d’une fin de journée. Le grand lit à baldaquin et sa moustiquaire invitent aux longues siestes, à l’abri de la chaleur.",
    galerie: ["/images/rooms/chambre-ocre-2.jpeg", "/images/rooms/sdb-palmiers-2.jpeg"],
    salleDeBains: "Salle d’eau privative, double vasque, fresque de palmiers",
    equipements: ["moustiquaire", "wifi", "coffre-fort", "linge"],
  },
]

// Saisons recalculées chaque année (l'année passée couvre les fêtes à cheval sur janvier)
function saisonsAutourDe(annee: number): Saison[] {
  return [annee - 1, annee, annee + 1].flatMap((a) => [
    { nom: "Haute saison", debut: `${a}-07-01`, fin: `${a}-09-01`, coefficient: 1.2, sejourMin: 3 },
    { nom: "Fêtes de fin d'année", debut: `${a}-12-20`, fin: `${a + 1}-01-05`, coefficient: 1.3, sejourMin: 5 },
  ])
}

// Comptes de démonstration (données mock uniquement) : se connecter avec ces identifiants
export const COMPTE_DEMO = { email: "demo@avocatier.test", motDePasse: "vohilava-demo" }
// Compte hôte : ouvre l'espace /admin
export const COMPTE_HOTE = { email: "hotes@avocatier.test", motDePasse: "avocatier-hotes" }

export function creerCompteHote(): Client {
  return {
    id: "hote",
    role: "hote",
    email: COMPTE_HOTE.email,
    prenom: "Joëlle & Stéphane",
    nom: "",
    telephone: "",
    pays: "Madagascar",
    motDePasseHash: hacherMotDePasse(COMPTE_HOTE.motDePasse),
    creeLe: new Date().toISOString(),
  }
}

export type BaseMock = {
  hebergements: Hebergement[]
  saisons: Saison[]
  clients: Client[]
  reservations: Reservation[]
  blocages: Blocage[]
  compteur: number // dernier numéro de référence attribué
}

export function creerBaseMock(): BaseMock {
  const aujourdhui = aujourdhuiISO()
  const jour = (decalage: number) => ajouterJours(aujourdhui, decalage)
  const maintenant = new Date().toISOString()
  const saisons = saisonsAutourDe(Number(aujourdhui.slice(0, 4)))

  const demo: Client = {
    id: "c1",
    role: "client",
    email: COMPTE_DEMO.email,
    prenom: "Claire",
    nom: "Démo",
    telephone: "+33 6 00 00 00 00",
    pays: "France",
    motDePasseHash: hacherMotDePasse(COMPTE_DEMO.motDePasse),
    creeLe: maintenant,
  }
  // Autres clients fictifs, pour que l'espace hôtes ait de quoi afficher (sans mot de passe utilisable)
  const autreClient = (id: string, prenom: string, telephone: string, pays: string): Client => ({
    id,
    role: "client",
    email: `${prenom.toLowerCase()}@exemple.test`,
    prenom,
    nom: "Démo",
    telephone,
    pays,
    motDePasseHash: "",
    creeLe: maintenant,
  })
  const lucas = autreClient("c2", "Lucas", "+33 7 00 00 00 00", "France")
  const aina = autreClient("c3", "Aina", "+261 34 00 000 00", "Madagascar")

  let compteur = 0
  const reservation = (
    hebergementId: string,
    arrivee: string,
    depart: string,
    statut: StatutReservation,
    demandeIlYaHeures: number, // ancienneté de la demande ; confirmation un jour plus tard
    extra: Partial<Reservation> = {},
  ): Reservation => {
    compteur += 1
    const demandeLe = new Date(Date.now() - demandeIlYaHeures * 3_600_000).toISOString()
    const confirmeLe = new Date(Date.now() - (demandeIlYaHeures - 24) * 3_600_000).toISOString()
    const hebergement = hebergements.find((h) => h.id === hebergementId)!
    return {
      id: `r${compteur}`,
      reference: `AVO-${arrivee.slice(0, 4)}-${String(compteur).padStart(4, "0")}`,
      clientId: demo.id,
      hebergementId,
      arrivee,
      depart,
      adultes: 2,
      enfants: 0,
      navette: false,
      telephone: demo.telephone,
      message: "",
      montantTotal: calculerDevis(hebergement, arrivee, depart, saisons).total,
      statut,
      source: "site",
      creeLe: demandeLe,
      historique: [{ statut: "option", le: demandeLe }, ...(statut === "option" ? [] : [{ statut, le: confirmeLe }])],
      ...extra,
    }
  }

  return {
    hebergements,
    saisons,
    clients: [creerCompteHote(), demo, lucas, aina],
    reservations: [
      reservation("h4", jour(-90), jour(-85), "confirmee", 24 * 130),
      reservation("h2", jour(40), jour(47), "confirmee", 24 * 12, { enfants: 1, navette: true }),
      reservation("h1", jour(60), jour(64), "option", 12, {
        expireLe: new Date(Date.now() + 36 * 3_600_000).toISOString(),
        message: "Arrivée par le vol de l'après-midi.",
      }),
      // Pour l'espace hôtes : un départ et une arrivée aujourd'hui, deux demandes à traiter
      reservation("h2", jour(-3), jour(0), "confirmee", 24 * 20, { clientId: lucas.id, telephone: lucas.telephone }),
      reservation("h4", jour(0), jour(4), "confirmee", 24 * 9, { clientId: aina.id, telephone: aina.telephone, navette: true }),
      reservation("h3", jour(2), jour(6), "option", 40, {
        clientId: lucas.id,
        telephone: lucas.telephone,
        adultes: 2,
        enfants: 2,
        expireLe: new Date(Date.now() + 8 * 3_600_000).toISOString(),
        message: "Nous voyageons avec deux enfants de 4 et 7 ans.",
      }),
      reservation("h1", jour(14), jour(18), "option", 6, {
        clientId: aina.id,
        telephone: aina.telephone,
        expireLe: new Date(Date.now() + 42 * 3_600_000).toISOString(),
      }),
    ],
    blocages: [
      { id: "b1", hebergementId: "h1", debut: jour(5), fin: jour(12), raison: "Réservation Booking.com (import iCal)" },
      { id: "b2", hebergementId: "h3", debut: jour(8), fin: jour(15), raison: "Réservation WhatsApp saisie par les hôtes" },
      // Établissement complet : ces nuits apparaissent grisées dans le calendrier
      ...hebergements.map((h) => ({ id: `b-priv-${h.id}`, hebergementId: h.id, debut: jour(20), fin: jour(23), raison: "Privatisation" })),
    ],
    compteur,
  }
}
