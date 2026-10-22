import { journaliser, json, lireCorps, pourLesGerants, pourLesHotes } from "@/lib/api/hotes"
import { gestion } from "@/lib/reservation"
import type { EffacementJournal } from "@/lib/reservation/types"

const LIMITE = 2000

// Journal d'activité de l'équipe (écran Journal du logiciel), du plus récent au plus ancien
export const GET = pourLesHotes(async () => json({ entrees: await gestion.listerJournal(LIMITE), limite: LIMITE }))

// Effacer des entrées : { ids: string[] }, { avant: date ISO } ou { tout: true }. Réservé aux gérants ;
// l'effacement est lui-même noté au journal
export const DELETE = pourLesGerants(async (requete, membre) => {
  const c = await lireCorps(requete)
  let effacement: EffacementJournal
  if (Array.isArray(c?.ids) && c.ids.length > 0) effacement = { ids: c.ids.map(String).slice(0, LIMITE) }
  else if (typeof c?.avant === "string" && !Number.isNaN(Date.parse(c.avant))) effacement = { avant: new Date(c.avant).toISOString() }
  else if (c?.tout === true) effacement = { tout: true }
  else return json({ erreur: "Choisissez les entrées à supprimer." }, 400)

  const nombre = await gestion.effacerJournal(effacement)
  const portee = "ids" in effacement ? "sélection" : "avant" in effacement ? `entrées d'avant le ${new Date(effacement.avant).toLocaleDateString("fr-FR")}` : "journal entier"
  journaliser(membre, "journal", "Journal effacé", `${nombre} entrée${nombre > 1 ? "s" : ""} supprimée${nombre > 1 ? "s" : ""} (${portee})`)
  return json({ ok: true, nombre })
})
