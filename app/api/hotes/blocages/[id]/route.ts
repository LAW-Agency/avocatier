import { json, pourLesHotes, rafraichirSite } from "@/lib/api/hotes"
import { moteur } from "@/lib/reservation"

// Libérer des dates bloquées
export const DELETE = pourLesHotes(async (_requete, _hote, contexte: RouteContext<"/api/hotes/blocages/[id]">) => {
  const { id } = await contexte.params
  if (!(await moteur.supprimerBlocage(id))) return json({ erreur: "Ces dates ont déjà été libérées." }, 404)
  rafraichirSite()
  return json({ ok: true })
})
