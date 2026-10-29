import { formaterDate, formaterPlage, formaterPrix, nombreNuits, pluriel } from "@partage/dates"
import { DEVISES, formaterDansDevise } from "@partage/devises"
import type { ClientPublic, CodeDevise, Facture, LigneFacture, Paiement, ReglagesFacturation, Reservation, SessionCaisse, Ticket } from "@partage/types"
import logo from "./assets/logo-couleur.svg?raw"
import { nomDe, type HebergementCourt } from "./donnees"
import { MODES_PAIEMENT } from "./libelles"

// Factures et reçus : pages HTML autonomes (styles et logo en ligne), mises en PDF A4 par le processus principal
// (fenêtre cachée, sans JavaScript). Tout texte variable passe par echapper(). Montants en euros, comme les tarifs.

const C = { forest: "#0d2b21", encre: "#1c2622", gris: "#5f6964", filet: "#e2e7df", fond: "#f5f7f3", vert: "#166120", bordeaux: "#841d01" }

const echapper = (texte: string) => texte.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
const lignes = (texte: string) => echapper(texte).replace(/\r?\n/g, "<br>")
const LOGO = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logo)}`

// « 21 octobre 2026 », à la date de Sainte-Marie
const dateLongue = (instant: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Indian/Antananarivo" }).format(new Date(instant))
const jourLong = (iso: string) => formaterDate(iso, { weekday: undefined, month: "long" })

export const numeroRecu = (p: Pick<Paiement, "numero">) => `RE-${String(p.numero).padStart(6, "0")}`

type Contexte = { facturation: ReglagesFacturation; client?: ClientPublic; hebergement?: HebergementCourt; chambre?: string; restaurantEuros?: number }

// Euros au centime près quand il y en a (encaissements reçus dans une autre devise)
const euros = (montant: number) => formaterDansDevise(montant, "EUR")

// « Bungalow Océan (Océan 3) »
const sejourDe = ({ hebergement, chambre }: Contexte) => `${hebergement?.nom ?? "Hébergement"}${chambre ? ` (${chambre})` : ""}`

function page(titre: string, corps: string): string {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>${echapper(titre)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; font-size: 10.5pt; line-height: 1.45; color: ${C.encre}; }
  .entete { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; padding-bottom: 18px; border-bottom: 2px solid ${C.forest}; }
  .logo { width: 190px; height: auto; display: block; margin-bottom: 10px; }
  .emetteur { color: ${C.gris}; font-size: 9.5pt; }
  .emetteur strong { color: ${C.encre}; font-size: 10.5pt; }
  .document { text-align: right; }
  .document h1 { margin: 0 0 6px; font-size: 22pt; font-weight: 600; letter-spacing: 0.04em; color: ${C.forest}; text-transform: uppercase; }
  .document p { margin: 0; color: ${C.gris}; }
  .document .numero { color: ${C.encre}; font-weight: 600; font-size: 11pt; }
  .destinataire { margin: 22px 0 24px; padding: 14px 16px; background: ${C.fond}; border-radius: 8px; width: 55%; }
  .etiquette { margin: 0 0 4px; font-size: 8pt; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: ${C.forest}; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 8pt; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: ${C.gris}; padding: 8px 6px; border-bottom: 1px solid ${C.encre}; }
  td { padding: 10px 6px; border-bottom: 1px solid ${C.filet}; vertical-align: top; }
  .droite { text-align: right; white-space: nowrap; }
  .detail { color: ${C.gris}; font-size: 9.5pt; }
  .totaux { margin: 14px 0 0 auto; width: 46%; }
  .totaux td { border: none; padding: 5px 6px; }
  .totaux .principal td { border-top: 1px solid ${C.encre}; font-size: 12pt; font-weight: 600; color: ${C.forest}; padding-top: 9px; }
  .acquittee { display: inline-block; margin-top: 14px; padding: 6px 14px; border: 2px solid ${C.vert}; border-radius: 6px; color: ${C.vert}; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; transform: rotate(-3deg); }
  h2 { margin: 28px 0 8px; font-size: 8pt; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: ${C.forest}; }
  .montant { font-size: 20pt; font-weight: 600; color: ${C.forest}; margin: 4px 0 0; }
  .grille { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 28px; margin-top: 8px; }
  .pied { margin-top: 36px; padding-top: 12px; border-top: 1px solid ${C.filet}; color: ${C.gris}; font-size: 8.5pt; }
  .signature { margin-top: 40px; width: 45%; margin-left: auto; padding-top: 8px; border-top: 1px solid ${C.gris}; color: ${C.gris}; font-size: 9pt; text-align: center; }
</style></head>
<body>${corps}</body></html>`
}

