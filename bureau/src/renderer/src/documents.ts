import { formaterDate, formaterPlage, formaterPrix, nombreNuits, pluriel } from "@partage/dates"
import type { ClientPublic, Paiement, ReglagesFacturation, Reservation } from "@partage/types"
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

type Contexte = { facturation: ReglagesFacturation; client?: ClientPublic; hebergement?: HebergementCourt; chambre?: string }

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

// Reçu d'un encaissement (ou d'un remboursement, montant négatif), avec où en est le paiement du séjour
export function recu(p: Paiement, r: Reservation, paiements: Paiement[], auteur: string | undefined, contexte: Contexte): string {
  const { facturation, client } = contexte
  const remboursement = p.montant < 0
  // Situation au moment de ce reçu : encaissements enregistrés jusqu'à lui
  const regle = paiements.filter((x) => x.le <= p.le).reduce((t, x) => t + x.montant, 0)
  const reste = r.montantTotal - regle
  const corps = `
${entete(facturation, remboursement ? "Reçu de remboursement" : "Reçu", [`N° ${numeroRecu(p)}`, `Date : ${dateLongue(p.le)}`, `Réservation ${r.reference}`])}
${destinataire(remboursement ? "Remboursé à" : "Reçu de", client)}
<p class="etiquette">${remboursement ? "Montant remboursé" : "Montant reçu"}</p>
<p class="montant">${echapper(formaterPrix(Math.abs(p.montant)))}</p>
<div class="grille">
  <div><p class="etiquette">Mode de paiement</p>${echapper(MODES_PAIEMENT[p.mode])}${p.note ? `<br><span class="detail">${echapper(p.note)}</span>` : ""}</div>
  <div><p class="etiquette">Pour le séjour</p>${echapper(sejourDe(contexte))}<br><span class="detail">${echapper(formaterPlage(r.arrivee, r.depart))} · ${echapper(pluriel(nombreNuits(r.arrivee, r.depart), "nuit"))}</span></div>
</div>
<h2>Situation du séjour à cette date</h2>
<table class="totaux" style="margin-left:0;width:60%">
  <tr><td>Montant du séjour</td><td class="droite">${echapper(formaterPrix(r.montantTotal))}</td></tr>
  <tr><td>Total réglé</td><td class="droite">${echapper(formaterPrix(regle))}</td></tr>
  <tr class="principal"><td>${reste > 0 ? "Reste à payer" : reste < 0 ? "Trop-perçu" : "Soldé"}</td><td class="droite">${echapper(formaterPrix(Math.abs(reste)))}</td></tr>
</table>
<div class="signature">Pour ${echapper(facturation.raisonSociale)}${auteur ? `, ${echapper(auteur)}` : ""}</div>
<div class="pied">Montants en euros.</div>`
  return page(`Reçu ${numeroRecu(p)}`, corps)
}
