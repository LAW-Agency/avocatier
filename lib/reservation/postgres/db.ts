import { attachDatabasePool } from "@vercel/functions"
import { Pool, types, type PoolClient, type QueryResultRow } from "pg"

// Connexion PostgreSQL (Neon aujourd'hui, serveur de l'agence plus tard : seule DATABASE_URL change).
// Driver node-postgres, recommandé par Neon sur Vercel ; adresse « -pooler » pour l'application,
// l'adresse directe (DATABASE_URL_UNPOOLED) étant réservée aux migrations.

// « date » gardée en texte « AAAA-MM-JJ » (DateISO) : par défaut, pg en ferait un Date à minuit
// dans le fuseau du serveur, qui peut décaler le jour. « numeric » (coefficients) en nombre.
const conversions = {
  getTypeParser: ((oid: number, format?: "text" | "binary") => {
    if (oid === types.builtins.DATE) return (valeur: string) => valeur
    if (oid === types.builtins.NUMERIC) return (valeur: string) => Number(valeur)
    return types.getTypeParser(oid, format as "text")
  }) as typeof types.getTypeParser,
}

// Un seul pool par processus, rangé sur globalThis pour survivre aux rechargements à chaud
const globalPg = globalThis as typeof globalThis & { __avocatierPg?: Pool }

function pool(): Pool {
  if (!globalPg.__avocatierPg) {
    // Sans adresse, pg tenterait silencieusement localhost:5432
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL manquante : la définir dans .env (neon env pull) ou chez l'hébergeur.")
    // Connexions gardées une minute au lieu de 10 s : chaque nouvelle connexion à Neon coûte plusieurs
    // allers-retours (TLS), et le logiciel des hôtes interroge le site toutes les 15 s
    const nouveau = new Pool({ connectionString: process.env.DATABASE_URL, types: conversions, allowExitOnIdle: true, idleTimeoutMillis: 60_000 })
    // Sur Vercel, garde la fonction en vie le temps de fermer les connexions inactives (sans effet ailleurs)
    attachDatabasePool(nouveau)
    globalPg.__avocatierPg = nouveau
  }
  return globalPg.__avocatierPg
}

// Pool ou connexion d'une transaction en cours
export type Executant = Pick<PoolClient, "query">

export function db(): Executant {
  return pool()
}

export async function lignes<T extends QueryResultRow>(executant: Executant, sql: string, valeurs: unknown[] = []): Promise<T[]> {
  return (await executant.query<T>(sql, valeurs)).rows
}

// Annulée en entier si `travail` lève une exception
export async function transaction<T>(travail: (tx: Executant) => Promise<T>): Promise<T> {
  const client = await pool().connect()
  try {
    await client.query("begin")
    const resultat = await travail(client)
    await client.query("commit")
    return resultat
  } catch (erreur) {
    await client.query("rollback")
    throw erreur
  } finally {
    client.release()
  }
}

// Code SQLSTATE d'une erreur PostgreSQL (23P01 : contrainte d'exclusion, 23505 : unicité)
export function codeErreur(erreur: unknown): string | undefined {
  return typeof erreur === "object" && erreur !== null && "code" in erreur ? String(erreur.code) : undefined
}