function entete(f: ReglagesFacturation, titre: string, infos: string[]): string {
  const contacts = [f.telephone, f.email].filter(Boolean).map(echapper).join(" · ")
  return `<div class="entete">
  <div class="emetteur">
    <img class="logo" src="${LOGO}" alt="${echapper(f.raisonSociale)}">
    <strong>${echapper(f.raisonSociale)}</strong><br>
    ${lignes(f.adresse)}
    ${contacts ? `<br>${contacts}` : ""}
    ${f.identifiants ? `<br>${lignes(f.identifiants)}` : ""}
  </div>
  <div class="document">
    <h1>${echapper(titre)}</h1>
    ${infos.map((i, n) => `<p${n === 0 ? ' class="numero"' : ""}>${echapper(i)}</p>`).join("")}
  </div>
</div>`
}

function destinataire(libelle: string, client?: ClientPublic): string {
  const coordonnees = client ? [client.email, client.telephone, client.pays].filter(Boolean).map(echapper).join("<br>") : ""
  return `<div class="destinataire"><p class="etiquette">${echapper(libelle)}</p><strong>${echapper(nomDe(client))}</strong>${coordonnees ? `<br>${coordonnees}` : ""}</div>`
}

const voyageurs = (r: Reservation) => [pluriel(r.adultes, "adulte"), r.enfants ? pluriel(r.enfants, "enfant") : ""].filter(Boolean).join(", ")

// Facture d'un séjour confirmé : le séjour, les encaissements déjà reçus et ce qui reste à payer
export function facture(r: Reservation, paiements: Paiement[], numero: string, le: string, contexte: Contexte): string {
  const { facturation, client } = contexte
  const nuits = nombreNuits(r.arrivee, r.depart)
  const regle = paiements.reduce((t, p) => t + p.montant, 0)
  const reste = r.montantTotal - regle
  const recus = [...paiements].sort((a, b) => a.le.localeCompare(b.le))
  const corps = `
${entete(facturation, "Facture", [`N° ${numero}`, `Date : ${dateLongue(le)}`, `Réservation ${r.reference}`])}
${destinataire("Facturé à", client)}
<table>
  <thead><tr><th>Désignation</th><th class="droite">Quantité</th><th class="droite">Montant</th></tr></thead>
  <tbody>
    <tr>
      <td>Séjour · ${echapper(sejourDe(contexte))}<br>
        <span class="detail">Du ${echapper(jourLong(r.arrivee))} au ${echapper(jourLong(r.depart))} · ${echapper(voyageurs(r))}${r.navette ? " · navette aéroport" : ""}</span></td>
      <td class="droite">${echapper(pluriel(nuits, "nuit"))}</td>
      <td class="droite">${echapper(formaterPrix(r.montantTotal))}</td>
    </tr>
  </tbody>
</table>
<table class="totaux">
  <tr class="principal"><td>Total</td><td class="droite">${echapper(formaterPrix(r.montantTotal))}</td></tr>
  ${regle ? `<tr><td>Déjà réglé</td><td class="droite">${echapper(formaterPrix(regle))}</td></tr>` : ""}
  ${regle ? `<tr><td><strong>${reste > 0 ? "Reste à payer" : reste < 0 ? "Trop-perçu" : "Solde"}</strong></td><td class="droite"><strong>${echapper(formaterPrix(Math.abs(reste)))}</strong></td></tr>` : ""}
</table>
${reste <= 0 && regle > 0 ? `<div style="text-align:right"><span class="acquittee">Acquittée</span></div>` : ""}
${
  recus.length
    ? `<h2>Règlements reçus</h2>
<table>
  <thead><tr><th>Date</th><th>Mode</th><th>Reçu</th><th class="droite">Montant</th></tr></thead>
  <tbody>${recus
    .map(
      (p) =>
        `<tr><td>${echapper(dateLongue(p.le))}</td><td>${echapper(MODES_PAIEMENT[p.mode])}${p.note ? `<br><span class="detail">${echapper(p.note)}</span>` : ""}</td><td>${echapper(numeroRecu(p))}</td><td class="droite">${echapper(formaterPrix(p.montant))}</td></tr>`,
    )
    .join("")}</tbody>
</table>`
    : ""
}
<div class="pied">Montants en euros.${facturation.mentions ? `<br>${lignes(facturation.mentions)}` : ""}</div>`
  return page(`Facture ${numero}`, corps)
}

