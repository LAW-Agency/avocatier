import {
  blocageEnConflit,
  controlerBlocage,
  controlerChangementStatut,
  controlerDemande,
  controlerTarifs,
  DATES_PRISES,
  DUREE_OPTION_MS,
  normaliserDevises,
  saisonsDatees,
  STATUTS_ACTIFS,
} from "../controles"
import { reglagesDevisesInitiaux } from "../devises"
import { hebergements as contenuDesFiches } from "../donnees"
import type { DepotComptes, MoteurReservation } from "../moteur"
import { calculerDevis } from "../regles"
import type {
  Blocage,
  Client,
  ClientPublic,
  CodeDevise,
  DateISO,
  Hebergement,
  PeriodeOccupee,
  RegleSaison,
  Reservation,
  ResultatAction,
  ResultatDemande,
  StatutReservation,
} from "../types"
import { codeErreur, db, lignes, transaction, type Executant } from "./db"

// Implémentation PostgreSQL des contrats de ../moteur (schéma : migrations/). Contrôles métier
// dans ../controles ; la base garantit en plus qu'aucune nuit n'est vendue deux fois (contrainte d'exclusion).

const HEBERGEMENT = `id, slug, nom, type, description, image, capacite_max as "capaciteMax", literie, vue,
  prix_nuit as "prixNuit", presentation, galerie, salle_de_bains as "salleDeBains", equipements`

const RESERVATION = `id, reference, client_id as "clientId", hebergement_id as "hebergementId", arrivee, depart,
  adultes, enfants, navette, telephone, message, montant_total as "montantTotal", statut, source,
  cree_le as "creeLe", expire_le as "expireLe", historique`

const CLIENT = `id, role, email, prenom, nom, telephone, pays, cree_le as "creeLe", sessions_valides_depuis as "sessionsValidesDepuis"`

// Horodatages rendus par pg en Date : convertis en texte ISO comme dans le reste du code
type LigneReservation = Omit<Reservation, "creeLe" | "expireLe"> & { creeLe: Date; expireLe: Date | null }
type LigneClient = Omit<ClientPublic, "creeLe" | "sessionsValidesDepuis"> & { creeLe: Date; sessionsValidesDepuis: Date | null }

function versReservation({ creeLe, expireLe, ...reste }: LigneReservation): Reservation {
  return { ...reste, creeLe: creeLe.toISOString(), ...(expireLe && { expireLe: expireLe.toISOString() }) }
}

function versClient({ creeLe, sessionsValidesDepuis, ...reste }: LigneClient): ClientPublic {
  return {
    ...reste,
    creeLe: creeLe.toISOString(),
    ...(sessionsValidesDepuis && { sessionsValidesDepuis: sessionsValidesDepuis.toISOString() }),
  }
}

// Contenu des fiches toujours repris du code (../donnees) : les hôtes ne le modifient pas,
// et un texte ou une photo changés partent avec le déploiement sans repasser par la base
function avecContenuDuCode(h: Hebergement): Hebergement {
  const source = contenuDesFiches.find((s) => s.id === h.id)
  if (!source) return h
  const { image, description, presentation, galerie, salleDeBains, equipements } = source
  return { ...h, image, description, presentation, galerie, salleDeBains, equipements }
}

// Événement à ajouter à `historique` (jsonb) : `historique || $n::jsonb`
function evenement(statut: StatutReservation, note?: string): string {
  return JSON.stringify([{ statut, le: new Date().toISOString(), ...(note && { note }) }])
}

async function lireHebergements(ex: Executant): Promise<Hebergement[]> {
  const liste = await lignes<Hebergement>(ex, `select ${HEBERGEMENT} from hebergements order by ordre, id`)
  return liste.map(avecContenuDuCode)
}

async function lireReglesSaisons(ex: Executant): Promise<RegleSaison[]> {
  return lignes<RegleSaison>(ex, `select nom, debut, fin, coefficient, sejour_min as "sejourMin" from regles_saisons order by debut`)
}

// Expiration paresseuse des options dépassées, avant toute lecture des réservations (en production : tâche planifiée)
async function expirerOptions(ex: Executant) {
  await ex.query(
    `update reservations set statut = 'expiree', historique = historique || $1::jsonb
     where statut = 'option' and expire_le < now()`,
    [evenement("expiree")],
  )
}

