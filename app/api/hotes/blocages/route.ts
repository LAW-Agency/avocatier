import { journaliser, json, lireCorps, nomChambre, pourLesHotes, rafraichirSite } from "@/lib/api/hotes"
import { formaterPlage } from "@/lib/reservation/dates"
import { moteur } from "@/lib/reservation"
import type { NouveauBlocage } from "@/lib/reservation/types"

// Fermer des dates sans réservation du site, sur une ou plusieurs chambres : { chambreIds, debut, fin, raison }
export const POST = pourLesHotes(async (requete, membre) => {
  const corps = await lireCorps(requete)
  const texte = (nom: string) => String(corps?.[nom] ?? "").trim()
  const blocage: NouveauBlocage = {
    chambreIds: Array.isArray(corps?.chambreIds) ? corps.chambreIds.map(String).slice(0, 100) : [],
    debut: texte("debut"),
    fin: texte("fin"),
    raison: texte("raison").slice(0, 120),
  }
  const resultat = await moteur.ajouterBlocage(blocage)
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
  journaliser(membre, "planning", "Dates bloquées", async () =>
    [(await Promise.all(blocage.chambreIds.map(nomChambre))).join(", "), formaterPlage(blocage.debut, blocage.fin), blocage.raison]
      .filter(Boolean)
      .join(" · "),
  )
  rafraichirSite()
  return json({ ok: true })
})
