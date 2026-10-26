import { revalidatePath } from "next/cache"
import { after, NextResponse, type NextRequest } from "next/server"
import { verifierJeton } from "@/lib/auth/session"
import { comptes, gestion, moteur } from "@/lib/reservation"
import { formaterPlage } from "@/lib/reservation/dates"
import type { CategorieJournal, ClientPublic } from "@/lib/reservation/types"

// API du logiciel des hôtes (application Electron du dossier bureau/, routes app/api/hotes/) : jeton signé
// envoyé dans « Authorization: Bearer … », même format et même durée que le cookie de session du site.
// Aucun cookie : le logiciel n'est pas un navigateur, et un jeton en en-tête ne craint pas le CSRF.

// Équipe : « hote » (gérants, tout le logiciel), « reception » (accueil : ni tarifs, ni statistiques, ni utilisateurs)
export type RoleEquipe = "hote" | "reception"
export type Membre = ClientPublic & { role: RoleEquipe }

export const estDeLEquipe = (client: Pick<ClientPublic, "role" | "actif">): client is Membre =>
  (client.role === "hote" || client.role === "reception") && client.actif

export async function membreDeLaRequete(requete: Request): Promise<Membre | null> {
  const entete = requete.headers.get("authorization") ?? ""
  const session = verifierJeton(entete.startsWith("Bearer ") ? entete.slice(7) : undefined)
  if (!session) return null
  const client = await comptes.trouverParId(session.clientId)
  if (!client || !estDeLEquipe(client)) return null
  // Mot de passe changé ou compte réactivé depuis la connexion : le jeton ne vaut plus
  if (client.sessionsValidesDepuis && session.emiseLe < Date.parse(client.sessionsValidesDepuis)) return null
  return client
}

// Réponse JSON jamais mise en cache : les données des hôtes changent à chaque demande
export function json(contenu: unknown, status = 200) {
  return NextResponse.json(contenu, { status, headers: { "Cache-Control": "no-store" } })
}

// Corps JSON de la requête, ou null s'il est illisible
export async function lireCorps(requete: Request): Promise<Record<string, unknown> | null> {
  try {
    const corps: unknown = await requete.json()
    return corps && typeof corps === "object" && !Array.isArray(corps) ? (corps as Record<string, unknown>) : null
  } catch {
    return null
  }
}

// Enveloppe de chaque route : 401 sans jeton valable d'un compte actif de l'équipe (le logiciel revient alors à
// l'écran de connexion), 403 si le rôle n'a pas accès à cette route
export function pourLesHotes<Contexte>(
  traiter: (requete: NextRequest, membre: Membre, contexte: Contexte) => Promise<Response>,
  roles: RoleEquipe[] = ["hote", "reception"],
) {
  return async (requete: NextRequest, contexte: Contexte) => {
    const membre = await membreDeLaRequete(requete)
    if (!membre) return json({ erreur: "Session expirée : reconnectez-vous." }, 401)
    if (!roles.includes(membre.role)) return json({ erreur: "Réservé aux gérants." }, 403)
    return traiter(requete, membre, contexte)
  }
}

export const pourLesGerants = <Contexte>(traiter: (requete: NextRequest, membre: Membre, contexte: Contexte) => Promise<Response>) =>
  pourLesHotes(traiter, ["hote"])

export const nomDuMembre = (membre: Pick<ClientPublic, "prenom" | "nom">) => `${membre.prenom} ${membre.nom}`.trim()

// Action de l'équipe notée au journal d'activité (écran Journal du logiciel), après la réponse : le détail peut
// demander des lectures en base sans ralentir l'action. Un échec d'écriture du journal n'annule pas l'action.
export function journaliser(
  membre: Pick<Membre, "id" | "prenom" | "nom">,
  categorie: CategorieJournal,
  action: string,
  detail: string | (() => Promise<string>) = "",
) {
  after(async () => {
    try {
      const texte = typeof detail === "string" ? detail : await detail()
      await gestion.noterActivite({ membreId: membre.id, auteur: nomDuMembre(membre), categorie, action, detail: texte })
    } catch (erreur) {
      console.error("Journal d'activité :", erreur)
    }
  })
}

// « AVO-2026-0042 · Joëlle Martin · Océan 3 · 12 – 15 nov. » pour le journal
export async function decrireReservation(id: string): Promise<string> {
  const r = await moteur.trouverReservation(id)
  if (!r) return "Réservation supprimée"
  const [client, chambres] = await Promise.all([comptes.trouverParId(r.clientId), moteur.listerChambres()])
  const chambre = chambres.find((c) => c.id === r.chambreId)?.numero
  return [r.reference, client && nomDuMembre(client), chambre, formaterPlage(r.arrivee, r.depart)].filter(Boolean).join(" · ")
}

// « Bungalow Océan · Océan 3 » pour le journal
export async function nomChambre(id: string): Promise<string> {
  const [chambres, hebergements] = await Promise.all([moteur.listerChambres(), moteur.listerHebergements()])
  const chambre = chambres.find((c) => c.id === id)
  if (!chambre) return "Chambre supprimée"
  return [hebergements.find((h) => h.id === chambre.hebergementId)?.nom, chambre.numero].filter(Boolean).join(" · ")
}

// Une décision des hôtes change les disponibilités ou les prix : calendrier de réservation, fiches,
// compte des clients et devises de la vitrine sont à régénérer
export function rafraichirSite() {
  revalidatePath("/", "layout")
}
