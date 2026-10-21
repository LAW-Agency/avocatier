import { json, lireCorps, nomDuMembre, pourLesHotes, rafraichirSite } from "@/lib/api/hotes"
import { gestion } from "@/lib/reservation"
import type { ReservationDirecte } from "@/lib/reservation/types"

// Réservation saisie dans le logiciel (téléphone, WhatsApp, Booking.com, client au comptoir) : confirmée
// d'office, revérifiée par le moteur (disponibilité, capacité, dates). Aucun e-mail : le client est en ligne
// ou devant la réception.
export const POST = pourLesHotes(async (requete, membre) => {
  const c = await lireCorps(requete)
  const texte = (nom: string) => String(c?.[nom] ?? "").trim()
  const montant = c?.montantTotal
  const reservation: ReservationDirecte = {
    clientId: texte("clientId"),
    hebergementId: texte("hebergementId"),
    arrivee: texte("arrivee"),
    depart: texte("depart"),
    adultes: Number(c?.adultes),
    enfants: Number(c?.enfants ?? 0),
    navette: c?.navette === true,
    source: texte("source") as ReservationDirecte["source"],
    montantTotal: montant === null || montant === undefined || montant === "" ? null : Number(montant),
    telephone: texte("telephone"),
    message: texte("message"),
  }
  const resultat = await gestion.creerReservationDirecte(reservation, nomDuMembre(membre))
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
  rafraichirSite()
  return json({ ok: true, reservation: resultat.reservation })
})
