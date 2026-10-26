import { randomUUID } from "node:crypto"
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
import { calculerDevis, repartirVoyageurs } from "../regles"
import type {
  ActiviteReservation,
  Blocage,
  Chambre,
  Client,
  ClientPublic,
  CodeDevise,
  DateISO,
  Hebergement,
  PeriodeOccupee,
  RegleSaison,
  Reservation,
  ResultatAction,
  ResultatDemandeSite,
  SourceReservation,
  StatutReservation,
} from "../types"
import { codeErreur, db, lignes, transaction, type Executant } from "./db"

// Implémentation PostgreSQL des contrats de ../moteur (schéma : migrations/). Contrôles métier
// dans ../controles ; la base garantit en plus qu'aucune nuit n'est vendue deux fois (contrainte d'exclusion).

const HEBERGEMENT = `id, slug, nom, type, description, image, capacite_max as "capaciteMax", literie, vue,
  prix_nuit as "prixNuit", presentation, galerie, salle_de_bains as "salleDeBains", equipements`

export const RESERVATION = `id, reference, client_id as "clientId", hebergement_id as "hebergementId", chambre_id as "chambreId",
  groupe, arrivee, depart,
  adultes, enfants, navette, telephone, message, montant_total as "montantTotal", statut, source,
  cree_le as "creeLe", expire_le as "expireLe", historique, arrivee_le as "arriveeLe", depart_le as "departLe",
  facture_numero as "factureNumero", facture_le as "factureLe"`

// E-mail facultatif pour un client créé à la réception : "" plutôt que null
export const CLIENT = `id, role, coalesce(email, '') as email, prenom, nom, telephone, pays, cree_le as "creeLe",
  sessions_valides_depuis as "sessionsValidesDepuis", actif, origine, note, efface_le as "effaceLe"`

// Horodatages rendus par pg en Date : convertis en texte ISO comme dans le reste du code
export type LigneReservation = Omit<Reservation, "groupe" | "creeLe" | "expireLe" | "arriveeLe" | "departLe" | "factureNumero" | "factureLe"> & {
  groupe: string | null
  creeLe: Date
  expireLe: Date | null
  arriveeLe: Date | null
  departLe: Date | null
  factureNumero: string | null
  factureLe: Date | null
}
export type LigneClient = Omit<ClientPublic, "creeLe" | "sessionsValidesDepuis" | "effaceLe"> & {
  creeLe: Date
  sessionsValidesDepuis: Date | null
  effaceLe: Date | null
}

export function versReservation({ groupe, creeLe, expireLe, arriveeLe, departLe, factureNumero, factureLe, ...reste }: LigneReservation): Reservation {
  return {
    ...reste,
    ...(groupe && { groupe }),
    creeLe: creeLe.toISOString(),
    ...(expireLe && { expireLe: expireLe.toISOString() }),
    ...(arriveeLe && { arriveeLe: arriveeLe.toISOString() }),
    ...(departLe && { departLe: departLe.toISOString() }),
    ...(factureNumero && { factureNumero }),
    ...(factureLe && { factureLe: factureLe.toISOString() }),
  }
}

