import { randomUUID } from "node:crypto"
import { pathToFileURL } from "node:url"
import { loadEnvConfig } from "@next/env"
import { Client } from "pg"
import { hacherMotDePasse } from "@/lib/auth/motDePasse"
import { bilanSession } from "@/lib/reservation/caisseRegles"
import { ajouterJours, aujourdhuiISO } from "@/lib/reservation/dates"
import { formaterDansDevise } from "@/lib/reservation/devises"
import { COMPTE_CAISSE_BAR, COMPTE_CAISSE_RESTAURANT, COMPTE_RECEPTION } from "@/lib/reservation/donnees"
import type { CodeDevise, DateISO, LigneTicket, ModePaiement, ReglementTicket, StatutTicket, Ticket } from "@/lib/reservation/types"

// Caisse Restaurant et Bar de démonstration : carte, deux postes (Restaurant, Bar) tenus par leurs caissiers, et
// deux mois de services jusqu'à maintenant (jamais dans le futur) : caisses ouvertes et clôturées chaque jour,
// tickets payés sur place (ariary, euros, carte, mobile money) ou mis sur la chambre des clients présents, quelques
// annulations et écarts de caisse. La note restaurant des clients déjà partis est réglée à leur départ.
// EFFACE la carte, les caisses (sessions) et les tickets, mais garde les postes (ceux nommés Restaurant et Bar sont
// repris, avec leur préfixe : les ordinateurs déjà enregistrés continuent), les factures, les séjours et les
// clients ; appelée aussi par npm run db:demo, après la création des séjours.
// Usage : npm run db:demo-caisse -- --confirmer

type Executant = Pick<Client, "query">

const JOURS = 60

