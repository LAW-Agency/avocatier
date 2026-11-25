import { loadEnvConfig } from "@next/env"
import { appelGoogle, identifiantsGoogle } from "@/lib/agenda/google"
import { synchroniserAgenda } from "@/lib/agenda/synchronisation"

// Mise en place et entretien de l'agenda Google des réservations (géré par l'agence, jamais par le propriétaire).
// Variables lues dans .env : GOOGLE_COMPTE_SERVICE_EMAIL, GOOGLE_COMPTE_SERVICE_CLE, GOOGLE_AGENDA_ID.
// Usage :
//   npm run agenda -- creer                       crée l'agenda du compte de service, affiche GOOGLE_AGENDA_ID
//   npm run agenda -- partager <e-mail> [editeur]  partage l'agenda (lecture seule par défaut)
//   npm run agenda -- partages                    liste les personnes qui y ont accès
//   npm run agenda -- synchroniser                remplit / remet à jour l'agenda depuis la base (DATABASE_URL)

loadEnvConfig(process.cwd())

const FUSEAU = "Indian/Antananarivo"

function agenda(): string {
  const id = process.env.GOOGLE_AGENDA_ID?.trim()
  if (!id) throw new Error("GOOGLE_AGENDA_ID absent de .env : lancer d'abord « npm run agenda -- creer ».")
  return id
}

async function principal() {
  const id = identifiantsGoogle()
  if (!id) throw new Error("GOOGLE_COMPTE_SERVICE_EMAIL et GOOGLE_COMPTE_SERVICE_CLE absents de .env (clé JSON du compte de service).")
  const [commande, ...args] = process.argv.slice(2)

  switch (commande) {
    case "creer": {
      if (process.env.GOOGLE_AGENDA_ID) throw new Error(`Un agenda est déjà configuré (${process.env.GOOGLE_AGENDA_ID}).`)
      const cree = await appelGoogle<{ id: string }>(id, "POST", "/calendars", {
        summary: "Chez L'Avocatier · Réservations",
        description: "Réservations de l'hôtel, mises à jour automatiquement par le site. Lecture seule : ne pas modifier ici.",
        timeZone: FUSEAU,
      })
      console.log(`Agenda créé. À mettre dans .env et dans les variables Vercel :\nGOOGLE_AGENDA_ID=${cree?.id}`)
      console.log("Puis : npm run agenda -- partager <e-mail du propriétaire>")
      return
    }
    case "partager": {
      const [email, droit] = args
      if (!email?.includes("@")) throw new Error("Usage : npm run agenda -- partager <e-mail> [editeur]")
      const role = droit === "editeur" ? "writer" : "reader"
      await appelGoogle(id, "POST", `/calendars/${encodeURIComponent(agenda())}/acl?sendNotifications=true`, {
        role,
        scope: { type: "user", value: email.trim().toLowerCase() },
      })
      console.log(`Agenda partagé avec ${email} (${role === "reader" ? "lecture seule" : "modification"}). Google lui envoie un e-mail.`)
      console.log(`S'il ne le voit pas : https://calendar.google.com/calendar/r?cid=${encodeURIComponent(agenda())}`)
      return
    }
    case "partages": {
      const acl = await appelGoogle<{ items?: { role: string; scope: { type: string; value?: string } }[] }>(
        id,
        "GET",
        `/calendars/${encodeURIComponent(agenda())}/acl`,
      )
      for (const r of acl?.items ?? []) console.log(`${r.role.padEnd(8)} ${r.scope.type} ${r.scope.value ?? ""}`)
      return
    }
    case "synchroniser": {
      agenda()
      const bilan = await synchroniserAgenda()
      console.log(`Créés : ${bilan.crees} · modifiés : ${bilan.modifies} · supprimés : ${bilan.supprimes}`)
      for (const e of bilan.erreurs) console.error(`Erreur : ${e}`)
      if (bilan.erreurs.length > 0) process.exitCode = 1
      return
    }
    default:
      throw new Error("Commande attendue : creer, partager, partages ou synchroniser.")
  }
}

principal().catch((erreur: unknown) => {
  console.error(erreur instanceof Error ? erreur.message : erreur)
  process.exitCode = 1
})
