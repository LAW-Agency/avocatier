import { journaliser, json, lireCorps, nomChambre, pourLesHotes, rafraichirSite } from "@/lib/api/hotes"
import { gestion, moteur } from "@/lib/reservation"
import { synchroniserCalendrier, synchroniserCalendriers } from "@/lib/reservation/calendriers"
import { STATUTS_ACTIFS } from "@/lib/reservation/controles"
import { chevauche, formaterPlage } from "@/lib/reservation/dates"

// Le logiciel la demande toutes les 10 minutes (calendriers importés depuis plus longtemps seulement), et à la
// demande d'un membre de l'équipe : { id } pour un calendrier, tout de suite (seule cette demande est notée au
// journal). Renvoie ce qu'il faut annoncer : nouvelles dates bloquées par une plateforme et, surtout, celles qui
// tombent sur une de nos réservations
const AGE_MIN_MS = 10 * 60_000

type AnnonceCalendrier = { titre: string; detail: string; conflit: boolean }

export const POST = pourLesHotes(async (requete, membre) => {
  const id = String((await lireCorps(requete))?.id ?? "")
  let bilans
  if (id) {
    const calendrier = (await gestion.listerCalendriers()).find((c) => c.id === id)
    if (!calendrier) return json({ erreur: "Ce calendrier a été retiré." }, 404)
    bilans = [await synchroniserCalendrier(calendrier)]
    const [bilan] = bilans
    journaliser(membre, "planning", "Calendrier synchronisé", async () =>
      [`${calendrier.nom} · ${await nomChambre(calendrier.chambreId)}`, bilan.erreur ?? `${bilan.ajoutees.length} ajout(s), ${bilan.retirees} retrait(s)`].join(" · "),
    )
  } else {
    bilans = await synchroniserCalendriers({ ageMinMs: AGE_MIN_MS })
  }

  const changements = bilans.reduce((total, b) => total + b.ajoutees.length + b.retirees, 0)
  const annonces: AnnonceCalendrier[] = []
  if (bilans.some((b) => b.ajoutees.length > 0)) {
    const [calendriers, reservations] = await Promise.all([gestion.listerCalendriers(), moteur.toutesLesReservations()])
    for (const b of bilans) {
      const calendrier = calendriers.find((c) => c.id === b.calendrierId)
      if (!calendrier) continue
      const hebergement = await nomChambre(calendrier.chambreId)
      for (const p of b.ajoutees) {
        // Réservation d'une autre provenance sur les mêmes nuits de cette chambre : double réservation à régler
        const conflit = reservations.find(
          (r) =>
            r.chambreId === calendrier.chambreId &&
            STATUTS_ACTIFS.includes(r.statut) &&
            r.source !== calendrier.plateforme &&
            chevauche(r.arrivee, r.depart, p.debut, p.fin),
        )
        annonces.push(
          conflit
            ? {
                titre: `Double réservation : ${hebergement}`,
                detail: `${calendrier.nom} bloque ${formaterPlage(p.debut, p.fin)}, déjà pris par ${conflit.reference}.`,
                conflit: true,
              }
            : { titre: `Dates bloquées par ${calendrier.nom}`, detail: `${hebergement}, ${formaterPlage(p.debut, p.fin)}`, conflit: false },
        )
      }
    }
  }
  if (changements > 0) rafraichirSite()
  return json({ bilans, changements, annonces })
})
