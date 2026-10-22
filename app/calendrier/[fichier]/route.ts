import { gestion } from "@/lib/reservation"
import { ecrireIcal } from "@/lib/reservation/ical"

// Calendrier exporté vers une plateforme : /calendrier/<jeton>.ics (lien affiché dans le Planning du logiciel,
// à coller dans Booking.com, Airbnb…). Seulement des dates « Indisponible », jamais de nom ni de détail.
export async function GET(_requete: Request, contexte: RouteContext<"/calendrier/[fichier]">) {
  const { fichier } = await contexte.params
  const jeton = fichier.replace(/\.ics$/, "")
  const calendrier = /^[\w-]{10,64}$/.test(jeton) ? await gestion.exporterCalendrier(jeton) : null
  if (!calendrier) return new Response("Calendrier introuvable.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } })
  return new Response(ecrireIcal(calendrier.nom, calendrier.evenements), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="disponibilites.ics"',
      "Cache-Control": "no-store",
      // Lien secret : jamais indexé
      "X-Robots-Tag": "noindex",
    },
  })
}
