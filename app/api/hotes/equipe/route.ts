import { journaliser, json, lireCorps, NOMS_ROLES, pourLesGerants } from "@/lib/api/hotes"
import { hacherMotDePasse } from "@/lib/auth/motDePasse"
import { gestion } from "@/lib/reservation"
import { controlerMembre, estRoleEquipe } from "@/lib/reservation/controles"

// Nouveau compte de l'équipe : { prenom, nom, email, role: "hote" | "reception" | "caissier", motDePasse } (mot de passe
// provisoire donné de vive voix ; la personne le change par « Mot de passe oublié »)
export const POST = pourLesGerants(async (requete, membre) => {
  const c = await lireCorps(requete)
  const prenom = String(c?.prenom ?? "").trim().slice(0, 80)
  const nom = String(c?.nom ?? "").trim().slice(0, 80)
  const email = String(c?.email ?? "").trim().toLowerCase()
  const motDePasse = String(c?.motDePasse ?? "")
  if (!estRoleEquipe(c?.role)) return json({ erreur: "Choisissez le rôle du compte." }, 400)
  const role = c.role

  const erreur = controlerMembre({ prenom, email }, motDePasse)
  if (erreur) return json({ erreur }, 400)
  const resultat = await gestion.creerMembre({ prenom, nom, email, role, motDePasseHash: hacherMotDePasse(motDePasse) })
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
  journaliser(membre, "equipe", "Compte créé", `${`${prenom} ${nom}`.trim()} · ${NOMS_ROLES[role]} · ${email}`)
  return json({ ok: true })
})
