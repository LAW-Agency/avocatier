import { cache } from "react"
import { comptes } from "@/lib/reservation"
import type { ClientPublic } from "@/lib/reservation/types"
import { lireSession } from "./session"

// Client connecté, mémorisé le temps d'un rendu. À appeler dans chaque page et Server Action protégée.
// Jamais un compte de l'équipe (hôtes, réception) : ils passent par leur logiciel (bureau/, API lib/api/hotes.ts).
export const clientConnecte = cache(async (): Promise<ClientPublic | null> => {
  const session = await lireSession()
  if (!session) return null
  const client = await comptes.trouverParId(session.clientId)
  if (!client || client.role !== "client") return null
  // Mot de passe changé depuis l'ouverture de cette session (récupération de compte) : elle ne vaut plus
  if (client.sessionsValidesDepuis && session.emiseLe < Date.parse(client.sessionsValidesDepuis)) return null
  return client
})

// Redirection après connexion : seulement vers un chemin interne (pas de redirection ouverte)
export function cheminInterne(valeur: unknown, parDefaut = "/compte"): string {
  if (typeof valeur !== "string" || !valeur.startsWith("/") || valeur.startsWith("//") || valeur.startsWith("/\\")) {
    return parDefaut
  }
  return valeur
}
