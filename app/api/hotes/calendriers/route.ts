import { journaliser, json, lireCorps, nomHebergement, pourLesGerants, rafraichirSite } from "@/lib/api/hotes"
import { gestion } from "@/lib/reservation"
import { synchroniserCalendrier } from "@/lib/reservation/calendriers"
import type { Plateforme } from "@/lib/reservation/types"

// Calendrier d'une plateforme pour un hébergement (gérants) : { hebergementId, plateforme, nom, urlImport }.
// Première importation tout de suite, pour montrer aussitôt si le lien fonctionne
export const POST = pourLesGerants(async (requete, membre) => {
  const c = await lireCorps(requete)
  const texte = (nom: string, max = 120) => String(c?.[nom] ?? "").trim().slice(0, max)
  const resultat = await gestion.creerCalendrier({
    hebergementId: texte("hebergementId"),
    plateforme: texte("plateforme") as Plateforme,
    nom: texte("nom", 40),
    urlImport: texte("urlImport", 2000),
  })
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 400)
  const bilan = await synchroniserCalendrier(resultat.calendrier)
  journaliser(membre, "planning", "Calendrier ajouté", async () => `${resultat.calendrier.nom} · ${await nomHebergement(resultat.calendrier.hebergementId)}`)
  if (bilan.ajoutees.length > 0) rafraichirSite()
  return json({ ok: true, calendrier: resultat.calendrier, bilan })
})
