import { comptes, moteur } from "@/lib/reservation"
import type { ClientPublic } from "@/lib/reservation/types"
import { envoyerEmail } from "./envoi"
import {
  accuseDeReception,
  alerteNouvelleDemande,
  annulationParLeClient,
  decisionDesHotes,
  lienDeReinitialisation,
  modificationParLesHotes,
  motDePasseModifie,
  type Sejour,
} from "./modeles"

// E-mails déclenchés par les actions, à appeler dans after() (next/server) : ils partent une fois la réponse
// envoyée, sans ralentir le visiteur. Une erreur est consignée dans les journaux, jamais remontée.

// Boîte des hôtes (EMAIL_HOTES, plusieurs adresses séparées par des virgules) : alertes, et adresse de réponse
// des e-mails aux clients
function hotes(): string[] {
  return (process.env.EMAIL_HOTES ?? "")
    .split(",")
    .map((adresse) => adresse.trim())
    .filter(Boolean)
}

// `toutLeGroupe` : demande de plusieurs chambres traitée en entier (nouvelle demande, décision sur la demande,
// annulation par le client) : un seul e-mail pour toutes ses chambres, de même statut
async function sejour(reservationId: string, toutLeGroupe = false): Promise<Sejour | null> {
  const reservation = await moteur.trouverReservation(reservationId)
  if (!reservation) return null
  const [client, hebergements, duClient] = await Promise.all([
    comptes.trouverParId(reservation.clientId),
    moteur.listerHebergements(),
    toutLeGroupe && reservation.groupe ? moteur.reservationsDuClient(reservation.clientId) : Promise.resolve([]),
  ])
  const hebergement = hebergements.find((h) => h.id === reservation.hebergementId)
  const autres = duClient.filter((r) => r.id !== reservation.id && r.groupe === reservation.groupe && r.statut === reservation.statut)
  const groupe = [reservation, ...autres].sort((a, b) => a.reference.localeCompare(b.reference))
  return client && hebergement ? { reservation, client, hebergement, groupe } : null
}

async function sansErreur(quoi: string, travail: () => Promise<void>) {
  try {
    await travail()
  } catch (erreur) {
    console.error(`[e-mail] ${quoi} :`, erreur)
  }
}

export function notifierNouvelleDemande(reservationId: string) {
  return sansErreur("nouvelle demande", async () => {
    const s = await sejour(reservationId, true)
    if (!s) return
    if (hotes().length === 0) console.warn("[e-mail] EMAIL_HOTES non défini : les hôtes ne sont pas prévenus des nouvelles demandes.")
    await Promise.all([
      envoyerEmail({ a: s.client.email, repondreA: hotes()[0], ...accuseDeReception(s) }),
      envoyerEmail({ a: hotes(), repondreA: s.client.email, ...alerteNouvelleDemande(s) }),
    ])
  })
}

// `mot` : message écrit par les hôtes au moment de refuser ou d'annuler (facultatif). Confirmer ou refuser porte
// sur toute la demande ; annuler, sur cette chambre seule
export function notifierDecisionDesHotes(reservationId: string, statut: "confirmee" | "refusee" | "annulee", mot?: string) {
  return sansErreur("décision des hôtes", async () => {
    const s = await sejour(reservationId, statut !== "annulee")
    // Client de la réception sans adresse : rien à envoyer
    if (s?.client.email) await envoyerEmail({ a: s.client.email, repondreA: hotes()[0], ...decisionDesHotes(s, statut, mot) })
  })
}

export function notifierModificationParLesHotes(reservationId: string, changements: string[], mot?: string) {
  return sansErreur("modification par les hôtes", async () => {
    const s = await sejour(reservationId)
    if (s?.client.email) await envoyerEmail({ a: s.client.email, repondreA: hotes()[0], ...modificationParLesHotes(s, changements, mot) })
  })
}

export function notifierAnnulationParLeClient(reservationId: string) {
  return sansErreur("annulation par le client", async () => {
    const s = await sejour(reservationId, true)
    if (s) await envoyerEmail({ a: hotes(), repondreA: s.client.email, ...annulationParLeClient(s) })
  })
}

export function envoyerLienDeReinitialisation(client: ClientPublic, url: string) {
  return sansErreur("lien de réinitialisation", () => envoyerEmail({ a: client.email, ...lienDeReinitialisation(client, url) }))
}

export function notifierMotDePasseModifie(client: ClientPublic, le: Date) {
  return sansErreur("mot de passe modifié", () =>
    envoyerEmail({ a: client.email, repondreA: hotes()[0], ...motDePasseModifie(client, le) }),
  )
}
