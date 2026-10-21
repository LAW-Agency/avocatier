import { json, lireCorps, pourLesHotes } from "@/lib/api/hotes"
import { gestion } from "@/lib/reservation"

// Client enregistré à la réception, sans compte sur le site : { prenom, nom, email?, telephone, pays, note }
export const POST = pourLesHotes(async (requete) => {
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
  return resultat.ok ? json({ ok: true, client: resultat.client }) : json({ erreur: resultat.erreur }, 400)
})