// Verrou de transaction par hébergement : deux écritures sur le même hébergement (demandes, blocages)
// passent l'une après l'autre, la vérification des dates ne peut pas se croiser avec une insertion
async function verrouiller(tx: Executant, hebergementId: string) {
  await tx.query("select pg_advisory_xact_lock(hashtext($1))", [hebergementId])
}

async function estOccupe(ex: Executant, hebergementId: string, debut: DateISO, fin: DateISO): Promise<boolean> {
  const occupees = await lignes(
    ex,
    `select 1 from reservations
     where hebergement_id = $1 and statut = any($4) and daterange(arrivee, depart) && daterange($2::date, $3::date)
     union all
     select 1 from blocages where hebergement_id = $1 and daterange(debut, fin) && daterange($2::date, $3::date)
     limit 1`,
    [hebergementId, debut, fin, STATUTS_ACTIFS],
  )
  return occupees.length > 0
}

export const moteurPostgres: MoteurReservation = {
  async listerHebergements() {
    return lireHebergements(db())
  },

  async listerSaisons() {
    return saisonsDatees(await lireReglesSaisons(db()))
  },

  async listerReglesSaisons() {
    return lireReglesSaisons(db())
  },

  async periodesOccupees() {
    const ex = db()
    await expirerOptions(ex)
    return lignes<PeriodeOccupee>(
      ex,
      `select hebergement_id as "hebergementId", arrivee as debut, depart as fin from reservations where statut = any($1)
       union all
       select hebergement_id, debut, fin from blocages`,
      [STATUTS_ACTIFS],
    )
  },

  async creerDemande(clientId, demande) {
    try {
      return await transaction<ResultatDemande>(async (tx) => {
        await verrouiller(tx, demande.hebergementId)
        await expirerOptions(tx)
        const hebergement = (await lireHebergements(tx)).find((h) => h.id === demande.hebergementId)
        const saisons = saisonsDatees(await lireReglesSaisons(tx))
        const erreur = controlerDemande(demande, hebergement, saisons)
        if (erreur || !hebergement) return { ok: false, erreur: erreur ?? "Cet hébergement n'existe pas." }

        const { arrivee, depart, adultes, enfants, navette, telephone, message } = demande
        if (await estOccupe(tx, hebergement.id, arrivee, depart)) return { ok: false, erreur: DATES_PRISES }

        const [{ numero }] = await lignes<{ numero: number }>(tx, "select nextval('reservations_numero')::int as numero")
        const maintenant = new Date()
        const [ligne] = await lignes<LigneReservation>(
          tx,
          `insert into reservations (reference, client_id, hebergement_id, arrivee, depart, adultes, enfants, navette,
             telephone, message, montant_total, statut, source, cree_le, expire_le, historique)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'option', 'site', $12, $13, $14)
           returning ${RESERVATION}`,
          [
            `AVO-${arrivee.slice(0, 4)}-${String(numero).padStart(4, "0")}`,
            clientId,
            hebergement.id,
            arrivee,
            depart,
            adultes,
            enfants,
            navette,
            telephone,
            message,
            calculerDevis(hebergement, arrivee, depart, saisons).total,
            maintenant,
            new Date(maintenant.getTime() + DUREE_OPTION_MS),
            JSON.stringify([{ statut: "option", le: maintenant.toISOString() }]),
          ],
        )
        // E-mails envoyés par l'action (app/reserver/actions.ts), une fois la transaction validée
        return { ok: true, reservation: versReservation(ligne) }
      })
    } catch (erreur) {
      // Filet de sécurité : la contrainte d'exclusion a refusé une nuit déjà prise
      if (codeErreur(erreur) === "23P01") return { ok: false, erreur: DATES_PRISES }
      throw erreur
    }
  },

  async reservationsDuClient(clientId) {
    const ex = db()
    await expirerOptions(ex)
    const liste = await lignes<LigneReservation>(
      ex,
      `select ${RESERVATION} from reservations where client_id = $1 order by arrivee desc`,
      [clientId],
    )
    return liste.map(versReservation)
  },

  async annulerDemande(clientId, reservationId) {
    const ex = db()
    await expirerOptions(ex)
    const resultat = await ex.query(
      `update reservations set statut = 'annulee', historique = historique || $3::jsonb
       where id = $1 and client_id = $2 and statut = 'option'`,
      [reservationId, clientId, evenement("annulee", "Annulée par le client")],
    )
    return (resultat.rowCount ?? 0) > 0
  },

  async trouverReservation(id) {
    const [ligne] = await lignes<LigneReservation>(db(), `select ${RESERVATION} from reservations where id = $1`, [id])
    return ligne ? versReservation(ligne) : null
  },

  async toutesLesReservations() {
    const ex = db()
    await expirerOptions(ex)
    return (await lignes<LigneReservation>(ex, `select ${RESERVATION} from reservations order by cree_le`)).map(versReservation)
  },

  async changerStatut(reservationId, statut, note) {
    return transaction<ResultatAction>(async (tx) => {
      await expirerOptions(tx)
      const [reservation] = await lignes<Pick<Reservation, "statut" | "depart">>(
        tx,
        "select statut, depart from reservations where id = $1 for update",
        [reservationId],
      )
      const erreur = controlerChangementStatut(reservation, statut)
      if (erreur) return { ok: false, erreur }
      // Les hôtes ne remettent jamais en option : l'échéance disparaît
      await tx.query(
        "update reservations set statut = $2, expire_le = null, historique = historique || $3::jsonb where id = $1",
        [reservationId, statut, evenement(statut, note)],
      )
      // E-mail au client envoyé par l'action (app/admin/actions.ts), une fois la transaction validée
      return { ok: true }
    })
  },

  async listerBlocages() {
    return lignes<Blocage>(db(), `select id, hebergement_id as "hebergementId", debut, fin, raison from blocages order by debut`)
  },

  async ajouterBlocage(blocage) {
    return transaction<ResultatAction>(async (tx) => {
      await verrouiller(tx, blocage.hebergementId)
      await expirerOptions(tx)
      const hebergement = (await lireHebergements(tx)).find((h) => h.id === blocage.hebergementId)
      const erreur = controlerBlocage(blocage, hebergement)
      if (erreur || !hebergement) return { ok: false, erreur: erreur ?? "Choisissez un hébergement." }

      const [conflit] = await lignes<{ reference: string }>(
        tx,
        `select reference from reservations
         where hebergement_id = $1 and statut = any($4) and daterange(arrivee, depart) && daterange($2::date, $3::date)
         order by arrivee limit 1`,
        [hebergement.id, blocage.debut, blocage.fin, STATUTS_ACTIFS],
      )
      if (conflit) return { ok: false, erreur: blocageEnConflit(conflit.reference, hebergement) }

      await tx.query("insert into blocages (hebergement_id, debut, fin, raison) values ($1, $2, $3, $4)", [
        hebergement.id,
        blocage.debut,
        blocage.fin,
        blocage.raison || "Indisponible",
      ])
      return { ok: true }
    })
  },

  async supprimerBlocage(id) {
    const resultat = await db().query("delete from blocages where id = $1", [id])
    return (resultat.rowCount ?? 0) > 0
  },

  async modifierTarifs({ prix, saisons }) {
    const erreur = controlerTarifs({ prix, saisons }, await lireHebergements(db()))
    if (erreur) return { ok: false, erreur }
    await transaction(async (tx) => {
      for (const [id, montant] of Object.entries(prix)) {
        await tx.query("update hebergements set prix_nuit = $2 where id = $1", [id, montant])
      }
      // Une saison revient chaque année : la liste saisie remplace la précédente
      await tx.query("delete from regles_saisons")
      for (const { nom, debut, fin, coefficient, sejourMin } of saisons) {
        await tx.query("insert into regles_saisons (nom, debut, fin, coefficient, sejour_min) values ($1, $2, $3, $4, $5)", [
          nom,
          debut,
          fin,
          coefficient,
          sejourMin,
        ])
      }
    })
    return { ok: true }
  },

  async reglagesDevises() {
    const [ligne] = await lignes<{ parDefaut: CodeDevise; actives: CodeDevise[]; taux: Partial<Record<CodeDevise, number>>; misAJourLe: Date }>(
      db(),
      `select par_defaut as "parDefaut", actives, taux, mis_a_jour_le as "misAJourLe" from reglages_devises`,
    )
    const initiaux = reglagesDevisesInitiaux()
    if (!ligne) return initiaux // base pas encore amorcée
    // Devises ajoutées au catalogue depuis l'enregistrement : taux par défaut
    return { ...ligne, taux: { ...initiaux.taux, ...ligne.taux }, misAJourLe: ligne.misAJourLe.toISOString() }
  },

  async modifierDevises(reglages) {
    const resultat = normaliserDevises(reglages)
    if ("erreur" in resultat) return { ok: false, erreur: resultat.erreur }
    const { parDefaut, actives, taux, misAJourLe } = resultat.reglages
    await db().query(
      `insert into reglages_devises (id, par_defaut, actives, taux, mis_a_jour_le) values (true, $1, $2, $3, $4)
       on conflict (id) do update set par_defaut = excluded.par_defaut, actives = excluded.actives,
         taux = excluded.taux, mis_a_jour_le = excluded.mis_a_jour_le`,
      [parDefaut, actives, JSON.stringify(taux), misAJourLe],
    )
    return { ok: true }
  },
}

