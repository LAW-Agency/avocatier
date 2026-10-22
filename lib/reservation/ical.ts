import { ajouterJours, estDateISO } from "./dates"
import type { DateISO, PeriodeImportee } from "./types"

// Calendriers iCal (RFC 5545) échangés avec Booking.com, Airbnb et les autres plateformes : lecture de leurs
// dates occupées, écriture des nôtres. Seules les dates comptent : rien d'autre n'est lu ni écrit (aucune
// donnée client ne sort dans un calendrier exporté).

const FUSEAU = "Indian/Antananarivo"

// « 20261105 » ou « 20261105T140000 » (heure locale) ; « …Z » : instant UTC ramené au jour de Sainte-Marie
function dateIcal(valeur: string): DateISO | null {
  const texte = valeur.trim()
  if (/^\d{8}T\d{6}Z$/.test(texte)) {
    const instant = new Date(
      `${texte.slice(0, 4)}-${texte.slice(4, 6)}-${texte.slice(6, 8)}T${texte.slice(9, 11)}:${texte.slice(11, 13)}:${texte.slice(13, 15)}Z`,
    )
    return Number.isNaN(instant.getTime()) ? null : new Intl.DateTimeFormat("en-CA", { timeZone: FUSEAU }).format(instant)
  }
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(texte)
  const iso = m ? `${m[1]}-${m[2]}-${m[3]}` : ""
  return estDateISO(iso) ? iso : null
}

const desechapper = (texte: string) => texte.replace(/\\([\\;,nN])/g, (_t, c: string) => (c === "n" || c === "N" ? " " : c)).trim()

// Événements du calendrier, en périodes [début, fin[ ; les événements annulés ou sans date sont ignorés
export function lireIcal(texte: string): PeriodeImportee[] {
  // Lignes repliées : une ligne qui commence par une espace ou une tabulation continue la précédente
  const lignes = texte.replace(/\r?\n[ \t]/g, "").split(/\r?\n/)
  const periodes: PeriodeImportee[] = []
  let proprietes: Record<string, string> | null = null

  for (const ligne of lignes) {
    if (ligne.trim() === "BEGIN:VEVENT") {
      proprietes = {}
      continue
    }
    if (ligne.trim() === "END:VEVENT") {
      const periode = proprietes && versPeriode(proprietes)
      if (periode) periodes.push(periode)
      proprietes = null
      continue
    }
    if (!proprietes) continue
    const deuxPoints = ligne.indexOf(":")
    if (deuxPoints <= 0) continue
    // « DTSTART;VALUE=DATE:20261105 » : les paramètres après le nom sont ignorés
    const nom = ligne.slice(0, deuxPoints).split(";")[0].toUpperCase()
    proprietes[nom] = ligne.slice(deuxPoints + 1)
  }
  return periodes
}

function versPeriode(p: Record<string, string>): PeriodeImportee | null {
  if ((p.STATUS ?? "").trim().toUpperCase() === "CANCELLED") return null
  const debut = p.DTSTART ? dateIcal(p.DTSTART) : null
  if (!debut) return null
  const finLue = p.DTEND ? dateIcal(p.DTEND) : null
  // Sans fin (ou fin le même jour) : une nuit
  const fin = finLue && finLue > debut ? finLue : ajouterJours(debut, 1)
  const raison = desechapper(p.SUMMARY ?? "").slice(0, 120)
  const uid = (p.UID ?? "").trim().slice(0, 300) || `${debut}/${fin}/${raison}`
  return { uid, debut, fin, raison }
}

// --- Écriture ---

export type EvenementExporte = { uid: string; debut: DateISO; fin: DateISO; titre: string }

const echapperTexte = (texte: string) => texte.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, "\\n")
const dateCompacte = (iso: DateISO) => iso.replaceAll("-", "")

// Lignes de 75 caractères au plus, la suite commençant par une espace (repliage de la norme)
function replier(ligne: string): string {
  const morceaux: string[] = []
  for (let i = 0; i < ligne.length; i += 73) morceaux.push(ligne.slice(i, i + 73))
  return morceaux.join("\r\n ")
}

export function ecrireIcal(nom: string, evenements: EvenementExporte[], maintenant = new Date()): string {
  const horodatage = maintenant.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  const lignes = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Chez L'Avocatier//Calendrier des disponibilites//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${echapperTexte(nom)}`,
    ...evenements.flatMap((e) => [
      "BEGIN:VEVENT",
      `UID:${echapperTexte(e.uid)}`,
      `DTSTAMP:${horodatage}`,
      `DTSTART;VALUE=DATE:${dateCompacte(e.debut)}`,
      `DTEND;VALUE=DATE:${dateCompacte(e.fin)}`,
      `SUMMARY:${echapperTexte(e.titre)}`,
      "TRANSP:OPAQUE",
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ]
  return lignes.map(replier).join("\r\n") + "\r\n"
}
