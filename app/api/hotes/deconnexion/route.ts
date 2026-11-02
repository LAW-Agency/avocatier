import { journaliser, json, pourLaCaisse } from "@/lib/api/hotes"
import { revoquerJeton } from "@/lib/auth/connexions"

// Déconnexion du logiciel : le logiciel oublie son jeton, et le serveur le refuse désormais (même copié ailleurs)
export const POST = pourLaCaisse(async (requete, membre) => {
  await revoquerJeton(requete.headers.get("authorization")?.replace(/^Bearer /, ""))
  journaliser(membre, "connexion", "Déconnexion du logiciel")
  return json({ ok: true })
})
