import { useCallback, useEffect, useState } from "react"
import type { CodeDevise, DateISO, DonneesCaisse, LigneTicket, ModePaiement, ReglagesDevises, ReglementTicket, SessionCaisse, Ticket } from "@partage/types"
import type { PosteLocal, ResultatApi } from "../../partage/ipc"
import { MESSAGE_LECTURE_SEULE, useDonnees, useLectureSeule } from "./donnees"

// Caisse Restaurant et Bar, côté interface : données de l'écran (API /api/hotes/caisse), poste de cet ordinateur
// et conversions des règlements. Montants de la caisse en ariary (entiers).

export type DonneesEcranCaisse = DonneesCaisse & { aujourdhui: DateISO }

// Modes proposés au comptoir (les virements se règlent à la réception)
export const MODES_CAISSE: ModePaiement[] = ["especes", "carte", "mobile_money"]

// Ariary pour une unité de la devise (1 € = taux.MGA Ar ; 1 $US = taux.MGA / taux.USD Ar)
export function ariaryPourUn(devise: CodeDevise, taux: ReglagesDevises["taux"]): number {
  if (devise === "MGA") return 1
  return taux.MGA / (devise === "EUR" ? 1 : taux[devise])
}

// Montant à payer dans la devise : arrondi au centime supérieur (le client ne paie jamais moins que le ticket)
export function aPayerEn(totalAr: number, devise: CodeDevise, taux: ReglagesDevises["taux"]): number {
  if (devise === "MGA") return totalAr
  return Math.ceil((totalAr / ariaryPourUn(devise, taux)) * 100 - 1e-9) / 100
}

// Règlement d'un ticket : montant reçu dans sa devise, contre-valeur en ariary, monnaie rendue en ariary (espèces
// seulement ; carte et mobile money débitent le montant exact). Erreur à afficher si le montant ne couvre pas
export function calculerReglement(
  totalAr: number,
  mode: ModePaiement,
  devise: CodeDevise,
  recu: number,
  taux: ReglagesDevises["taux"],
): { reglement: ReglementTicket } | { erreur: string } {
  const du = aPayerEn(totalAr, devise, taux)
  if (mode !== "especes") return { reglement: { mode, devise, montant: du, contreValeur: totalAr, rendu: 0 } }
  if (!Number.isFinite(recu) || recu <= 0) return { erreur: "Saisissez le montant reçu." }
  const montant = devise === "MGA" ? Math.round(recu) : Math.round(recu * 100) / 100
  if (montant < du) return { erreur: "Le montant reçu ne couvre pas le ticket." }
  // Montant exact dans une autre devise : la conversion ne doit pas laisser 1 Ar d'écart
  const contreValeur = Math.max(Math.round(montant * ariaryPourUn(devise, taux)), totalAr)
  return { reglement: { mode, devise, montant, contreValeur, rendu: contreValeur - totalAr } }
}

// Billets usuels proposés en un clic (ariary) : montant exact puis arrondis supérieurs
export function montantsSuggeres(totalAr: number): number[] {
  const arrondis = [5_000, 10_000, 20_000, 50_000].map((pas) => Math.ceil(totalAr / pas) * pas)
  return [...new Set([totalAr, ...arrondis])].filter((m) => m > 0).slice(0, 4)
}

export const totalLignes = (lignes: Pick<LigneTicket, "prixUnitaire" | "quantite">[]) => lignes.reduce((t, l) => t + l.prixUnitaire * l.quantite, 0)

// « 2 × THB grande, Poisson coco »
export const resumeTicket = (t: Pick<Ticket, "lignes">) => t.lignes.map((l) => (l.quantite > 1 ? `${l.quantite} × ${l.libelle}` : l.libelle)).join(", ")

export type Vente = { libelle: string; lignes: LigneTicket[] } & ({ reservationId: string } | { reglement: ReglementTicket })