export function versClient({ creeLe, sessionsValidesDepuis, effaceLe, ...reste }: LigneClient): ClientPublic {
  return {
    ...reste,
    creeLe: creeLe.toISOString(),
    ...(sessionsValidesDepuis && { sessionsValidesDepuis: sessionsValidesDepuis.toISOString() }),
    ...(effaceLe && { effaceLe: effaceLe.toISOString() }),
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
export function evenement(statut: StatutReservation, note?: string): string {
  return JSON.stringify([{ statut, le: new Date().toISOString(), ...(note && { note }) }])
}

export async function lireHebergements(ex: Executant): Promise<Hebergement[]> {
  const liste = await lignes<Hebergement>(ex, `select ${HEBERGEMENT} from hebergements order by ordre, id`)
  return liste.map(avecContenuDuCode)
}

export const CHAMBRE = `id, hebergement_id as "hebergementId", numero, etat, note_etat as "noteEtat", active`

// Ordre d'attribution et d'affichage : « Océan 2 » avant « Océan 10 »
export const ORDRE_CHAMBRES = "hebergement_id, length(numero), numero"

export async function lireChambres(ex: Executant): Promise<Chambre[]> {
  return lignes<Chambre>(ex, `select ${CHAMBRE} from chambres order by ${ORDRE_CHAMBRES}`)
}

export async function lireReglesSaisons(ex: Executant): Promise<RegleSaison[]> {
  return lignes<RegleSaison>(ex, `select nom, debut, fin, coefficient, sejour_min as "sejourMin" from regles_saisons order by debut`)
}

// Expiration paresseuse des options dépassées, avant toute lecture des réservations (en production : tâche planifiée)
export async function expirerOptions(ex: Executant) {
  await ex.query(
    `update reservations set statut = 'expiree', historique = historique || $1::jsonb
     where statut = 'option' and expire_le < now()`,
    [evenement("expiree")],
  )
}

// Verrou de transaction par hébergement (catégorie) : deux écritures sur ses chambres (demandes, blocages,
// attribution d'une chambre libre) passent l'une après l'autre, la vérification des dates ne peut pas se croiser
// avec une insertion
export async function verrouiller(tx: Executant, hebergementId: string) {
  await tx.query("select pg_advisory_xact_lock(hashtext($1))", [hebergementId])
}

// Chambres actives de la catégorie libres sur tout le séjour, dans l'ordre d'attribution (à appeler sous le verrou
// de la catégorie). `sauf` : réservation modifiée, qui ne se gêne pas elle-même. `source` : provenance de la
// réservation (saisie ou modifiée par l'équipe) ; les dates importées du calendrier de cette même plateforme sont
// les siennes (réservation Booking.com déjà importée de Booking.com) et ne la bloquent pas
export async function chambresLibres(
  ex: Executant,
  hebergementId: string,
  debut: DateISO,
  fin: DateISO,
  { sauf, source }: { sauf?: string; source?: SourceReservation } = {},
): Promise<string[]> {
  const libres = await lignes<{ id: string }>(
    ex,
    `select c.id from chambres c
     where c.hebergement_id = $1 and c.active
       and not exists (
         select 1 from reservations r
         where r.chambre_id = c.id and r.statut = any($4) and daterange(r.arrivee, r.depart) && daterange($2::date, $3::date)
           and r.id is distinct from $5)
       and not exists (
         select 1 from blocages b left join calendriers_externes k on k.id = b.calendrier_id
         where b.chambre_id = c.id and daterange(b.debut, b.fin) && daterange($2::date, $3::date)
           and ($6::text is null or k.plateforme is distinct from $6))
     order by ${ORDRE_CHAMBRES}`,
    [hebergementId, debut, fin, STATUTS_ACTIFS, sauf ?? null, source ?? null],
  )
  return libres.map((c) => c.id)
}

// Chambre choisie par l'équipe (`chambreId`), sinon la première libre ; l'erreur à afficher si ce n'est pas possible
export async function attribuerChambre(
  ex: Executant,
  hebergement: Pick<Hebergement, "id" | "nom">,
  chambreId: string | null,
  debut: DateISO,
  fin: DateISO,
  options: { sauf?: string; source?: SourceReservation } = {},
): Promise<{ chambreId: string } | { erreur: string }> {
  const libres = await chambresLibres(ex, hebergement.id, debut, fin, options)
  if (!chambreId) return libres[0] ? { chambreId: libres[0] } : { erreur: `Aucune chambre ${hebergement.nom} n'est libre à ces dates.` }
  const [chambre] = await lignes<Pick<Chambre, "numero" | "hebergementId" | "active">>(
    ex,
    `select numero, hebergement_id as "hebergementId", active from chambres where id = $1`,
    [chambreId],
  )
  if (!chambre || chambre.hebergementId !== hebergement.id) return { erreur: `Choisissez une chambre ${hebergement.nom}.` }
  if (!chambre.active) return { erreur: `La chambre ${chambre.numero} est désactivée.` }
  if (!libres.includes(chambreId)) {
    return { erreur: `La chambre ${chambre.numero} n'est pas libre à ces dates : une autre réservation ou des dates bloquées les occupent.` }
  }
  return { chambreId }
}

export const moteurPostgres: MoteurReservation = {
  async listerHebergements() {
    return lireHebergements(db())
  },

  async listerChambres() {
    return lireChambres(db())
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
      `select hebergement_id as "hebergementId", chambre_id as "chambreId", arrivee as debut, depart as fin
       from reservations where statut = any($1)
       union all
       select hebergement_id, chambre_id, debut, fin from blocages`,
      [STATUTS_ACTIFS],
    )
  },

  async creerDemande(clientId, demande) {
    try {
      return await transaction<ResultatDemandeSite>(async (tx) => {
        await verrouiller(tx, demande.hebergementId)
        await expirerOptions(tx)
        const hebergement = (await lireHebergements(tx)).find((h) => h.id === demande.hebergementId)
        const saisons = saisonsDatees(await lireReglesSaisons(tx))
        const erreur = controlerDemande(demande, hebergement, saisons)
        if (erreur || !hebergement) return { ok: false, erreur: erreur ?? "Cet hébergement n'existe pas." }

        const { arrivee, depart, adultes, enfants, chambres, navette, telephone, message } = demande
        const libres = await chambresLibres(tx, hebergement.id, arrivee, depart)
        if (libres.length === 0) return { ok: false, erreur: DATES_PRISES }
        if (libres.length < chambres) {
          return {
            ok: false,
            erreur: `Il ne reste que ${libres.length} ${hebergement.nom} libre${libres.length > 1 ? "s" : ""} à ces dates : réduisez le nombre de chambres ou choisissez d'autres dates.`,
          }
        }
        // Capacité déjà contrôlée (controlerDemande) : la répartition existe
        const repartition = repartirVoyageurs(adultes, enfants, chambres, hebergement.capaciteMax)!
        const montant = calculerDevis(hebergement, arrivee, depart, saisons).total
        const groupe = chambres > 1 ? randomUUID() : null
        const maintenant = new Date()

        // Une réservation par chambre, chacune avec sa référence, ses voyageurs et son montant
        const reservations: Reservation[] = []
        for (const [i, voyageurs] of repartition.entries()) {
          const [{ numero }] = await lignes<{ numero: number }>(tx, "select nextval('reservations_numero')::int as numero")
          const [ligne] = await lignes<LigneReservation>(
            tx,
            `insert into reservations (reference, client_id, hebergement_id, chambre_id, groupe, arrivee, depart, adultes,
               enfants, navette, telephone, message, montant_total, statut, source, cree_le, expire_le, historique)
             values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'option', 'site', $14, $15, $16)
             returning ${RESERVATION}`,
            [
              `AVO-${arrivee.slice(0, 4)}-${String(numero).padStart(4, "0")}`,
              clientId,
              hebergement.id,
              libres[i],
              groupe,
              arrivee,
              depart,
              voyageurs.adultes,
              voyageurs.enfants,
              navette,
              telephone,
              message,
              montant,
              maintenant,
              new Date(maintenant.getTime() + DUREE_OPTION_MS),
              JSON.stringify([{ statut: "option", le: maintenant.toISOString() }]),
            ],
          )
          reservations.push(versReservation(ligne))
        }
        // E-mails envoyés par l'action (app/reserver/actions.ts), une fois la transaction validée
        return { ok: true, reservations }
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
    // Toutes les chambres de la demande : le client annule sa demande, pas une chambre
    const resultat = await ex.query(
      `update reservations set statut = 'annulee', historique = historique || $3::jsonb
       where client_id = $2 and statut = 'option'
         and (id = $1 or groupe = (select groupe from reservations where id = $1 and client_id = $2))`,
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

  async activiteDepuis(depuis) {
    const ex = db()
    // Les options dépassées deviennent des événements « expirée » à annoncer
    await expirerOptions(ex)
    const [{ dernier, total }] = await lignes<{ dernier: Date | null; total: number }>(
      ex,
      `select max((e->>'le')::timestamptz) as dernier, count(*)::int as total
       from reservations, jsonb_array_elements(historique) e`,
    )
    const curseur = (dernier ?? new Date(0)).toISOString()
    if (!depuis) return { curseur, total, evenements: [] }

    // Au plus 20 : au-delà (onglet resté longtemps fermé), la page rechargée montre de toute façon tout
    const evenements = await lignes<Omit<ActiviteReservation, "le"> & { le: Date }>(
      ex,
      `select r.id as "reservationId", r.reference, e.statut, e.le, e.note,
         trim(c.prenom || ' ' || c.nom) as client, h.nom || ' · ' || ch.numero as hebergement, r.arrivee, r.depart
       from reservations r
       cross join lateral jsonb_to_recordset(r.historique) as e(statut text, le timestamptz, note text)
       join clients c on c.id = r.client_id
       join hebergements h on h.id = r.hebergement_id
       join chambres ch on ch.id = r.chambre_id
       where e.le > $1::timestamptz and e.le <= $2::timestamptz
       order by e.le
       limit 20`,
      [depuis, curseur],
    )
    return {
      curseur,
      total,
      evenements: evenements.map(({ le, note, ...reste }) => ({ ...reste, le: le.toISOString(), ...(note && { note }) })),
    }
  },

  async changerStatut(reservationId, statut, note) {
    return transaction<ResultatAction>(async (tx) => {
      await expirerOptions(tx)
      const [reservation] = await lignes<Pick<Reservation, "statut" | "depart"> & { groupe: string | null }>(
        tx,
        "select statut, depart, groupe from reservations where id = $1 for update",
        [reservationId],
      )
      const erreur = controlerChangementStatut(reservation, statut)
      if (erreur) return { ok: false, erreur }
      // Les hôtes ne remettent jamais en option : l'échéance disparaît. Une demande de plusieurs chambres se
      // confirme ou se refuse en entier ; un séjour confirmé s'annule chambre par chambre
      const groupe = reservation.statut === "option" ? reservation.groupe : null
      await tx.query(
        `update reservations set statut = $2, expire_le = null, historique = historique || $3::jsonb
         where id = $1 or ($4::text is not null and groupe = $4 and statut = 'option')`,
        [reservationId, statut, evenement(statut, note), groupe],
      )
      // E-mail au client envoyé par la route de l'API (app/api/hotes/reservations/[id]), une fois la transaction validée
      return { ok: true }
    })
  },

  async listerBlocages() {
    const liste = await lignes<Omit<Blocage, "calendrierId"> & { calendrierId: string | null }>(
      db(),
      `select id, hebergement_id as "hebergementId", chambre_id as "chambreId", debut, fin, raison, calendrier_id as "calendrierId"
       from blocages order by debut`,
    )
    return liste.map(({ calendrierId, ...reste }) => ({ ...reste, ...(calendrierId && { calendrierId }) }))
  },

  async ajouterBlocage(blocage) {
    return transaction<ResultatAction>(async (tx) => {
      const chambres = (await lireChambres(tx)).filter((c) => blocage.chambreIds.includes(c.id))
      const erreur = controlerBlocage(blocage, chambres)
      if (erreur) return { ok: false, erreur }
      // Verrous des catégories concernées, toujours dans le même ordre (pas d'interblocage)
      for (const hebergementId of [...new Set(chambres.map((c) => c.hebergementId))].sort()) await verrouiller(tx, hebergementId)
      await expirerOptions(tx)

      const [conflit] = await lignes<{ reference: string; chambre: string }>(
        tx,
        `select r.reference, c.numero as chambre from reservations r join chambres c on c.id = r.chambre_id
         where r.chambre_id = any($1) and r.statut = any($4) and daterange(r.arrivee, r.depart) && daterange($2::date, $3::date)
         order by r.arrivee limit 1`,
        [chambres.map((c) => c.id), blocage.debut, blocage.fin, STATUTS_ACTIFS],
      )
      if (conflit) return { ok: false, erreur: blocageEnConflit(conflit.reference, conflit.chambre) }

      for (const chambre of chambres) {
        await tx.query("insert into blocages (hebergement_id, chambre_id, debut, fin, raison) values ($1, $2, $3, $4, $5)", [
          chambre.hebergementId,
          chambre.id,
          blocage.debut,
          blocage.fin,
          blocage.raison || "Indisponible",
        ])
      }
      return { ok: true }
    })
  },

  async supprimerBlocage(id) {
    // Dates importées d'une plateforme : elles reviendraient à la synchronisation suivante
    const resultat = await db().query("delete from blocages where id = $1 and calendrier_id is null", [id])
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