// Reçu d'un encaissement (ou d'un remboursement, montant négatif), dans la devise reçue, avec où en est le paiement
// du séjour (restaurant et bar compris)
export function recu(p: Paiement, r: Reservation, paiements: Paiement[], auteur: string | undefined, contexte: Contexte): string {
  const { facturation, client, restaurantEuros = 0 } = contexte
  const remboursement = p.montant < 0
  // Situation au moment de ce reçu : encaissements enregistrés jusqu'à lui
  const regle = Math.round(paiements.filter((x) => x.le <= p.le).reduce((t, x) => t + x.montant, 0) * 100) / 100
  const du = r.montantTotal + restaurantEuros
  const reste = Math.round((du - regle) * 100) / 100
  const autreDevise = p.devise !== "EUR" && p.montantDevise !== undefined
  const corps = `
${entete(facturation, remboursement ? "Reçu de remboursement" : "Reçu", [`N° ${numeroRecu(p)}`, `Date : ${dateLongue(p.le)}`, `Réservation ${r.reference}`])}
${destinataire(remboursement ? "Remboursé à" : "Reçu de", client)}
<p class="etiquette">${remboursement ? "Montant remboursé" : "Montant reçu"}</p>
<p class="montant">${echapper(autreDevise ? formaterDansDevise(Math.abs(p.montantDevise!), p.devise) : euros(Math.abs(p.montant)))}</p>
${autreDevise ? `<p class="detail">soit ${echapper(euros(Math.abs(p.montant)))} au taux du jour</p>` : ""}
<div class="grille">
  <div><p class="etiquette">Mode de paiement</p>${echapper(MODES_PAIEMENT[p.mode])}${p.note ? `<br><span class="detail">${echapper(p.note)}</span>` : ""}</div>
  <div><p class="etiquette">Pour le séjour</p>${echapper(sejourDe(contexte))}<br><span class="detail">${echapper(formaterPlage(r.arrivee, r.depart))} · ${echapper(pluriel(nombreNuits(r.arrivee, r.depart), "nuit"))}</span></div>
</div>
<h2>Situation du séjour à cette date</h2>
<table class="totaux" style="margin-left:0;width:60%">
  <tr><td>Montant du séjour</td><td class="droite">${echapper(euros(r.montantTotal))}</td></tr>
  ${restaurantEuros ? `<tr><td>Restaurant et bar</td><td class="droite">${echapper(euros(restaurantEuros))}</td></tr>` : ""}
  <tr><td>Total réglé</td><td class="droite">${echapper(euros(regle))}</td></tr>
  <tr class="principal"><td>${reste > 0 ? "Reste à payer" : reste < 0 ? "Trop-perçu" : "Soldé"}</td><td class="droite">${echapper(euros(Math.abs(reste)))}</td></tr>
</table>
<div class="signature">Pour ${echapper(facturation.raisonSociale)}${auteur ? `, ${echapper(auteur)}` : ""}</div>
<div class="pied">Situation en euros.</div>`
  return page(`Reçu ${numeroRecu(p)}`, corps)
}

