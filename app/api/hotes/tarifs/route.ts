import { journaliser, json, lireCorps, pourLesGerants, rafraichirSite } from "@/lib/api/hotes"
import { moteur } from "@/lib/reservation"
import type { RegleSaison } from "@/lib/reservation/types"

// Nouveaux tarifs : { prix: { hebergementId: euros }, saisons: RegleSaison[] }, revérifiés par le moteur
// (controlerTarifs). Les réservations existantes gardent leur montant.
export const PUT = pourLesGerants(async (requete, membre) => {
  const corps = await lireCorps(requete)
  const prix = corps?.prix && typeof corps.prix === "object" ? (corps.prix as Record<string, unknown>) : {}
  const saisons = Array.isArray(corps?.saisons) ? (corps.saisons as Record<string, unknown>[]) : []

  const resultat = await moteur.modifierTarifs({
    prix: Object.fromEntries(Object.entries(prix).map(([id, montant]) => [id, Number(montant)])),
    saisons: saisons.map(
      (s): RegleSaison => ({
        nom: String(s?.nom ?? "").trim(),
        debut: String(s?.debut ?? ""),
        fin: String(s?.fin ?? ""),
        // Arrondi au centième : « 20 % » donne 1,2 et non 1,2000000000000002
        coefficient: Math.round(Number(s?.coefficient) * 100) / 100,
        sejourMin: Number(s?.sejourMin),
      }),
    ),
  })
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 400)
  journaliser(
    membre,
    "tarifs",
    "Tarifs modifiés",
    `${Object.keys(prix).length} prix de base · ${saisons.length} saison${saisons.length > 1 ? "s" : ""}${saisons.length ? ` (${saisons.map((s) => String(s?.nom ?? "")).join(", ")})` : ""}`,
  )
  rafraichirSite()
  return json({ ok: true })
})
