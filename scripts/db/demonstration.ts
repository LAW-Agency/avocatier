import { randomUUID } from "node:crypto"
import { loadEnvConfig } from "@next/env"
import { Client } from "pg"
import { ajouterJours, aujourdhuiISO, formaterPlage, formaterPrix, nombreNuits } from "@/lib/reservation/dates"
import { COMPTE_DEMO, COMPTE_RECEPTION } from "@/lib/reservation/donnees"
import { calculerDevis, deplierSaisons, saisonDeLaNuit } from "@/lib/reservation/regles"
import type { DateISO, EvenementReservation, RegleSaison, SourceReservation, StatutReservation } from "@/lib/reservation/types"

// Remplace les données d'essai par une activité d'hôtel vraisemblable, autour de la date du jour : deux mois de
// séjours passés (arrivées, départs, encaissements, factures), les clients présents aujourd'hui, les arrivées et
// départs du jour, puis trois mois à venir (confirmés, demandes en attente, groupe, fêtes de fin d'année).
// EFFACE toutes les réservations, tous les encaissements, blocages manuels, le journal et les clients, sauf
// l'équipe et le compte client de démonstration (COMPTE_DEMO, renommé). Hébergements, chambres, tarifs, devises et
// calendriers des plateformes restent. Tirage fixe : deux lancements le même jour donnent les mêmes données.
// Usage : npm run db:demo -- --confirmer (ajouter --essai pour tout exécuter puis annuler la transaction)

loadEnvConfig(process.cwd())