// Facture figée (séjours, restaurant et bar, règlements) dans la devise choisie par le client, telle qu'éditée
export function factureFigee(f: Facture): string {
  const c = f.contenu
  const m = (montant: number) => formaterDansDevise(montant, f.devise)
  const lignesTableau = (lignes: LigneFacture[]) =>
    lignes
      .map(
        (l) =>
          `<tr><td>${echapper(l.libelle)}${l.detail ? `<br><span class="detail">${echapper(l.detail)}</span>` : ""}</td><td class="droite">${echapper(l.quantite)}</td><td class="droite">${echapper(m(l.montant))}</td></tr>`,
      )
      .join("")
  const taux = (Object.entries(f.taux) as [CodeDevise, number][])
    .filter(([d]) => d !== "EUR" && (d !== "MGA" || c.consommations.length || f.devise === "MGA"))
    .map(([d, t]) => `1 € = ${formaterDansDevise(t, d)}`)
    .join(" · ")
  const client = { prenom: c.client.nom, nom: "", email: c.client.email, telephone: c.client.telephone, pays: c.client.pays } as ClientPublic
  const corps = `
${entete(c.facturation, "Facture", [`N° ${f.numero}`, `Date : ${dateLongue(f.le)}`, c.references.length > 1 ? `Réservations ${c.references.join(", ")}` : `Réservation ${c.references[0] ?? ""}`])}
${destinataire("Facturé à", client)}
<table>
  <thead><tr><th>Désignation</th><th class="droite">Quantité</th><th class="droite">Montant</th></tr></thead>
  <tbody>
    ${lignesTableau(c.sejours)}
    ${c.consommations.length ? `<tr><td colspan="3" style="padding-top:16px"><p class="etiquette">Restaurant et bar</p></td></tr>${lignesTableau(c.consommations)}` : ""}
  </tbody>
</table>
<table class="totaux">
  <tr class="principal"><td>Total</td><td class="droite">${echapper(m(c.total))}</td></tr>
  ${c.regle ? `<tr><td>Déjà réglé</td><td class="droite">${echapper(m(c.regle))}</td></tr>` : ""}
  ${c.regle ? `<tr><td><strong>${c.reste > 0 ? "Reste à payer" : c.reste < 0 ? "Trop-perçu" : "Solde"}</strong></td><td class="droite"><strong>${echapper(m(Math.abs(c.reste)))}</strong></td></tr>` : ""}
</table>
${c.reste <= 0 && c.regle > 0 ? `<div style="text-align:right"><span class="acquittee">Acquittée</span></div>` : ""}
${
  c.reglements.length
    ? `<h2>Règlements reçus</h2>
<table>
  <thead><tr><th>Date</th><th>Mode</th><th>Reçu</th><th class="droite">Montant</th></tr></thead>
  <tbody>${c.reglements
    .map(
      (r) =>
        `<tr><td>${echapper(dateLongue(r.le))}</td><td>${echapper(MODES_PAIEMENT[r.mode])}${r.devise !== f.devise ? `<br><span class="detail">${echapper(formaterDansDevise(r.montantDevise, r.devise))}</span>` : ""}${r.note ? `<br><span class="detail">${echapper(r.note)}</span>` : ""}</td><td>${echapper(numeroRecu({ numero: r.recu }))}</td><td class="droite">${echapper(m(r.montant))}</td></tr>`,
    )
    .join("")}</tbody>
</table>`
    : ""
}
<div class="pied">Montants en ${echapper(DEVISES[f.devise].nom.toLowerCase())}${taux ? `, au taux du ${echapper(dateLongue(f.le))} : ${echapper(taux)}` : ""}.${c.facturation.mentions ? `<br>${lignes(c.facturation.mentions)}` : ""}</div>`
  return page(`Facture ${f.numero}`, corps)
}

// --- Ticket de caisse Restaurant et Bar (rouleau de 80 mm) ---

type ContexteTicket = { facturation: ReglagesFacturation; caissier?: string; chambre?: string }

const ariary = (montant: number) => formaterDansDevise(montant, "MGA")

