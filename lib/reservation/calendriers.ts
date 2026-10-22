import { gestion } from "."
import { lireIcal } from "./ical"
import type { BilanSynchronisation, CalendrierExterne, PeriodeImportee } from "./types"

// Importation des calendriers des plateformes (code serveur) : téléchargement du fichier iCal, lecture, puis
// remplacement des dates importées en base. Déclenchée par le logiciel des hôtes (toutes les 10 minutes et à la
// demande), par la tâche planifiée de Vercel, et juste avant d'enregistrer une demande du site.

const DELAI_MS = 10_000
const TAILLE_MAX = 2_000_000 // un calendrier de plateforme pèse quelques dizaines de Ko

async function telecharger(url: string, delaiMs: number): Promise<{ periodes: PeriodeImportee[] } | { erreur: string }> {
  let reponse: Response
  try {
    reponse = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      headers: { Accept: "text/calendar, */*", "User-Agent": "ChezLAvocatier-Calendrier/1.0" },
      signal: AbortSignal.timeout(delaiMs),
    })
  } catch {
    return { erreur: "La plateforme ne répond pas : nouvel essai à la prochaine synchronisation." }
  }
  if (!reponse.ok) return { erreur: `La plateforme refuse le lien (erreur ${reponse.status}) : vérifiez qu'il est toujours valable.` }
  const texte = await reponse.text()
  if (texte.length > TAILLE_MAX) return { erreur: "Le calendrier reçu est anormalement volumineux." }
  if (!texte.includes("BEGIN:VCALENDAR")) return { erreur: "Ce lien ne renvoie pas un calendrier iCal : copiez le lien d'exportation donné par la plateforme." }
  return { periodes: lireIcal(texte) }
}

export async function synchroniserCalendrier(calendrier: CalendrierExterne, delaiMs = DELAI_MS): Promise<BilanSynchronisation> {
  if (!calendrier.urlImport) return { calendrierId: calendrier.id, ajoutees: [], retirees: 0 }
  const lu = await telecharger(calendrier.urlImport, delaiMs)
  if ("erreur" in lu) {
    await gestion.noterErreurImport(calendrier.id, lu.erreur)
    return { calendrierId: calendrier.id, ajoutees: [], retirees: 0, erreur: lu.erreur }
  }
  return gestion.remplacerImport(calendrier.id, lu.periodes)
}

// Calendriers à importer : tous, ou ceux d'un hébergement ; `ageMinMs` : seulement ceux importés il y a plus
// longtemps (pas de téléchargement à chaque appel). Les calendriers passent en parallèle, sans qu'un échec
// n'arrête les autres
export async function synchroniserCalendriers({
  hebergementId,
  ageMinMs = 0,
  delaiMs = DELAI_MS,
}: { hebergementId?: string; ageMinMs?: number; delaiMs?: number } = {}): Promise<BilanSynchronisation[]> {
  const limite = Date.now() - ageMinMs
  const aImporter = (await gestion.listerCalendriers()).filter(
    (c) =>
      c.urlImport &&
      (!hebergementId || c.hebergementId === hebergementId) &&
      (!c.synchroniseLe || Date.parse(c.synchroniseLe) <= limite || c.erreur),
  )
  const bilans = await Promise.allSettled(aImporter.map((c) => synchroniserCalendrier(c, delaiMs)))
  return bilans.map((b, i) =>
    b.status === "fulfilled" ? b.value : { calendrierId: aImporter[i].id, ajoutees: [], retirees: 0, erreur: "Synchronisation interrompue." },
  )
}
