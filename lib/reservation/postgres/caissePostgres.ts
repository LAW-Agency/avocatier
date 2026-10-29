import type { CaisseRestaurant } from "../caisse"
import { comparerNumeros, controlerArticle, controlerTicket, lireNumeroTicket, totalTicket } from "../controles"
import { aujourdhuiISO } from "../dates"
import type { Article, PosteCaisse, SejourCaisse, StatutTicket, Ticket } from "../types"
import { codeErreur, db, lignes, transaction, type Executant } from "./db"

// Implémentation PostgreSQL du contrat ../caisse (schéma : migrations/007_restaurant_bar.sql)

const FUSEAU = "Indian/Antananarivo"

const ARTICLE = `id, nom, categorie, prix, description, actif, ordre`
const POSTE = `id, nom, prefixe, dernier_ticket as "dernierTicket"`

// Lignes et règlements agrégés en JSON (champs nuls retirés) : un ticket complet par ligne de résultat
const TICKET = `t.id, t.numero, t.poste_id as "posteId", t.session_id as "sessionId", t.caissier_id as "caissierId", t.le,
  t.recu_le as "recuLe", t.statut, t.reservation_id as "reservationId", t.libelle, t.total, t.annule_le as "annuleLe",
  t.annule_par as "annulePar", t.motif_annulation as "motifAnnulation", t.facture_id as "factureId",
  coalesce((select json_agg(json_strip_nulls(json_build_object('articleId', l.article_id, 'libelle', l.libelle,
      'prixUnitaire', l.prix_unitaire, 'quantite', l.quantite)) order by l.position)
    from lignes_ticket l where l.ticket_id = t.id), '[]') as lignes,
  coalesce((select json_agg(json_build_object('mode', g.mode, 'devise', g.devise, 'montant', g.montant,
      'contreValeur', g.contre_valeur, 'rendu', g.rendu))
    from reglements_tickets g where g.ticket_id = t.id), '[]') as reglements`

type LigneTicketBase = Omit<Ticket, "sessionId" | "caissierId" | "le" | "recuLe" | "reservationId" | "annuleLe" | "annulePar" | "factureId"> & {
  sessionId: string | null
  caissierId: string | null
  le: Date
  recuLe: Date
  reservationId: string | null
  annuleLe: Date | null
  annulePar: string | null
  factureId: string | null
}

function versTicket({ sessionId, caissierId, le, recuLe, reservationId, annuleLe, annulePar, factureId, ...reste }: LigneTicketBase): Ticket {
  return {
    ...reste,
    le: le.toISOString(),
    recuLe: recuLe.toISOString(),
    ...(sessionId && { sessionId }),
    ...(caissierId && { caissierId }),
    ...(reservationId && { reservationId }),
    ...(annuleLe && { annuleLe: annuleLe.toISOString() }),
    ...(annulePar && { annulePar }),
    ...(factureId && { factureId }),
  }
}

async function lireTicket(executant: Executant, id: string): Promise<Ticket | null> {
  const [ligne] = await lignes<LigneTicketBase>(executant, `select ${TICKET} from tickets t where t.id = $1`, [id])
  return ligne ? versTicket(ligne) : null
}

// Séjour déjà facturé (facture figée, ou facture éditée avant la caisse) : plus rien ne s'y ajoute
const DEJA_FACTURE = `(r.facture_numero is not null or exists (select 1 from factures_reservations fr where fr.reservation_id = r.id))`

const ID_POSTE = /^[A-Za-z0-9-]{8,64}$/

