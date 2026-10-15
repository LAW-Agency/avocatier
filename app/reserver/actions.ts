"use server"

import { revalidatePath } from "next/cache"
import { clientConnecte } from "@/lib/auth/dal"
import { moteur } from "@/lib/reservation"

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

  // Les dates prises disparaissent du calendrier, la demande apparaît dans « Mon compte »
  revalidatePath("/reserver")
  revalidatePath("/compte")
  return { reference: resultat.reservation.reference }
}
