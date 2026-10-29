import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react"
import { comparerNumeros } from "@partage/controles"
import { chevauche } from "@partage/dates"
import { encaisseSur, restaurantDe, soldeSejour } from "@partage/folio"
import type {
  Blocage,
  CalendrierExterne,
  Chambre,
  ClientPublic,
  Consommation,
  DateISO,
  Facture,
  Paiement,
  ReglagesDevises,
  ReglagesFacturation,
  RegleSaison,
  Reservation,
  StatutReservation,
} from "@partage/types"
import type { FiltreChambres, Methode, ResultatApi, RoleEquipe } from "../../partage/ipc"

// Données du logiciel, chargées en une fois depuis GET /api/hotes/donnees (voir app/api/hotes/donnees),
// rechargées après chaque action de l'équipe et à chaque nouveauté du suivi en direct

// Catégorie d'hébergement (« Bungalow Océan ») : prix et capacité de chacune de ses chambres
export type HebergementCourt = {
  id: string
  nom: string
  type: "bungalow" | "chambre"
  capaciteMax: number
  prixNuit: number
  literie: string
  vue: string
}

export type MembreEquipe = { id: string; prenom: string; nom: string; email: string; role: RoleEquipe; actif: boolean; creeLe: string }

// Calendrier d'une plateforme tel que l'envoie l'API : le jeton secret est déjà dans le lien d'export complet
export type Calendrier = Omit<CalendrierExterne, "jeton"> & { urlExport: string }

export type Donnees = {
  hote: { id: string; prenom: string; nom: string; email: string; role: RoleEquipe }
  aujourdhui: string // date du jour à Sainte-Marie, donnée par le serveur
  reservations: Reservation[]
  clients: ClientPublic[]
  hebergements: HebergementCourt[]
  chambres: Chambre[] // chambres numérotées de chaque catégorie, actives ou non
  blocages: Blocage[]
  saisons: RegleSaison[]
  devises: ReglagesDevises
  paiements: Paiement[]
  consommations: Consommation[] // restaurant et bar sur la note des séjours (ariary)
  factures: Facture[] // factures figées (séjours, restaurant, règlements)
  equipe: MembreEquipe[] // vide pour la réception
  calendriers: Calendrier[]
  facturation: ReglagesFacturation // coordonnées imprimées sur les factures et les reçus
}

// Onglets de Restaurant et Bar (la visite guidée les ouvre l'un après l'autre)
export type OngletCaisse = "ensemble" | "vente" | "tickets" | "cloture" | "carte"

// Écrans du logiciel ; `filtre` : statut affiché dans Réservations
export type Vue =
  | { page: "aujourdhui" }
  | { page: "reservations"; filtre?: StatutReservation | null }
  | { page: "planning" }
  | { page: "chambres"; filtre?: FiltreChambres }
  | { page: "restaurant"; onglet?: OngletCaisse }
  | { page: "clients" }
  | { page: "client"; id: string }
  | { page: "revenus" }
  | { page: "statistiques" }
  | { page: "tarifs" }
  | { page: "utilisateurs" }
  | { page: "journal" }
  | { page: "notifications" }
  | { page: "guide"; section?: string }
  | { page: "parametres" }

// Écrans réservés aux gérants (la réception ne les voit pas ; l'API refuse de toute façon)
export const PAGES_GERANTS: Vue["page"][] = ["revenus", "statistiques", "tarifs", "utilisateurs"]

// Seuls écrans d'un caissier (il ne reçoit ni réservations ni clients ; l'API refuse le reste)
export const PAGES_CAISSIER: Vue["page"][] = ["restaurant", "guide", "parametres"]

// Écran ouvert à ce rôle (même règle que la navigation de la Coquille ; reprise par le Guide et la visite guidée)
export function pageAutorisee(role: RoleEquipe, page: Vue["page"]): boolean {
  if (role === "caissier") return PAGES_CAISSIER.includes(page)
  if (role === "reception") return !PAGES_GERANTS.includes(page)
  return true
}

// Fenêtre « Nouvelle réservation », éventuellement préremplie (client, hébergement et chambre, date)
export type Preremplissage = { clientId?: string; hebergementId?: string; chambreId?: string; arrivee?: string }

