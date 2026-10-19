import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { loadEnvConfig } from "@next/env"
import { Client } from "pg"

// Applique, dans l'ordre et une seule fois chacun, les fichiers .sql de lib/reservation/postgres/migrations.
// Connexion directe (DATABASE_URL_UNPOOLED, sans « -pooler ») : recommandée par Neon pour les migrations.
// Usage : npm run db:migrer

loadEnvConfig(process.cwd())

const DOSSIER = path.join(process.cwd(), "lib/reservation/postgres/migrations")

async function migrer() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL absente : la définir dans .env (neon env pull).")

  const client = new Client({ connectionString: url })
  await client.connect()
  try {
    // Un seul passage à la fois, même lancé deux fois en parallèle
    await client.query("select pg_advisory_lock(hashtext('avocatier-migrations'))")
    await client.query("create table if not exists migrations (nom text primary key, appliquee_le timestamptz not null default now())")
    const faites = new Set((await client.query<{ nom: string }>("select nom from migrations")).rows.map((l) => l.nom))
    const fichiers = (await readdir(DOSSIER)).filter((f) => f.endsWith(".sql")).sort()

    let appliquees = 0
    for (const nom of fichiers) {
      if (faites.has(nom)) continue
      const sql = await readFile(path.join(DOSSIER, nom), "utf8")
      // Une migration passe en entier ou pas du tout
      await client.query("begin")
      try {
        await client.query(sql)
        await client.query("insert into migrations (nom) values ($1)", [nom])
        await client.query("commit")
      } catch (erreur) {
        await client.query("rollback")
        throw erreur
      }
      appliquees += 1
      console.log(`✓ ${nom}`)
    }
    console.log(appliquees ? `${appliquees} migration(s) appliquée(s).` : "Base déjà à jour.")
  } finally {
    await client.end()
  }
}

migrer().catch((erreur) => {
  console.error(erreur)
  process.exitCode = 1
})
