import { journaliser, json, lireCorps, pourLesGerants } from "@/lib/api/hotes"
import { normaliserFacturation } from "@/lib/reservation/controles"
import { gestion } from "@/lib/reservation"

// Coordonnées de l'hôtel imprimées sur les factures et les reçus (gérants) :
// { raisonSociale, adresse, telephone, email, identifiants, mentions }
export const PUT = pourLesGerants(async (requete, membre) => {
  const reglages = normaliserFacturation((await lireCorps(requete)) ?? {})
  if (!reglages.raisonSociale) return json({ erreur: "Saisissez le nom de l'établissement." }, 400)
  await gestion.modifierFacturation(reglages)
  journaliser(membre, "tarifs", "Coordonnées des factures modifiées", reglages.raisonSociale)
  return json({ ok: true })
})
