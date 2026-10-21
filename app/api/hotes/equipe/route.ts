import { json, lireCorps, pourLesGerants } from "@/lib/api/hotes"
import { hacherMotDePasse } from "@/lib/auth/motDePasse"
import { gestion } from "@/lib/reservation"
import { controlerMembre } from "@/lib/reservation/controles"

// Nouveau compte de l'équipe : { prenom, nom, email, role: "hote" | "reception", motDePasse } (mot de passe
// provisoire donné de vive voix ; la personne le change par « Mot de passe oublié »)
export const POST = pourLesGerants(async (requete) => {
  const c = await lireCorps(requete)
  const prenom = String(c?.prenom ?? "").trim().slice(0, 80)
  const nom = String(c?.nom ?? "").trim().slice(0, 80)
  const email = String(c?.email ?? "").trim().toLowerCase()
  const motDePasse = String(c?.motDePasse ?? "")
  const role = c?.role === "hote" ? "hote" : "reception"

  const erreur = controlerMembre({ prenom, email }, motDePasse)
  if (erreur) return json({ erreur }, 400)
  const resultat = await gestion.creerMembre({ prenom, nom, email, role, motDePasseHash: hacherMotDePasse(motDePasse) })
  return resultat.ok ? json({ ok: true }) : json({ erreur: resultat.erreur }, 409)
})