export const caissePostgres: CaisseRestaurant = {
  async donnees({ du, au }) {
    const aujourdhui = aujourdhuiISO()
    const [articles, postes, tickets, sejours] = await Promise.all([
      lignes<Article>(db(), `select ${ARTICLE} from articles order by categorie, ordre, nom`),
      lignes<PosteCaisse>(db(), `select ${POSTE} from postes_caisse order by prefixe`),
      lignes<LigneTicketBase>(
        db(),
        `select ${TICKET} from tickets t where (t.le at time zone '${FUSEAU}')::date between $1 and $2 order by t.le desc`,
        [du, au],
      ),
      // Clients attendus ou sur place aujourd'hui, départ pas encore enregistré
      lignes<SejourCaisse>(
        db(),
        `select r.id as "reservationId", r.reference, ch.numero as chambre, trim(c.prenom || ' ' || c.nom) as client,
           r.arrivee, r.depart, ${DEJA_FACTURE} as facture
         from reservations r join chambres ch on ch.id = r.chambre_id join clients c on c.id = r.client_id
         where r.statut = 'confirmee' and r.depart_le is null and r.arrivee <= $1 and r.depart >= $1`,
        [aujourdhui],
      ),
    ])
    return {
      articles,
      postes,
      tickets: tickets.map(versTicket),
      sejours: sejours.sort((a, b) => comparerNumeros({ numero: a.chambre }, { numero: b.chambre })),
    }
  },

  async enregistrerPoste(id, nom) {
    if (!ID_POSTE.test(id)) return { ok: false, erreur: "Identifiant de poste invalide." }
    const libelle = nom.trim().slice(0, 60)
    if (!libelle) return { ok: false, erreur: "Donnez un nom au poste (Bar, Restaurant, Réception…)." }
    const [poste] = await lignes<PosteCaisse>(
      db(),
      `insert into postes_caisse (id, nom) values ($1, $2) on conflict (id) do update set nom = excluded.nom returning ${POSTE}`,
      [id, libelle],
    )
    return { ok: true, poste }
  },

  async creerArticle(article) {
    const erreur = controlerArticle(article)
    if (erreur) return { ok: false, erreur }
    const [ligne] = await lignes<Article>(
      db(),
      `insert into articles (nom, categorie, prix, description, ordre)
       values ($1, $2, $3, $4, coalesce($5, (select coalesce(max(ordre), 0) + 1 from articles where categorie = $2)))
       returning ${ARTICLE}`,
      [article.nom.trim().slice(0, 120), article.categorie.trim().slice(0, 60), article.prix, article.description.trim().slice(0, 300), article.ordre ?? null],
    )
    return { ok: true, article: ligne }
  },

  async modifierArticle(id, modification) {
    return transaction(async (tx) => {
      const [actuel] = await lignes<Article>(tx, `select ${ARTICLE} from articles where id = $1 for update`, [id])
      if (!actuel) return { ok: false as const, erreur: "Cet article n'existe plus." }
      const suivant = { ...actuel, ...modification }
      const erreur = controlerArticle(suivant)
      if (erreur) return { ok: false as const, erreur }
      if (!Number.isInteger(suivant.ordre)) return { ok: false as const, erreur: "Ordre d'affichage invalide." }
      const [article] = await lignes<Article>(
        tx,
        `update articles set nom = $2, categorie = $3, prix = $4, description = $5, actif = $6, ordre = $7, modifie_le = now()
         where id = $1 returning ${ARTICLE}`,
        [id, suivant.nom.trim().slice(0, 120), suivant.categorie.trim().slice(0, 60), suivant.prix, suivant.description.trim().slice(0, 300), suivant.actif === true, suivant.ordre],
      )
      return { ok: true as const, article }
    })
  },

  async supprimerArticle(id) {
    const [vendu] = await lignes(db(), "select 1 from lignes_ticket where article_id = $1 limit 1", [id])
    if (vendu) return { ok: false, erreur: "Cet article a déjà été vendu : désactivez-le plutôt (les tickets passés le gardent)." }
    const [article] = await lignes<Article>(db(), `delete from articles where id = $1 returning ${ARTICLE}`, [id])
    return article ? { ok: true, article } : { ok: false, erreur: "Cet article n'existe plus." }
  },

  async enregistrerTicket(t, caissierId) {
    const erreur = controlerTicket(t)
    if (erreur) return { ok: false, erreur }
    const rang = lireNumeroTicket(t.numero)!.rang
    try {
      return await transaction(async (tx) => {
        // Renvoi d'une vente déjà reçue (réponse perdue pendant une coupure) : rien ne change
        const deja = await lireTicket(tx, t.id)
        if (deja) return { ok: true as const, ticket: deja, deja: true }

        const [poste] = await lignes<{ prefixe: string }>(tx, "select prefixe from postes_caisse where id = $1 for update", [t.posteId])
        if (!poste) return { ok: false as const, erreur: "Poste de caisse inconnu : reconnectez le logiciel." }
        if (lireNumeroTicket(t.numero)!.prefixe !== poste.prefixe) return { ok: false as const, erreur: "Ce numéro de ticket n'appartient pas à ce poste." }

        let statut: StatutTicket = "paye"
        if (t.reservationId) {
          statut = "chambre"
          const [r] = await lignes<{ statut: string; arrivee: string; depart: string; parti: boolean; facture: boolean }>(
            tx,
            `select r.statut, r.arrivee, r.depart, r.depart_le is not null as parti, ${DEJA_FACTURE} as facture from reservations r where r.id = $1`,
            [t.reservationId],
          )
          if (!r) return { ok: false as const, erreur: "Séjour introuvable." }
          // Vente faite hors connexion : elle a eu lieu, on l'enregistre (une anomalie se verra au départ)
          if (!t.differe) {
            const aujourdhui = aujourdhuiISO()
            if (r.statut !== "confirmee" || r.arrivee > aujourdhui || r.depart < aujourdhui) return { ok: false as const, erreur: "Ce séjour n'est pas en cours : choisissez une autre chambre." }
            if (r.parti) return { ok: false as const, erreur: "Ce client est déjà parti : encaissez le ticket sur place." }
            if (r.facture) return { ok: false as const, erreur: "Ce séjour est déjà facturé : encaissez le ticket sur place." }
          }
        }

        // Article supprimé entre-temps (vente hors connexion) : la ligne garde son libellé et son prix
        const ids = t.lignes.flatMap((l) => (l.articleId ? [l.articleId] : []))
        const connus = new Set((await lignes<{ id: string }>(tx, "select id from articles where id = any($1)", [ids])).map((a) => a.id))

        await tx.query(
          `insert into tickets (id, numero, poste_id, session_id, caissier_id, le, statut, reservation_id, libelle, total)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [t.id, t.numero, t.posteId, t.sessionId ?? null, caissierId, new Date(t.le), statut, t.reservationId ?? null, t.libelle.trim().slice(0, 80), totalTicket(t.lignes)],
        )
        await tx.query(
          `insert into lignes_ticket (ticket_id, article_id, libelle, prix_unitaire, quantite, position)
           select $1, x.article_id, x.libelle, x.prix_unitaire, x.quantite, x.position
           from json_to_recordset($2::json) as x(article_id text, libelle text, prix_unitaire integer, quantite integer, position integer)`,
          [
            t.id,
            JSON.stringify(
              t.lignes.map((l, position) => ({
                article_id: l.articleId && connus.has(l.articleId) ? l.articleId : null,
                libelle: l.libelle.trim().slice(0, 120),
                prix_unitaire: l.prixUnitaire,
                quantite: l.quantite,
                position,
              })),
            ),
          ],
        )
        if (t.reglements.length) {
          await tx.query(
            `insert into reglements_tickets (ticket_id, mode, devise, montant, contre_valeur, rendu)
             select $1, x.mode, x.devise, x.montant, x.contre_valeur, x.rendu
             from json_to_recordset($2::json) as x(mode text, devise text, montant numeric, contre_valeur integer, rendu integer)`,
            [t.id, JSON.stringify(t.reglements.map((r) => ({ mode: r.mode, devise: r.devise, montant: r.montant, contre_valeur: r.contreValeur, rendu: r.rendu })))],
          )
        }
        // Poste réinstallé : il reprendra sa numérotation après le plus haut numéro reçu
        await tx.query("update postes_caisse set dernier_ticket = greatest(dernier_ticket, $2) where id = $1", [t.posteId, rang])
        return { ok: true as const, ticket: (await lireTicket(tx, t.id))!, deja: false }
      })
    } catch (e) {
      if (codeErreur(e) === "23505") return { ok: false, erreur: "Ce numéro de ticket existe déjà : le poste reprend sa numérotation, renvoyez la vente." }
      if (codeErreur(e) === "23503") return { ok: false, erreur: "Session de caisse inconnue : rouvrez la caisse." }
      throw e
    }
  },

  async annulerTicket(id, motif, membre) {
    const raison = motif.trim().slice(0, 300)
    if (!raison) return { ok: false, erreur: "Indiquez le motif de l'annulation." }
    return transaction(async (tx) => {
      const [t] = await lignes<{ statut: StatutTicket; jour: string; facture: boolean }>(
        tx,
        `select t.statut, (t.le at time zone '${FUSEAU}')::date::text as jour,
           (t.facture_id is not null or coalesce((select ${DEJA_FACTURE} from reservations r where r.id = t.reservation_id), false)) as facture
         from tickets t where t.id = $1 for update`,
        [id],
      )
      if (!t) return { ok: false as const, erreur: "Ce ticket n'existe plus." }
      if (t.statut === "annule") return { ok: false as const, erreur: "Ce ticket est déjà annulé." }
      if (t.facture) return { ok: false as const, erreur: "Ce ticket figure sur une facture de séjour : il ne s'annule plus." }
      if (!membre.gerant && t.jour !== aujourdhuiISO()) return { ok: false as const, erreur: "Seul un gérant annule un ticket d'un jour passé." }
      await tx.query("update tickets set statut = 'annule', annule_le = now(), annule_par = $2, motif_annulation = $3 where id = $1", [id, membre.id, raison])
      return { ok: true as const, ticket: (await lireTicket(tx, id))! }
    })
  },
}
