import { json, lireCorps, pourLesHotes, rafraichirSite } from "@/lib/api/hotes"
import { moteur } from "@/lib/reservation"

// Fermer des dates sans réservation du site : { hebergementId, debut, fin, raison }
export const POST = pourLesHotes(async (requete) => {
  const corps = await lireCorps(requete)
  const texte = (nom: string) => String(corps?.[nom] ?? "").trim()
  const resultat = await moteur.ajouterBlocage({
    hebergementId: texte("hebergementId"),
    debut: texte("debut"),
    fin: texte("fin"),
    raison: texte("raison").slice(0, 120),
  })
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
  rafraichirSite()
  return json({ ok: true })
})
