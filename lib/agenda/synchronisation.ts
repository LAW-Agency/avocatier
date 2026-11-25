import { createHash } from "node:crypto"
import { db, lignes } from "@/lib/reservation/postgres/db"
import { expirerOptions } from "@/lib/reservation/postgres/moteurPostgres"
import { appelGoogle, ErreurGoogle, identifiantsGoogle, type IdentifiantsGoogle } from "./google"

// Copie des réservations dans l'agenda Google du propriétaire (lecture seule pour lui, géré par l'agence).
// Synchronisation complète par différence, sans état en base : chaque réservation active (option ou confirmée) dont
// le départ est dans moins de JOURS_PASSES jours devient un événement « journée entière » [arrivée, départ[ ; les
// événements de l'agenda qui ne correspondent plus à rien sont supprimés. Chaque événement porte l'empreinte de son
// contenu (propriété privée) : seuls les événements changés sont réécrits. Relançable à volonté, et deux passages
// simultanés aboutissent au même agenda (identifiant d'événement tiré de celui de la réservation).
// Données envoyées à Google : chambre, prénom et nom du client, voyageurs, navette, statut, origine et référence.
// Jamais d'e-mail, de téléphone, de message ni de montant.

const FUSEAU = "Indian/Antananarivo"
const JOURS_PASSES = 30
const PARALLELE = 4
const MARQUE = "avocatier"

const SOURCES: Record<string, string> = {
  site: "site",
  booking: "Booking.com",
  airbnb: "Airbnb",
  telephone: "téléphone",
  whatsapp: "WhatsApp",
  sur_place: "sur place",
}

// Couleurs de l'API Google Agenda : 5 jaune, 10 vert, 8 gris
const COULEUR = { option: "5", confirmee: "10", parti: "8" } as const

export type LigneSejour = {
  id: string
  reference: string
  arrivee: string
  depart: string
  adultes: number
  enfants: number
  navette: boolean
  statut: "option" | "confirmee"
  source: string
  arrivee_le: Date | null
  depart_le: Date | null
  chambre: string | null
  categorie: string
  client: string
}

type Evenement = {
  id: string
  summary: string
  description: string
  start: { date: string }
  end: { date: string }
  colorId: string
  transparency: "transparent"
  reminders: { useDefault: false; overrides: [] }
  extendedProperties: { private: Record<string, string> }
}

type EvenementGoogle = { id: string; extendedProperties?: { private?: Record<string, string> } }

export type BilanAgenda = { actif: boolean; crees: number; modifies: number; supprimes: number; erreurs: string[] }

// Identifiant Google : caractères « a » à « v » et chiffres seulement, d'où une empreinte hexadécimale
export function idEvenement(reservationId: string) {
  return `avo${createHash("sha256").update(reservationId).digest("hex").slice(0, 40)}`
}

function pluriel(n: number, mot: string) {
  return `${n} ${mot}${n > 1 ? "s" : ""}`
}

export function evenementDe(s: LigneSejour): Evenement {
  const etat = s.statut === "option" ? "option" : s.depart_le ? "parti" : "confirmee"
  const voyageurs = [pluriel(s.adultes, "adulte"), s.enfants > 0 ? pluriel(s.enfants, "enfant") : ""].filter(Boolean).join(", ")
  const chambre = s.chambre ?? s.categorie
  const statut = {
    option: "Option : demande en attente de confirmation",
    confirmee: s.arrivee_le ? "Confirmée, client arrivé" : "Confirmée",
    parti: "Confirmée, client parti",
  }[etat]
  const contenu = {
    id: idEvenement(s.id),
    summary: `${etat === "option" ? "Option · " : ""}${chambre} · ${s.client.trim() || "Client"}`,
    description: [
      `Chambre : ${chambre} (${s.categorie})`,
      `Voyageurs : ${voyageurs}`,
      ...(s.navette ? ["Navette demandée"] : []),
      `Statut : ${statut}`,
      `Réservation ${s.reference} · origine : ${SOURCES[s.source] ?? s.source}`,
      "",
      "Agenda mis à jour automatiquement par le site Chez L'Avocatier : les modifications faites ici seront effacées.",
    ].join("\n"),
    start: { date: s.arrivee },
    end: { date: s.depart }, // date de fin exclue par Google : la nuit du départ n'apparaît pas, comme au planning
    colorId: COULEUR[etat],
    transparency: "transparent" as const, // ne rend pas le propriétaire « occupé » dans ses autres agendas
    reminders: { useDefault: false as const, overrides: [] as [] }, // aucun rappel par réservation
  }
  const empreinte = createHash("sha256").update(JSON.stringify(contenu)).digest("hex").slice(0, 16)
  return { ...contenu, extendedProperties: { private: { [MARQUE]: "1", reservation: s.id, empreinte } } }
}

async function sejoursActifs(): Promise<{ sejours: LigneSejour[]; depuis: string }> {
  await expirerOptions(db())
  const sejours = await lignes<LigneSejour & { depuis: string }>(
    db(),
    `select r.id, r.reference, r.arrivee, r.depart, r.adultes, r.enfants, r.navette, r.statut, r.source,
            r.arrivee_le, r.depart_le, ch.numero as chambre, h.nom as categorie,
            trim(c.prenom || ' ' || c.nom) as client,
            ((now() at time zone '${FUSEAU}')::date - ${JOURS_PASSES})::date as depuis
       from reservations r
       join hebergements h on h.id = r.hebergement_id
       join clients c on c.id = r.client_id
       left join chambres ch on ch.id = r.chambre_id
      where r.statut in ('option', 'confirmee')
        and r.depart > (now() at time zone '${FUSEAU}')::date - ${JOURS_PASSES}
      order by r.arrivee`,
  )
  const [{ depuis }] = sejours.length
    ? sejours
    : await lignes<{ depuis: string }>(db(), `select ((now() at time zone '${FUSEAU}')::date - ${JOURS_PASSES})::date as depuis`)
  return { sejours, depuis }
}

