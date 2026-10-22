import { journaliser, json, pourLesHotes } from "@/lib/api/hotes"

// Déconnexion du logiciel : rien à fermer côté serveur (le logiciel oublie son jeton), seulement notée au journal
export const POST = pourLesHotes(async (_requete, membre) => {
  journaliser(membre, "connexion", "Déconnexion du logiciel")
  return json({ ok: true })
})