// Données de l'écran pour un jour (tickets de ce jour ; carte et séjours en cours toujours à jour), poste de cet
// ordinateur, et écritures (hors connexion : refusées, comme le reste du logiciel)
export function useCaisse(jour: DateISO | null) {
  const { enLigne } = useDonnees()
  const lectureSeule = useLectureSeule()
  const [donnees, setDonnees] = useState<DonneesEcranCaisse | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [poste, setPoste] = useState<PosteLocal | null>(null)
  // Jour des tickets reçus (null : aujourd'hui) : différent de jour pendant le chargement d'un autre jour
  const [jourCharge, setJourCharge] = useState<DateISO | null | undefined>(undefined)

  const charger = useCallback(async () => {
    const [resultat, local] = await Promise.all([
      window.avocatier.api<DonneesEcranCaisse>("GET", `/api/hotes/caisse${jour ? `?du=${jour}&au=${jour}` : ""}`),
      window.avocatier.posteCaisse(),
    ])
    if (!resultat.ok) {
      setErreur(resultat.erreur)
      setPoste(local)
      return
    }
    setDonnees(resultat.donnees)
    setJourCharge(jour)
    setErreur(null)
    // Préfixe et plus haut numéro reçus par le serveur : la numérotation du poste reste devant
    const connu = resultat.donnees.postes.find((p) => p.id === local.posteId)
    setPoste(connu ? await window.avocatier.noterPosteCaisse(connu.prefixe, connu.dernierTicket) : local)
  }, [jour])

  // Premier chargement, changement de jour, et connexion perdue ou retrouvée
  useEffect(() => {
    void charger()
  }, [charger, enLigne])

  const ecrire = useCallback(
    async <T,>(methode: "POST" | "PATCH" | "DELETE", chemin: string, corps?: unknown): Promise<ResultatApi<T>> => {
      if (lectureSeule) return { ok: false, erreur: MESSAGE_LECTURE_SEULE }
      const resultat = await window.avocatier.api<T>(methode, chemin, corps)
      if (resultat.ok) await charger()
      return resultat
    },
    [lectureSeule, charger],
  )

  const enregistrerPoste = useCallback(
    async (nom: string): Promise<string | null> => {
      const local = poste ?? (await window.avocatier.posteCaisse())
      const resultat = await ecrire<{ poste: { prefixe: string; dernierTicket: number } }>("POST", "/api/hotes/caisse/postes", { id: local.posteId, nom })
      if (!resultat.ok) return resultat.erreur
      setPoste(await window.avocatier.noterPosteCaisse(resultat.donnees.poste.prefixe, resultat.donnees.poste.dernierTicket))
      return null
    },
    [poste, ecrire],
  )

  // Session ouverte de ce poste : on ne vend qu'avec la caisse ouverte (fond de caisse compté)
  const session = donnees?.sessions.find((s) => s.posteId === poste?.posteId && !s.fermeeLe) ?? null

  const ouvrir = useCallback(
    async (fondCaisse: number): Promise<string | null> => {
      if (!poste) return "Ce poste n'est pas encore enregistré."
      const resultat = await ecrire<{ session: SessionCaisse }>("POST", "/api/hotes/caisse/sessions", {
        id: crypto.randomUUID(),
        posteId: poste.posteId,
        ouverteLe: new Date().toISOString(),
        fondCaisse,
      })
      return resultat.ok ? null : resultat.erreur
    },
    [poste, ecrire],
  )

  const cloturer = useCallback(
    async (id: string, especesComptees: Partial<Record<CodeDevise, number>>, commentaire: string): Promise<ResultatApi<{ session: SessionCaisse }>> =>
      ecrire<{ session: SessionCaisse }>("PATCH", `/api/hotes/caisse/sessions/${encodeURIComponent(id)}`, { fermeeLe: new Date().toISOString(), especesComptees, commentaire }),
    [ecrire],
  )

  // Numéro attribué par le poste, identifiant unique : un renvoi après une coupure ne fait pas de doublon
  const vendre = useCallback(
    async (vente: Vente): Promise<ResultatApi<{ ticket: Ticket }>> => {
      if (lectureSeule) return { ok: false, erreur: MESSAGE_LECTURE_SEULE }
      if (!session) return { ok: false, erreur: "Ouvrez la caisse de ce poste avant de vendre." }
      const local = poste ?? (await window.avocatier.posteCaisse())
      const numero = await window.avocatier.numeroterTicket()
      if (!numero) return { ok: false, erreur: "Ce poste n'est pas encore enregistré." }
      return ecrire<{ ticket: Ticket }>("POST", "/api/hotes/caisse/tickets", {
        id: crypto.randomUUID(),
        numero,
        posteId: local.posteId,
        sessionId: session.id,
        le: new Date().toISOString(),
        libelle: vente.libelle,
        lignes: vente.lignes,
        ...("reservationId" in vente ? { reservationId: vente.reservationId, reglements: [] } : { reglements: [vente.reglement] }),
      })
    },
    [lectureSeule, poste, session, ecrire],
  )

  return { donnees, erreur, poste, session, jourEnCours: jourCharge !== jour, charger, ecrire, enregistrerPoste, ouvrir, cloturer, vendre, lectureSeule }
}

export type Caisse = ReturnType<typeof useCaisse>
