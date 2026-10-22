"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { clientConnecte } from "@/lib/auth/dal"
import { notifierNouvelleDemande } from "@/lib/email/notifications"
import { moteur } from "@/lib/reservation"
import { synchroniserCalendriers } from "@/lib/reservation/calendriers"

export type EtatDemande = {
  erreur?: string
  reference?: string
}

const MESSAGE_MAX = 1000

// Finalisation : compte obligatoire, puis le moteur revérifie tout (dates, capacité, disponibilité, prix)
export async function envoyerDemande(_etat: EtatDemande, formData: FormData): Promise<EtatDemande> {
  const client = await clientConnecte()
  if (!client) return { erreur: "Connectez-vous ou créez votre compte pour finaliser la réservation." }

  const texte = (nom: string) => String(formData.get(nom) ?? "").trim()
  const telephone = texte("telephone")
  if (!telephone) return { erreur: "Indiquez un numéro de téléphone ou WhatsApp pour que les hôtes puissent vous joindre." }

  // Dates des plateformes (Booking.com, Airbnb…) rafraîchies juste avant de vérifier la disponibilité, si leur
  // dernière importation date de plus de 10 minutes ; une plateforme lente ne bloque pas la demande plus de 4 s
  const hebergementId = texte("hebergementId")
  if (hebergementId) await synchroniserCalendriers({ hebergementId, ageMinMs: 10 * 60_000, delaiMs: 4_000 }).catch(() => [])

  const resultat = await moteur.creerDemande(client.id, {
    hebergementId: texte("hebergementId"),
    arrivee: texte("arrivee"),
    depart: texte("depart"),
    adultes: Number(texte("adultes")),
    enfants: Number(texte("enfants")),
    navette: formData.get("navette") === "on",
    telephone,
    message: texte("message").slice(0, MESSAGE_MAX),
  })
  if (!resultat.ok) return { erreur: resultat.erreur }

  // Accusé de réception au client et alerte aux hôtes, après la réponse
  const reservationId = resultat.reservation.id
  after(() => notifierNouvelleDemande(reservationId))

  // Les dates prises disparaissent du calendrier, la demande apparaît dans « Mon compte »
  revalidatePath("/reserver")
  revalidatePath("/compte")
  return { reference: resultat.reservation.reference }
}
