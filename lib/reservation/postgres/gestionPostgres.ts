import {
  controlerClientLocal,
  controlerPaiement,
  controlerReservationDirecte,
  DATES_PRISES,
  ETATS_CHAMBRE,
  saisonsDatees,
} from "../controles"
import { aujourdhuiISO } from "../dates"
import type { GestionHotel } from "../gestion"
import { calculerDevis } from "../regles"
import type { Chambre, ModePaiement, Paiement, ResultatAction, ResultatDemande } from "../types"
import { codeErreur, db, lignes, transaction } from "./db"
import {
  CLIENT,
  estOccupe,
  expirerOptions,
  lireHebergements,
  lireReglesSaisons,
  RESERVATION,
  verrouiller,
  versClient,
  versReservation,
  type LigneClient,
  type LigneReservation,
} from "./moteurPostgres"

// Implémentation PostgreSQL du contrat ../gestion (schéma : migrations/003_logiciel_hotes.sql)

const PAIEMENT = `id, reservation_id as "reservationId", montant, mode, note, le, enregistre_par as "enregistrePar"`

const EMAIL_PRIS = "Un compte existe déjà avec cette adresse e-mail."

export const gestionPostgres: GestionHotel = {
  async listerEquipe() {
    const liste = await lignes<LigneClient>(
      db(),
      `select ${CLIENT} from clients where role in ('hote', 'reception') order by actif desc, role, prenom`,
    )
    return liste.map(versClient)
  },

  async creerMembre({ prenom, nom, email, role, motDePasseHash }) {
    try {
      await db().query(
        "insert into clients (role, email, prenom, nom, mot_de_passe_hash, pays) values ($1, $2, $3, $4, $5, 'Madagascar')",
        [role, email.trim().toLowerCase(), prenom.trim(), nom.trim(), motDePasseHash],
      )
      return { ok: true }
    } catch (erreur) {
      if (codeErreur(erreur) === "23505") return { ok: false, erreur: EMAIL_PRIS }
      throw erreur
    }
  },

  async modifierMembre(id, { role, actif, motDePasseHash }) {
    return transaction<ResultatAction>(async (tx) => {
      // Deux gérants qui se retirent leurs droits en même temps : l'un attend l'autre
      await tx.query("select pg_advisory_xact_lock(hashtext('equipe'))")
      const [membre] = await lignes<{ role: string; actif: boolean }>(
        tx,
        "select role, actif from clients where id = $1 and role in ('hote', 'reception') for update",
        [id],
      )
      if (!membre) return { ok: false, erreur: "Ce compte n'existe plus." }

      const resteGerant = (role ?? membre.role) === "hote" && (actif ?? membre.actif)
      if (membre.role === "hote" && membre.actif && !resteGerant) {
        const [{ gerants }] = await lignes<{ gerants: number }>(
          tx,
          "select count(*)::int as gerants from clients where role = 'hote' and actif",
        )
        if (gerants <= 1) return { ok: false, erreur: "Il faut garder au moins un gérant actif." }
      }

      await tx.query(
        `update clients set role = coalesce($2, role), actif = coalesce($3, actif),
           mot_de_passe_hash = coalesce($4, mot_de_passe_hash),
           -- Mot de passe changé ou compte désactivé : les connexions ouvertes ne valent plus
           sessions_valides_depuis = case when $4::text is not null or $3 = false then now() else sessions_valides_depuis end
         where id = $1`,
        [id, role ?? null, actif ?? null, motDePasseHash ?? null],
      )
      return { ok: true }
    })
  },

  async creerClientLocal(client) {
    const erreur = controlerClientLocal(client)
    if (erreur) return { ok: false, erreur }
    try {
      const [ligne] = await lignes<LigneClient>(
        db(),
        `insert into clients (role, origine, email, prenom, nom, telephone, pays, note)
         values ('client', 'reception', nullif($1, ''), $2, $3, $4, $5, $6) returning ${CLIENT}`,
        [client.email.trim().toLowerCase(), client.prenom.trim(), client.nom.trim(), client.telephone.trim(), client.pays.trim(), client.note.trim()],
      )
      return { ok: true, client: versClient(ligne) }
    } catch (e) {
      if (codeErreur(e) === "23505") return { ok: false, erreur: "Un client a déjà cette adresse e-mail : cherchez-le dans la liste." }
      throw e
    }
  },

  async modifierNoteClient(id, note) {
    const resultat = await db().query("update clients set note = $2 where id = $1 and role = 'client'", [id, note.trim().slice(0, 1000)])
    return (resultat.rowCount ?? 0) > 0 ? { ok: true } : { ok: false, erreur: "Client introuvable." }
  },

  async creerReservationDirecte(r, auteur) {
    try {
      return await transaction<ResultatDemande>(async (tx) => {
        await verrouiller(tx, r.hebergementId)
        await expirerOptions(tx)
        const hebergement = (await lireHebergements(tx)).find((h) => h.id === r.hebergementId)
        const erreur = controlerReservationDirecte(r, hebergement, aujourdhuiISO())
        if (erreur || !hebergement) return { ok: false, erreur: erreur ?? "Choisissez un hébergement." }

        const [client] = await lignes<{ telephone: string }>(tx, "select telephone from clients where id = $1 and role = 'client'", [r.clientId])
        if (!client) return { ok: false, erreur: "Ce client n'existe plus." }
        if (await estOccupe(tx, hebergement.id, r.arrivee, r.depart)) return { ok: false, erreur: DATES_PRISES }

        const saisons = saisonsDatees(await lireReglesSaisons(tx))
        const [{ numero }] = await lignes<{ numero: number }>(tx, "select nextval('reservations_numero')::int as numero")
        const maintenant = new Date()
        const [ligne] = await lignes<LigneReservation>(
          tx,
          `insert into reservations (reference, client_id, hebergement_id, arrivee, depart, adultes, enfants, navette,
             telephone, message, montant_total, statut, source, cree_le, historique)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'confirmee', $12, $13, $14)
           returning ${RESERVATION}`,
          [
            `AVO-${r.arrivee.slice(0, 4)}-${String(numero).padStart(4, "0")}`,
            r.clientId,
            hebergement.id,
            r.arrivee,
            r.depart,
            r.adultes,
            r.enfants,
            r.navette,
            r.telephone.trim() || client.telephone,
            r.message.trim().slice(0, 2000),
            r.montantTotal ?? calculerDevis(hebergement, r.arrivee, r.depart, saisons).total,
            r.source,
            maintenant,
            JSON.stringify([{ statut: "confirmee", le: maintenant.toISOString(), note: `Saisie dans le logiciel par ${auteur}` }]),
          ],
        )
        return { ok: true, reservation: versReservation(ligne) }
      })
    } catch (erreur) {
      if (codeErreur(erreur) === "23P01") return { ok: false, erreur: DATES_PRISES }
      throw erreur
    }
  },

  async enregistrerMouvement(reservationId, mouvement, annuler = false) {
    const [r] = await lignes<{ statut: string; arrivee: string; arriveeLe: Date | null; departLe: Date | null }>(
      db(),
      `select statut, arrivee, arrivee_le as "arriveeLe", depart_le as "departLe" from reservations where id = $1`,
      [reservationId],
    )
    if (!r) return { ok: false, erreur: "Réservation introuvable." }
    if (r.statut !== "confirmee") return { ok: false, erreur: "Seul un séjour confirmé peut être enregistré à la réception." }

    if (mouvement === "arrivee") {
      if (!annuler && r.arrivee > aujourdhuiISO()) return { ok: false, erreur: "Ce séjour ne commence pas encore aujourd'hui." }
      if (annuler && r.departLe) return { ok: false, erreur: "Annulez d'abord le départ." }
      await db().query("update reservations set arrivee_le = $2 where id = $1", [reservationId, annuler ? null : new Date()])
    } else {
      if (!annuler && !r.arriveeLe) return { ok: false, erreur: "Enregistrez d'abord l'arrivée du client." }
      await transaction(async (tx) => {
        const [{ hebergementId }] = await lignes<{ hebergementId: string }>(
          tx,
          `update reservations set depart_le = $2 where id = $1 returning hebergement_id as "hebergementId"`,
          [reservationId, annuler ? null : new Date()],
        )
        // Client parti : la chambre passe au ménage
        if (!annuler) await tx.query("update hebergements set etat = 'a_nettoyer' where id = $1 and etat = 'propre'", [hebergementId])
      })
    }
    return { ok: true }
  },

  async listerChambres() {
    return lignes<Chambre>(db(), `select id, etat, note_etat as "noteEtat" from hebergements order by ordre, id`)
  },

  async modifierChambre(id, etat, noteEtat) {
    if (!ETATS_CHAMBRE.includes(etat)) return { ok: false, erreur: "État inconnu." }
    const resultat = await db().query("update hebergements set etat = $2, note_etat = $3 where id = $1", [id, etat, noteEtat.trim().slice(0, 200)])
    return (resultat.rowCount ?? 0) > 0 ? { ok: true } : { ok: false, erreur: "Hébergement introuvable." }
  },

  async listerPaiements() {
    const liste = await lignes<Omit<Paiement, "le" | "enregistrePar"> & { le: Date; enregistrePar: string | null }>(
      db(),
      `select ${PAIEMENT} from paiements order by le`,
    )
    return liste.map(({ le, enregistrePar, ...reste }) => ({ ...reste, le: le.toISOString(), ...(enregistrePar && { enregistrePar }) }))
  },

  async ajouterPaiement(reservationId, { montant, mode, note }, membreId) {
    const erreur = controlerPaiement(montant, mode)
    if (erreur) return { ok: false, erreur }
    const [r] = await lignes(db(), "select 1 from reservations where id = $1", [reservationId])
    if (!r) return { ok: false, erreur: "Réservation introuvable." }
    await db().query("insert into paiements (reservation_id, montant, mode, note, enregistre_par) values ($1, $2, $3, $4, $5)", [
      reservationId,
      montant,
      mode satisfies ModePaiement,
      note.trim().slice(0, 200),
      membreId,
    ])
    return { ok: true }
  },

  async supprimerPaiement(id) {
    const resultat = await db().query("delete from paiements where id = $1", [id])
    return (resultat.rowCount ?? 0) > 0
  },
}
