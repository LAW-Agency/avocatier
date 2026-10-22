import { journaliser, json, lireCorps, nomDuMembre, pourLesGerants, pourLesHotes } from "@/lib/api/hotes"
import { comptes, gestion } from "@/lib/reservation"

// { note } : note interne sur un client. { coordonnees: { prenom, nom, email, telephone, pays } } : coordonnées
// corrigées (un compte du site garde son e-mail)
export const PATCH = pourLesHotes(async (requete, membre, contexte: RouteContext<"/api/hotes/clients/[id]">) => {
  const { id } = await contexte.params
  const corps = await lireCorps(requete)
  const c = corps?.coordonnees

  if (c && typeof c === "object" && !Array.isArray(c)) {
    const texte = (nom: string, max = 120) => String((c as Record<string, unknown>)[nom] ?? "").trim().slice(0, max)
    const avant = await comptes.trouverParId(id)
    const resultat = await gestion.modifierClient(id, {
      prenom: texte("prenom"),
      nom: texte("nom"),
      email: texte("email"),
      telephone: texte("telephone", 40),
      pays: texte("pays", 60),
    })
    if (!resultat.ok) return json({ erreur: resultat.erreur }, 400)
    journaliser(membre, "client", "Coordonnées modifiées", async () => {
      const apres = await comptes.trouverParId(id)
      if (!avant || !apres) return ""
      const champs = (["prenom", "nom", "email", "telephone", "pays"] as const).filter((cle) => avant[cle] !== apres[cle])
      return `${nomDuMembre(apres)}${champs.length ? ` · ${champs.join(", ")}` : ""}`
    })
    return json({ ok: true })
  }

  const resultat = await gestion.modifierNoteClient(id, String(corps?.note ?? ""))
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 404)
  journaliser(membre, "client", "Note client modifiée", async () => {
    const client = await comptes.trouverParId(id)
    return client ? nomDuMembre(client) : "Client supprimé"
  })
  return json({ ok: true })
})

// Droit à l'effacement (gérants) : fiche supprimée, ou anonymisée si des réservations restent en comptabilité.
// Le journal ne garde pas le nom
export const DELETE = pourLesGerants(async (_requete, membre, contexte: RouteContext<"/api/hotes/clients/[id]">) => {
  const { id } = await contexte.params
  const resultat = await gestion.effacerClient(id)
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
  journaliser(membre, "client", "Données d'un client effacées", "À la demande du client")
  return json({ ok: true })
})