// Page de 80 mm de large (72 mm imprimables) et hauteur estimée d'après le nombre de lignes : l'imprimante coupe
// le papier sous le dernier texte
export function ticketCaisse(t: Ticket, contexte: ContexteTicket): { html: string; hauteurMm: number } {
  const { facturation, caissier, chambre } = contexte
  const rendu = t.reglements.reduce((s, r) => s + r.rendu, 0)
  const lignesTicket = t.lignes
    .map(
      (l) =>
        `<tr><td>${l.quantite} × ${echapper(l.libelle)}${l.quantite > 1 ? `<br><span class="detail">${echapper(ariary(l.prixUnitaire))} l'unité</span>` : ""}</td><td class="droite">${echapper(ariary(l.prixUnitaire * l.quantite))}</td></tr>`,
    )
    .join("")
  const reglements =
    t.statut === "chambre" || (t.statut === "annule" && t.reservationId)
      ? `<p class="centre gras">Sur la note de la chambre${chambre ? ` ${echapper(chambre)}` : ""}</p><p class="centre detail">À régler au départ</p>`
      : `<table>${t.reglements
          .map(
            (r) =>
              `<tr><td>${echapper(MODES_PAIEMENT[r.mode])}</td><td class="droite">${echapper(formaterDansDevise(r.montant, r.devise))}</td></tr>${r.devise !== "MGA" ? `<tr><td class="detail" colspan="2">soit ${echapper(ariary(r.contreValeur))}</td></tr>` : ""}`,
          )
          .join("")}${rendu ? `<tr><td>Monnaie rendue</td><td class="droite">${echapper(ariary(rendu))}</td></tr>` : ""}</table>`
  const contacts = [facturation.telephone, facturation.email].filter(Boolean).map(echapper).join("<br>")
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Ticket ${echapper(t.numero)}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 4mm 4mm 6mm; width: 80mm; font-family: "Segoe UI", Arial, sans-serif; font-size: 9pt; line-height: 1.35; color: #000; }
  .centre { text-align: center; }
  .gras { font-weight: 700; }
  .titre { font-size: 12pt; font-weight: 700; margin: 0; }
  p { margin: 0 0 1mm; }
  .detail { font-size: 8pt; }
  .filet { border-top: 1px dashed #000; margin: 2.5mm 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 0.6mm 0; vertical-align: top; }
  .droite { text-align: right; white-space: nowrap; padding-left: 2mm; }
  .total td { font-size: 12pt; font-weight: 700; padding-top: 1.5mm; }
  .annule { margin: 2mm 0; padding: 1.5mm; border: 2px solid #000; text-align: center; font-weight: 700; letter-spacing: 0.1em; }
</style></head>
<body>
<p class="titre centre">${echapper(facturation.raisonSociale)}</p>
<p class="centre detail">${lignes(facturation.adresse)}${contacts ? `<br>${contacts}` : ""}${facturation.identifiants ? `<br>${lignes(facturation.identifiants)}` : ""}</p>
<div class="filet"></div>
<p>Ticket <span class="gras">${echapper(t.numero)}</span><br>${echapper(formaterHeureLongue(t.le))}${t.libelle ? `<br>${echapper(t.libelle)}` : ""}${caissier ? `<br>Servi par ${echapper(caissier)}` : ""}</p>
${t.statut === "annule" ? `<div class="annule">TICKET ANNULÉ</div>` : ""}
<div class="filet"></div>
<table>${lignesTicket}</table>
<div class="filet"></div>
<table><tr class="total"><td>TOTAL</td><td class="droite">${echapper(ariary(t.total))}</td></tr></table>
<div class="filet"></div>
${reglements}
<div class="filet"></div>
<p class="centre">Misaotra · Merci de votre visite</p>
</body></html>`
  const lignesReglement = t.statut === "chambre" ? 2 : t.reglements.length * 2 + (rendu ? 1 : 0)
  // Mesuré : en-tête, filets, total et pied font environ 80 mm ; une marge de trop vaut mieux qu'un ticket coupé
  const hauteurMm = 80 + t.lignes.reduce((h, l) => h + (l.quantite > 1 ? 9 : 5), 0) + lignesReglement * 5 + (t.libelle ? 4 : 0) + (caissier ? 4 : 0) + (t.statut === "annule" ? 10 : 0)
  return { html, hauteurMm }
}

// « mer. 29 octobre 2026 à 14:05 », à l'heure de Sainte-Marie
const formaterHeureLongue = (instant: string) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Indian/Antananarivo" }).format(new Date(instant))

// --- Rapport de clôture de caisse (rouleau de 80 mm) ---

type ContexteCloture = { facturation: ReglagesFacturation; poste: string; ouvertePar?: string; fermeePar?: string }

export function rapportCloture(s: SessionCaisse, contexte: ContexteCloture): { html: string; hauteurMm: number } {
  const { facturation, poste, ouvertePar, fermeePar } = contexte
  const b = s.bilan
  const ligne = (libelle: string, valeur: string, classe = "") => `<tr class="${classe}"><td>${echapper(libelle)}</td><td class="droite">${echapper(valeur)}</td></tr>`
  const devises = Object.keys(b.attendues) as CodeDevise[]
  const especes = devises
    .map((d) => {
      const ecart = b.ecarts?.[d] ?? 0
      return [
        ligne(`Attendu (${DEVISES[d].symbole})`, formaterDansDevise(b.attendues[d] ?? 0, d)),
        b.comptees ? ligne(`Compté (${DEVISES[d].symbole})`, formaterDansDevise(b.comptees[d] ?? 0, d)) : "",
        b.comptees ? ligne("Écart", `${ecart > 0 ? "+" : ""}${formaterDansDevise(ecart, d)}`, ecart ? "gras" : "") : "",
      ].join("")
    })
    .join("")
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Clôture de caisse</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 4mm 4mm 6mm; width: 80mm; font-family: "Segoe UI", Arial, sans-serif; font-size: 9pt; line-height: 1.35; color: #000; }
  .centre { text-align: center; }
  .gras td, .gras { font-weight: 700; }
  .titre { font-size: 12pt; font-weight: 700; margin: 0; }
  h2 { font-size: 9pt; margin: 0 0 1mm; text-transform: uppercase; letter-spacing: 0.08em; }
  p { margin: 0 0 1mm; }
  .filet { border-top: 1px dashed #000; margin: 2.5mm 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 0.5mm 0; vertical-align: top; }
  .droite { text-align: right; white-space: nowrap; padding-left: 2mm; }
  .signature { margin-top: 10mm; border-top: 1px solid #000; padding-top: 1mm; text-align: center; font-size: 8pt; }
</style></head>
<body>
<p class="titre centre">${echapper(facturation.raisonSociale)}</p>
<p class="centre gras">${s.fermeeLe ? "CLÔTURE DE CAISSE" : "SITUATION DE CAISSE (EN COURS)"}</p>
<div class="filet"></div>
<p>Poste : <span class="gras">${echapper(poste)}</span><br>
Ouverture : ${echapper(formaterHeureLongue(s.ouverteLe))}${ouvertePar ? `, ${echapper(ouvertePar)}` : ""}<br>
${s.fermeeLe ? `Clôture : ${echapper(formaterHeureLongue(s.fermeeLe))}${fermeePar ? `, ${echapper(fermeePar)}` : ""}` : `Édité : ${echapper(formaterHeureLongue(new Date().toISOString()))}`}</p>
<div class="filet"></div>
<h2>Ventes</h2>
<table>
${ligne("Tickets", String(b.tickets))}
${ligne("Encaissé sur place", ariary(b.encaisse))}
${ligne("Mis sur les chambres", ariary(b.surChambres))}
${ligne("Total des ventes", ariary(b.ventes), "gras")}
${b.annules ? ligne(`Annulés (${b.annules})`, ariary(b.montantAnnule)) : ""}
</table>
<div class="filet"></div>
<h2>Encaissements</h2>
<table>
${b.parMode.map((m) => ligne(`${MODES_PAIEMENT[m.mode]}${m.devise !== "MGA" ? ` (${formaterDansDevise(m.montant, m.devise)})` : ""}`, ariary(m.contreValeur))).join("") || ligne("Aucun", "—")}
</table>
<div class="filet"></div>
<h2>Espèces du tiroir</h2>
<table>
${ligne("Fond de caisse", ariary(s.fondCaisse))}
${especes}
</table>
${s.commentaire ? `<p>Commentaire : ${echapper(s.commentaire)}</p>` : ""}
<div class="signature">Signature</div>
</body></html>`
  const hauteurMm = 120 + b.parMode.length * 5 + devises.length * 15 + (b.annules ? 5 : 0) + (s.commentaire ? 10 : 0)
  return { html, hauteurMm }
}
