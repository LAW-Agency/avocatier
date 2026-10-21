import { json, lireCorps, pourLesHotes } from "@/lib/api/hotes"
import { gestion } from "@/lib/reservation"

// Note interne sur un client : { note }
export const PATCH = pourLesHotes(async (requete, _membre, contexte: RouteContext<"/api/hotes/clients/[id]">) => {
  const { id } = await contexte.params
  const resultat = await gestion.modifierNoteClient(id, String((await lireCorps(requete))?.note ?? ""))
  return resultat.ok ? json({ ok: true }) : json({ erreur: resultat.erreur }, 404)
})
