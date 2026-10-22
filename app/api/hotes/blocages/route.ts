import { journaliser, json, lireCorps, nomHebergement, pourLesHotes, rafraichirSite } from "@/lib/api/hotes"
import { formaterPlage } from "@/lib/reservation/dates"
import { moteur } from "@/lib/reservation"

// Fermer des dates sans réservation du site : { hebergementId, debut, fin, raison }
export const POST = pourLesHotes(async (requete, membre) => {
  const corps = await lireCorps(requete)
  const texte = (nom: string) => String(corps?.[nom] ?? "").trim()
  const blocage = { hebergementId: texte("hebergementId"), debut: texte("debut"), fin: texte("fin"), raison: texte("raison").slice(0, 120) }
  const resultat = await moteur.ajouterBlocage(blocage)
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
  journaliser(membre, "planning", "Dates bloquées", async () =>
    [await nomHebergement(blocage.hebergementId), formaterPlage(blocage.debut, blocage.fin), blocage.raison].filter(Boolean).join(" · "),
  )
  rafraichirSite()
  return json({ ok: true })
})