type ContexteDonnees = {
  donnees: Donnees | null
  erreur: string | null
  recharger: () => Promise<void>
  // Action de l'équipe (PATCH, POST, PUT, DELETE) : données rechargées si elle réussit
  executer: <T = unknown>(methode: Methode, chemin: string, corps?: unknown) => Promise<ResultatApi<T>>
  vue: Vue
  naviguer: (vue: Vue) => void
  // Écran suivant en préparation (rendu en transition) : la coquille affiche le logo en attendant
  changementEcran: boolean
  // Serveur joignable ; hors connexion, le logiciel passe en lecture seule
  enLigne: boolean
  setEnLigne: (valeur: boolean) => void
  recherche: string
  setRecherche: (texte: string) => void
  nouvelleReservation: Preremplissage | null
  ouvrirNouvelleReservation: (preremplissage?: Preremplissage) => void
  fermerNouvelleReservation: () => void
  // Visite guidée sur une base presque vide : données d'exemple affichées à la place des vraies, rien
  // n'est enregistré tant qu'elles sont là (visite/demonstration.ts)
  demonstration: boolean
  setDemonstration: (donnees: Donnees | null) => void
}

const Contexte = createContext<ContexteDonnees | null>(null)

export const MESSAGE_LECTURE_SEULE = "Hors connexion : le logiciel est en lecture seule. Réessayez une fois la connexion rétablie."
const MESSAGE_DEMONSTRATION = "Visite guidée : les données affichées sont des exemples, rien n'est enregistré."

// Données demandées dès la connexion validée (pendant que l'écran de connexion s'efface), reprises par le
// premier chargement du fournisseur au lieu d'un second appel
let prechargement: Promise<ResultatApi<Donnees>> | null = null
export function prechargerDonnees() {
  prechargement = window.avocatier.api<Donnees>("GET", "/api/hotes/donnees")
}

export function FournisseurDonnees({ children }: { children: ReactNode }) {
  const [donnees, setDonnees] = useState<Donnees | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [vue, setVue] = useState<Vue>({ page: "aujourdhui" })
  const [recherche, setRecherche] = useState("")
  const [nouvelleReservation, setNouvelleReservation] = useState<Preremplissage | null>(null)
  const [changementEcran, demarrerChangement] = useTransition()
  const [enLigne, setEnLigne] = useState(true)
  const [exemple, setExemple] = useState<Donnees | null>(null)
  // Lus au moment de l'action, sans recréer `executer` à chaque changement de connexion
  const enLigneActuel = useRef(enLigne)
  const exempleActuel = useRef(exemple)
  useEffect(() => {
    enLigneActuel.current = enLigne
    exempleActuel.current = exemple
  }, [enLigne, exemple])

  const recharger = useCallback(async () => {
    const appel = prechargement ?? window.avocatier.api<Donnees>("GET", "/api/hotes/donnees")
    prechargement = null
    const resultat = await appel
    if (resultat.ok) {
      setDonnees(resultat.donnees)
      setErreur(null)
    } else setErreur(resultat.erreur)
  }, [])

  const executer = useCallback(
    async <T,>(methode: Methode, chemin: string, corps?: unknown): Promise<ResultatApi<T>> => {
      if (exempleActuel.current) return { ok: false, erreur: MESSAGE_DEMONSTRATION }
      if (!enLigneActuel.current) return { ok: false, erreur: MESSAGE_LECTURE_SEULE }
      const resultat = await window.avocatier.api<T>(methode, chemin, corps)
      if (resultat.ok) await recharger()
      return resultat
    },
    [recharger],
  )

  // En transition : l'écran courant reste réactif pendant que le suivant se prépare (longues listes)
  const naviguer = useCallback((nouvelle: Vue) => {
    demarrerChangement(() => {
      setVue(nouvelle)
      // Quitter la liste des réservations efface la recherche qui y menait
      if (nouvelle.page !== "reservations") setRecherche("")
    })
  }, [])

  // Hors connexion, aucune saisie : la fenêtre ne s'ouvre pas
  const ouvrirNouvelleReservation = useCallback((p: Preremplissage = {}) => {
    if (enLigneActuel.current && !exempleActuel.current) setNouvelleReservation(p)
  }, [])
  const fermerNouvelleReservation = useCallback(() => setNouvelleReservation(null), [])

  useEffect(() => {
    // Premier chargement : l'appel réseau met l'état à jour à son retour, pas pendant l'effet
    void recharger()
  }, [recharger])

  const valeur = useMemo(
    () => ({
      donnees: exemple ?? donnees,
      erreur,
      recharger,
      executer,
      vue,
      naviguer,
      changementEcran,
      enLigne,
      setEnLigne,
      recherche,
      setRecherche,
      nouvelleReservation,
      ouvrirNouvelleReservation,
      fermerNouvelleReservation,
      demonstration: exemple !== null,
      setDemonstration: setExemple,
    }),
    [donnees, exemple, erreur, recharger, executer, vue, naviguer, changementEcran, enLigne, recherche, nouvelleReservation, ouvrirNouvelleReservation, fermerNouvelleReservation],
  )
  return <Contexte value={valeur}>{children}</Contexte>
}

