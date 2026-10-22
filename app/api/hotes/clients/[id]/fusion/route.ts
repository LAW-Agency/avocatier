import { journaliser, json, lireCorps, nomDuMembre, pourLesGerants } from "@/lib/api/hotes"
import { gestion } from "@/lib/reservation"

// Fusion de deux fiches du même client (gérants) : { doublonId }. Renvoie la fiche gardée (celle du compte du
// site si l'une en est un), à ouvrir dans le logiciel
export const POST = pourLesGerants(async (requete, membre, contexte: RouteContext<"/api/hotes/clients/[id]/fusion">) => {
  const { id } = await contexte.params
  const doublonId = String((await lireCorps(requete))?.doublonId ?? "")
  const resultat = await gestion.fusionnerClients(id, doublonId)
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
  journaliser(membre, "client", "Fiches clients fusionnées", nomDuMembre(resultat.client))
  return json({ ok: true, client: resultat.client })
})
