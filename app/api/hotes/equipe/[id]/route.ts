import { journaliser, json, lireCorps, nomDuMembre, pourLesGerants } from "@/lib/api/hotes"
import { hacherMotDePasse } from "@/lib/auth/motDePasse"
import { comptes, gestion } from "@/lib/reservation"
import { MOT_DE_PASSE_MIN } from "@/lib/reservation/controles"
import type { ModificationMembre } from "@/lib/reservation/types"

// Modifier un compte de l'équipe : { role?, actif?, motDePasse? }. Un gérant ne se désactive pas lui-même.
export const PATCH = pourLesGerants(async (requete, membre, contexte: RouteContext<"/api/hotes/equipe/[id]">) => {
  const { id } = await contexte.params
  const c = await lireCorps(requete)
  const modification: ModificationMembre = {}
  if (c?.role === "hote" || c?.role === "reception") modification.role = c.role
  if (typeof c?.actif === "boolean") modification.actif = c.actif
  if (typeof c?.motDePasse === "string") {
    if (c.motDePasse.length < MOT_DE_PASSE_MIN) return json({ erreur: `Le mot de passe doit contenir au moins ${MOT_DE_PASSE_MIN} caractères.` }, 400)
    modification.motDePasseHash = hacherMotDePasse(c.motDePasse)
  }
  if (id === membre.id && (modification.actif === false || modification.role === "reception")) {
    return json({ erreur: "Vous ne pouvez pas retirer vos propres droits de gérant." }, 400)
  }

  const resultat = await gestion.modifierMembre(id, modification)
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
  const changements = [
    modification.role && `rôle : ${modification.role === "hote" ? "gérant" : "réception"}`,
    modification.actif === false && "compte désactivé",
    modification.actif === true && "compte réactivé",
    modification.motDePasseHash && "mot de passe réinitialisé",
  ].filter(Boolean)
  journaliser(membre, "equipe", "Compte modifié", async () => {
    const compte = await comptes.trouverParId(id)
    return [compte ? nomDuMembre(compte) : "Compte supprimé", ...changements].join(" · ")
  })
  return json({ ok: true })
})
