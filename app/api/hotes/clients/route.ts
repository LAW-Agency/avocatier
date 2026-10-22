import { journaliser, json, lireCorps, nomDuMembre, pourLesHotes } from "@/lib/api/hotes"
import { gestion } from "@/lib/reservation"

// Client enregistré à la réception, sans compte sur le site : { prenom, nom, email?, telephone, pays, note }
export const POST = pourLesHotes(async (requete, membre) => {
  const c = await lireCorps(requete)
  const texte = (nom: string, max = 120) => String(c?.[nom] ?? "").trim().slice(0, max)
  const resultat = await gestion.creerClientLocal({
    prenom: texte("prenom"),
    nom: texte("nom"),
    email: texte("email"),
    telephone: texte("telephone", 40),
    pays: texte("pays", 60),
    note: texte("note", 1000),
  })
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 400)
  journaliser(membre, "client", "Client enregistré", [nomDuMembre(resultat.client), resultat.client.telephone, resultat.client.pays].filter(Boolean).join(" · "))
  return json({ ok: true, client: resultat.client })
})
