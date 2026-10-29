import { randomBytes } from "node:crypto"
import {
  changementsReservation,
  controlerCalendrier,
  controlerClientLocal,
  controlerModification,
  controlerModificationClient,
  controlerPaiement,
  controlerReservationDirecte,
  DATES_PRISES,
  ETATS_CHAMBRE,
  normaliserFacturation,
  normaliserNumero,
  saisonsDatees,
  STATUTS_ACTIFS,
} from "../controles"
import { aujourdhuiISO, formaterPrix } from "../dates"
import type { GestionHotel, ResultatClient } from "../gestion"
import type { EvenementExporte } from "../ical"
import { calculerDevis } from "../regles"
import type {
  BilanSynchronisation,
  CalendrierExterne,
  Chambre,
  EntreeJournal,
  ModePaiement,
  Paiement,
  Plateforme,
  ReglagesFacturation,
  ResultatAction,
  ResultatDemande,
  ResultatModification,
} from "../types"
import { codeErreur, db, lignes, transaction } from "./db"
import {
  attribuerChambre,
  CHAMBRE,
  CLIENT,
  evenement,
  expirerOptions,
  lireChambres,
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

const PAIEMENT = `id, reservation_id as "reservationId", montant, mode, note, le, enregistre_par as "enregistrePar", numero`

const CALENDRIER = `id, hebergement_id as "hebergementId", chambre_id as "chambreId", plateforme, nom, url_import as "urlImport", jeton,
  synchronise_le as "synchroniseLe", erreur, cree_le as "creeLe"`
type LigneCalendrier = Omit<CalendrierExterne, "synchroniseLe" | "creeLe"> & { synchroniseLe: Date | null; creeLe: Date }

function versCalendrier({ synchroniseLe, creeLe, ...reste }: LigneCalendrier): CalendrierExterne {
  return { ...reste, creeLe: creeLe.toISOString(), ...(synchroniseLe && { synchroniseLe: synchroniseLe.toISOString() }) }
}

const EMAIL_PRIS = "Un compte existe déjà avec cette adresse e-mail."
const NUMERO_PRIS = (numero: string) => `Une autre chambre s'appelle déjà « ${numero} » : choisissez un autre numéro.`
const EMAIL_D_UN_AUTRE ="Un autre client a déjà cette adresse e-mail : s'il s'agit de la même personne, fusionnez les deux fiches."

// Avant toute saisie des hôtes, les factures portent au moins le nom et l'adresse de l'hôtel
const FACTURATION_INITIALE: ReglagesFacturation = {
  raisonSociale: "Chez L’Avocatier",
  adresse: "Vohilava, Île Sainte-Marie, Madagascar",
  telephone: "",
  email: "",
  identifiants: "",
  mentions: "",
}

export const gestionPostgres: GestionHotel = {
  async listerEquipe() {
    const liste = await lignes<LigneClient>(
      db(),
      `select ${CLIENT} from clients where role in ('hote', 'reception', 'caissier') order by actif desc, role, prenom`,
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
        "select role, actif from clients where id = $1 and role in ('hote', 'reception', 'caissier') for update",
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
    const resultat = await db().query("update clients set note = $2 where id = $1 and role = 'client' and efface_le is null", [
      id,
      note.trim().slice(0, 1000),
    ])
    return (resultat.rowCount ?? 0) > 0 ? { ok: true } : { ok: false, erreur: "Client introuvable." }
  },

  async modifierClient(id, modification) {
    const [client] = await lignes<{ compte: boolean }>(
      db(),
      "select mot_de_passe_hash <> '' as compte from clients where id = $1 and role = 'client' and efface_le is null",
      [id],
    )
    if (!client) return { ok: false, erreur: "Client introuvable." }
    const erreur = controlerModificationClient(modification, client.compte)
    if (erreur) return { ok: false, erreur }
    try {
      await db().query("update clients set prenom = $2, nom = $3, email = nullif($4, ''), telephone = $5, pays = $6 where id = $1", [
        id,
        modification.prenom.trim(),
        modification.nom.trim(),
        modification.email.trim().toLowerCase(),
        modification.telephone.trim(),
        modification.pays.trim(),
      ])
      return { ok: true }
    } catch (e) {
      if (codeErreur(e) === "23505") return { ok: false, erreur: EMAIL_D_UN_AUTRE }
      throw e
    }
  },

  async fusionnerClients(gardeId, doublonId) {
    if (gardeId === doublonId) return { ok: false, erreur: "Choisissez une autre fiche que celle-ci." }
    return transaction<ResultatClient>(async (tx) => {
      type Fiche = { id: string; email: string | null; nom: string; telephone: string; pays: string; note: string; compte: boolean }
      const fiches = await lignes<Fiche>(
        tx,
        `select id, email, nom, telephone, pays, note, mot_de_passe_hash <> '' as compte from clients
         where id = any($1) and role = 'client' and efface_le is null order by id for update`,
        [[gardeId, doublonId]],
      )
      const garde = fiches.find((f) => f.id === gardeId)
      const doublon = fiches.find((f) => f.id === doublonId)
      if (!garde || !doublon) return { ok: false, erreur: "L'une des deux fiches n'existe plus." }
      if (garde.compte && doublon.compte) {
        return { ok: false, erreur: "Ces deux fiches sont des comptes du site, chacun avec son mot de passe : elles ne peuvent pas être réunies." }
      }
      // Le compte du site reste : son titulaire continue de s'y connecter et retrouve tous ses séjours
      const [reste, part] = doublon.compte ? [doublon, garde] : [garde, doublon]

      await tx.query("update reservations set client_id = $1 where client_id = $2", [reste.id, part.id])
      // Adresse libérée avant d'être reprise (unicité)
      await tx.query("update clients set email = null where id = $1", [part.id])
      await tx.query(
        `update clients set email = coalesce(email, $2), nom = case when nom = '' then $3 else nom end,
           telephone = case when telephone = '' then $4 else telephone end, pays = case when pays = '' then $5 else pays end,
           note = $6
         where id = $1`,
        [reste.id, part.email, part.nom, part.telephone, part.pays, [reste.note, part.note].filter(Boolean).join("\n").slice(0, 1000)],
      )
      await tx.query("delete from clients where id = $1", [part.id])
      const [ligne] = await lignes<LigneClient>(tx, `select ${CLIENT} from clients where id = $1`, [reste.id])
      return { ok: true, client: versClient(ligne) }
    })
  },

  async effacerClient(id) {
    return transaction<ResultatAction>(async (tx) => {
      const [client] = await lignes<{ prenom: string; nom: string }>(
        tx,
        "select prenom, nom from clients where id = $1 and role = 'client' and efface_le is null for update",
        [id],
      )
      if (!client) return { ok: false, erreur: "Client introuvable ou déjà effacé." }
      await expirerOptions(tx)
      const [enCours] = await lignes<{ reference: string }>(
        tx,
        "select reference from reservations where client_id = $1 and statut = any($2) and depart >= $3 and depart_le is null limit 1",
        [id, STATUTS_ACTIFS, aujourdhuiISO()],
      )
      if (enCours) return { ok: false, erreur: `Ce client a un séjour en cours ou à venir (${enCours.reference}) : annulez-le ou attendez son départ.` }

      const [{ sejours }] = await lignes<{ sejours: number }>(tx, "select count(*)::int as sejours from reservations where client_id = $1", [id])
      if (sejours === 0) {
        await tx.query("delete from clients where id = $1", [id])
      } else {
        // Réservations et encaissements restent pour la comptabilité, sans rien qui désigne la personne
        await tx.query(
          `update clients set email = null, prenom = 'Client', nom = 'effacé', telephone = '', pays = '', note = '',
             mot_de_passe_hash = '', sessions_valides_depuis = now(), efface_le = now()
           where id = $1`,
          [id],
        )
        await tx.query("update reservations set telephone = '', message = '' where client_id = $1", [id])
        await tx.query("delete from jetons_reinitialisation where client_id = $1", [id])
      }
      // Son nom disparaît aussi du journal d'activité
      const nom = `${client.prenom} ${client.nom}`.trim()
      if (nom.length >= 3) {
        await tx.query("update journal_activite set detail = replace(detail, $1, 'Client effacé') where strpos(detail, $1) > 0", [nom])
      }
      return { ok: true }
    })
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
        const chambre = await attribuerChambre(tx, hebergement, r.chambreId || null, r.arrivee, r.depart, { source: r.source })
        if ("erreur" in chambre) return { ok: false, erreur: chambre.erreur }

        const saisons = saisonsDatees(await lireReglesSaisons(tx))
        const [{ numero }] = await lignes<{ numero: number }>(tx, "select nextval('reservations_numero')::int as numero")
        const maintenant = new Date()
        const [ligne] = await lignes<LigneReservation>(
          tx,
          `insert into reservations (reference, client_id, hebergement_id, chambre_id, arrivee, depart, adultes, enfants, navette,
             telephone, message, montant_total, statut, source, cree_le, historique)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'confirmee', $13, $14, $15)
           returning ${RESERVATION}`,
          [
            `AVO-${r.arrivee.slice(0, 4)}-${String(numero).padStart(4, "0")}`,
            r.clientId,
            hebergement.id,
            chambre.chambreId,
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

  async modifierReservation(id, m, auteur) {
    try {
      return await transaction<ResultatModification>(async (tx) => {
        // Option arrivée à échéance : expirée avant d'être lue
        await expirerOptions(tx)
        const [ligne] = await lignes<LigneReservation>(tx, `select ${RESERVATION} from reservations where id = $1`, [id])
        if (!ligne) return { ok: false, erreur: "Réservation introuvable." }
        // Verrous des hébergements quitté et rejoint, toujours dans le même ordre (pas d'interblocage), puis la
        // ligne relue : une autre modification a pu passer entre-temps
        for (const hebergementId of [...new Set([ligne.hebergementId, m.hebergementId])].sort()) await verrouiller(tx, hebergementId)
        const [aJour] = await lignes<LigneReservation>(tx, `select ${RESERVATION} from reservations where id = $1 for update`, [id])
        const avant = versReservation(aJour)

        const hebergements = await lireHebergements(tx)
        const hebergement = hebergements.find((h) => h.id === m.hebergementId)
        const erreur = controlerModification(avant, m, hebergement, aujourdhuiISO())
        if (erreur || !hebergement) return { ok: false, erreur: erreur ?? "Choisissez un hébergement." }

        // Chambre : celle choisie, sinon l'actuelle (même catégorie) si elle reste libre, sinon une autre libre.
        // La disponibilité n'est revérifiée que si le séjour change de chambre ou de dates
        const voulue = m.chambreId || (m.hebergementId === avant.hebergementId ? avant.chambreId : null)
        let chambreId = avant.chambreId
        if (voulue !== avant.chambreId || m.arrivee !== avant.arrivee || m.depart !== avant.depart) {
          const options = { sauf: id, source: avant.source }
          let attribuee = await attribuerChambre(tx, hebergement, voulue, m.arrivee, m.depart, options)
          if ("erreur" in attribuee && !m.chambreId && voulue) attribuee = await attribuerChambre(tx, hebergement, null, m.arrivee, m.depart, options)
          if ("erreur" in attribuee) return { ok: false, erreur: attribuee.erreur }
          chambreId = attribuee.chambreId
        }

        const montantTotal = m.montantTotal ?? calculerDevis(hebergement, m.arrivee, m.depart, saisonsDatees(await lireReglesSaisons(tx))).total
        const chambres = await lireChambres(tx)
        const changements = changementsReservation(
          avant,
          { ...m, chambreId, montantTotal },
          (h) => hebergements.find((x) => x.id === h)?.nom ?? h,
          (c) => chambres.find((x) => x.id === c)?.numero ?? c,
        )
        if (changements.length === 0) return { ok: true, changements }

        await tx.query(
          `update reservations set hebergement_id = $2, chambre_id = $10, arrivee = $3, depart = $4, adultes = $5, enfants = $6,
             navette = $7, montant_total = $8, historique = historique || $9::jsonb
           where id = $1`,
          [
            id,
            m.hebergementId,
            m.arrivee,
            m.depart,
            m.adultes,
            m.enfants,
            m.navette,
            montantTotal,
            evenement(avant.statut, `Modifiée par ${auteur} : ${changements.join(" ; ")}`),
            chambreId,
          ],
        )
        return { ok: true, changements }
      })
    } catch (erreur) {
      if (codeErreur(erreur) === "23P01") return { ok: false, erreur: DATES_PRISES }
      throw erreur
    }
  },

  async enregistrerMouvement(reservationId, mouvement, { annuler = false, auteur, note = "" }) {
    return transaction<{ ok: true; soldeDu: number } | { ok: false; erreur: string }>(async (tx) => {
      const [r] = await lignes<{ statut: string; arrivee: string; arriveeLe: Date | null; departLe: Date | null; chambreId: string; solde: number }>(
        tx,
        `select statut, arrivee, arrivee_le as "arriveeLe", depart_le as "departLe", chambre_id as "chambreId",
           montant_total - coalesce((select sum(montant) from paiements p where p.reservation_id = r.id), 0)::int as solde
         from reservations r where id = $1 for update`,
        [reservationId],
      )
      if (!r) return { ok: false, erreur: "Réservation introuvable." }
      if (r.statut !== "confirmee") return { ok: false, erreur: "Seul un séjour confirmé peut être enregistré à la réception." }
      const mot = note.trim().slice(0, 500)
      let texte: string

      if (mouvement === "arrivee") {
        if (!annuler && r.arriveeLe) return { ok: false, erreur: "L'arrivée de ce client est déjà enregistrée." }
        if (!annuler && r.arrivee > aujourdhuiISO()) return { ok: false, erreur: "Ce séjour ne commence pas encore aujourd'hui." }
        if (annuler && !r.arriveeLe) return { ok: false, erreur: "Aucune arrivée enregistrée à annuler." }
        if (annuler && r.departLe) return { ok: false, erreur: "Annulez d'abord le départ." }
        await tx.query("update reservations set arrivee_le = $2 where id = $1", [reservationId, annuler ? null : new Date()])
        texte = annuler ? `Arrivée annulée par ${auteur}` : `Arrivée enregistrée par ${auteur}${r.solde > 0 ? `, reste ${formaterPrix(r.solde)} à payer` : ""}`
      } else {
        if (!annuler && r.departLe) return { ok: false, erreur: "Le départ de ce client est déjà enregistré." }
        if (!annuler && !r.arriveeLe) return { ok: false, erreur: "Enregistrez d'abord l'arrivée du client." }
        if (annuler && !r.departLe) return { ok: false, erreur: "Aucun départ enregistré à annuler." }
        if (!annuler && r.solde > 0 && !mot) {
          return { ok: false, erreur: `Il reste ${formaterPrix(r.solde)} à payer : encaissez-le, ou indiquez pourquoi le client part sans avoir soldé.` }
        }
        await tx.query("update reservations set depart_le = $2 where id = $1", [reservationId, annuler ? null : new Date()])
        // Client parti : la chambre passe au ménage
        if (!annuler) await tx.query("update chambres set etat = 'a_nettoyer' where id = $1 and etat = 'propre'", [r.chambreId])
        texte = annuler
          ? `Départ annulé par ${auteur}`
          : r.solde > 0
            ? `Départ enregistré par ${auteur} sans avoir soldé (reste ${formaterPrix(r.solde)})`
            : `Départ enregistré par ${auteur}, séjour soldé`
      }
      if (mot) texte += ` : « ${mot} »`
      await tx.query("update reservations set historique = historique || $2::jsonb where id = $1", [reservationId, evenement("confirmee", texte)])
      return { ok: true, soldeDu: Math.max(0, r.solde) }
    })
  },

  async creerChambre({ hebergementId, numero }) {
    const lu = normaliserNumero(numero)
    if ("erreur" in lu) return { ok: false, erreur: lu.erreur }
    if (!(await lireHebergements(db())).some((h) => h.id === hebergementId)) return { ok: false, erreur: "Choisissez une catégorie d'hébergement." }
    try {
      const [chambre] = await lignes<Chambre>(
        db(),
        `insert into chambres (hebergement_id, numero) values ($1, $2) returning ${CHAMBRE}`,
        [hebergementId, lu.numero],
      )
      return { ok: true, chambre }
    } catch (e) {
      if (codeErreur(e) === "23505") return { ok: false, erreur: NUMERO_PRIS(lu.numero) }
      throw e
    }
  },

  async modifierChambre(id, { numero, etat, noteEtat, active }) {
    if (etat !== undefined && !ETATS_CHAMBRE.includes(etat)) return { ok: false, erreur: "État inconnu." }
    const lu = numero === undefined ? null : normaliserNumero(numero)
    if (lu && "erreur" in lu) return { ok: false, erreur: lu.erreur }
    try {
      return await transaction<ResultatAction>(async (tx) => {
        const [chambre] = await lignes<Chambre>(tx, `select ${CHAMBRE} from chambres where id = $1`, [id])
        if (!chambre) return { ok: false, erreur: "Cette chambre n'existe plus." }
        if (active === false && chambre.active) {
          // Sous le verrou de la catégorie : aucune réservation ne peut s'y glisser pendant la vérification
          await verrouiller(tx, chambre.hebergementId)
          await expirerOptions(tx)
          const [aVenir] = await lignes<{ reference: string }>(
            tx,
            "select reference from reservations where chambre_id = $1 and statut = any($2) and depart > $3 order by arrivee limit 1",
            [id, STATUTS_ACTIFS, aujourdhuiISO()],
          )
          if (aVenir) {
            return { ok: false, erreur: `La réservation ${aVenir.reference} est attribuée à ${chambre.numero} : changez-la de chambre avant de désactiver celle-ci.` }
          }
        }
        await tx.query(
          `update chambres set numero = coalesce($2, numero), etat = coalesce($3, etat), note_etat = coalesce($4, note_etat),
             active = coalesce($5, active)
           where id = $1`,
          [id, lu?.numero ?? null, etat ?? null, noteEtat === undefined ? null : noteEtat.trim().slice(0, 200), active ?? null],
        )
        return { ok: true }
      })
    } catch (e) {
      if (codeErreur(e) === "23505" && lu) return { ok: false, erreur: NUMERO_PRIS(lu.numero) }
      throw e
    }
  },

  async supprimerChambre(id) {
    return transaction<ResultatAction>(async (tx) => {
      const [chambre] = await lignes<Chambre>(tx, `select ${CHAMBRE} from chambres where id = $1`, [id])
      if (!chambre) return { ok: false, erreur: "Cette chambre a déjà été supprimée." }
      await verrouiller(tx, chambre.hebergementId)
      // Les réservations, même passées ou annulées, restent en comptabilité avec leur chambre
      const [{ reservations }] = await lignes<{ reservations: number }>(
        tx,
        "select count(*)::int as reservations from reservations where chambre_id = $1",
        [id],
      )
      if (reservations > 0) {
        return { ok: false, erreur: `${chambre.numero} a déjà des réservations dans son historique : désactivez-la plutôt, elle ne sera plus proposée.` }
      }
      // Ses dates bloquées et ses calendriers de plateforme partent avec elle (clés étrangères en cascade)
      await tx.query("delete from chambres where id = $1", [id])
      return { ok: true }
    })
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

  async listerCalendriers() {
    return (await lignes<LigneCalendrier>(db(), `select ${CALENDRIER} from calendriers_externes order by cree_le`)).map(versCalendrier)
  },

  async creerCalendrier(calendrier) {
    const chambre = (await lireChambres(db())).find((c) => c.id === calendrier.chambreId)
    const erreur = controlerCalendrier(calendrier, chambre)
    if (erreur || !chambre) return { ok: false, erreur: erreur ?? "Choisissez une chambre." }
    const [ligne] = await lignes<LigneCalendrier>(
      db(),
      `insert into calendriers_externes (hebergement_id, chambre_id, plateforme, nom, url_import, jeton) values ($1, $2, $3, $4, $5, $6)
       returning ${CALENDRIER}`,
      // Jeton du lien d'export : impossible à deviner, il ne protège que des dates (aucune donnée client)
      [chambre.hebergementId, chambre.id, calendrier.plateforme, calendrier.nom.trim(), calendrier.urlImport.trim(), randomBytes(18).toString("base64url")],
    )
    return { ok: true, calendrier: versCalendrier(ligne) }
  },

  async supprimerCalendrier(id) {
    const [ligne] = await lignes<LigneCalendrier>(db(), `delete from calendriers_externes where id = $1 returning ${CALENDRIER}`, [id])
    return ligne ? versCalendrier(ligne) : null
  },

  async remplacerImport(id, periodes) {
    return transaction<BilanSynchronisation>(async (tx) => {
      const [calendrier] = await lignes<{ hebergementId: string; chambreId: string; nom: string }>(
        tx,
        `select hebergement_id as "hebergementId", chambre_id as "chambreId", nom from calendriers_externes where id = $1 for update`,
        [id],
      )
      if (!calendrier) return { calendrierId: id, ajoutees: [], retirees: 0, erreur: "Ce calendrier a été supprimé." }
      await verrouiller(tx, calendrier.hebergementId)

      // Séjours terminés inutiles ; un même identifiant lu deux fois ne compte qu'une fois
      const aujourdhui = aujourdhuiISO()
      const utiles = [...new Map(periodes.filter((p) => p.fin > aujourdhui).map((p) => [p.uid, p])).values()]
      const connus = new Set((await lignes<{ uid: string }>(tx, "select uid from blocages where calendrier_id = $1", [id])).map((b) => b.uid))
      const retirees = await tx.query("delete from blocages where calendrier_id = $1 and not (uid = any($2::text[]))", [id, utiles.map((p) => p.uid)])
      for (const p of utiles) {
        await tx.query(
          `insert into blocages (hebergement_id, chambre_id, debut, fin, raison, calendrier_id, uid) values ($1, $2, $3, $4, $5, $6, $7)
           on conflict (calendrier_id, uid) where calendrier_id is not null
           do update set debut = excluded.debut, fin = excluded.fin, raison = excluded.raison`,
          [calendrier.hebergementId, calendrier.chambreId, p.debut, p.fin, [calendrier.nom, p.raison].filter(Boolean).join(" · ").slice(0, 120), id, p.uid],
        )
      }
      await tx.query("update calendriers_externes set synchronise_le = now(), erreur = '' where id = $1", [id])
      return { calendrierId: id, ajoutees: utiles.filter((p) => !connus.has(p.uid)), retirees: retirees.rowCount ?? 0 }
    })
  },

  async noterErreurImport(id, erreur) {
    await db().query("update calendriers_externes set erreur = $2 where id = $1", [id, erreur.slice(0, 300)])
  },

  async exporterCalendrier(jeton) {
    const [calendrier] = await lignes<{ id: string; chambreId: string; plateforme: Plateforme; hebergement: string; numero: string }>(
      db(),
      `select c.id, c.chambre_id as "chambreId", c.plateforme, h.nom as hebergement, ch.numero
       from calendriers_externes c join hebergements h on h.id = c.hebergement_id join chambres ch on ch.id = c.chambre_id
       where c.jeton = $1`,
      [jeton],
    )
    if (!calendrier) return null
    await expirerOptions(db())
    // Tout ce qui occupe la chambre, sauf ce qui vient déjà de cette plateforme : ses propres réservations
    // (saisies avec cette provenance) et les dates importées de ses calendriers
    const evenements = await lignes<EvenementExporte>(
      db(),
      `select id || '@avocatier' as uid, arrivee as debut, depart as fin, 'Indisponible' as titre from reservations
       where chambre_id = $1 and statut = any($3) and depart > $4 and source is distinct from $2
       union all
       select b.id || '@avocatier', b.debut, b.fin, 'Indisponible' from blocages b
       left join calendriers_externes c on c.id = b.calendrier_id
       where b.chambre_id = $1 and b.fin > $4 and b.calendrier_id is distinct from $5
         and ($2 = 'autre' or c.plateforme is distinct from $2)
       order by 2`,
      [calendrier.chambreId, calendrier.plateforme, STATUTS_ACTIFS, aujourdhuiISO(), calendrier.id],
    )
    return { nom: `Chez L'Avocatier · ${calendrier.hebergement} · ${calendrier.numero}`, evenements }
  },

  async reglagesFacturation() {
    const [ligne] = await lignes<ReglagesFacturation>(
      db(),
      `select raison_sociale as "raisonSociale", adresse, telephone, email, identifiants, mentions from reglages_facturation`,
    )
    return ligne ?? FACTURATION_INITIALE
  },

  async modifierFacturation(reglages) {
    const r = normaliserFacturation(reglages)
    await db().query(
      `insert into reglages_facturation (id, raison_sociale, adresse, telephone, email, identifiants, mentions, mis_a_jour_le)
       values (true, $1, $2, $3, $4, $5, $6, now())
       on conflict (id) do update set raison_sociale = excluded.raison_sociale, adresse = excluded.adresse,
         telephone = excluded.telephone, email = excluded.email, identifiants = excluded.identifiants,
         mentions = excluded.mentions, mis_a_jour_le = excluded.mis_a_jour_le`,
      [r.raisonSociale, r.adresse, r.telephone, r.email, r.identifiants, r.mentions],
    )
  },

  async numeroterFacture(reservationId) {
    return transaction(async (tx) => {
      const [r] = await lignes<{ statut: string; numero: string | null; le: Date | null }>(
        tx,
        `select statut, facture_numero as numero, facture_le as le from reservations where id = $1 for update`,
        [reservationId],
      )
      if (!r) return { ok: false as const, erreur: "Réservation introuvable." }
      // Déjà facturée : même numéro, même date (une facture ne se renumérote jamais)
      if (r.numero && r.le) return { ok: true as const, numero: r.numero, le: r.le.toISOString() }
      if (r.statut !== "confirmee") return { ok: false as const, erreur: "Seul un séjour confirmé se facture." }
      const [{ suivant }] = await lignes<{ suivant: number }>(tx, "select nextval('factures_numero')::int as suivant")
      const numero = `FA-${aujourdhuiISO().slice(0, 4)}-${String(suivant).padStart(4, "0")}`
      const [{ le }] = await lignes<{ le: Date }>(
        tx,
        "update reservations set facture_numero = $2, facture_le = now() where id = $1 returning facture_le as le",
        [reservationId, numero],
      )
      return { ok: true as const, numero, le: le.toISOString() }
    })
  },

  async noterActivite({ membreId, auteur, categorie, action, detail }) {
    await db().query("insert into journal_activite (membre_id, auteur, categorie, action, detail) values ($1, $2, $3, $4, $5)", [
      membreId ?? null,
      auteur.slice(0, 160),
      categorie,
      action.slice(0, 160),
      detail.slice(0, 500),
    ])
  },

  async listerJournal(limite) {
    const liste = await lignes<Omit<EntreeJournal, "le" | "membreId"> & { le: Date; membreId: string | null }>(
      db(),
      `select id, le, membre_id as "membreId", auteur, categorie, action, detail from journal_activite order by le desc limit $1`,
      [limite],
    )
    return liste.map(({ le, membreId, ...reste }) => ({ ...reste, le: le.toISOString(), ...(membreId && { membreId }) }))
  },

  async effacerJournal(effacement) {
    const resultat =
      "ids" in effacement
        ? await db().query("delete from journal_activite where id = any($1::text[])", [effacement.ids])
        : "avant" in effacement
          ? await db().query("delete from journal_activite where le < $1", [effacement.avant])
          : await db().query("delete from journal_activite")
    return resultat.rowCount ?? 0
  },
}
