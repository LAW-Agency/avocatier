"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { after } from "next/server"
import { cheminInterne, clientConnecte } from "@/lib/auth/dal"
import { hacherMotDePasse, verifierMotDePasse } from "@/lib/auth/motDePasse"
import { DUREE_LIEN_MS, empreinteJeton, nouveauJeton } from "@/lib/auth/recuperation"
import { fermerSession, ouvrirSession } from "@/lib/auth/session"
import { urlDuSite } from "@/lib/email/modeles"
import { envoyerLienDeReinitialisation, notifierAnnulationParLeClient, notifierMotDePasseModifie } from "@/lib/email/notifications"
import { comptes, moteur } from "@/lib/reservation"
import type { RoleCompte } from "@/lib/reservation/types"

export type EtatFormulaire = {
  erreur?: string
  valeurs?: Record<string, string> // pour réafficher la saisie après une erreur
  lienExpire?: boolean // lien de récupération déjà utilisé ou expiré
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MOT_DE_PASSE_MIN = 8

const texte = (formData: FormData, nom: string) => String(formData.get(nom) ?? "").trim()

// Avec un champ « suite » (page de connexion), on y redirige ; sans (parcours de réservation),
// la page courante se met à jour d'elle-même puisque le cookie de session a changé.
// Un compte hôte part vers son espace, sauf s'il venait déjà d'une page /admin.
function poursuivre(formData: FormData, role: RoleCompte = "client"): EtatFormulaire {
  const suite = formData.get("suite")
  if (suite) {
    const chemin = cheminInterne(suite)
    redirect(role === "hote" && !chemin.startsWith("/admin") ? "/admin" : chemin)
  }
  return {}
}

export async function connexion(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const email = texte(formData, "email").toLowerCase()
  const motDePasse = String(formData.get("motDePasse") ?? "")

  const client = email ? await comptes.trouverParEmail(email) : null
  if (!client || !verifierMotDePasse(motDePasse, client.motDePasseHash)) {
    return { erreur: "E-mail ou mot de passe incorrect.", valeurs: { email } }
  }

  await ouvrirSession(client.id)
  return poursuivre(formData, client.role)
}

export async function inscription(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const valeurs = {
    prenom: texte(formData, "prenom"),
    nom: texte(formData, "nom"),
    email: texte(formData, "email").toLowerCase(),
    telephone: texte(formData, "telephone"),
    pays: texte(formData, "pays"),
  }
  const motDePasse = String(formData.get("motDePasse") ?? "")

  if (!valeurs.prenom || !valeurs.nom) return { erreur: "Indiquez votre prénom et votre nom.", valeurs }
  if (!EMAIL.test(valeurs.email)) return { erreur: "Cette adresse e-mail n'est pas valide.", valeurs }
  if (!valeurs.telephone) return { erreur: "Indiquez un numéro de téléphone ou WhatsApp.", valeurs }
  if (motDePasse.length < MOT_DE_PASSE_MIN) {
    return { erreur: `Le mot de passe doit contenir au moins ${MOT_DE_PASSE_MIN} caractères.`, valeurs }
  }
  if (await comptes.trouverParEmail(valeurs.email)) {
    return { erreur: "Un compte existe déjà avec cette adresse : connectez-vous.", valeurs }
  }

  const client = await comptes.creer({ ...valeurs, motDePasseHash: hacherMotDePasse(motDePasse) })
  await ouvrirSession(client.id)
  return poursuivre(formData)
}

export async function deconnexion(formData: FormData) {
  await fermerSession()
  redirect(cheminInterne(formData.get("suite"), "/"))
}

export async function annulerReservation(formData: FormData) {
  const client = await clientConnecte()
  if (!client) redirect("/compte/connexion")

  const reservationId = String(formData.get("reservationId") ?? "")
  // Les hôtes sont prévenus que les dates se libèrent
  if (await moteur.annulerDemande(client.id, reservationId)) after(() => notifierAnnulationParLeClient(reservationId))
  revalidatePath("/compte")
}

// --- Récupération de compte ---

export type EtatRecuperation = {
  erreur?: string
  envoye?: string // adresse saisie, reprise dans le message de confirmation
}

// Même réponse que l'adresse ait un compte ou non : le formulaire ne doit pas révéler qui est inscrit.
// La recherche du compte et l'envoi ont lieu après la réponse, ce qui égalise aussi son délai.
export async function demanderReinitialisation(_etat: EtatRecuperation, formData: FormData): Promise<EtatRecuperation> {
  const email = texte(formData, "email").toLowerCase()
  if (!EMAIL.test(email)) return { erreur: "Cette adresse e-mail n'est pas valide." }
  const suite = cheminInterne(formData.get("suite"), "")

  after(async () => {
    try {
      const client = await comptes.trouverParEmail(email)
      if (!client) return
      const { jeton, empreinte } = nouveauJeton()
      if (!(await comptes.creerJetonReinitialisation(client.id, empreinte, new Date(Date.now() + DUREE_LIEN_MS)))) return
      const parametres = new URLSearchParams({ jeton, ...(suite && { suite }) })
      await envoyerLienDeReinitialisation(client, urlDuSite(`/compte/nouveau-mot-de-passe?${parametres}`))
    } catch (erreur) {
      console.error("[compte] lien de récupération :", erreur)
    }
  })
  return { envoye: email }
}

export async function choisirNouveauMotDePasse(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const motDePasse = String(formData.get("motDePasse") ?? "")
  if (motDePasse.length < MOT_DE_PASSE_MIN) {
    return { erreur: `Le mot de passe doit contenir au moins ${MOT_DE_PASSE_MIN} caractères.` }
  }
  if (motDePasse !== String(formData.get("confirmation") ?? "")) return { erreur: "Les deux mots de passe ne correspondent pas." }

  const le = new Date()
  const jeton = String(formData.get("jeton") ?? "")
  const client = await comptes.reinitialiserMotDePasse(empreinteJeton(jeton), hacherMotDePasse(motDePasse), le)
  if (!client) return { erreur: "Ce lien n'est plus valable : il a déjà servi ou a expiré.", lienExpire: true }

  // Connecté d'office : cette session est postérieure au changement, les plus anciennes sont refusées
  await ouvrirSession(client.id)
  after(() => notifierMotDePasseModifie(client, le))
  redirect(cheminInterne(formData.get("suite"), client.role === "hote" ? "/admin" : "/compte"))
}
