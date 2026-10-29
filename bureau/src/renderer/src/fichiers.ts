import { useState } from "react"
import type { CodeDevise, Facture, Paiement, Reservation, SessionCaisse, Ticket } from "@partage/types"
import type { FeuilleClasseur, ResultatFichier } from "../../partage/ipc"
import { convertir } from "@partage/folio"
import { facture, factureFigee, numeroRecu, rapportCloture, recu, ticketCaisse } from "./documents"
import { nomDe, restaurantSur, useDonneesChargees } from "./donnees"
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

  const contexte = (r: Reservation) => ({
    facturation: d.facturation,
    client: clientDe(r),
    hebergement: hebergementDe(r),
    chambre: chambreDe(r)?.numero,
    restaurantEuros: convertir(restaurantSur(r, d), "MGA", "EUR", d.devises.taux),
  })

  // Facture du séjour (et des autres chambres de son groupe) dans la devise choisie : figée par le serveur à la
  // première édition, la même ensuite. Séjour facturé avant la caisse du restaurant : son ancienne facture.
  // Renvoie l'erreur à afficher
  async function imprimerFacture(r: Reservation, devise: CodeDevise = "EUR"): Promise<string | null> {
    const resultat = await executer<{ facture?: Facture; ancienne?: { numero: string; le: string } }>(
      "POST",
      `/api/hotes/reservations/${encodeURIComponent(r.id)}/facture`,
      { devise },
    )
    if (!resultat.ok) return resultat.erreur
    const { facture: figee, ancienne } = resultat.donnees
    const numero = figee?.numero ?? ancienne!.numero
    const html = figee ? factureFigee(figee) : facture(r, paiementsDe(r), ancienne!.numero, ancienne!.le, contexte(r))
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

  // Ticket de caisse (80 mm) sur l'imprimante choisie dans Paramètres, ou par la boîte d'impression de Windows
  async function imprimerTicket(t: Ticket, chambre?: string) {
    const membre = d.equipe.find((m) => m.id === t.caissierId) ?? (t.caissierId === d.hote.id ? d.hote : undefined)
    const { html, hauteurMm } = ticketCaisse(t, { facturation: d.facturation, caissier: membre?.prenom, chambre })
    const resultat = await window.avocatier.imprimerTicket(html, hauteurMm)
    if (!resultat.ok && !resultat.annule) annoncer({ titre: `Ticket ${t.numero} non imprimé`, texte: resultat.erreur, intent: "error", duree: 10_000 })
  }

  // Rapport de clôture (ou situation d'une caisse encore ouverte), sur l'imprimante des tickets
  async function imprimerCloture(session: SessionCaisse, poste: string) {
    const nom = (id?: string) => d.equipe.find((m) => m.id === id)?.prenom ?? (id === d.hote.id ? d.hote.prenom : undefined)
    const { html, hauteurMm } = rapportCloture(session, { facturation: d.facturation, poste, ouvertePar: nom(session.ouvertePar), fermeePar: nom(session.fermeePar) })
    const resultat = await window.avocatier.imprimerTicket(html, hauteurMm)
    if (!resultat.ok && !resultat.annule) annoncer({ titre: "Rapport de caisse non imprimé", texte: resultat.erreur, intent: "error", duree: 10_000 })
  }

  return { exporter, exportEnCours, imprimerFacture, imprimerRecu, imprimerTicket, imprimerCloture }
}
