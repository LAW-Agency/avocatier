"use server"

import { revalidatePath } from "next/cache"
import { exigerHote } from "@/lib/auth/dal"
import { moteur } from "@/lib/reservation"
import type { StatutReservation } from "@/lib/reservation/types"

// Toutes les actions des hôtes revérifient le rôle : une Server Action est appelable directement

export type EtatAction = { erreur?: string; ok?: boolean }

const STATUTS_HOTE: StatutReservation[] = ["confirmee", "refusee", "annulee"]
const NOTES: Partial<Record<StatutReservation, string>> = {
  confirmee: "Confirmée par les hôtes",
  refusee: "Déclinée par les hôtes",
  annulee: "Annulée par les hôtes",
}

// Les disponibilités changent : calendrier de réservation, compte client et espace hôtes à rafraîchir
function rafraichir() {
  revalidatePath("/", "layout")
}

export async function changerStatutReservation(_etat: EtatAction, formData: FormData): Promise<EtatAction> {
  await exigerHote()
  const statut = String(formData.get("statut") ?? "") as StatutReservation
  if (!STATUTS_HOTE.includes(statut)) return { erreur: "Action inconnue." }

  const resultat = await moteur.changerStatut(String(formData.get("reservationId") ?? ""), statut, NOTES[statut])
  if (!resultat.ok) return { erreur: resultat.erreur }
  rafraichir()
  return { ok: true }
}

export async function ajouterBlocage(_etat: EtatAction, formData: FormData): Promise<EtatAction> {
  await exigerHote()
  const texte = (nom: string) => String(formData.get(nom) ?? "").trim()
  const resultat = await moteur.ajouterBlocage({
    hebergementId: texte("hebergementId"),
    debut: texte("debut"),
    fin: texte("fin"),
    raison: texte("raison").slice(0, 120),
  })
  if (!resultat.ok) return { erreur: resultat.erreur }
  rafraichir()
  return { ok: true }
}

export async function supprimerBlocage(formData: FormData) {
  await exigerHote()
  await moteur.supprimerBlocage(String(formData.get("blocageId") ?? ""))
  rafraichir()
}