// Générateur pseudo-aléatoire à graine (mulberry32)
let graine = 20261026
function hasard() {
  graine = (graine + 0x6d2b79f5) | 0
  let t = Math.imul(graine ^ (graine >>> 15), 1 | graine)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const entre = (min: number, max: number) => min + Math.floor(hasard() * (max - min + 1))
const parmi = <T,>(liste: readonly T[]) => liste[Math.floor(hasard() * liste.length)]
const chance = (p: number) => hasard() < p
function ponderee<T extends string>(poids: Record<T, number>): T {
  const total = Object.values<number>(poids).reduce((a, b) => a + b, 0)
  let tirage = hasard() * total
  for (const [cle, p] of Object.entries<number>(poids)) {
    tirage -= p
    if (tirage < 0) return cle as T
  }
  return Object.keys(poids)[0] as T
}
const chiffres = (n: number) => Array.from({ length: n }, () => entre(0, 9)).join("")

// Heure de Madagascar (UTC+3) → instant ISO
const instant = (jour: DateISO, heure: string) => new Date(`${jour}T${heure}:00+03:00`).toISOString()
const heure = (min: number, max: number) => `${String(entre(min, max)).padStart(2, "0")}:${String(entre(0, 11) * 5).padStart(2, "0")}`
const decaler = (iso: string, heures: number) => new Date(Date.parse(iso) + heures * 3_600_000).toISOString()

// ---------------------------------------------------------------------------------------------------------------
// Clientèle : surtout des Français (métropole et Réunion) et des Malgaches de Tana, puis l'Europe et l'océan Indien

type Origine = {
  pays: string
  poids: number
  prenoms: string[]
  noms: string[]
  telephone: () => string
  sources: Partial<Record<SourceReservation, number>>
}

const ETRANGER = { site: 40, booking: 30, airbnb: 15, whatsapp: 10, telephone: 5 }
const ORIGINES: Origine[] = [
  {
    pays: "France",
    poids: 38,
    prenoms: ["Sophie", "Julien", "Camille", "Thomas", "Élodie", "Nicolas", "Pauline", "Antoine", "Mathilde", "Guillaume", "Céline", "Romain", "Hélène", "Vincent", "Isabelle", "Maxime", "Laura", "Hugo", "Manon", "Sébastien", "Aurélie", "Olivier", "Juliette", "François", "Émilie", "Benoît", "Chloé", "Laurent", "Anne", "Marion"],
    noms: ["Lefebvre", "Moreau", "Fontaine", "Girard", "Mercier", "Bertrand", "Garnier", "Rousseau", "Faure", "Chevalier", "Lambert", "Dupuis", "Marchand", "Perrin", "Morel", "Bernard", "Petit", "Durand", "Leroy", "Roux", "Bonnet", "Blanc", "Guérin", "Muller", "Henry", "Lemoine", "Picard", "Renaud", "Vidal", "Caron"],
    telephone: () => `+33 6 ${chiffres(2)} ${chiffres(2)} ${chiffres(2)} ${chiffres(2)}`,
    sources: ETRANGER,
  },
  {
    pays: "Madagascar",
    poids: 26,
    prenoms: ["Hery", "Fanja", "Tiana", "Mamy", "Voahangy", "Toky", "Nirina", "Haingo", "Rado", "Lalao", "Andry", "Miora", "Fetra", "Onja", "Tojo", "Sitraka", "Mialy", "Njaka", "Rova", "Hasina"],
    noms: ["Rakotomalala", "Randrianarisoa", "Rasoanaivo", "Andriamanana", "Razafindrakoto", "Ramanantsoa", "Rabemananjara", "Ravelojaona", "Rakotondrabe", "Razanamparany", "Andrianjafy", "Rasolofonirina", "Ratsimbazafy", "Rajaonarison", "Rakotoarisoa"],
    telephone: () => `+261 ${parmi(["32", "33", "34", "38"])} ${chiffres(2)} ${chiffres(3)} ${chiffres(2)}`,
    sources: { whatsapp: 40, telephone: 22, sur_place: 15, site: 23 },
  },
  {
    pays: "La Réunion",
    poids: 10,
    prenoms: ["Jean-Marc", "Stéphanie", "Ludovic", "Nathalie", "Fabrice", "Sandrine", "Johan", "Valérie", "David", "Mélanie"],
    noms: ["Payet", "Hoarau", "Grondin", "Técher", "Rivière", "Boyer", "Lebon", "Maillot", "Turpin", "Robert"],
    telephone: () => `+262 692 ${chiffres(2)} ${chiffres(2)} ${chiffres(2)}`,
    sources: { site: 45, whatsapp: 25, booking: 20, telephone: 10 },
  },
  {
    pays: "Italie",
    poids: 5,
    prenoms: ["Marco", "Giulia", "Luca", "Francesca", "Alessandro", "Chiara"],
    noms: ["Bianchi", "Romano", "Ferrari", "Colombo", "Ricci", "Greco"],
    telephone: () => `+39 3${chiffres(2)} ${chiffres(3)} ${chiffres(4)}`,
    sources: ETRANGER,
  },
  {
    pays: "Allemagne",
    poids: 4,
    prenoms: ["Katrin", "Markus", "Stefan", "Julia", "Tobias", "Lena"],
    noms: ["Weber", "Schneider", "Fischer", "Wagner", "Becker", "Hoffmann"],
    telephone: () => `+49 15${chiffres(1)} ${chiffres(8)}`,
    sources: ETRANGER,
  },
  {
    pays: "Suisse",
    poids: 3,
    prenoms: ["Anna", "Lukas", "Nadia", "Reto", "Céline"],
    noms: ["Keller", "Meier", "Brunner", "Favre", "Rochat"],
    telephone: () => `+41 79 ${chiffres(3)} ${chiffres(2)} ${chiffres(2)}`,
    sources: ETRANGER,
  },
  {
    pays: "Belgique",
    poids: 3,
    prenoms: ["Pierre", "Lies", "Thibault", "Sarah", "Arnaud"],
    noms: ["Dubois", "Janssens", "Peeters", "Lambert", "Claes"],
    telephone: () => `+32 4${chiffres(2)} ${chiffres(2)} ${chiffres(2)} ${chiffres(2)}`,
    sources: ETRANGER,
  },
  {
    pays: "Afrique du Sud",
    poids: 3,
    prenoms: ["Pieter", "Emma", "Johan", "Lerato", "Ruan"],
    noms: ["van der Merwe", "Botha", "Naidoo", "Smith", "Pretorius"],
    telephone: () => `+27 8${chiffres(1)} ${chiffres(3)} ${chiffres(4)}`,
    sources: ETRANGER,
  },
  {
    pays: "Maurice",
    poids: 3,
    prenoms: ["Vikash", "Priya", "Kevin", "Anjali", "Yannick"],
    noms: ["Ramdin", "Seebaluck", "Appadoo", "Ramsamy", "Lagesse"],
    telephone: () => `+230 5${chiffres(3)} ${chiffres(4)}`,
    sources: { site: 40, whatsapp: 30, booking: 30 },
  },
  {
    pays: "Royaume-Uni",
    poids: 2,
    prenoms: ["Oliver", "Charlotte", "James", "Emily"],
    noms: ["Bennett", "Hughes", "Walker", "Clarke"],
    telephone: () => `+44 7${chiffres(3)} ${chiffres(6)}`,
    sources: ETRANGER,
  },
  {
    pays: "Espagne",
    poids: 1,
    prenoms: ["Lucía", "Javier", "Marta"],
    noms: ["Fernández", "García", "Navarro"],
    telephone: () => `+34 6${chiffres(2)} ${chiffres(3)} ${chiffres(3)}`,
    sources: ETRANGER,
  },
  {
    pays: "Canada",
    poids: 1,
    prenoms: ["Marie-Ève", "Mathieu", "Geneviève"],
    noms: ["Tremblay", "Gagnon", "Bouchard"],
    telephone: () => `+1 514 ${chiffres(3)} ${chiffres(4)}`,
    sources: ETRANGER,
  },
]

const NOTES_CLIENT = [
  "Allergique aux fruits de mer.",
  "Préfère un bungalow au calme, loin de la piscine.",
  "Arrive souvent par le dernier vol de Tana.",
  "Habitué : demande toujours la sortie baleines.",
  "Végétarienne.",
  "Vient fêter son anniversaire de mariage chaque année.",
]

const MESSAGES = [
  "Nous arrivons par le vol de 11 h 40 depuis Tana.",
  "C'est notre voyage de noces !",
  "Serait-il possible d'avoir un lit bébé ?",
  "Je suis végétarienne, merci d'avance.",
  "Pouvez-vous nous réserver une sortie en pirogue ?",
  "Nous arriverons tard, vers 19 h, par le bateau de Soanierana-Ivongo.",
  "Est-ce possible de dîner au restaurant le soir de l'arrivée ?",
  "Anniversaire de ma femme le deuxième soir, une petite attention serait parfaite.",
  "Nous voyageons avec notre fille de 6 ans.",
  "Possibilité de louer des vélos sur place ?",
]

const sansAccents = (texte: string) =>
  texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")

type Fiche = {
  cle: string
  id?: string // identifiant en base, après insertion
  prenom: string
  nom: string
  pays: string
  telephone: string
  email: string | null
  source: SourceReservation // canal habituel, et origine de la fiche
  note: string
  sejours: { arrivee: DateISO; depart: DateISO }[]
  premiere?: string // première demande : date de création de la fiche
}

const emails = new Set<string>()
const nomsPris = new Set<string>()
function nouvelleFiche(): Fiche {
  const pays = ponderee(Object.fromEntries(ORIGINES.map((o) => [o.pays, o.poids])))
  const origine = ORIGINES.find((o) => o.pays === pays)!
  let prenom = parmi(origine.prenoms)
  let nom = parmi(origine.noms)
  for (let essai = 0; nomsPris.has(`${prenom} ${nom}`) && essai < 20; essai++) {
    prenom = parmi(origine.prenoms)
    nom = parmi(origine.noms)
  }
  nomsPris.add(`${prenom} ${nom}`)
  const source = ponderee(origine.sources as Record<SourceReservation, number>)
  // Fiches de la réception : e-mail pas toujours demandé (WhatsApp, téléphone, au comptoir)
  const avecEmail = source === "site" || source === "booking" || chance(0.45)
  let email: string | null = null
  if (avecEmail) {
    const base = `${sansAccents(prenom)}.${sansAccents(nom)}`
    email = `${base}@exemple.test`
    for (let n = 2; emails.has(email); n++) email = `${base}${n}@exemple.test`
    emails.add(email)
  }
  return {
    cle: randomUUID(),
    prenom,
    nom,
    pays: origine.pays,
    telephone: origine.telephone(),
    email,
    source,
    note: chance(0.05) ? parmi(NOTES_CLIENT) : "",
    sejours: [],
  }
}

// ---------------------------------------------------------------------------------------------------------------

type Chambre = { id: string; hebergementId: string; numero: string }
type Hebergement = { id: string; nom: string; prixNuit: number; capaciteMax: number }
type Paiement = { reservation: Sejour; montant: number; mode: string; note: string; le: string; par: string }
type Sejour = {
  id: string
  reference?: string
  client: Fiche
  chambre: Chambre
  arrivee: DateISO
  depart: DateISO
  adultes: number
  enfants: number
  navette: boolean
  message: string
  montant: number
  statut: StatutReservation
  source: SourceReservation
  creeLe: string
  expireLe?: string
  historique: EvenementReservation[]
  arriveeLe?: string
  departLe?: string
  groupe?: string
  factureNumero?: string
  factureLe?: string
}

async function demonstration() {
  if (!process.argv.includes("--confirmer")) {
    console.error(
      "Ce script efface les réservations, encaissements, blocages manuels, le journal et les clients (sauf l'équipe et le compte de démo).\n" +
        "Relancer avec : npm run db:demo -- --confirmer",
    )
    process.exitCode = 1
    return
  }
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL absente : la définir dans .env (neon env pull).")

  const db = new Client({ connectionString: url })
  await db.connect()
  try {
    // Séquences hors transaction : un essai les remet ensuite là où elles étaient (valeur vide : jamais utilisée)
    const { rows: sequences } = await db.query<{ nom: string; valeur: string | null }>(
      `select schemaname || '.' || sequencename as nom, last_value::text as valeur from pg_sequences
       where sequencename in ('reservations_numero', 'factures_numero', 'paiements_numero_seq')`,
    )
    await db.query("begin")

    const aujourdhui = aujourdhuiISO()
    const jour = (decalage: number) => ajouterJours(aujourdhui, decalage)
    const maintenant = new Date().toISOString()
    // Un événement « passé » ne doit jamais dépasser l'instant présent
    const auPlusTard = (iso: string, marge = 0.25) => (iso > maintenant ? decaler(maintenant, -marge) : iso)

    const { rows: hebergements } = await db.query<Hebergement>(
      `select id, nom, prix_nuit as "prixNuit", capacite_max as "capaciteMax" from hebergements order by ordre`,
    )
    const { rows: chambres } = await db.query<Chambre>(
      `select id, hebergement_id as "hebergementId", numero from chambres where active order by hebergement_id, numero`,
    )
    if (!chambres.length) throw new Error("Aucune chambre : lancer d'abord npm run db:amorcer.")
    const { rows: regles } = await db.query<RegleSaison>(
      `select nom, debut, fin, coefficient::float as coefficient, sejour_min as "sejourMin" from regles_saisons`,
    )
    const annee = Number(aujourdhui.slice(0, 4))
    const saisons = deplierSaisons(regles, [annee - 1, annee, annee + 1])
    const hebergement = (id: string) => hebergements.find((h) => h.id === id)!
    const chambreNumero = (numero: string) => chambres.find((c) => c.numero === numero)

    // Équipe : gérants et réception, auteurs des saisies et des encaissements
    const { rows: equipe } = await db.query<{ id: string; prenom: string; nom: string; role: string; email: string }>(
      "select id, prenom, nom, role, email from clients where role in ('hote', 'reception') and actif order by role, cree_le",
    )
    const reception = equipe.find((m) => m.email === COMPTE_RECEPTION.email)
    if (reception) {
      await db.query("update clients set prenom = 'Hanta', nom = 'Rasoarimanana' where id = $1", [reception.id])
      reception.prenom = "Hanta"
      reception.nom = "Rasoarimanana"
    }
    const gerants = equipe.filter((m) => m.role === "hote" && m.email !== "info@agency.net")
    const membres = [...gerants, ...(reception ? [reception] : [])]
    if (!membres.length) throw new Error("Aucun membre de l'équipe : lancer d'abord npm run db:amorcer.")
    const nomMembre = (m: { prenom: string; nom: string }) => `${m.prenom} ${m.nom}`.trim()
    const unMembre = () => parmi(membres)

    // -----------------------------------------------------------------------------------------------------------
    // Effacement des données d'essai

    const effaces = {
      paiements: (await db.query("delete from paiements")).rowCount,
      reservations: (await db.query("delete from reservations")).rowCount,
      blocages: (await db.query("delete from blocages where calendrier_id is null")).rowCount,
      journal: (await db.query("delete from journal_activite")).rowCount,
      clients: (await db.query("delete from clients where role = 'client' and email is distinct from $1", [COMPTE_DEMO.email])).rowCount,
    }
    await db.query("update chambres set etat = 'propre', note_etat = ''")
    // Numéros de reçu repris à 1 : séquence de la colonne d'identité (un ALTER TABLE verrouillerait la table, même
    // en lecture, jusqu'à la fin de la transaction)
    await db.query("select setval(pg_get_serial_sequence('paiements', 'numero'), 1, false)")
    console.log(
      `✗ effacé : ${effaces.reservations} réservations, ${effaces.paiements} encaissements, ${effaces.blocages} blocages, ${effaces.journal} lignes de journal, ${effaces.clients} clients`,
    )

    // -----------------------------------------------------------------------------------------------------------
    // Planning : nuits occupées par chambre (séjours actifs et blocages)

    const occupe = new Map<string, { debut: DateISO; fin: DateISO }[]>()
    const libre = (c: Chambre, debut: DateISO, fin: DateISO) => !(occupe.get(c.id) ?? []).some((p) => debut < p.fin && p.debut < fin)
    const marquer = (c: Chambre, debut: DateISO, fin: DateISO) => occupe.set(c.id, [...(occupe.get(c.id) ?? []), { debut, fin }])

    const blocages: { chambre: Chambre; debut: DateISO; fin: DateISO; raison: string }[] = []
    const bloquer = (numero: string, debut: DateISO, fin: DateISO, raison: string) => {
      const c = chambreNumero(numero)
      if (!c || !libre(c, debut, fin)) return
      marquer(c, debut, fin)
      blocages.push({ chambre: c, debut, fin, raison })
    }
    bloquer("Ocre 2", jour(-1), jour(3), "Climatisation : réparation")
    bloquer("Famille 2", jour(30), jour(35), "Peinture de la terrasse")
    bloquer("Jardin 2", `${annee}-12-22`, `${annee}-12-28`, "Famille des propriétaires")

    // -----------------------------------------------------------------------------------------------------------
    // Séjours

    const fiches: Fiche[] = []
    const sejours: Sejour[] = []
    const paiements: Paiement[] = []

    const clientLibre = (f: Fiche, arrivee: DateISO, depart: DateISO) => !f.sejours.some((s) => arrivee < s.depart && s.arrivee < depart)
    function choisirClient(arrivee: DateISO, depart: DateISO, source?: SourceReservation): Fiche {
      // Un client sur dix revient (fidèles), sinon nouvelle fiche
      if (fiches.length > 20 && chance(0.1)) {
        const habitue = parmi(fiches)
        if (habitue.cle !== "demo" && clientLibre(habitue, arrivee, depart) && (!source || habitue.source === source)) return habitue
      }
      let f = nouvelleFiche()
      for (let essai = 0; source && f.source !== source && essai < 30; essai++) f = nouvelleFiche()
      if (source) f.source = source
      fiches.push(f)
      return f
    }

    function voyageurs(h: Hebergement): { adultes: number; enfants: number } {
      if (h.capaciteMax >= 4) {
        const enfants = entre(1, h.capaciteMax - 2)
        return { adultes: 2, enfants }
      }
      if (h.capaciteMax === 3) return chance(0.4) ? { adultes: 2, enfants: 1 } : { adultes: chance(0.15) ? 3 : 2, enfants: 0 }
      return { adultes: chance(0.85) ? 2 : 1, enfants: 0 }
    }

    // Délai entre la demande et l'arrivée selon le canal (jours)
    const DELAI: Record<SourceReservation, [number, number]> = {
      site: [8, 70],
      booking: [4, 50],
      airbnb: [12, 75],
      whatsapp: [2, 30],
      telephone: [2, 25],
      sur_place: [0, 0],
    }

    type Options = Partial<Pick<Sejour, "statut" | "source" | "groupe" | "creeLe">> & {
      client?: Fiche
      arrive?: boolean // client du jour déjà arrivé
      parti?: boolean // départ du jour déjà enregistré
      sansPaiement?: boolean
      resteDu?: boolean // séjour terminé avec un solde encore dû
      message?: string
      voyageurs?: { adultes: number; enfants: number }
    }

    function creerSejour(c: Chambre, arrivee: DateISO, depart: DateISO, o: Options = {}): Sejour {
      const h = hebergement(c.hebergementId)
      const passe = depart <= aujourdhui
      const enCours = arrivee <= aujourdhui && aujourdhui < depart
      // Pas de client « au comptoir » pour un séjour à venir
      const source = o.source ?? o.client?.source
      const client = o.client ?? choisirClient(arrivee, depart, source === "sur_place" && arrivee > aujourdhui ? "whatsapp" : source)
      let canal: SourceReservation = o.source ?? client.source
      if (canal === "sur_place" && arrivee > aujourdhui) canal = "whatsapp"

      let creeLe: string
      if (o.creeLe) creeLe = o.creeLe
      else if (canal === "sur_place") creeLe = instant(arrivee, heure(9, 12))
      else creeLe = instant(ajouterJours(arrivee, -entre(...DELAI[canal])), heure(7, 22))
      creeLe = auPlusTard(creeLe, entre(2, 96))

      let statut: StatutReservation = o.statut ?? "confirmee"
      const historique: EvenementReservation[] = []
      let expireLe: string | undefined
      const auteur = nomMembre(unMembre())
      if (canal === "site") {
        historique.push({ statut: "option", le: creeLe })
        const reponse = decaler(creeLe, entre(2, 20))
        if (statut === "option" || reponse > maintenant) {
          statut = "option"
          expireLe = decaler(creeLe, 48)
        } else if (statut !== "expiree") {
          historique.push({ statut: "confirmee", le: reponse, note: "Confirmée par les hôtes" })
        }
      } else {
        historique.push({ statut: "confirmee", le: creeLe, note: `Saisie dans le logiciel par ${auteur}` })
      }

      const sejour: Sejour = {
        id: randomUUID(),
        client,
        chambre: c,
        arrivee,
        depart,
        ...(o.voyageurs ?? voyageurs(h)),
        navette: chance(canal === "site" ? 0.4 : 0.2),
        message: o.message ?? (canal === "site" && chance(0.45) ? parmi(MESSAGES) : ""),
        montant: calculerDevis(h, arrivee, depart, saisons).total,
        statut,
        source: canal,
        creeLe,
        expireLe,
        historique,
        groupe: o.groupe,
      }

      if (statut === "confirmee") {
        // Arrivée et départ enregistrés par la réception
        if (arrivee < aujourdhui || (arrivee === aujourdhui && o.arrive)) sejour.arriveeLe = auPlusTard(instant(arrivee, heure(13, 18)))
        if (depart < aujourdhui || (depart === aujourdhui && o.parti)) sejour.departLe = auPlusTard(instant(depart, heure(8, 10)))
        if (!o.sansPaiement) encaisser(sejour, passe, enCours, o.resteDu)
      }
      marquerSejour(sejour)
      return sejour
    }

    function marquerSejour(s: Sejour) {
      if (s.statut === "option" || s.statut === "confirmee") marquer(s.chambre, s.arrivee, s.depart)
      s.client.sejours.push({ arrivee: s.arrivee, depart: s.depart })
      if (!s.client.premiere || s.creeLe < s.client.premiere) s.client.premiere = s.creeLe
      sejours.push(s)
    }

    const MODES_SOLDE: Record<string, string[]> = {
      Madagascar: ["especes", "especes", "mobile_money", "mobile_money"],
      autre: ["especes", "carte", "carte", "especes"],
    }
    function encaisser(s: Sejour, passe: boolean, enCours: boolean, resteDu?: boolean) {
      const malgache = s.client.pays === "Madagascar"
      const confirmeLe = s.historique.find((e) => e.statut === "confirmee")?.le ?? s.creeLe
      const ajouter = (montant: number, mode: string, note: string, le: string) => {
        if (le > maintenant || montant <= 0) return
        paiements.push({ reservation: s, montant, mode, note, le, par: unMembre().id })
      }
      if (s.source === "airbnb") {
        // Versé par la plateforme au lendemain de l'arrivée
        if (s.arriveeLe) ajouter(s.montant, "virement", "Versement Airbnb", instant(ajouterJours(s.arrivee, 1), "09:00"))
        return
      }
      if (s.source === "booking") {
        // Payé sur place au départ (carte le plus souvent)
        if (s.departLe) ajouter(s.montant, parmi(["carte", "carte", "especes"]), "Paiement Booking.com sur place", s.departLe)
        return
      }
      if (s.source === "sur_place") {
        ajouter(s.montant, malgache ? parmi(["especes", "mobile_money"]) : "especes", "Payé à l'arrivée", s.creeLe)
        return
      }
      // Site, WhatsApp, téléphone : acompte de 30 % puis solde au départ
      const acompte = Math.round((s.montant * 0.3) / 5) * 5
      const avecAcompte = passe || enCours ? chance(0.75) : chance(0.65)
      if (avecAcompte) ajouter(acompte, malgache ? "mobile_money" : "virement", "Acompte 30 %", decaler(confirmeLe, entre(3, 48)))
      if (s.departLe && !resteDu) {
        ajouter(avecAcompte ? s.montant - acompte : s.montant, parmi(MODES_SOLDE[malgache ? "Madagascar" : "autre"]), "Solde du séjour", s.departLe)
      }
    }

    // Une chambre libre d'une catégorie pour ces dates
    const chambreLibre = (hebergementId: string, arrivee: DateISO, depart: DateISO) =>
      chambres.filter((c) => c.hebergementId === hebergementId && libre(c, arrivee, depart))[0]

    // Compte client de démonstration du site : un séjour passé, un à venir et une demande en attente
    const { rows: demoLignes } = await db.query<{ id: string }>(
      "update clients set prenom = 'Claire', nom = 'Martin', telephone = '+33 6 72 18 45 09', pays = 'France' where email = $1 returning id",
      [COMPTE_DEMO.email],
    )
    if (demoLignes[0]) {
      const demo: Fiche = {
        cle: "demo",
        id: demoLignes[0].id,
        prenom: "Claire",
        nom: "Martin",
        pays: "France",
        telephone: "+33 6 72 18 45 09",
        email: COMPTE_DEMO.email,
        source: "site",
        note: "",
        sejours: [],
      }
      const places = [
        { h: "h2", arrivee: jour(-41), nuits: 4, statut: "confirmee" as const, message: "Nous arrivons par le vol de 11 h 40 depuis Tana." },
        { h: "h4", arrivee: jour(19), nuits: 3, statut: "confirmee" as const, message: "" },
        { h: "h1", arrivee: jour(74), nuits: 4, statut: "option" as const, message: "Pouvez-vous nous réserver une sortie en pirogue ?", creeLe: decaler(maintenant, -5) },
      ]
      for (const p of places) {
        const c = chambreLibre(p.h, p.arrivee, ajouterJours(p.arrivee, p.nuits))
        if (c) creerSejour(c, p.arrivee, ajouterJours(p.arrivee, p.nuits), { client: demo, statut: p.statut, source: "site", message: p.message, creeLe: p.creeLe, voyageurs: { adultes: 2, enfants: 0 } })
      }
    }

    // Journée d'aujourd'hui bien remplie : arrivées (dont une déjà là), départs (dont deux déjà partis)
    const PLACES_DU_JOUR: { h: string; arrivee: number; nuits: number; arrive?: boolean; parti?: boolean; source?: SourceReservation }[] = [
      { h: "h1", arrivee: 0, nuits: 4, arrive: true },
      { h: "h3", arrivee: 0, nuits: 5 },
      { h: "h4", arrivee: 0, nuits: 2, source: "booking" },
      { h: "h2", arrivee: -4, nuits: 4, parti: true },
      { h: "h4", arrivee: -3, nuits: 3, parti: true },
      { h: "h1", arrivee: -5, nuits: 5 },
    ]
    for (const p of PLACES_DU_JOUR) {
      const arrivee = jour(p.arrivee)
      const depart = jour(p.arrivee + p.nuits)
      const c = chambreLibre(p.h, arrivee, depart)
      if (c) creerSejour(c, arrivee, depart, { arrive: p.arrive, parti: p.parti, source: p.source })
    }

    // Groupe : deux bungalows Océan demandés ensemble sur le site
    {
      const arrivee = jour(18)
      const depart = jour(22)
      const libres = chambres.filter((c) => c.hebergementId === "h1" && libre(c, arrivee, depart)).slice(0, 2)
      if (libres.length === 2) {
        const groupe = randomUUID()
        const meneur = choisirClient(arrivee, depart, "site")
        const creeLe = instant(jour(-12), "20:14")
        for (const c of libres) creerSejour(c, arrivee, depart, { client: meneur, groupe, creeLe, source: "site", message: "Nous venons entre amis, deux couples." })
      }
    }

    // Demandes du site encore en attente (réponse sous 48 h)
    for (const [h, decalage, nuits, ilYa] of [["h2", 9, 3, 3], ["h5", 26, 4, 20], ["h3", 40, 6, 31]] as const) {
      const arrivee = jour(decalage)
      const depart = jour(decalage + nuits)
      const c = chambreLibre(h, arrivee, depart)
      if (c) creerSejour(c, arrivee, depart, { statut: "option", source: "site", creeLe: decaler(maintenant, -ilYa) })
    }

    // Remplissage : forte occupation passée et aux fêtes, plus creuse à mesure qu'on s'éloigne
    const DEBUT = -62
    const FIN = 100
    const ATTRAIT: Record<string, number> = { h1: 1.15, h2: 1, h3: 0.85, h4: 1, h5: 0.75 }
    const fetes = (d: DateISO) => saisonDeLaNuit(d, saisons)?.nom === "Fêtes de fin d'année"
    const probabilite = (d: DateISO, decalage: number, h: string) => {
      const base = fetes(d) ? 0.85 : decalage < 0 ? 0.55 : decalage < 15 ? 0.45 : decalage < 45 ? 0.32 : 0.18
      return Math.min(0.95, base * ATTRAIT[h])
    }
    let resteDuPlace = 0
    for (const c of chambres) {
      let decalage = DEBUT + entre(0, 3)
      while (decalage < FIN) {
        const arrivee = jour(decalage)
        if (!chance(probabilite(arrivee, decalage, c.hebergementId))) {
          decalage += entre(1, 3)
          continue
        }
        let nuits = parmi([2, 2, 3, 3, 3, 4, 4, 5, 6, 7])
        const minimum = saisonDeLaNuit(arrivee, saisons)?.sejourMin ?? 1
        nuits = Math.max(nuits, minimum)
        const depart = jour(decalage + nuits)
        if (!libre(c, arrivee, depart)) {
          decalage += 1
          continue
        }
        const termine = depart < aujourdhui
        // Deux séjours terminés laissés avec un solde à encaisser (écran Revenus)
        const resteDu = termine && resteDuPlace < 2 && decalage > -20 && chance(0.15)
        if (resteDu) resteDuPlace++
        creerSejour(c, arrivee, depart, { resteDu })
        decalage += nuits + (chance(0.5) ? 0 : entre(1, 2))
      }
    }

    // Demandes qui n'ont pas abouti (aucune nuit bloquée) : annulées, refusées, expirées
    const ISSUES: { statut: StatutReservation; note?: string; avantConfirmation: boolean }[] = [
      { statut: "annulee", note: "Annulée par le client", avantConfirmation: true },
      { statut: "annulee", note: "Annulée par le client", avantConfirmation: true },
      { statut: "annulee", note: "Annulée par les hôtes : « Le client a prévenu par téléphone : vol Tana–Sainte-Marie annulé. »", avantConfirmation: false },
      { statut: "annulee", note: "Annulée par les hôtes", avantConfirmation: false },
      { statut: "refusee", note: "Déclinée par les hôtes : « Nous sommes complets sur ces dates, nous pouvons vous proposer la semaine suivante. »", avantConfirmation: true },
      { statut: "refusee", note: "Déclinée par les hôtes : « Le bungalow Famille est déjà réservé, la chambre Verte est libre si cela vous convient. »", avantConfirmation: true },
      { statut: "refusee", note: "Déclinée par les hôtes", avantConfirmation: true },
      { statut: "expiree", avantConfirmation: true },
      { statut: "expiree", avantConfirmation: true },
    ]
    for (const issue of ISSUES) {
      const c = parmi(chambres)
      const decalage = entre(-50, 70)
      const arrivee = jour(decalage)
      const depart = jour(decalage + entre(2, 5))
      const client = choisirClient(arrivee, depart, "site")
      const creeLe = auPlusTard(instant(ajouterJours(arrivee, -entre(10, 40)), heure(8, 22)), 72)
      const historique: EvenementReservation[] = [{ statut: "option", le: creeLe }]
      if (!issue.avantConfirmation) historique.push({ statut: "confirmee", le: decaler(creeLe, entre(3, 18)), note: "Confirmée par les hôtes" })
      const fin = issue.statut === "expiree" ? decaler(creeLe, 48) : decaler(historique[historique.length - 1].le, entre(5, 200))
      historique.push({ statut: issue.statut, le: auPlusTard(fin), ...(issue.note && { note: issue.note }) })
      const h = hebergement(c.hebergementId)
      marquerSejour({
        id: randomUUID(),
        client,
        chambre: c,
        arrivee,
        depart,
        ...voyageurs(h),
        navette: false,
        message: chance(0.4) ? parmi(MESSAGES) : "",
        montant: calculerDevis(h, arrivee, depart, saisons).total,
        statut: issue.statut,
        source: "site",
        creeLe,
        historique,
      })
    }

    // -----------------------------------------------------------------------------------------------------------
    // Écriture

    // Une requête par table (lignes passées en JSON) : la transaction dure quelques secondes au lieu de minutes
    const inserer = (table: string, colonnes: string, lignes: unknown[], ordre = "") =>
      lignes.length
        ? db.query(`insert into ${table} (${colonnes.replace(/ [a-z]+(?=,|$)/g, "")}) select * from json_to_recordset($1) as x(${colonnes}) ${ordre}`, [JSON.stringify(lignes)])
        : null

    // Fiches clients, créées à leur première demande
    for (const f of fiches) f.id ??= randomUUID()
    await inserer(
      "clients",
      "id text, role text, email text, prenom text, nom text, telephone text, pays text, mot_de_passe_hash text, cree_le timestamptz, origine text, note text",
      fiches
        .filter((f) => f.cle !== "demo")
        .map((f) => ({
          id: f.id, role: "client", email: f.email, prenom: f.prenom, nom: f.nom, telephone: f.telephone, pays: f.pays, mot_de_passe_hash: "",
          cree_le: decaler(f.premiere ?? maintenant, -0.05), origine: f.source === "site" ? "site" : "reception", note: f.note,
        })),
    )

    // Références dans l'ordre des demandes, comme le moteur
    sejours.sort((a, b) => a.creeLe.localeCompare(b.creeLe))
    // Factures des séjours terminés, numérotées dans l'ordre d'édition (au départ du client)
    const facturables = sejours.filter((s) => s.departLe && chance(0.6)).sort((a, b) => a.departLe!.localeCompare(b.departLe!))
    facturables.forEach((s, i) => {
      s.factureLe = decaler(s.departLe!, 0.2)
      s.factureNumero = `FA-${s.factureLe.slice(0, 4)}-${String(i + 1).padStart(4, "0")}`
    })
    for (const [i, s] of sejours.entries()) s.reference = `AVO-${s.arrivee.slice(0, 4)}-${String(i + 1).padStart(4, "0")}`
    await inserer(
      "reservations",
      `id text, reference text, client_id text, hebergement_id text, chambre_id text, arrivee date, depart date, adultes integer,
       enfants integer, navette boolean, telephone text, message text, montant_total integer, statut text, source text,
       cree_le timestamptz, expire_le timestamptz, historique jsonb, arrivee_le timestamptz, depart_le timestamptz, groupe text,
       facture_numero text, facture_le timestamptz`.replace(/\s+/g, " "),
      sejours.map((s) => ({
        id: s.id, reference: s.reference, client_id: s.client.id, hebergement_id: s.chambre.hebergementId, chambre_id: s.chambre.id,
        arrivee: s.arrivee, depart: s.depart, adultes: s.adultes, enfants: s.enfants, navette: s.navette, telephone: s.client.telephone,
        message: s.message, montant_total: s.montant, statut: s.statut, source: s.source, cree_le: s.creeLe, expire_le: s.expireLe ?? null,
        historique: s.historique, arrivee_le: s.arriveeLe ?? null, depart_le: s.departLe ?? null, groupe: s.groupe ?? null,
        facture_numero: s.factureNumero ?? null, facture_le: s.factureLe ?? null,
      })),
    )
    await db.query("select setval('reservations_numero', $1)", [sejours.length])
    if (facturables.length) await db.query("select setval('factures_numero', $1)", [facturables.length])

    // Encaissements dans l'ordre chronologique : numéros de reçu croissants
    paiements.sort((a, b) => a.le.localeCompare(b.le))
    await inserer(
      "paiements",
      "reservation_id text, montant integer, mode text, note text, le timestamptz, enregistre_par text",
      paiements.map((p) => ({ reservation_id: p.reservation.id, montant: p.montant, mode: p.mode, note: p.note, le: p.le, enregistre_par: p.par })),
      "order by le",
    )

    await inserer(
      "blocages",
      "hebergement_id text, chambre_id text, debut date, fin date, raison text",
      blocages.map((b) => ({ hebergement_id: b.chambre.hebergementId, chambre_id: b.chambre.id, debut: b.debut, fin: b.fin, raison: b.raison })),
    )

    // Ménage : chambres libérées ce matin à nettoyer, climatisation en panne
    await db.query("update chambres set etat = 'a_nettoyer' where id = any($1)", [
      sejours.filter((x) => x.depart === aujourdhui && x.departLe).map((x) => x.chambre.id),
    ])
    const enPanne = chambreNumero("Ocre 2")
    if (enPanne) await db.query("update chambres set etat = 'maintenance', note_etat = 'Climatisation en panne, technicien attendu jeudi' where id = $1", [enPanne.id])

    // Journal des sept derniers jours : connexions du matin et actions de l'équipe
    const journal: { le: string; membre: (typeof membres)[number]; categorie: string; action: string; detail: string }[] = []
    const decrire = (s: Sejour) => [s.reference, `${s.client.prenom} ${s.client.nom}`, s.chambre.numero, formaterPlage(s.arrivee, s.depart)].join(" · ")
    const depuis = decaler(maintenant, -7 * 24)
    for (let d = -6; d <= 0; d++) {
      for (const m of membres) journal.push({ le: instant(jour(d), heure(7, 8)), membre: m, categorie: "connexion", action: "Connexion au logiciel", detail: "" })
    }
    for (const s of sejours) {
      const m = unMembre()
      const confirmation = s.historique.find((e) => e.note === "Confirmée par les hôtes")
      if (confirmation) journal.push({ le: confirmation.le, membre: m, categorie: "reservation", action: "Demande confirmée", detail: decrire(s) })
      const refus = s.historique.find((e) => e.statut === "refusee")
      if (refus) journal.push({ le: refus.le, membre: m, categorie: "reservation", action: "Demande refusée", detail: decrire(s) })
      if (s.source !== "site") journal.push({ le: s.creeLe, membre: m, categorie: "reservation", action: "Réservation saisie", detail: decrire(s) })
      if (s.arriveeLe) journal.push({ le: s.arriveeLe, membre: m, categorie: "reservation", action: "Arrivée enregistrée", detail: decrire(s) })
      if (s.departLe) journal.push({ le: s.departLe, membre: m, categorie: "reservation", action: "Départ enregistré", detail: decrire(s) })
      if (s.factureLe) journal.push({ le: s.factureLe, membre: m, categorie: "paiement", action: "Facture éditée", detail: `${s.factureNumero} · ${decrire(s)}` })
    }
    for (const p of paiements) {
      const m = membres.find((x) => x.id === p.par)!
      journal.push({ le: p.le, membre: m, categorie: "paiement", action: "Encaissement enregistré", detail: `${formaterPrix(p.montant)} · ${decrire(p.reservation)}` })
    }
    const recents = journal.filter((j) => j.le >= depuis && j.le <= maintenant).sort((a, b) => a.le.localeCompare(b.le))
    await inserer(
      "journal_activite",
      "le timestamptz, membre_id text, auteur text, categorie text, action text, detail text",
      recents.map((j) => ({ le: j.le, membre_id: j.membre.id, auteur: nomMembre(j.membre), categorie: j.categorie, action: j.action, detail: j.detail })),
    )

    const essai = process.argv.includes("--essai")
    await db.query(essai ? "rollback" : "commit")
    if (essai) {
      for (const q of sequences) await db.query("select setval($1, $2, $3)", [q.nom, q.valeur ?? 1, q.valeur !== null])
      console.log("(essai : transaction annulée, la base n'a pas changé)")
    }

    const compte = (statut: StatutReservation) => sejours.filter((s) => s.statut === statut).length
    const presents = sejours.filter((s) => s.statut === "confirmee" && s.arrivee <= aujourdhui && aujourdhui < s.depart).length
    const nuitsVendues = sejours.filter((s) => s.statut === "confirmee").reduce((n, s) => n + nombreNuits(s.arrivee, s.depart), 0)
    console.log(`✓ ${fiches.length} clients (${fiches.filter((f) => f.source === "site").length} venus du site)`)
    console.log(
      `✓ ${sejours.length} réservations : ${compte("confirmee")} confirmées, ${compte("option")} demandes en attente, ${compte("annulee")} annulées, ${compte("refusee")} refusées, ${compte("expiree")} expirées (${nuitsVendues} nuits)`,
    )
    console.log(`✓ aujourd'hui (${aujourdhui}) : ${presents} chambres occupées, ${sejours.filter((s) => s.arrivee === aujourdhui && s.statut === "confirmee").length} arrivées, ${sejours.filter((s) => s.depart === aujourdhui && s.statut === "confirmee").length} départs`)
    console.log(`✓ ${paiements.length} encaissements (${formaterPrix(paiements.reduce((n, p) => n + p.montant, 0))}), ${facturables.length} factures, ${blocages.length} blocages, ${recents.length} lignes de journal`)
  } catch (erreur) {
    await db.query("rollback")
    throw erreur
  } finally {
    await db.end()
  }
}

demonstration().catch((erreur) => {
  console.error(erreur)
  process.exitCode = 1
})
