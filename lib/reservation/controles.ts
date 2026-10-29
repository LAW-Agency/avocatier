import { ajouterJours, aujourdhuiISO, estDateISO, formaterPlage, formaterPrix, nombreNuits, pluriel } from "./dates"
import { CODES_DEVISES, DEVISE_REFERENCE } from "./devises"
import { CHAMBRES_PAR_DEMANDE_MAX, chevauchementSaisons, deplierSaisons, estJourAnnee, NUITS_MAX, verifierDates } from "./regles"
import type {
  Chambre,
  DateISO,
  ModificationClient,
  ModificationReservation,
  NouveauCalendrier,
  Plateforme,
  ReglagesFacturation,
  EtatChambre,
  ModePaiement,
  NouveauBlocage,
  NouveauClientLocal,
  ReservationDirecte,
  DemandeReservation,
  Hebergement,
  ModificationTarifs,
  ReglagesDevises,
  RegleSaison,
  Reservation,
  RoleEquipe,
  Saison,
  StatutReservation,
} from "./types"

// Contrôles serveur du moteur, séparés de l'accès aux données (purs) : à reprendre par toute autre implémentation.
// Chacun renvoie le message d'erreur à afficher, ou null si tout va bien.

export const DUREE_OPTION_MS = 48 * 3_600_000
// Statuts qui bloquent les dates (en PostgreSQL : contrainte d'exclusion sur ces lignes)
export const STATUTS_ACTIFS: StatutReservation[] = ["option", "confirmee"]

export const DATES_PRISES = "Ces dates viennent d'être réservées. Choisissez d'autres dates ou un autre hébergement."

// Bornes des tarifs saisis par les hôtes (contrôle serveur : une Server Action est appelable directement)
const PRIX_MAX = 10_000
const COEFFICIENT = { min: 0.5, max: 3 }
const TAUX_MAX = 1_000_000
const SAISONS_MAX = 12
const NOM_SAISON_MAX = 40

const estEntre = (n: number, min: number, max: number) => Number.isFinite(n) && n >= min && n <= max

// Changements de statut permis aux hôtes
const TRANSITIONS: Partial<Record<StatutReservation, StatutReservation[]>> = {
  option: ["confirmee", "refusee"],
  confirmee: ["annulee"],
}

// Saisons datées de l'an dernier (fêtes à cheval sur janvier) à dans deux ans (réservations à l'avance)
export function saisonsDatees(regles: RegleSaison[]): Saison[] {
  const annee = Number(aujourdhuiISO().slice(0, 4))
  return deplierSaisons(regles, [annee - 1, annee, annee + 1, annee + 2])
}

// Tout sauf la disponibilité, que chaque implémentation vérifie au moment d'écrire
export function controlerDemande(demande: DemandeReservation, hebergement: Hebergement | undefined, saisons: Saison[]): string | null {
  if (!hebergement) return "Cet hébergement n'existe pas."

  const { arrivee, depart, adultes, enfants, chambres } = demande
  if (!estDateISO(arrivee) || !estDateISO(depart)) return "Dates invalides."
  const erreurDates = verifierDates(arrivee, depart, aujourdhuiISO(), saisons)
  if (erreurDates) return erreurDates

  if (!Number.isInteger(chambres) || chambres < 1 || chambres > CHAMBRES_PAR_DEMANDE_MAX) {
    return `De 1 à ${CHAMBRES_PAR_DEMANDE_MAX} chambres par demande : pour un groupe plus grand, contactez-nous directement.`
  }
  if (!Number.isInteger(adultes) || !Number.isInteger(enfants) || adultes < 1 || enfants < 0) {
    return "Nombre de voyageurs invalide."
  }
  if (adultes < chambres) return "Il faut au moins un adulte par chambre."
  if (adultes + enfants > hebergement.capaciteMax * chambres) {
    return chambres === 1
      ? `${hebergement.nom} accueille ${hebergement.capaciteMax} personnes au maximum.`
      : `${pluriel(chambres, "chambre")} ${hebergement.nom} accueillent ${hebergement.capaciteMax * chambres} personnes au maximum.`
  }
  return null
}

export function controlerChangementStatut(
  reservation: Pick<Reservation, "statut" | "depart"> | undefined,
  statut: StatutReservation,
): string | null {
  if (!reservation) return "Réservation introuvable."
  if (!TRANSITIONS[reservation.statut]?.includes(statut)) {
    return "Ce changement n'est plus possible : la réservation a changé entre-temps."
  }
  if (statut === "annulee" && reservation.depart <= aujourdhuiISO()) {
    return "Ce séjour est terminé : il ne peut plus être annulé."
  }
  return null
}

