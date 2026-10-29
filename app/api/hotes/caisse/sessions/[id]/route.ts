import { journaliser, json, lireCorps, pourLaCaisse } from "@/lib/api/hotes"
import { caisse } from "@/lib/reservation"
import { formaterDansDevise } from "@/lib/reservation/devises"
import type { CodeDevise } from "@/lib/reservation/types"

// Clôture de la caisse : { fermeeLe, especesComptees: { MGA: 412000, EUR: 20 }, commentaire } ; bilan figé, écart
// à expliquer dans le commentaire
export const PATCH = pourLaCaisse(async (requete, membre, contexte: RouteContext<"/api/hotes/caisse/sessions/[id]">) => {
  const { id } = await contexte.params
  const c = await lireCorps(requete)
  const brutes = c?.especesComptees && typeof c.especesComptees === "object" ? (c.especesComptees as Record<string, unknown>) : {}
  const especesComptees = Object.fromEntries(Object.entries(brutes).map(([devise, montant]) => [devise, Number(montant)])) as Partial<Record<CodeDevise, number>>
  const resultat = await caisse.cloturerSession(id, { fermeeLe: String(c?.fermeeLe ?? ""), especesComptees, commentaire: String(c?.commentaire ?? "") }, membre.id)
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
  const { session } = resultat
  if (!resultat.deja) {
    journaliser(membre, "restaurant", "Caisse clôturée", async () => {
      const ecarts = Object.entries(session.bilan.ecarts ?? {}).filter(([, e]) => e !== 0)
      return [
        await caisse.nomPoste(session.posteId),
        `ventes ${formaterDansDevise(session.bilan.ventes, "MGA")}`,
        ecarts.length ? `écart ${ecarts.map(([d, e]) => `${e > 0 ? "+" : ""}${formaterDansDevise(e, d as CodeDevise)}`).join(", ")}` : "sans écart",
      ].join(" · ")
    })
  }
  return json({ ok: true, session, deja: resultat.deja })
})
