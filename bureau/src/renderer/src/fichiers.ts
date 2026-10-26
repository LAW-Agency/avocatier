import { useState } from "react"
import type { Paiement, Reservation } from "@partage/types"
import type { FeuilleClasseur, ResultatFichier } from "../../partage/ipc"
import { facture, numeroRecu, recu } from "./documents"
import { nomDe, useDonneesChargees } from "./donnees"
import { nomExport } from "./exports"
import { useAnnoncer } from "./toasts"

// Exports Excel, factures et reçus PDF : enregistrement par le processus principal (« Enregistrer sous »), puis
// une notification avec le chemin du fichier (ou l'erreur). Abandon de l'enregistrement : rien à dire.
export function useFichiers() {
  const { d, executer, clientDe, hebergementDe, chambreDe, paiementsDe } = useDonneesChargees()
  const { annoncer } = useAnnoncer()
  // Export en cours (fenêtre « Enregistrer sous » puis mise en forme du classeur) : Spinner sur le bouton
  const [exportEnCours, setExportEnCours] = useState(false)

  function annoncerResultat(resultat: ResultatFichier, reussi: string, echec: string) {
    if (!resultat) return
    if ("erreur" in resultat) annoncer({ titre: echec, texte: resultat.erreur, intent: "error", duree: 10_000 })
    else annoncer({ titre: reussi, texte: resultat.chemin, intent: "success", duree: 8000 })
  }

  async function exporter(quoi: string, feuille: FeuilleClasseur) {
    setExportEnCours(true)
    const resultat = await window.avocatier.enregistrerXlsx(nomExport(quoi, d.aujourdhui), { feuilles: [feuille] })
    setExportEnCours(false)
    annoncerResultat(resultat, "Export Excel enregistré", "Export non enregistré")
  }

  const contexte = (r: Reservation) => ({ facturation: d.facturation, client: clientDe(r), hebergement: hebergementDe(r), chambre: chambreDe(r)?.numero })

  // Numéro attribué par le serveur à la première édition (le même ensuite) ; renvoie l'erreur à afficher
  async function imprimerFacture(r: Reservation): Promise<string | null> {
    const resultat = await executer<{ numero: string; le: string }>("POST", `/api/hotes/reservations/${encodeURIComponent(r.id)}/facture`)
    if (!resultat.ok) return resultat.erreur
    const { numero, le } = resultat.donnees
    const html = facture(r, paiementsDe(r), numero, le, contexte(r))
    annoncerResultat(await window.avocatier.enregistrerPdf(`Facture ${numero} ${nomDe(clientDe(r))}.pdf`, html), `Facture ${numero} enregistrée`, "Facture non enregistrée")
    return null
  }

  async function imprimerRecu(p: Paiement) {
    const r = d.reservations.find((x) => x.id === p.reservationId)
    if (!r) return
    // L'équipe n'est envoyée qu'aux gérants : à la réception, seul son propre nom est connu
    const membre = d.equipe.find((m) => m.id === p.enregistrePar) ?? (p.enregistrePar === d.hote.id ? d.hote : undefined)
    const html = recu(p, r, paiementsDe(r), membre && nomDe(membre), contexte(r))
    annoncerResultat(await window.avocatier.enregistrerPdf(`Reçu ${numeroRecu(p)} ${nomDe(clientDe(r))}.pdf`, html), `Reçu ${numeroRecu(p)} enregistré`, "Reçu non enregistré")
  }

  return { exporter, exportEnCours, imprimerFacture, imprimerRecu }
}
