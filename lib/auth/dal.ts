import { redirect } from "next/navigation"
import { cache } from "react"
import { comptes } from "@/lib/reservation"
import type { ClientPublic } from "@/lib/reservation/types"
import { lireSession } from "./session"

// Client connecté, mémorisé le temps d'un rendu. À appeler dans chaque page et Server Action protégée.
export const clientConnecte = cache(async (): Promise<ClientPublic | null> => {
  const clientId = await lireSession()
  return clientId ? comptes.trouverParId(clientId) : null
})

// Espace hôtes : à appeler en tête de chaque page et Server Action de /admin
// (le layout ne suffit pas : il n'est pas réexécuté à chaque navigation)
export async function exigerHote(): Promise<ClientPublic> {
  const client = await clientConnecte()
  if (!client) redirect("/compte/connexion?suite=/admin")
  if (client.role !== "hote") redirect("/compte")
  return client
}

// Redirection après connexion : seulement vers un chemin interne (pas de redirection ouverte)
export function cheminInterne(valeur: unknown, parDefaut = "/compte"): string {
  if (typeof valeur !== "string" || !valeur.startsWith("/") || valeur.startsWith("//") || valeur.startsWith("/\\")) {
    return parDefaut
  }
  return valeur
}
