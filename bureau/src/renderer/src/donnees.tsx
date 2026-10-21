import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import type { Blocage, ClientPublic, EtatChambre, Paiement, ReglagesDevises, RegleSaison, Reservation, StatutReservation } from "@partage/types"
import type { Methode, ResultatApi, RoleEquipe } from "../../partage/ipc"

// Données du logiciel, chargées en une fois depuis GET /api/hotes/donnees (voir app/api/hotes/donnees),
// rechargées après chaque action de l'équipe et à chaque nouveauté du suivi en direct

export type HebergementCourt = {
  id: string
  nom: string
  type: "bungalow" | "chambre"
  capaciteMax: number
  prixNuit: number
  literie: string
  vue: string
  etat: EtatChambre
  noteEtat: string
}

export type MembreEquipe = { id: string; prenom: string; nom: string; email: string; role: RoleEquipe; actif: boolean; creeLe: string }

export type Donnees = {
  hote: { id: string; prenom: string; nom: string; email: string; role: RoleEquipe }
  aujourdhui: string // date du jour à Sainte-Marie, donnée par le serveur
  reservations: Reservation[]
  clients: ClientPublic[]
  hebergements: HebergementCourt[]
  blocages: Blocage[]
  saisons: RegleSaison[]
  devises: ReglagesDevises
  paiements: Paiement[]
  equipe: MembreEquipe[] // vide pour la réception
}

// Écrans du logiciel ; `filtre` : statut affiché dans Réservations
export type Vue =
  | { page: "aujourdhui" }
  | { page: "reservations"; filtre?: StatutReservation | null }
  | { page: "planning" }
  | { page: "chambres" }
  | { page: "clients" }
  | { page: "client"; id: string }
  | { page: "revenus" }
  | { page: "statistiques" }
  | { page: "tarifs" }
  | { page: "utilisateurs" }
  | { page: "parametres" }

// Écrans réservés aux gérants (la réception ne les voit pas ; l'API refuse de toute façon)
export const PAGES_GERANTS: Vue["page"][] = ["revenus", "statistiques", "tarifs", "utilisateurs"]

// Fenêtre « Nouvelle réservation », éventuellement préremplie (client, hébergement, date)
export type Preremplissage = { clientId?: string; hebergementId?: string; arrivee?: string }

type ContexteDonnees = {
  donnees: Donnees | null
  erreur: string | null
  recharger: () => Promise<void>
  // Action de l'équipe (PATCH, POST, PUT, DELETE) : données rechargées si elle réussit
  executer: <T = unknown>(methode: Methode, chemin: string, corps?: unknown) => Promise<ResultatApi<T>>
  vue: Vue
  naviguer: (vue: Vue) => void
  recherche: string
  setRecherche: (texte: string) => void
  nouvelleReservation: Preremplissage | null
  ouvrirNouvelleReservation: (preremplissage?: Preremplissage) => void
  fermerNouvelleReservation: () => void
}

const Contexte = createContext<ContexteDonnees | null>(null)

export function FournisseurDonnees({ children }: { children: ReactNode }) {
  const [donnees, setDonnees] = useState<Donnees | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [vue, setVue] = useState<Vue>({ page: "aujourdhui" })
  const [recherche, setRecherche] = useState("")
  const [nouvelleReservation, setNouvelleReservation] = useState<Preremplissage | null>(null)

  const recharger = useCallback(async () => {
    const resultat = await window.avocatier.api<Donnees>("GET", "/api/hotes/donnees")
    if (resultat.ok) {
      setDonnees(resultat.donnees)
      setErreur(null)
    } else setErreur(resultat.erreur)
  }, [])

  const executer = useCallback(
    async <T,>(methode: Methode, chemin: string, corps?: unknown) => {
      const resultat = await window.avocatier.api<T>(methode, chemin, corps)
      if (resultat.ok) await recharger()
      return resultat
    },
    [recharger],
  )

  const naviguer = useCallback((nouvelle: Vue) => {
    setVue(nouvelle)
    // Quitter la liste des réservations efface la recherche qui y menait
    if (nouvelle.page !== "reservations") setRecherche("")
  }, [])

  const ouvrirNouvelleReservation = useCallback((p: Preremplissage = {}) => setNouvelleReservation(p), [])
  const fermerNouvelleReservation = useCallback(() => setNouvelleReservation(null), [])

  useEffect(() => {
    // Premier chargement : l'appel réseau met l'état à jour à son retour, pas pendant l'effet
    void recharger()
  }, [recharger])

  const valeur = useMemo(
    () => ({
      donnees,
      erreur,
      recharger,
      executer,
      vue,
      naviguer,
      recherche,
      setRecherche,
      nouvelleReservation,
      ouvrirNouvelleReservation,
      fermerNouvelleReservation,
    }),
    [donnees, erreur, recharger, executer, vue, naviguer, recherche, nouvelleReservation, ouvrirNouvelleReservation, fermerNouvelleReservation],
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
    paiementsDe: (r: Reservation) => d.paiements.filter((p) => p.reservationId === r.id),
  }
}

export const nomDe = (client?: Pick<ClientPublic, "prenom" | "nom">) => (client ? `${client.prenom} ${client.nom}`.trim() : "Client inconnu")

// Séjour confirmé déjà passé : plus aucune action possible dessus
export const estTermine = (r: Reservation, aujourdhui: string) => r.statut === "confirmee" && r.depart <= aujourdhui

// Montant encore dû sur une réservation confirmée (encaissements déduits, remboursements ajoutés)
export const soldeDe = (r: Reservation, paiements: Paiement[]) =>
  r.montantTotal - paiements.filter((p) => p.reservationId === r.id).reduce((total, p) => total + p.montant, 0)