// Tout sauf le chevauchement avec une réservation active (voir blocageEnConflit). `trouvees` : chambres
// demandées qui existent
export function controlerBlocage(blocage: NouveauBlocage, trouvees: Chambre[]): string | null {
  if (blocage.chambreIds.length === 0) return "Choisissez au moins une chambre."
  if (trouvees.length !== new Set(blocage.chambreIds).size) return "Une des chambres choisies n'existe plus."
  if (!estDateISO(blocage.debut) || !estDateISO(blocage.fin)) return "Dates invalides."
  if (blocage.fin <= blocage.debut) return "La fin doit suivre le début."
  return null
}

export function blocageEnConflit(reference: string, chambre: string): string {
  return `Ces dates chevauchent la réservation ${reference} (${chambre}).`
}

// --- Chambres ---

const NUMERO_MAX = 30

// Numéro saisi par l'équipe, nettoyé (« Océan 3 »), ou l'erreur à afficher
export function normaliserNumero(numero: unknown): { numero: string } | { erreur: string } {
  const propre = String(numero ?? "").replace(/\s+/g, " ").trim()
  if (!propre) return { erreur: "Donnez un numéro à la chambre (par exemple « Océan 3 »)." }
  if (propre.length > NUMERO_MAX) return { erreur: `Numéro de ${NUMERO_MAX} caractères au plus.` }
  return { numero: propre }
}

// Ordre naturel des numéros : « Océan 2 » avant « Océan 10 »
export const comparerNumeros = (a: Pick<Chambre, "numero">, b: Pick<Chambre, "numero">) =>
  a.numero.localeCompare(b.numero, "fr", { numeric: true, sensitivity: "base" })

// Tout vérifier avant d'écrire : pas de modification à moitié appliquée
export function controlerTarifs({ prix, saisons }: ModificationTarifs, hebergements: Hebergement[]): string | null {
  for (const [id, montant] of Object.entries(prix)) {
    const h = hebergements.find((h) => h.id === id)
    if (!h) return "Hébergement inconnu."
    if (!Number.isInteger(montant) || !estEntre(montant, 1, PRIX_MAX)) {
      return `${h.nom} : saisissez un prix entier entre 1 et ${PRIX_MAX.toLocaleString("fr-FR")} €.`
    }
  }
  if (saisons.length > SAISONS_MAX) return `${SAISONS_MAX} saisons au maximum.`
  const noms = new Set<string>()
  for (const { nom, debut, fin, coefficient, sejourMin } of saisons) {
    if (!nom || nom.length > NOM_SAISON_MAX) {
      return `Donnez à chaque saison un nom de ${NOM_SAISON_MAX} caractères au plus.`
    }
    if (noms.has(nom.toLowerCase())) return `Deux saisons s’appellent « ${nom} » : renommez l’une d’elles.`
    noms.add(nom.toLowerCase())
    if (!estJourAnnee(debut) || !estJourAnnee(fin)) return `${nom} : choisissez un jour et un mois valides pour le début et la fin.`
    if (!estEntre(coefficient, COEFFICIENT.min, COEFFICIENT.max)) {
      return `${nom} : la majoration doit rester entre -50 % et +200 %.`
    }
    if (!Number.isInteger(sejourMin) || !estEntre(sejourMin, 1, NUITS_MAX)) {
      return `${nom} : le séjour minimum doit être compris entre 1 et ${NUITS_MAX} nuits.`
    }
  }
  const chevauchement = chevauchementSaisons(saisons)
  if (chevauchement) {
    return `« ${chevauchement[0]} » et « ${chevauchement[1]} » se chevauchent : une nuit ne peut appartenir qu’à une seule saison.`
  }
  return null
}

// Réglages à enregistrer (l'euro toujours proposé, à 1), ou l'erreur à afficher
export function normaliserDevises({
  parDefaut,
  actives,
  taux,
}: Omit<ReglagesDevises, "misAJourLe">): { erreur: string } | { reglages: ReglagesDevises } {
  const proposees = CODES_DEVISES.filter((code) => code === DEVISE_REFERENCE || actives.includes(code))
  if (!proposees.includes(parDefaut)) return { erreur: "La devise par défaut doit faire partie des devises proposées." }
  for (const code of CODES_DEVISES) {
    if (code !== DEVISE_REFERENCE && !estEntre(taux[code], Number.EPSILON, TAUX_MAX)) {
      return { erreur: `Taux invalide pour ${code} : saisissez un nombre positif.` }
    }
  }
  return {
    reglages: { parDefaut, actives: proposees, taux: { ...taux, [DEVISE_REFERENCE]: 1 }, misAJourLe: new Date().toISOString() },
  }
}

