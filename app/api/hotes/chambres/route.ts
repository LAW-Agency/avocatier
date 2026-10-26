import { journaliser, json, lireCorps, nomChambre, pourLesGerants, rafraichirSite } from "@/lib/api/hotes"
import { gestion } from "@/lib/reservation"

// Nouvelle chambre dans une catégorie (gérants) : { hebergementId, numero }. Proposée à la vente aussitôt
export const POST = pourLesGerants(async (requete, membre) => {
  const corps = await lireCorps(requete)
  const resultat = await gestion.creerChambre({ hebergementId: String(corps?.hebergementId ?? ""), numero: String(corps?.numero ?? "") })
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 400)
  journaliser(membre, "chambre", "Chambre ajoutée", () => nomChambre(resultat.chambre.id))
  rafraichirSite()
  return json({ ok: true, chambre: resultat.chambre })
})