async function evenementsExistants(id: IdentifiantsGoogle, agenda: string, depuis: string) {
  const trouves = new Map<string, string>() // id → empreinte
  let page: string | undefined
  do {
    const parametres = new URLSearchParams({
      privateExtendedProperty: `${MARQUE}=1`,
      timeMin: `${depuis}T00:00:00+03:00`,
      maxResults: "2500",
      showDeleted: "false",
      fields: "nextPageToken,items(id,extendedProperties)",
    })
    if (page) parametres.set("pageToken", page)
    const reponse = await appelGoogle<{ items?: EvenementGoogle[]; nextPageToken?: string }>(
      id,
      "GET",
      `/calendars/${encodeURIComponent(agenda)}/events?${parametres}`,
    )
    for (const e of reponse?.items ?? []) trouves.set(e.id, e.extendedProperties?.private?.empreinte ?? "")
    page = reponse?.nextPageToken
  } while (page)
  return trouves
}

// Insertion, ou mise à jour si l'identifiant existe déjà (événement hors de la fenêtre lue, ou supprimé puis
// réapparu : Google garde les identifiants supprimés, que seule une mise à jour remet en place)
async function ecrire(id: IdentifiantsGoogle, agenda: string, e: Evenement, existe: boolean): Promise<"cree" | "modifie"> {
  const base = `/calendars/${encodeURIComponent(agenda)}/events`
  if (!existe) {
    try {
      await appelGoogle(id, "POST", base, e)
      return "cree"
    } catch (erreur) {
      if (!(erreur instanceof ErreurGoogle && erreur.statut === 409)) throw erreur
    }
  }
  await appelGoogle(id, "PUT", `${base}/${e.id}`, { ...e, status: "confirmed" })
  return "modifie"
}

async function parPaquets<T>(elements: T[], travail: (e: T) => Promise<void>) {
  for (let i = 0; i < elements.length; i += PARALLELE) await Promise.all(elements.slice(i, i + PARALLELE).map(travail))
}

async function synchroniser(): Promise<BilanAgenda> {
  const id = identifiantsGoogle()
  const agenda = process.env.GOOGLE_AGENDA_ID?.trim()
  if (!id || !agenda) return { actif: false, crees: 0, modifies: 0, supprimes: 0, erreurs: [] }
  const { sejours, depuis } = await sejoursActifs()
  return appliquer(id, agenda, sejours, depuis)
}

// Met l'agenda en accord avec ces séjours (séparé de la lecture en base pour pouvoir l'essayer sur des exemples)
export async function appliquer(id: IdentifiantsGoogle, agenda: string, sejours: LigneSejour[], depuis: string): Promise<BilanAgenda> {
  const bilan: BilanAgenda = { actif: true, crees: 0, modifies: 0, supprimes: 0, erreurs: [] }
  const existants = await evenementsExistants(id, agenda, depuis)
  const voulus = sejours.map(evenementDe)
  const aEcrire = voulus.filter((e) => existants.get(e.id) !== e.extendedProperties.private.empreinte)
  const gardes = new Set(voulus.map((e) => e.id))
  const aSupprimer = [...existants.keys()].filter((cle) => !gardes.has(cle))

  await parPaquets(aEcrire, async (e) => {
    try {
      bilan[(await ecrire(id, agenda, e, existants.has(e.id))) === "cree" ? "crees" : "modifies"]++
    } catch (erreur) {
      bilan.erreurs.push(String(erreur instanceof Error ? erreur.message : erreur))
    }
  })
  await parPaquets(aSupprimer, async (cle) => {
    try {
      await appelGoogle(id, "DELETE", `/calendars/${encodeURIComponent(agenda)}/events/${cle}`)
      bilan.supprimes++
    } catch (erreur) {
      // Déjà supprimé ailleurs : rien à faire
      if (erreur instanceof ErreurGoogle && (erreur.statut === 404 || erreur.statut === 410)) return
      bilan.erreurs.push(String(erreur instanceof Error ? erreur.message : erreur))
    }
  })
  return bilan
}

// Un seul passage à la fois par processus ; une demande arrivée pendant un passage en relance un seul après lui
const etat = globalThis as typeof globalThis & { __avocatierAgenda?: { encours: Promise<BilanAgenda>; relancer: boolean } }

export function synchroniserAgenda(): Promise<BilanAgenda> {
  const courant = etat.__avocatierAgenda
  if (courant) {
    courant.relancer = true
    return courant.encours
  }
  const suivi = { relancer: false, encours: Promise.resolve<BilanAgenda | null>(null) as Promise<BilanAgenda> }
  suivi.encours = (async () => {
    try {
      let bilan = await synchroniser()
      while (suivi.relancer) {
        suivi.relancer = false
        bilan = await synchroniser()
      }
      return bilan
    } finally {
      etat.__avocatierAgenda = undefined
    }
  })()
  etat.__avocatierAgenda = suivi
  return suivi.encours
}
