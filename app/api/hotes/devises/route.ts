import { journaliser, json, lireCorps, pourLesGerants, rafraichirSite } from "@/lib/api/hotes"
import { moteur } from "@/lib/reservation"
import { CODES_DEVISES, estCodeDevise } from "@/lib/reservation/devises"
import type { CodeDevise } from "@/lib/reservation/types"

// Devises de la vitrine : { parDefaut, actives: CodeDevise[], taux: { code: nombre } }
export const PUT = pourLesGerants(async (requete, membre) => {
  const corps = await lireCorps(requete)
  const parDefaut = corps?.parDefaut
  if (!estCodeDevise(parDefaut)) return json({ erreur: "Choisissez la devise par défaut." }, 400)
  const taux = corps?.taux && typeof corps.taux === "object" ? (corps.taux as Record<string, unknown>) : {}

  const actives = Array.isArray(corps?.actives) ? corps.actives.filter(estCodeDevise) : []
  const resultat = await moteur.modifierDevises({
    parDefaut,
    actives,
    taux: Object.fromEntries(CODES_DEVISES.map((code) => [code, Number(taux[code])])) as Record<CodeDevise, number>,
  })
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 400)
  journaliser(membre, "tarifs", "Devises modifiées", `Par défaut : ${parDefaut} · proposées : ${actives.join(", ") || "aucune"}`)
  rafraichirSite()
  return json({ ok: true })
})