// Générateur pseudo-aléatoire à graine (mulberry32) : mêmes données pour un même jour
function generateur(graine: number) {
  let etat = graine
  const hasard = () => {
    etat = (etat + 0x6d2b79f5) | 0
    let t = Math.imul(etat ^ (etat >>> 15), 1 | etat)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const entre = (min: number, max: number) => min + Math.floor(hasard() * (max - min + 1))
  return {
    entre,
    chance: (p: number) => hasard() < p,
    parmi: <T,>(liste: readonly T[]) => liste[Math.floor(hasard() * liste.length)],
    minute: (de: string, a: string) => {
      const [h1, m1] = de.split(":").map(Number)
      const [h2, m2] = a.split(":").map(Number)
      const m = entre(h1 * 60 + m1, h2 * 60 + m2)
      return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
    },
  }
}

// Heure de Madagascar (UTC+3) → instant ISO
const instant = (jour: DateISO, heure: string) => new Date(`${jour}T${heure}:00+03:00`).toISOString()
const plus = (iso: string, minutes: number) => new Date(Date.parse(iso) + minutes * 60_000).toISOString()

type ArticleCarte = { nom: string; categorie: string; prix: number; description?: string }

// Prix en ariary, ordre d'affichage dans la caisse
const CARTE: ArticleCarte[] = [
  { nom: "Samoussas (4)", categorie: "Entrées", prix: 8_000 },
  { nom: "Salade de crudités", categorie: "Entrées", prix: 12_000 },
  { nom: "Soupe chinoise", categorie: "Entrées", prix: 15_000 },
  { nom: "Poisson coco", categorie: "Plats", prix: 28_000, description: "Poisson du jour, lait de coco, riz" },
  { nom: "Romazava", categorie: "Plats", prix: 25_000, description: "Zébu et brèdes, riz" },
  { nom: "Zébu sauce poivre vert", categorie: "Plats", prix: 32_000 },
  { nom: "Crevettes sautées à l'ail", categorie: "Plats", prix: 35_000 },
  { nom: "Langouste grillée", categorie: "Plats", prix: 65_000, description: "Selon la pêche" },
  { nom: "Riz cantonais", categorie: "Plats", prix: 18_000 },
  { nom: "Banane flambée", categorie: "Desserts", prix: 12_000 },
  { nom: "Salade de fruits", categorie: "Desserts", prix: 10_000 },
  { nom: "Crème coco", categorie: "Desserts", prix: 9_000 },
  { nom: "THB grande", categorie: "Bières", prix: 8_000 },
  { nom: "THB petite", categorie: "Bières", prix: 5_000 },
  { nom: "Gold", categorie: "Bières", prix: 7_000 },
  { nom: "Coca-Cola", categorie: "Softs", prix: 4_000 },
  { nom: "Jus de corossol", categorie: "Softs", prix: 6_000 },
  { nom: "Eau minérale 1,5 l", categorie: "Softs", prix: 4_000 },
  { nom: "Rhum arrangé", categorie: "Cocktails", prix: 8_000 },
  { nom: "Ti'punch", categorie: "Cocktails", prix: 12_000 },
  { nom: "Mojito", categorie: "Cocktails", prix: 15_000 },
  { nom: "Punch coco", categorie: "Cocktails", prix: 12_000 },
  { nom: "Vin rouge (verre)", categorie: "Vins", prix: 15_000 },
  { nom: "Vin blanc (bouteille)", categorie: "Vins", prix: 80_000 },
  { nom: "Café", categorie: "Boissons chaudes", prix: 3_000 },
  { nom: "Thé à la vanille", categorie: "Boissons chaudes", prix: 3_500 },
]

const MOTIFS_ANNULATION = ["Erreur de saisie", "Plat renvoyé en cuisine", "Commande en double", "Client parti sans consommer"]
const ECARTS: { ecart: number; commentaire: string }[] = [
  { ecart: -500, commentaire: "Pièce de 500 Ar manquante au comptage" },
  { ecart: -1_000, commentaire: "Erreur de monnaie rendue" },
  { ecart: -2_000, commentaire: "Erreur de monnaie sur un billet de 10 000" },
  { ecart: 2_000, commentaire: "Pourboire laissé dans le tiroir" },
  { ecart: 1_000, commentaire: "Monnaie non réclamée par un client" },
]

// Ce que la caisse de démonstration remplace : tickets, caisses, carte, règlements de restaurant faits au départ
// (les postes et les factures restent)
export async function effacerCaisse(db: Executant) {
  const n = async (sql: string) => (await db.query(sql)).rowCount ?? 0
  await db.query("update paiements set session_id = null where session_id is not null")
  return {
    reglements: await n("delete from paiements where note = 'Restaurant et bar'"),
    tickets: await n("delete from tickets"),
    sessions: await n("delete from sessions_caisse"),
    articles: await n("delete from articles"),
    journal: await n("delete from journal_activite where categorie = 'restaurant'"),
  }
}

type Membre = { id: string; prenom: string; nom: string }

async function caissier(db: Executant, compte: typeof COMPTE_CAISSE_BAR): Promise<Membre> {
  const { rows } = await db.query<Membre>("select id, prenom, nom from clients where email = $1", [compte.email])
  if (rows[0]) {
    await db.query("update clients set role = 'caissier', actif = true, prenom = $2, nom = $3 where id = $1", [rows[0].id, compte.prenom, compte.nom])
    return { ...rows[0], prenom: compte.prenom, nom: compte.nom }
  }
  const { rows: cree } = await db.query<Membre>(
    "insert into clients (role, email, prenom, nom, mot_de_passe_hash, pays) values ('caissier', $1, $2, $3, $4, 'Madagascar') returning id, prenom, nom",
    [compte.email, compte.prenom, compte.nom, hacherMotDePasse(compte.motDePasse)],
  )
  return cree[0]
}

type Sejour = { id: string; arrivee: DateISO; depart: DateISO; arriveeLe: string | null; departLe: string | null }

// Caisse de démonstration, à appeler dans une transaction ouverte (après la création des séjours pour db:demo)
export async function genererCaisse(db: Executant, aujourdhui: DateISO = aujourdhuiISO()) {
  const { parmi, entre, chance, minute } = generateur(Number(aujourdhui.replaceAll("-", "")))
  const maintenant = new Date().toISOString()
  const jour = (decalage: number) => ajouterJours(aujourdhui, decalage)
  const { rows: devises } = await db.query<{ taux: Record<string, number> }>("select taux from reglages_devises")
  const taux = { MGA: 5_150, USD: 1.16, ...(devises[0]?.taux ?? {}) }

  // Équipe : les deux caissiers ; la réception tient le restaurant le mardi (jour de repos de Fanja)
  const fanja = await caissier(db, COMPTE_CAISSE_RESTAURANT)
  const tojo = await caissier(db, COMPTE_CAISSE_BAR)
  const { rows: autres } = await db.query<Membre & { email: string }>("select id, prenom, nom, email from clients where role = 'reception' and actif order by email = $1 desc", [
    COMPTE_RECEPTION.email,
  ])
  const remplacant = autres[0] ?? fanja

  // Carte
  const articles = CARTE.map((a, ordre) => ({ ...a, id: randomUUID(), ordre }))
  await db.query(
    `insert into articles (id, nom, categorie, prix, description, ordre)
     select x.id, x.nom, x.categorie, x.prix, coalesce(x.description, ''), x.ordre from json_to_recordset($1) as x(id text, nom text, categorie text, prix integer, description text, ordre integer)`,
    [JSON.stringify(articles)],
  )
  const de = (...categories: string[]) => articles.filter((a) => categories.includes(a.categorie))
  const entrees = de("Entrées")
  const plats = de("Plats")
  const desserts = de("Desserts")
  const boissonsRepas = de("Bières", "Softs", "Vins")
  const boissonsBar = de("Bières", "Softs", "Cocktails", "Boissons chaudes")

  // Postes : ceux déjà enregistrés sous ce nom par un ordinateur, sinon un poste de démonstration
  const poste = async (nom: string, horaires: { fond: number; ouverture: string; fermeture: string }) => {
    const { rows } = await db.query<{ id: string; prefixe: string }>("select id, prefixe from postes_caisse where lower(nom) = lower($1) order by cree_le limit 1", [nom])
    const existant =
      rows[0] ??
      (await db.query<{ id: string; prefixe: string }>("insert into postes_caisse (id, nom) values ($1, $2) returning id, prefixe", [`demo-poste-${nom.toLowerCase()}`, nom])).rows[0]
    return { ...existant, nom, ...horaires }
  }
  const postes = [
    await poste("Restaurant", { fond: 50_000, ouverture: "11:00", fermeture: "22:30" }),
    await poste("Bar", { fond: 30_000, ouverture: "10:00", fermeture: "23:30" }),
  ]

  // Clients présents chaque soir (séjour confirmé, arrivée enregistrée)
  const { rows: sejours } = await db.query<Sejour>(
    `select id, arrivee::text, depart::text, arrivee_le as "arriveeLe", depart_le as "departLe" from reservations
     where statut = 'confirmee' and arrivee_le is not null and depart > $1 and arrivee <= $2`,
    [jour(-JOURS), aujourdhui],
  )
  for (const s of sejours) {
    s.arriveeLe = s.arriveeLe && new Date(s.arriveeLe).toISOString()
    s.departLe = s.departLe && new Date(s.departLe).toISOString()
  }
  const presentsA = (le: string) => sejours.filter((s) => s.arriveeLe! <= le && (!s.departLe || s.departLe > le) && s.arrivee <= le.slice(0, 10))

  type TicketDemo = Ticket & { posteIndex: number }
  const tickets: TicketDemo[] = []
  const sessions: { id: string; posteId: string; ouverteLe: string; ouvertePar: string; fond: number; fermeeLe?: string; fermeePar?: string; tickets: TicketDemo[] }[] = []

  const ligne = (a: (typeof articles)[number], quantite = 1): LigneTicket => ({ articleId: a.id, libelle: a.nom, prixUnitaire: a.prix, quantite })
  // Mêmes articles regroupés sur une ligne (2 × THB grande)
  const regrouper = (lignes: LigneTicket[]) => {
    const parArticle = new Map<string, LigneTicket>()
    for (const l of lignes) {
      const deja = parArticle.get(l.articleId!)
      if (deja) deja.quantite += l.quantite
      else parArticle.set(l.articleId!, { ...l })
    }
    return [...parArticle.values()]
  }

  function reglement(total: number): ReglementTicket {
    const mode = parmi<ModePaiement>(["especes", "especes", "especes", "especes", "carte", "carte", "mobile_money"])
    const devise: CodeDevise = mode === "mobile_money" ? "MGA" : mode === "especes" ? (chance(0.15) ? "EUR" : "MGA") : chance(0.5) ? "EUR" : "MGA"
    if (devise === "MGA") {
      if (mode !== "especes") return { mode, devise, montant: total, contreValeur: total, rendu: 0 }
      const pas = parmi([0, 1_000, 5_000, 10_000, 10_000, 20_000])
      const recu = pas ? Math.ceil(total / pas) * pas : total
      return { mode, devise, montant: recu, contreValeur: recu, rendu: recu - total }
    }
    const du = Math.ceil((total / taux.MGA) * 100 - 1e-9) / 100
    if (mode !== "especes") return { mode, devise, montant: du, contreValeur: total, rendu: 0 }
    const recu = Math.max(Math.ceil(du / 5) * 5, 5)
    const contreValeur = Math.max(Math.round(recu * taux.MGA), total)
    return { mode, devise, montant: recu, contreValeur, rendu: contreValeur - total }
  }

  for (let d = -JOURS; d <= 0; d++) {
    const date = jour(d)
    const mardi = new Date(`${date}T12:00:00+03:00`).getUTCDay() === 2
    postes.forEach((poste, posteIndex) => {
      const ouverteLe = instant(date, poste.ouverture)
      if (ouverteLe > maintenant) return // pas encore ouvert aujourd'hui
      const responsable = posteIndex === 0 ? (mardi ? remplacant : fanja) : tojo
      const fermeeLe = instant(date, poste.fermeture)
      const session = { id: randomUUID(), posteId: poste.id, ouverteLe, ouvertePar: responsable.id, fond: poste.fond, tickets: [] as TicketDemo[], ...(fermeeLe < maintenant && { fermeeLe, fermeePar: responsable.id }) }
      sessions.push(session)

      const presents = presentsA(instant(date, "19:00")).length
      const nombre = posteIndex === 0 ? entre(3, 6) + Math.round(presents * (0.8 + entre(0, 6) / 10)) : entre(5, 10) + Math.round(presents * (1 + entre(0, 8) / 10))
      for (let i = 0; i < nombre; i++) {
        const heure = posteIndex === 0 ? (chance(0.45) ? minute("12:00", "14:30") : minute("19:00", "21:45")) : minute("10:30", "23:00")
        const le = instant(date, heure)
        if (le > maintenant) continue // jamais dans le futur
        let lignes: LigneTicket[]
        let libelle = ""
        if (posteIndex === 0) {
          const couverts = entre(1, 4)
          lignes = []
          for (let c = 0; c < couverts; c++) {
            if (chance(0.25)) lignes.push(ligne(parmi(entrees)))
            lignes.push(ligne(parmi(plats)))
            if (chance(0.3)) lignes.push(ligne(parmi(desserts)))
            if (chance(0.85)) lignes.push(ligne(parmi(boissonsRepas)))
          }
          libelle = `Table ${entre(1, 8)}`
        } else {
          lignes = Array.from({ length: entre(1, 3) }, () => ligne(parmi(boissonsBar), entre(1, 3)))
          if (chance(0.2)) libelle = "Comptoir"
        }
        lignes = regrouper(lignes)
        const total = lignes.reduce((t, l) => t + l.prixUnitaire * l.quantite, 0)
        // Client de l'hôtel : sur la note de sa chambre ; sinon réglé sur place
        const surPlace = presentsA(le)
        const chambre = surPlace.length && chance(posteIndex === 0 ? 0.45 : 0.3) ? parmi(surPlace) : null
        const annule = chance(0.02)
        const statut: StatutTicket = annule ? "annule" : chambre ? "chambre" : "paye"
        const ticket: TicketDemo = {
          id: randomUUID(),
          numero: "",
          posteId: poste.id,
          sessionId: session.id,
          caissierId: responsable.id,
          le,
          recuLe: plus(le, 0.05),
          statut,
          ...(chambre && { reservationId: chambre.id }),
          libelle,
          total,
          lignes,
          reglements: chambre ? [] : [reglement(total)],
          motifAnnulation: annule ? parmi(MOTIFS_ANNULATION) : "",
          ...(annule && { annuleLe: plus(le, entre(3, 20)), annulePar: responsable.id }),
          posteIndex,
        }
        tickets.push(ticket)
        session.tickets.push(ticket)
      }
    })
  }

  // Numéros dans l'ordre des ventes, par poste
  tickets.sort((a, b) => a.le.localeCompare(b.le))
  postes.forEach((poste, posteIndex) => {
    tickets.filter((t) => t.posteIndex === posteIndex).forEach((t, i) => (t.numero = `${poste.prefixe}-${String(i + 1).padStart(6, "0")}`))
  })

  // Clôtures : espèces comptées = attendues, sauf quelques écarts expliqués
  const lignesSessions = sessions.map((s) => {
    if (!s.fermeeLe) return { ...s, especes: null, bilan: null, commentaire: "" }
    const attendu = bilanSession(s.fond, s.tickets)
    const ecart = chance(0.12) ? parmi(ECARTS) : null
    const comptees = { ...attendu.attendues, MGA: (attendu.attendues.MGA ?? 0) + (ecart?.ecart ?? 0) }
    return { ...s, especes: comptees, bilan: bilanSession(s.fond, s.tickets, comptees), commentaire: ecart?.commentaire ?? "" }
  })
  await db.query(
    `insert into sessions_caisse (id, poste_id, ouverte_par, ouverte_le, fond_caisse, fermee_par, fermee_le, especes_comptees, bilan, commentaire)
     select * from json_to_recordset($1) as x(id text, poste_id text, ouverte_par text, ouverte_le timestamptz, fond_caisse integer,
       fermee_par text, fermee_le timestamptz, especes_comptees jsonb, bilan jsonb, commentaire text)`,
    [
      JSON.stringify(
        lignesSessions.map((s) => ({
          id: s.id, poste_id: s.posteId, ouverte_par: s.ouvertePar, ouverte_le: s.ouverteLe, fond_caisse: s.fond, fermee_par: s.fermeePar ?? null,
          fermee_le: s.fermeeLe ?? null, especes_comptees: s.especes, bilan: s.bilan, commentaire: s.commentaire,
        })),
      ),
    ],
  )
  await db.query(
    `insert into tickets (id, numero, poste_id, session_id, caissier_id, le, recu_le, statut, reservation_id, libelle, total, annule_le, annule_par, motif_annulation)
     select * from json_to_recordset($1) as x(id text, numero text, poste_id text, session_id text, caissier_id text, le timestamptz, recu_le timestamptz,
       statut text, reservation_id text, libelle text, total integer, annule_le timestamptz, annule_par text, motif_annulation text)`,
    [
      JSON.stringify(
        tickets.map((t) => ({
          id: t.id, numero: t.numero, poste_id: t.posteId, session_id: t.sessionId, caissier_id: t.caissierId, le: t.le, recu_le: t.recuLe, statut: t.statut,
          reservation_id: t.reservationId ?? null, libelle: t.libelle, total: t.total, annule_le: t.annuleLe ?? null, annule_par: t.annulePar ?? null,
          motif_annulation: t.motifAnnulation,
        })),
      ),
    ],
  )
  await db.query(
    `insert into lignes_ticket (ticket_id, article_id, libelle, prix_unitaire, quantite, position)
     select * from json_to_recordset($1) as x(ticket_id text, article_id text, libelle text, prix_unitaire integer, quantite integer, position integer)`,
    [JSON.stringify(tickets.flatMap((t) => t.lignes.map((l, position) => ({ ticket_id: t.id, article_id: l.articleId, libelle: l.libelle, prix_unitaire: l.prixUnitaire, quantite: l.quantite, position }))))],
  )
  await db.query(
    `insert into reglements_tickets (ticket_id, mode, devise, montant, contre_valeur, rendu)
     select * from json_to_recordset($1) as x(ticket_id text, mode text, devise text, montant numeric, contre_valeur integer, rendu integer)`,
    [JSON.stringify(tickets.flatMap((t) => t.reglements.map((r) => ({ ticket_id: t.id, mode: r.mode, devise: r.devise, montant: r.montant, contre_valeur: r.contreValeur, rendu: r.rendu }))))],
  )
  for (const [i, p] of postes.entries()) await db.query("update postes_caisse set dernier_ticket = $2 where id = $1", [p.id, tickets.filter((t) => t.posteIndex === i).length])

  // Note restaurant des clients partis : réglée à la réception juste avant leur départ, en ariary
  const { rows: equipe } = await db.query<{ id: string }>("select id from clients where role in ('hote', 'reception') and actif order by role desc")
  const notes = new Map<string, number>()
  for (const t of tickets) if (t.statut === "chambre") notes.set(t.reservationId!, (notes.get(t.reservationId!) ?? 0) + t.total)
  const reglesAuDepart = [...notes].flatMap(([id, totalAr]) => {
    const s = sejours.find((x) => x.id === id)!
    if (!s.departLe) return []
    return [{ reservation_id: id, montant: Math.round((totalAr / taux.MGA) * 100) / 100, devise: "MGA", montant_devise: totalAr, taux: taux.MGA, mode: parmi(["especes", "especes", "carte", "mobile_money"]), note: "Restaurant et bar", le: plus(s.departLe, -1), enregistre_par: parmi(equipe)?.id ?? null }]
  })
  if (reglesAuDepart.length) {
    await db.query(
      `insert into paiements (reservation_id, montant, devise, montant_devise, taux, mode, note, le, enregistre_par)
       select * from json_to_recordset($1) as x(reservation_id text, montant numeric, devise text, montant_devise numeric, taux numeric, mode text, note text, le timestamptz, enregistre_par text) order by le`,
      [JSON.stringify(reglesAuDepart)],
    )
  }

  // Journal des sept derniers jours : ouvertures et clôtures de caisse
  const nom = (id: string) => [fanja, tojo, remplacant].find((m) => m.id === id)
  const depuis = new Date(Date.parse(maintenant) - 7 * 86_400_000).toISOString()
  const journal = lignesSessions.flatMap((s) => {
    const poste = postes.find((p) => p.id === s.posteId)!.nom
    const ouvreur = nom(s.ouvertePar)!
    const entrees = [{ le: s.ouverteLe, membre: ouvreur, action: "Caisse ouverte", detail: `${poste} · fond de caisse ${formaterDansDevise(s.fond, "MGA")}` }]
    if (s.fermeeLe && s.bilan) {
      const ecart = s.bilan.ecarts?.MGA ?? 0
      entrees.push({ le: s.fermeeLe, membre: ouvreur, action: "Caisse clôturée", detail: `${poste} · ventes ${formaterDansDevise(s.bilan.ventes, "MGA")} · ${ecart ? `écart ${ecart > 0 ? "+" : ""}${formaterDansDevise(ecart, "MGA")}` : "sans écart"}` })
    }
    return entrees
  })
  await db.query(
    `insert into journal_activite (le, membre_id, auteur, categorie, action, detail)
     select x.le, x.membre_id, x.auteur, 'restaurant', x.action, x.detail from json_to_recordset($1) as x(le timestamptz, membre_id text, auteur text, action text, detail text)`,
    [JSON.stringify(journal.filter((j) => j.le >= depuis && j.le <= maintenant).map((j) => ({ le: j.le, membre_id: j.membre.id, auteur: `${j.membre.prenom} ${j.membre.nom}`.trim(), action: j.action, detail: j.detail })))],
  )

  const valides = tickets.filter((t) => t.statut !== "annule")
  return {
    articles: articles.length,
    sessions: sessions.length,
    ouvertes: sessions.filter((s) => !s.fermeeLe).length,
    tickets: tickets.length,
    surChambres: valides.filter((t) => t.statut === "chambre").length,
    annules: tickets.length - valides.length,
    ventes: valides.reduce((t, x) => t + x.total, 0),
    ecarts: lignesSessions.filter((s) => s.commentaire).length,
    reglementsAuDepart: reglesAuDepart.length,
  }
}

async function principal() {
  if (!process.argv.includes("--confirmer")) {
    console.error("Ce script remplace la carte, les caisses et les tickets du Restaurant et Bar (postes et factures gardés).\nRelancer avec : npm run db:demo-caisse -- --confirmer")
    process.exitCode = 1
    return
  }
  loadEnvConfig(process.cwd())
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL absente : la définir dans .env (neon env pull).")
  const db = new Client({ connectionString: url })
  await db.connect()
  try {
    await db.query("begin")
    const effaces = await effacerCaisse(db)
    const bilan = await genererCaisse(db)
    await db.query(process.argv.includes("--essai") ? "rollback" : "commit")
    console.log(`✗ effacé : ${effaces.tickets} tickets, ${effaces.sessions} caisses, ${effaces.articles} articles`)
    console.log(
      `✓ caissiers ${COMPTE_CAISSE_RESTAURANT.prenom} (Restaurant) et ${COMPTE_CAISSE_BAR.prenom} (Bar), ${bilan.articles} articles, ${bilan.sessions} caisses (${bilan.ouvertes} ouvertes, ${bilan.ecarts} écarts), ` +
        `${bilan.tickets} tickets (${bilan.surChambres} sur les chambres, ${bilan.annules} annulés), ventes ${formaterDansDevise(bilan.ventes, "MGA")}, ${bilan.reglementsAuDepart} notes réglées au départ`,
    )
    if (process.argv.includes("--essai")) console.log("(essai : transaction annulée, la base n'a pas changé)")
  } catch (erreur) {
    await db.query("rollback")
    throw erreur
  } finally {
    await db.end()
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch((erreur) => {
    console.error(erreur)
    process.exitCode = 1
  })
}