export function useDonnees(): ContexteDonnees {
  const contexte = use(Contexte)
  if (!contexte) throw new Error("useDonnees hors de FournisseurDonnees")
  return contexte
}

// Données chargées : les écrans ne s'affichent qu'une fois le premier chargement terminé (voir Coquille)
export function useDonneesChargees() {
  const contexte = useDonnees()
  const d = contexte.donnees!
  return {
    ...contexte,
    d,
    gerant: d.hote.role === "hote",
    clientDe: (r: Reservation) => d.clients.find((c) => c.id === r.clientId),
    hebergementDe: (r: Reservation) => d.hebergements.find((h) => h.id === r.hebergementId),
    chambreDe: (r: Pick<Reservation, "chambreId">) => d.chambres.find((c) => c.id === r.chambreId),
    paiementsDe: (r: Reservation) => d.paiements.filter((p) => p.reservationId === r.id),
  }
}

// Hors connexion : boutons qui enregistrent quelque chose désactivés (l'écriture serait refusée de toute façon)
export function useLectureSeule(): boolean {
  const { enLigne, demonstration } = useDonnees()
  return !enLigne || demonstration
}

export const nomDe = (client?: Pick<ClientPublic, "prenom" | "nom">) => (client ? `${client.prenom} ${client.nom}`.trim() : "Client inconnu")

// Chambres dans l'ordre du site (catégorie après catégorie), puis des numéros (« Océan 2 » avant « Océan 10 »)
export function chambresTriees(d: Pick<Donnees, "hebergements" | "chambres">): Chambre[] {
  const rang = (c: Chambre) => d.hebergements.findIndex((h) => h.id === c.hebergementId)
  return [...d.chambres].sort((a, b) => rang(a) - rang(b) || comparerNumeros(a, b))
}

// « Bungalow Océan · Océan 3 »
export function nomChambre(d: Pick<Donnees, "hebergements" | "chambres">, chambreId: string): string {
  const chambre = d.chambres.find((c) => c.id === chambreId)
  if (!chambre) return "Chambre supprimée"
  return [d.hebergements.find((h) => h.id === chambre.hebergementId)?.nom, chambre.numero].filter(Boolean).join(" · ")
}

// Chambres prises sur [arrivée, départ[ : réservation active ou dates bloquées qui gênent cette provenance.
// `sauf` : réservation modifiée, qui ne se gêne pas elle-même
export function chambresPrises(
  d: Pick<Donnees, "reservations" | "blocages" | "calendriers">,
  arrivee: DateISO,
  depart: DateISO,
  { sauf, source }: { sauf?: string; source?: Reservation["source"] } = {},
): Set<string> {
  if (!arrivee || !depart || depart <= arrivee) return new Set()
  return new Set([
    ...d.reservations
      .filter((r) => r.id !== sauf && (r.statut === "option" || r.statut === "confirmee") && chevauche(arrivee, depart, r.arrivee, r.depart))
      .map((r) => r.chambreId),
    ...d.blocages.filter((b) => chevauche(arrivee, depart, b.debut, b.fin) && blocageGene(b, source, d.calendriers)).map((b) => b.chambreId),
  ])
}