// Liens de récupération envoyés au plus par compte et par heure
const LIENS_PAR_HEURE = 3

export const comptesPostgres: DepotComptes = {
  async trouverParEmail(email) {
    const [ligne] = await lignes<LigneClient & { motDePasseHash: string }>(
      db(),
      `select ${CLIENT}, mot_de_passe_hash as "motDePasseHash" from clients where email = $1`,
      [email.trim().toLowerCase()],
    )
    return ligne ? ({ ...versClient(ligne), motDePasseHash: ligne.motDePasseHash } satisfies Client) : null
  },

  async trouverParId(id) {
    const [ligne] = await lignes<LigneClient>(db(), `select ${CLIENT} from clients where id = $1`, [id])
    return ligne ? versClient(ligne) : null
  },

  // Toujours un compte client : les comptes hôtes ne se créent pas depuis le site
  async creer({ email, prenom, nom, telephone, pays, motDePasseHash }) {
    const [ligne] = await lignes<LigneClient>(
      db(),
      `insert into clients (role, email, prenom, nom, telephone, pays, mot_de_passe_hash)
       values ('client', $1, $2, $3, $4, $5, $6) returning ${CLIENT}`,
      [email.trim().toLowerCase(), prenom, nom, telephone, pays, motDePasseHash],
    )
    return versClient(ligne)
  },

  async listerClients() {
    const liste = await lignes<LigneClient>(db(), `select ${CLIENT} from clients where role = 'client' order by cree_le`)
    return liste.map(versClient)
  },

  async creerJetonReinitialisation(clientId, empreinte, expireLe) {
    return transaction(async (tx) => {
      // Décompte et insertion sans croisement, même si le formulaire part plusieurs fois
      await tx.query("select pg_advisory_xact_lock(hashtext($1))", [`jeton:${clientId}`])
      const [{ recents }] = await lignes<{ recents: number }>(
        tx,
        "select count(*)::int as recents from jetons_reinitialisation where client_id = $1 and cree_le > now() - interval '1 hour'",
        [clientId],
      )
      // Pas de boîte inondée de liens par un tiers qui connaît l'adresse
      if (recents >= LIENS_PAR_HEURE) return false
      await tx.query("insert into jetons_reinitialisation (empreinte, client_id, expire_le) values ($1, $2, $3)", [
        empreinte,
        clientId,
        expireLe,
      ])
      return true
    })
  },

  async clientDuJeton(empreinte) {
    const [ligne] = await lignes<LigneClient>(
      db(),
      `select ${CLIENT} from clients where id = (
         select client_id from jetons_reinitialisation where empreinte = $1 and utilise_le is null and expire_le > now()
       )`,
      [empreinte],
    )
    return ligne ? versClient(ligne) : null
  },

  async reinitialiserMotDePasse(empreinte, motDePasseHash, le) {
    return transaction(async (tx) => {
      // Consommé une seule fois, même si le formulaire est envoyé deux fois
      const [jeton] = await lignes<{ clientId: string }>(
        tx,
        `update jetons_reinitialisation set utilise_le = $2
         where empreinte = $1 and utilise_le is null and expire_le > $2 returning client_id as "clientId"`,
        [empreinte, le],
      )
      if (!jeton) return null
      // Les autres liens encore valables de ce compte ne servent plus
      await tx.query("update jetons_reinitialisation set utilise_le = $2 where client_id = $1 and utilise_le is null", [jeton.clientId, le])
      const [ligne] = await lignes<LigneClient>(
        tx,
        `update clients set mot_de_passe_hash = $2, sessions_valides_depuis = $3 where id = $1 returning ${CLIENT}`,
        [jeton.clientId, motDePasseHash, le],
      )
      return ligne ? versClient(ligne) : null
    })
  },
}