// --- Logiciel des hôtes : réception, encaissements, équipe ---

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const SOURCES_DIRECTES = ["telephone", "whatsapp", "booking", "airbnb", "sur_place"] as const
export const MODES_PAIEMENT: ModePaiement[] = ["especes", "carte", "mobile_money", "virement", "autre"]
export const ETATS_CHAMBRE: EtatChambre[] = ["propre", "a_nettoyer", "maintenance"]
export const MOT_DE_PASSE_MIN = 8
const MONTANT_MAX = 100_000

// Réservation saisie par l'équipe : pas de séjour minimum ni d'échéance (décision de la réception),
// arrivée possible jusqu'à la veille (client arrivé dans la nuit, saisie le lendemain matin)
export function controlerReservationDirecte(r: ReservationDirecte, hebergement: Hebergement | undefined, aujourdhui: DateISO): string | null {
  if (!hebergement) return "Choisissez un hébergement."
  if (!r.clientId) return "Choisissez ou créez le client."
  if (!estDateISO(r.arrivee) || !estDateISO(r.depart)) return "Dates invalides."
  if (r.depart <= r.arrivee) return "Le départ doit suivre l'arrivée."
  if (r.arrivee < ajouterJours(aujourdhui, -1)) return "La date d'arrivée est déjà passée."
  if (nombreNuits(r.arrivee, r.depart) > 90) return "Séjour de 90 nuits au plus."
  if (!(SOURCES_DIRECTES as readonly string[]).includes(r.source)) return "Provenance inconnue."
  if (!Number.isInteger(r.adultes) || !Number.isInteger(r.enfants) || r.adultes < 1 || r.enfants < 0) return "Nombre de voyageurs invalide."
  if (r.adultes + r.enfants > hebergement.capaciteMax) return `${hebergement.nom} accueille ${hebergement.capaciteMax} personnes au maximum.`
  if (r.montantTotal !== null && (!Number.isInteger(r.montantTotal) || !estEntre(r.montantTotal, 0, MONTANT_MAX))) {
    return "Saisissez un montant entier en euros."
  }
  return null
}

// Réservation modifiée par l'équipe (demande ou séjour confirmé) : mêmes règles que la saisie directe, plus ce
// qui est déjà arrivé (client sur place : date d'arrivée figée ; client parti : plus rien ne change). Le jour du
// départ, le séjour peut encore être prolongé.
export function controlerModification(
  avant: Reservation,
  m: ModificationReservation,
  hebergement: Hebergement | undefined,
  aujourdhui: DateISO,
): string | null {
  if (avant.statut !== "option" && avant.statut !== "confirmee") return "Seules les demandes et les réservations confirmées se modifient."
  if (avant.departLe || avant.depart < aujourdhui) return "Ce séjour est terminé : il ne peut plus être modifié."
  if (!hebergement) return "Choisissez un hébergement."
  if (!estDateISO(m.arrivee) || !estDateISO(m.depart)) return "Dates invalides."
  if (m.depart <= m.arrivee) return "Le départ doit suivre l'arrivée."
  if (nombreNuits(m.arrivee, m.depart) > 90) return "Séjour de 90 nuits au plus."
  if (avant.arriveeLe && m.arrivee !== avant.arrivee) return "Le client est déjà arrivé : sa date d'arrivée ne change plus."
  if (m.arrivee !== avant.arrivee && m.arrivee < ajouterJours(aujourdhui, -1)) return "La nouvelle date d'arrivée est déjà passée."
  if (m.depart < aujourdhui) return "La date de départ est déjà passée."
  if (!Number.isInteger(m.adultes) || !Number.isInteger(m.enfants) || m.adultes < 1 || m.enfants < 0) return "Nombre de voyageurs invalide."
  if (m.adultes + m.enfants > hebergement.capaciteMax) return `${hebergement.nom} accueille ${hebergement.capaciteMax} personnes au maximum.`
  if (m.montantTotal !== null && (!Number.isInteger(m.montantTotal) || !estEntre(m.montantTotal, 0, MONTANT_MAX))) {
    return "Saisissez un montant entier en euros."
  }
  return null
}

const voyageurs = (adultes: number, enfants: number) => [pluriel(adultes, "adulte"), enfants ? pluriel(enfants, "enfant") : ""].filter(Boolean).join(", ")