// Chambre pas prête pour ce soir : à nettoyer ou en maintenance. Pour une arrivée du jour, elle n'est pas libre tant
// que son état n'est pas repassé à « Propre » (le serveur refuse aussi, voir chambresLibres de moteurPostgres.ts), sauf
// pour la réservation modifiée qui l'occupe déjà (`garder`) ; les nuits suivantes, l'état du ménage ne compte pas
export const pretePour = (c: Chambre, arrivee: DateISO, aujourdhui: DateISO, garder?: string) => arrivee !== aujourdhui || c.etat === "propre" || c.id === garder

// Chambre attribuée à « Première chambre libre » : la première libre et prête (même ordre que le serveur)
export function premiereChambre(
  d: Pick<Donnees, "hebergements" | "chambres" | "aujourdhui">,
  hebergementId: string,
  prises: Set<string>,
  arrivee: DateISO,
  garder?: string,
): Chambre | undefined {
  return chambresTriees(d).find((c) => c.hebergementId === hebergementId && c.active && !prises.has(c.id) && pretePour(c, arrivee, d.aujourdhui, garder))
}

// Fiches proposées dans les listes et les recherches : pas celles des clients effacés (elles ne restent que pour
// les réservations passées, sous le nom « Client effacé »)
export const clientsVisibles = (clients: ClientPublic[]) => clients.filter((c) => !c.effaceLe)

// Dates importées d'une plateforme qui ne gênent pas une réservation de cette même provenance : c'est la même
// réservation, vue des deux côtés (Booking.com importé, et saisi à la main avec la provenance Booking.com)
export const plateformeDe = (b: Blocage, calendriers: Calendrier[]) => calendriers.find((c) => c.id === b.calendrierId)?.plateforme

export const blocageGene = (b: Blocage, source: Reservation["source"] | undefined, calendriers: Calendrier[]) =>
  !b.calendrierId || plateformeDe(b, calendriers) !== source

// Doubles réservations à venir : dates importées d'une plateforme sur les nuits d'une réservation active d'une
// autre provenance (le serveur refuse ces chevauchements partout ailleurs)
export function doublesReservations(d: Donnees): { blocage: Blocage; reservation: Reservation }[] {
  return d.blocages
    .filter((b) => b.calendrierId && b.fin > d.aujourdhui)
    .flatMap((b) =>
      d.reservations
        .filter(
          (r) =>
            r.chambreId === b.chambreId &&
            (r.statut === "option" || r.statut === "confirmee") &&
            chevauche(b.debut, b.fin, r.arrivee, r.depart) &&
            blocageGene(b, r.source, d.calendriers),
        )
        .map((reservation) => ({ blocage: b, reservation })),
    )
    .sort((a, b) => a.blocage.debut.localeCompare(b.blocage.debut))
}

// Séjour confirmé déjà passé : plus aucune action possible dessus
export const estTermine = (r: Reservation, aujourdhui: string) => r.statut === "confirmee" && r.depart <= aujourdhui

type Note = Pick<Donnees, "paiements" | "consommations" | "devises">

// Total encaissé sur une réservation en euros (remboursements déduits)
export const encaisseDe = (r: Reservation, d: Pick<Donnees, "paiements">) => encaisseSur(r.id, d.paiements)

// Restaurant et bar mis sur la note de la réservation (ariary)
export const restaurantSur = (r: Reservation, d: Pick<Donnees, "consommations">) => restaurantDe(r.id, d.consommations)

// Montant encore dû en euros, restaurant et bar compris (négatif : trop-perçu, à rembourser). Une réservation
// annulée, refusée ou expirée ne doit plus son hébergement : ce qui a été encaissé pour lui est à rendre
export const soldeDe = (r: Reservation, d: Note) => soldeSejour(r, d.paiements, d.consommations, d.devises.taux)

// Facture figée du séjour (avec les autres chambres de son groupe)
export const factureDe = (r: Pick<Reservation, "id">, d: Pick<Donnees, "factures">) => d.factures.find((f) => f.reservationIds.includes(r.id))
