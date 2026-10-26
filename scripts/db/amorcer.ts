import { loadEnvConfig } from "@next/env"
import { Client } from "pg"
import { reglagesDevisesInitiaux } from "@/lib/reservation/devises"
import { chambresInitiales, creerDemonstration, hebergements, reglesSaisonsInitiales } from "@/lib/reservation/donnees"

// Remplit la base après `npm run db:migrer`. Sans risque à relancer :
// - hébergements : ajoutés ou mis à jour depuis lib/reservation/donnees.ts, sans toucher au prix saisi par les hôtes ;
// - chambres : celles de `chambresInitiales`, seulement pour une catégorie qui n'en a encore aucune ;
// - saisons et devises : seulement si rien n'est encore enregistré ;
// - comptes de démonstration (COMPTE_DEMO, COMPTE_HOTE) et leurs réservations : seulement si la base n'a aucun compte.
// Ces comptes ont des mots de passe connus : les supprimer avant l'ouverture au public.
// Usage : npm run db:amorcer

loadEnvConfig(process.cwd())

async function amorcer() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL absente : la définir dans .env (neon env pull).")

  const client = new Client({ connectionString: url })
  await client.connect()
  try {
    await client.query("begin")

    for (const [ordre, h] of hebergements.entries()) {
      await client.query(
        `insert into hebergements (id, ordre, slug, nom, type, description, image, capacite_max, literie, vue, prix_nuit,
           presentation, galerie, salle_de_bains, equipements)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         on conflict (id) do update set ordre = excluded.ordre, slug = excluded.slug, nom = excluded.nom, type = excluded.type,
           description = excluded.description, image = excluded.image, capacite_max = excluded.capacite_max,
           literie = excluded.literie, vue = excluded.vue, presentation = excluded.presentation, galerie = excluded.galerie,
           salle_de_bains = excluded.salle_de_bains, equipements = excluded.equipements`,
        [h.id, ordre, h.slug, h.nom, h.type, h.description, h.image, h.capaciteMax, h.literie, h.vue, h.prixNuit,
          h.presentation, h.galerie, h.salleDeBains, h.equipements],
      )
    }
    console.log(`✓ ${hebergements.length} hébergements`)

    for (const [hebergementId, numeros] of Object.entries(chambresInitiales)) {
      const { rowCount: existantes } = await client.query("select 1 from chambres where hebergement_id = $1 limit 1", [hebergementId])
      if (existantes) continue
      for (const numero of numeros) {
        await client.query("insert into chambres (hebergement_id, numero) values ($1, $2)", [hebergementId, numero])
      }
      console.log(`✓ ${numeros.length} chambre(s) pour ${hebergementId}`)
    }

    const { rowCount: saisons } = await client.query("select 1 from regles_saisons limit 1")
    if (!saisons) {
      for (const s of reglesSaisonsInitiales) {
        await client.query("insert into regles_saisons (nom, debut, fin, coefficient, sejour_min) values ($1, $2, $3, $4, $5)", [
          s.nom, s.debut, s.fin, s.coefficient, s.sejourMin,
        ])
      }
      console.log(`✓ ${reglesSaisonsInitiales.length} saisons`)
    }

    const devises = reglagesDevisesInitiaux()
    const { rowCount: devisesAjoutees } = await client.query(
      "insert into reglages_devises (id, par_defaut, actives, taux) values (true, $1, $2, $3) on conflict (id) do nothing",
      [devises.parDefaut, devises.actives, JSON.stringify(devises.taux)],
    )
    if (devisesAjoutees) console.log("✓ devises")

    const { rowCount: comptes } = await client.query("select 1 from clients limit 1")
    if (!comptes) {
      const demo = creerDemonstration()
      // Identifiants de la démonstration (« c1 », « hote »…) remplacés par ceux de la base
      const ids = new Map<string, string>()
      for (const c of demo.clients) {
        const { rows } = await client.query<{ id: string }>(
          `insert into clients (role, email, prenom, nom, telephone, pays, mot_de_passe_hash, cree_le)
           values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
          [c.role, c.email, c.prenom, c.nom, c.telephone, c.pays, c.motDePasseHash, c.creeLe],
        )
        ids.set(c.id, rows[0].id)
      }
      // Chambres de la démonstration désignées par leur numéro
      const { rows: chambres } = await client.query<{ id: string; numero: string }>("select id, numero from chambres")
      const chambre = (numero: string) => {
        const trouvee = chambres.find((c) => c.numero === numero)
        if (!trouvee) throw new Error(`Chambre « ${numero} » absente : elle a été renommée ou supprimée.`)
        return trouvee.id
      }
      for (const r of demo.reservations) {
        await client.query(
          `insert into reservations (reference, client_id, hebergement_id, chambre_id, arrivee, depart, adultes, enfants, navette,
             telephone, message, montant_total, statut, source, cree_le, expire_le, historique)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [r.reference, ids.get(r.clientId), r.hebergementId, chambre(r.chambreId), r.arrivee, r.depart, r.adultes, r.enfants, r.navette,
            r.telephone, r.message, r.montantTotal, r.statut, r.source, r.creeLe, r.expireLe ?? null, JSON.stringify(r.historique)],
        )
      }
      for (const b of demo.blocages) {
        await client.query("insert into blocages (hebergement_id, chambre_id, debut, fin, raison) values ($1, $2, $3, $4, $5)", [
          b.hebergementId, chambre(b.chambreId), b.debut, b.fin, b.raison,
        ])
      }
      // Les prochaines références suivent celles de la démonstration
      await client.query("select setval('reservations_numero', $1)", [demo.compteur])
      console.log(`✓ démonstration : ${demo.clients.length} comptes, ${demo.reservations.length} réservations, ${demo.blocages.length} blocages`)
    }

    await client.query("commit")
  } catch (erreur) {
    await client.query("rollback")
    throw erreur
  } finally {
    await client.end()
  }
}

amorcer().catch((erreur) => {
  console.error(erreur)
  process.exitCode = 1
})
