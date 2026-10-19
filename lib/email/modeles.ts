import { HORAIRES } from "@/components/hebergements/sejour"
import { contact } from "@/data/contact"
import { formaterHeure, formaterPlage, formaterPrix, nombreNuits, pluriel } from "@/lib/reservation/dates"
import type { ClientPublic, Hebergement, Reservation } from "@/lib/reservation/types"

// Modèles des e-mails : HTML en tableaux et styles en ligne (seule mise en forme fiable dans les messageries),
// doublé d'une version texte. Tout texte variable (noms, message du client) passe par echapper().

const C = { forest: "#0d2b21", encre: "#1c2622", fond: "#f1f4ef", filet: "#e3e8e0", gris: "#58625d", blanc: "#ffffff" }
const POLICE = "'Outfit','Helvetica Neue',Helvetica,Arial,sans-serif"
const NOM = "Chez L’Avocatier"
// Wordmark blanc tiré de public/logo-texte-blanc.svg, en PNG trois fois plus large que l'affichage (écrans denses)
const LOGO = { chemin: "/email/logo-texte-blanc.png", largeur: 180, hauteur: 38 }
const HOTES = "Joëlle & Stéphane"

export function echapper(texte: string): string {
  return texte.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

// Adresse publique configurée, jamais l'en-tête Host de la requête : falsifié, il enverrait les liens
// de réinitialisation vers un autre site
export function urlDuSite(chemin = "/"): string {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  const base = process.env.SITE_URL || (vercel ? `https://${vercel}` : "http://localhost:3000")
  return new URL(chemin, base).toString()
}

export type Message = { sujet: string; html: string; texte: string }

type Contenu = {
  apercu: string // aperçu affiché après le sujet dans la boîte de réception
  titre: string
  paragraphes: string[]
  details?: [libelle: string, valeur: string][]
  bouton?: { libelle: string; url: string }
  notes?: string[]
}

const html = (texte: string) => echapper(texte).replace(/\r?\n/g, "<br>")

function message(sujet: string, { apercu, titre, paragraphes, details, bouton, notes }: Contenu): Message {
  const cellule = `font-family:${POLICE};color:${C.encre}`
  const lignes = (details ?? [])
    .map(
      ([libelle, valeur]) =>
        `<tr><td style="${cellule};padding:10px 16px 10px 0;border-bottom:1px solid ${C.filet};font-size:14px;color:${C.gris};width:38%;vertical-align:top">${html(libelle)}</td>` +
        `<td style="${cellule};padding:10px 0;border-bottom:1px solid ${C.filet};font-size:15px;line-height:1.5;vertical-align:top">${html(valeur)}</td></tr>`,
    )
    .join("")

  const corps = [
    // Logo en PNG (le SVG n'est pas affiché par Gmail ni Outlook) ; images bloquées : le texte alternatif, en blanc
    `<tr><td style="background:${C.forest};padding:26px 36px"><a href="${echapper(urlDuSite())}" style="text-decoration:none">` +
      `<img src="${echapper(urlDuSite(LOGO.chemin))}" width="${LOGO.largeur}" height="${LOGO.hauteur}" alt="${NOM}" ` +
      `style="display:block;border:0;outline:none;width:${LOGO.largeur}px;height:auto;font-family:${POLICE};font-size:20px;color:${C.blanc}"></a></td></tr>`,
    `<tr><td style="${cellule};padding:36px 36px 8px">`,
    `<h1 style="margin:0 0 20px;font-family:${POLICE};font-size:24px;line-height:1.25;font-weight:500;color:${C.forest}">${html(titre)}</h1>`,
    ...paragraphes.map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6">${html(p)}</p>`),
    `</td></tr>`,
    lignes &&
      `<tr><td style="padding:8px 36px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.filet}">${lignes}</table></td></tr>`,
    bouton &&
      `<tr><td align="center" style="padding:28px 36px 8px;text-align:center"><a href="${echapper(bouton.url)}" style="display:inline-block;background:${C.encre};color:${C.blanc};font-family:${POLICE};font-size:15px;font-weight:500;letter-spacing:0.02em;text-decoration:none;padding:14px 26px;border-radius:4px">${html(bouton.libelle)}</a></td></tr>`,
    ...(notes ?? []).map(
      (n) => `<tr><td style="${cellule};padding:12px 36px 0;font-size:13px;line-height:1.6;color:${C.gris};word-break:break-word">${html(n)}</td></tr>`,
    ),
    `<tr><td style="${cellule};padding:32px 36px 36px;font-size:13px;line-height:1.6;color:${C.gris}">` +
      `${NOM} · ${contact.address.locality}, ${contact.address.island}, ${contact.address.country}<br>` +
      `<a href="${echapper(urlDuSite())}" style="color:${C.gris}">${echapper(urlDuSite().replace(/^https?:\/\/|\/$/g, ""))}</a></td></tr>`,
  ]
    .filter(Boolean)
    .join("\n")

  const page = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${html(sujet)}</title></head>
<body style="margin:0;padding:0;background:${C.fond}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${html(apercu)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fond}"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${C.blanc};border-radius:16px;overflow:hidden">
${corps}
</table></td></tr></table></body></html>`

  const texte = [
    titre.toUpperCase(),
    ...paragraphes,
    (details ?? []).map(([libelle, valeur]) => `${libelle} : ${valeur}`).join("\n"),
    bouton && `${bouton.libelle} : ${bouton.url}`,
    ...(notes ?? []),
    `${NOM} · ${contact.address.locality}, ${contact.address.island}, ${contact.address.country}\n${urlDuSite()}`,
  ]
    .filter(Boolean)
    .join("\n\n")

  return { sujet, html: page, texte }
}

// --- Réservations ---

export type Sejour = { reservation: Reservation; client: ClientPublic; hebergement: Hebergement }

const voyageurs = (r: Reservation) => [pluriel(r.adultes, "adulte"), r.enfants ? pluriel(r.enfants, "enfant") : ""].filter(Boolean).join(", ")
const plage = (r: Reservation) => formaterPlage(r.arrivee, r.depart)
const nomComplet = (c: ClientPublic) => [c.prenom, c.nom].filter(Boolean).join(" ")

function recapitulatif({ reservation: r, hebergement: h }: Sejour): [string, string][] {
  return [
    ["Référence", r.reference],
    ["Hébergement", h.nom],
    ["Dates", `${plage(r)} · ${pluriel(nombreNuits(r.arrivee, r.depart), "nuit")}`],
    ["Voyageurs", voyageurs(r)],
    ["Navette aéroport", r.navette ? "Demandée" : "Non demandée"],
    // Comme « Mon compte » : montant estimé tant que le séjour n'est pas confirmé
    [r.statut === "confirmee" ? "Montant total" : "Montant estimé", formaterPrix(r.montantTotal)],
  ]
}

// Échéance de l'option, à l'heure de l'île
const echeance = (r: Reservation) => (r.expireLe ? `${formaterHeure(r.expireLe)} (heure de Sainte-Marie)` : "48 h")

export function accuseDeReception(s: Sejour): Message {
  const r = s.reservation
  return message(`Demande reçue : ${s.hebergement.nom}, ${plage(r)}`, {
    apercu: `Vos dates sont bloquées le temps que ${HOTES} confirment votre séjour.`,
    titre: "Votre demande est bien arrivée",
    paragraphes: [
      `Bonjour ${s.client.prenom},`,
      `Merci pour votre demande. Vos dates sont bloquées jusqu’au ${echeance(r)}, le temps que ${HOTES} confirment votre séjour personnellement.`,
      "Aucun paiement pour l’instant : une fois le séjour confirmé, ils vous indiqueront les modalités d’acompte.",
    ],
    details: recapitulatif(s),
    bouton: { libelle: "Suivre ma demande", url: urlDuSite("/compte") },
    notes: ["Une question, une précision sur votre arrivée ? Il suffit de répondre à cet e-mail."],
  })
}

export function alerteNouvelleDemande(s: Sejour): Message {
  const { reservation: r, client: c } = s
  return message(`Nouvelle demande : ${s.hebergement.nom}, ${plage(r)} (${nomComplet(c)})`, {
    apercu: `${r.reference} · ${formaterPrix(r.montantTotal)} · à traiter avant le ${echeance(r)}`,
    titre: "Nouvelle demande de réservation",
    paragraphes: [
      `${nomComplet(c)} demande ${s.hebergement.nom} pour ${voyageurs(r)}. Les dates restent bloquées jusqu’au ${echeance(r)} : sans réponse, la demande expire.`,
    ],
    details: [
      ...recapitulatif(s),
      ["Client", `${nomComplet(c)}${c.pays ? `, ${c.pays}` : ""}`],
      ["E-mail", c.email],
      ["Téléphone / WhatsApp", r.telephone || c.telephone || "—"],
      ["Message", r.message || "—"],
    ],
    bouton: { libelle: "Traiter la demande", url: urlDuSite("/admin/reservations?statut=option") },
    notes: ["Répondre à cet e-mail écrit directement au client."],
  })
}

export function decisionDesHotes(s: Sejour, statut: "confirmee" | "refusee" | "annulee"): Message {
  const r = s.reservation
  const bonjour = `Bonjour ${s.client.prenom},`
  if (statut === "confirmee") {
    return message(`Séjour confirmé : ${s.hebergement.nom}, ${plage(r)}`, {
      apercu: `${HOTES} vous attendent ${plage(r)}.`,
      titre: "Votre séjour est confirmé",
      paragraphes: [
        bonjour,
        `Bonne nouvelle : ${HOTES} confirment votre séjour et vous recontactent très vite pour les modalités d’acompte.`,
        `Arrivée ${HORAIRES.arrivee.toLowerCase()}, départ ${HORAIRES.depart.toLowerCase()}. ${contact.airport}${r.navette ? " : la navette demandée vous attendra." : "."}`,
      ],
      details: recapitulatif(s),
      bouton: { libelle: "Voir mon séjour", url: urlDuSite("/compte") },
      notes: ["Une question avant votre arrivée ? Il suffit de répondre à cet e-mail."],
    })
  }
  if (statut === "refusee") {
    return message(`Votre demande ${r.reference} n’a pas pu être acceptée`, {
      apercu: "Vos dates sont libérées, aucun paiement n’a été demandé.",
      titre: "Votre demande n’a pas pu être acceptée",
      paragraphes: [
        bonjour,
        `${HOTES} ne peuvent malheureusement pas vous accueillir à ces dates. Votre demande est close et aucun paiement n’a été demandé.`,
        "D’autres dates ou un autre hébergement vous conviendraient peut-être.",
      ],
      details: recapitulatif(s),
      bouton: { libelle: "Choisir d’autres dates", url: urlDuSite("/reserver") },
    })
  }
  return message(`Réservation annulée : ${s.hebergement.nom}, ${plage(r)}`, {
    apercu: `Votre réservation ${r.reference} est annulée.`,
    titre: "Votre réservation est annulée",
    paragraphes: [bonjour, `${HOTES} ont annulé votre réservation ${r.reference}. Pour toute question, il suffit de répondre à cet e-mail.`],
    details: recapitulatif(s),
    bouton: { libelle: "Voir mon compte", url: urlDuSite("/compte") },
  })
}

export function annulationParLeClient(s: Sejour): Message {
  const r = s.reservation
  return message(`Demande annulée par le client : ${s.hebergement.nom}, ${plage(r)}`, {
    apercu: `${nomComplet(s.client)} a annulé sa demande ${r.reference}.`,
    titre: "Demande annulée par le client",
    paragraphes: [`${nomComplet(s.client)} a annulé sa demande ${r.reference}. Les dates sont de nouveau libres.`],
    details: recapitulatif(s),
    bouton: { libelle: "Voir les réservations", url: urlDuSite("/admin/reservations") },
  })
}

// --- Compte ---

export function lienDeReinitialisation(client: ClientPublic, url: string): Message {
  return message("Choisissez un nouveau mot de passe", {
    apercu: "Ce lien est valable une heure.",
    titre: "Choisissez un nouveau mot de passe",
    paragraphes: [
      `Bonjour ${client.prenom},`,
      `Vous avez demandé à récupérer l’accès à votre compte ${NOM}. Ce lien est valable une heure et ne sert qu’une fois.`,
    ],
    bouton: { libelle: "Choisir un nouveau mot de passe", url },
    notes: [
      "Vous n’êtes pas à l’origine de cette demande ? Ignorez cet e-mail : votre mot de passe reste inchangé.",
      `Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur : ${url}`,
    ],
  })
}

export function motDePasseModifie(client: ClientPublic, le: Date): Message {
  return message("Votre mot de passe a été modifié", {
    apercu: "Vos autres sessions ont été déconnectées.",
    titre: "Votre mot de passe a été modifié",
    paragraphes: [
      `Bonjour ${client.prenom},`,
      `Le mot de passe de votre compte ${NOM} a été modifié le ${formaterHeure(le.toISOString())} (heure de Sainte-Marie). Par sécurité, vos autres sessions ont été déconnectées.`,
    ],
    bouton: { libelle: "Ce n’était pas moi", url: urlDuSite("/compte/mot-de-passe-oublie") },
    notes: ["Si vous n’êtes pas à l’origine de ce changement, choisissez tout de suite un nouveau mot de passe et prévenez-nous en répondant à cet e-mail."],
  })
}
