import { journaliser, json, lireCorps, pourLaCaisse } from "@/lib/api/hotes"
import { caisse } from "@/lib/reservation"
import { formaterDansDevise } from "@/lib/reservation/devises"

// Annuler un ticket : { annuler: true, motif }. Jamais effacé : il reste dans la liste, barré, avec son motif.
// Hors gérants, seulement un ticket du jour
export const PATCH = pourLaCaisse(async (requete, membre, contexte: RouteContext<"/api/hotes/caisse/tickets/[id]">) => {
  const { id } = await contexte.params
  const c = await lireCorps(requete)
  if (c?.annuler !== true) return json({ erreur: "Seule l'annulation d'un ticket est possible." }, 400)
  const resultat = await caisse.annulerTicket(id, String(c.motif ?? ""), { id: membre.id, gerant: membre.role === "hote" })
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
  const t = resultat.ticket
  journaliser(membre, "restaurant", "Ticket annulé", `${t.numero} · ${formaterDansDevise(t.total, "MGA")} · « ${t.motifAnnulation} »`)
  return json({ ok: true, ticket: t })
})