// Ce qui change, en clair, pour l'historique, le journal et l'e-mail au client (vide : rien ne change).
// `apres.chambreId` : chambre finalement attribuée
export function changementsReservation(
  avant: Reservation,
  apres: Omit<ModificationReservation, "montantTotal" | "chambreId"> & { montantTotal: number; chambreId: string },
  nomHebergement: (id: string) => string,
  numeroChambre: (id: string) => string,
): string[] {
  const navette = (oui: boolean) => (oui ? "demandée" : "non demandée")
  return [
    avant.hebergementId !== apres.hebergementId && `Hébergement : ${nomHebergement(avant.hebergementId)} → ${nomHebergement(apres.hebergementId)}`,
    avant.chambreId !== apres.chambreId && `Chambre : ${numeroChambre(avant.chambreId)} → ${numeroChambre(apres.chambreId)}`,
    (avant.arrivee !== apres.arrivee || avant.depart !== apres.depart) &&
      `Dates : ${formaterPlage(avant.arrivee, avant.depart)} → ${formaterPlage(apres.arrivee, apres.depart)}`,
    (avant.adultes !== apres.adultes || avant.enfants !== apres.enfants) &&
      `Voyageurs : ${voyageurs(avant.adultes, avant.enfants)} → ${voyageurs(apres.adultes, apres.enfants)}`,
    avant.navette !== apres.navette && `Navette : ${navette(avant.navette)} → ${navette(apres.navette)}`,
    avant.montantTotal !== apres.montantTotal && `Montant : ${formaterPrix(avant.montantTotal)} → ${formaterPrix(apres.montantTotal)}`,
  ].filter((c): c is string => Boolean(c))
}

export function controlerPaiement(montant: number, mode: string): string | null {
  if (!Number.isInteger(montant) || montant === 0 || !estEntre(Math.abs(montant), 1, MONTANT_MAX)) {
    return "Saisissez un montant entier en euros (négatif pour un remboursement)."
  }
  if (!(MODES_PAIEMENT as string[]).includes(mode)) return "Choisissez le mode de paiement."
  return null
}

export function controlerClientLocal(c: NouveauClientLocal): string | null {
  if (!c.prenom.trim() && !c.nom.trim()) return "Saisissez au moins le prénom ou le nom du client."
  if (c.email && !EMAIL.test(c.email)) return "Cette adresse e-mail n'est pas valide."
  return null
}

// Coordonnées corrigées par l'équipe ; un compte du site garde une adresse e-mail (c'est son identifiant)
export function controlerModificationClient(c: ModificationClient, compteDuSite: boolean): string | null {
  if (!c.prenom.trim() && !c.nom.trim()) return "Saisissez au moins le prénom ou le nom du client."
  if (compteDuSite && !c.email.trim()) return "Ce client a un compte sur le site : son adresse e-mail est obligatoire, elle lui sert à se connecter."
  if (c.email && !EMAIL.test(c.email)) return "Cette adresse e-mail n'est pas valide."
  return null
}

// --- Calendriers des plateformes (iCal) ---

export const PLATEFORMES: Plateforme[] = ["booking", "airbnb", "autre"]
const NOM_CALENDRIER_MAX = 40

export function controlerCalendrier(c: NouveauCalendrier, chambre: Chambre | undefined): string | null {
  if (!chambre) return "Choisissez une chambre."
  if (!PLATEFORMES.includes(c.plateforme)) return "Choisissez la plateforme."
  if (!c.nom.trim() || c.nom.length > NOM_CALENDRIER_MAX) return `Donnez au calendrier un nom de ${NOM_CALENDRIER_MAX} caractères au plus.`
  if (c.urlImport) {
    let url: URL
    try {
      url = new URL(c.urlImport)
    } catch {
      return "Ce lien n'est pas une adresse valide : copiez le lien d'exportation iCal donné par la plateforme."
    }
    if (url.protocol !== "https:") return "Le lien du calendrier doit commencer par https://."
  }
  return null
}

// --- Factures ---

const FACTURATION_MAX = { raisonSociale: 120, adresse: 300, telephone: 40, email: 120, identifiants: 300, mentions: 1000 }

export function normaliserFacturation(r: Partial<Record<keyof ReglagesFacturation, unknown>>): ReglagesFacturation {
  const texte = (cle: keyof ReglagesFacturation) => String(r[cle] ?? "").trim().slice(0, FACTURATION_MAX[cle])
  return {
    raisonSociale: texte("raisonSociale"),
    adresse: texte("adresse"),
    telephone: texte("telephone"),
    email: texte("email"),
    identifiants: texte("identifiants"),
    mentions: texte("mentions"),
  }
}

// Rôles d'un compte de l'équipe, du plus large au plus restreint
export const ROLES_EQUIPE: RoleEquipe[] = ["hote", "reception", "caissier"]

export const estRoleEquipe = (role: unknown): role is RoleEquipe => (ROLES_EQUIPE as unknown[]).includes(role)

export function controlerMembre({ prenom, email }: { prenom: string; email: string }, motDePasse: string): string | null {
  if (!prenom.trim()) return "Saisissez le prénom."
  if (!EMAIL.test(email)) return "Cette adresse e-mail n'est pas valide."
  if (motDePasse.length < MOT_DE_PASSE_MIN) return `Le mot de passe doit contenir au moins ${MOT_DE_PASSE_MIN} caractères.`
  return null
}
