"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { exigerHote } from "@/lib/auth/dal"
import { notifierDecisionDesHotes } from "@/lib/email/notifications"
import { moteur } from "@/lib/reservation"
import { CODES_DEVISES, estCodeDevise } from "@/lib/reservation/devises"
import { recupererTauxDuJour, type TauxDuJour } from "@/lib/reservation/tauxDeChange"
import type { CodeDevise, ModificationTarifs, StatutReservation } from "@/lib/reservation/types"

// Toutes les actions des hôtes revérifient le rôle : une Server Action est appelable directement

export type EtatAction = { erreur?: string; ok?: boolean }

const STATUTS_HOTE = ["confirmee", "refusee", "annulee"] as const
type StatutHote = (typeof STATUTS_HOTE)[number]
const estStatutHote = (valeur: string): valeur is StatutHote => (STATUTS_HOTE as readonly string[]).includes(valeur)
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
  const statut = String(formData.get("statut") ?? "")
  if (!estStatutHote(statut)) return { erreur: "Action inconnue." }

  const reservationId = String(formData.get("reservationId") ?? "")
  const resultat = await moteur.changerStatut(reservationId, statut, NOTES[statut])
  if (!resultat.ok) return { erreur: resultat.erreur }
  // Confirmation, refus ou annulation : le client est prévenu par e-mail, après la réponse
  after(() => notifierDecisionDesHotes(reservationId, statut))
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

// Saisie française acceptée : « 1,16 », espaces de milliers (« 5 150 », insécables compris : \s les couvre)
function lireNombre(valeur: FormDataEntryValue | null | undefined): number {
  const texte = String(valeur ?? "").replace(/\s/g, "").replace(",", ".")
  return texte === "" ? Number.NaN : Number(texte)
}

function nombre(formData: FormData, nom: string): number {
  return lireNombre(formData.get(nom))
}

// Champs : prix:<hebergementId> ; puis une fois par saison, dans l'ordre de la page : saison.nom,
// saison.debut et saison.fin (« MM-JJ », fin comprise), saison.majoration (en %), saison.sejourMin
export async function enregistrerTarifs(_etat: EtatAction, formData: FormData): Promise<EtatAction> {
  await exigerHote()
  const hebergements = await moteur.listerHebergements()
  const champ = (nom: string, i: number) => formData.getAll(nom)[i]
  const modification: ModificationTarifs = {
    prix: Object.fromEntries(hebergements.map((h) => [h.id, nombre(formData, `prix:${h.id}`)])),
    saisons: formData.getAll("saison.nom").map((nom, i) => ({
      nom: String(nom).trim(),
      debut: String(champ("saison.debut", i) ?? ""),
      fin: String(champ("saison.fin", i) ?? ""),
      // Arrondi au centième : « 20 % » donne 1,2 et non 1,2000000000000002
      coefficient: Math.round((1 + lireNombre(champ("saison.majoration", i)) / 100) * 100) / 100,
      sejourMin: lireNombre(champ("saison.sejourMin", i)),
    })),
  }

  const resultat = await moteur.modifierTarifs(modification)
  if (!resultat.ok) return { erreur: resultat.erreur }
  // Prix affichés partout : fiches, cartes, parcours de réservation
  rafraichir()
  return { ok: true }
}

// Champs : active:<code> (interrupteur), taux:<code>, parDefaut
export async function enregistrerDevises(_etat: EtatAction, formData: FormData): Promise<EtatAction> {
  await exigerHote()
  const parDefaut = String(formData.get("parDefaut") ?? "")
  if (!estCodeDevise(parDefaut)) return { erreur: "Choisissez la devise par défaut." }
  const taux = Object.fromEntries(CODES_DEVISES.map((code) => [code, nombre(formData, `taux:${code}`)])) as Record<CodeDevise, number>

  const resultat = await moteur.modifierDevises({
    parDefaut,
    actives: CODES_DEVISES.filter((code) => formData.get(`active:${code}`) === "on"),
    taux,
  })
  if (!resultat.ok) return { erreur: resultat.erreur }
  rafraichir()
  return { ok: true }
}

// Taux du jour pour pré-remplir le formulaire des devises : rien n'est enregistré, les hôtes vérifient puis enregistrent
export async function chargerTauxDuJour(): Promise<TauxDuJour> {
  await exigerHote()
  return recupererTauxDuJour()
}
