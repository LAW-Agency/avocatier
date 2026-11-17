import { loadEnvConfig } from "@next/env"
import { Client } from "pg"
import { hacherMotDePasse } from "@/lib/auth/motDePasse"
import { COMPTES_DEMO } from "@/lib/reservation/donnees"
import { motDePasseDemo } from "./motsDePasseDemo"

// Change en base le mot de passe des comptes de démonstration (COMPTES_DEMO de lib/reservation/donnees.ts) :
// valeur des variables MOT_DE_PASSE_DEMO_* de .env, sinon mot de passe tiré au hasard et affiché une fois.
// Les sessions déjà ouvertes (site et logiciel des hôtes) et les liens de récupération en cours sont invalidés.
// Un compte absent de la base est ignoré. À lancer dans son propre terminal : les mots de passe s'y affichent.
// Usage : npm run db:mots-de-passe-demo -- --confirmer

loadEnvConfig(process.cwd())

async function changer() {
  if (!process.argv.includes("--confirmer")) {
    console.log(
      "Change le mot de passe des comptes de démonstration et déconnecte leurs sessions.\n" +
        "Relancer avec : npm run db:mots-de-passe-demo -- --confirmer",
    )
    return
  }
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL absente : la définir dans .env (neon env pull).")

  const client = new Client({ connectionString: url })
  await client.connect()
  try {
    await client.query("begin")
    for (const compte of COMPTES_DEMO) {
      const { rows } = await client.query<{ id: string }>("select id from clients where lower(email) = lower($1)", [compte.email])
      if (!rows[0]) {
        console.log(`– ${compte.email} : absent de la base, ignoré`)
        continue
      }
      await client.query("update clients set mot_de_passe_hash = $2, sessions_valides_depuis = now() where id = $1", [
        rows[0].id,
        hacherMotDePasse(motDePasseDemo(compte)),
      ])
      await client.query("delete from jetons_reinitialisation where client_id = $1", [rows[0].id])
      console.log(`✓ ${compte.email} : mot de passe changé, sessions fermées`)
    }
    await client.query("commit")
  } catch (erreur) {
    await client.query("rollback")
    throw erreur
  } finally {
    await client.end()
  }
}

changer().catch((erreur) => {
  console.error(erreur)
  process.exitCode = 1
})
