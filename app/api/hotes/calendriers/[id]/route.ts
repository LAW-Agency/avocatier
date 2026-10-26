import { journaliser, json, nomChambre, pourLesGerants, rafraichirSite } from "@/lib/api/hotes"
import { gestion } from "@/lib/reservation"

// Calendrier retiré (gérants) : ses dates importées sont libérées, son lien d'export ne répond plus
export const DELETE = pourLesGerants(async (_requete, membre, contexte: RouteContext<"/api/hotes/calendriers/[id]">) => {
  const { id } = await contexte.params
  const calendrier = await gestion.supprimerCalendrier(id)
  if (!calendrier) return json({ erreur: "Ce calendrier a déjà été retiré." }, 404)
  journaliser(membre, "planning", "Calendrier retiré", async () => `${calendrier.nom} · ${await nomChambre(calendrier.chambreId)}`)
  rafraichirSite()
  return json({ ok: true })
})
