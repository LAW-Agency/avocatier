import type { NextRequest } from "next/server"
import { estDeLEquipe, journaliser, json, lireCorps } from "@/lib/api/hotes"
import { verifierMotDePasse } from "@/lib/auth/motDePasse"
import { emettreJeton } from "@/lib/auth/session"
import { comptes } from "@/lib/reservation"

// Connexion du logiciel des hôtes : jeton à renvoyer dans l'en-tête Authorization (gardé chiffré par le logiciel)
export async function POST(requete: NextRequest) {
  const corps = await lireCorps(requete)
  const email = String(corps?.email ?? "").trim().toLowerCase()
  const motDePasse = String(corps?.motDePasse ?? "")

  const client = email ? await comptes.trouverParEmail(email) : null
  if (!client || !verifierMotDePasse(motDePasse, client.motDePasseHash)) {
    // Tentative sur un compte de l'équipe : notée au journal (pas pour une adresse inconnue ou un client)
    if (client && client.role !== "client") journaliser(client, "connexion", "Connexion refusée", "Mot de passe incorrect")
    return json({ erreur: "E-mail ou mot de passe incorrect." }, 401)
  }
  if (client.role === "client") return json({ erreur: "Ce compte client n'a pas accès au logiciel des hôtes." }, 403)
  if (!estDeLEquipe(client)) {
    journaliser(client, "connexion", "Connexion refusée", "Compte désactivé")
    return json({ erreur: "Ce compte a été désactivé par un gérant." }, 403)
  }
  journaliser(client, "connexion", "Connexion au logiciel")

  return json({
    jeton: emettreJeton(client.id),
    hote: { prenom: client.prenom, nom: client.nom, email: client.email, role: client.role },
  })
}
