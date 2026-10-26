import { journaliser, json, nomChambre, pourLesHotes, rafraichirSite } from "@/lib/api/hotes"
import { formaterPlage } from "@/lib/reservation/dates"
import { moteur } from "@/lib/reservation"

// Libérer des dates bloquées (pas celles importées d'une plateforme : elles reviendraient à la synchronisation)
export const DELETE = pourLesHotes(async (_requete, membre, contexte: RouteContext<"/api/hotes/blocages/[id]">) => {
  const { id } = await contexte.params
  // Lu avant la suppression, pour le journal
  const blocage = (await moteur.listerBlocages()).find((b) => b.id === id)
  if (blocage?.calendrierId) {
    return json({ erreur: "Ces dates viennent du calendrier d'une plateforme : libérez-les sur la plateforme, elles disparaîtront à la synchronisation." }, 409)
  }
  if (!blocage || !(await moteur.supprimerBlocage(id))) return json({ erreur: "Ces dates ont déjà été libérées." }, 404)
  journaliser(membre, "planning", "Dates libérées", async () =>
    [await nomChambre(blocage.chambreId), formaterPlage(blocage.debut, blocage.fin), blocage.raison].filter(Boolean).join(" · "),
  )
  rafraichirSite()
  return json({ ok: true })
})
