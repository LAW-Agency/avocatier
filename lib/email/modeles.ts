import { HORAIRES } from "@/components/hebergements/sejour"
import { contact } from "@/data/contact"
import { formaterHeure, formaterPlage, formaterPrix, nombreNuits, pluriel } from "@/lib/reservation/dates"
import type { ClientPublic, Hebergement, Reservation } from "@/lib/reservation/types"

// Modèles des e-mails : HTML en tableaux et styles en ligne (seule mise en forme fiable dans les messageries),
// doublé d'une version texte. Tout texte variable (noms, message du client) passe par echapper().
// Mise en page : en-tête vert nuit centré (wordmark), titre centré souligné d'un filet sable, texte justifié,
// récapitulatif dans une carte claire, bouton centré, pied de page sous la carte.

const C = {
  forest: "#0d2b21",
  encre: "#1c2622",
  fond: "#f1f4ef",
  carte: "#f5f7f3",
  filet: "#e2e7df",
  gris: "#5f6964",
  sable: "#dcc9a5",
  blanc: "#ffffff",
}
const POLICE = "'Outfit','Helvetica Neue',Helvetica,Arial,sans-serif"
const NOM = "Chez L’Avocatier"
// Wordmark blanc tiré de public/logo-texte-blanc.svg, en PNG trois fois plus large que l'affichage (écrans denses)
const LOGO = { chemin: "/email/logo-texte-blanc.png", largeur: 180, hauteur: 47 }
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

// `fort` : valeur mise en avant (montant)
type Ligne = [libelle: string, valeur: string, fort?: boolean]
type Section = { titre: string; lignes: Ligne[] }

type Contenu = {
  apercu: string // aperçu affiché après le sujet dans la boîte de réception
  titre: string
  paragraphes: string[]
  sections?: Section[]
  bouton?: { libelle: string; url: string }
  notes?: string[]
}

// Espaces insécables à la française : ni « : » ni unité (« h », « nuits »…) seuls en début de ligne
const insecables = (texte: string) =>
  texte
    .replace(/ ([:;?!])/g, " $1")
    .replace(/(\d) (h|nuits?|adultes?|enfants?|km)\b/g, "$1 $2")
    .replace(/ · /g, " · ")
const html = (texte: string) => echapper(insecables(texte)).replace(/\r?\n/g, "<br>")
const police = `font-family:${POLICE}`
// Texte justifié : césure (lang="fr") pour éviter les grands blancs entre les mots sur mobile
const justifie = "text-align:justify;hyphens:auto;-webkit-hyphens:auto;word-break:break-word"

function carte({ titre, lignes }: Section): string {
  const rangees = lignes
    .map(([libelle, valeur, fort], i) => {
      const filet = i < lignes.length - 1 ? `border-bottom:1px solid ${C.filet};` : ""
      return (
        `<tr><td style="${police};${filet}padding:11px 12px 11px 0;width:40%;vertical-align:top;font-size:14px;line-height:1.5;color:${C.gris}">${html(libelle)}</td>` +
        `<td style="${police};${filet}padding:11px 0;vertical-align:top;line-height:1.5;word-break:break-word;` +
        (fort ? `font-size:17px;font-weight:600;color:${C.forest}` : `font-size:15px;color:${C.encre}`) +
        `">${html(valeur)}</td></tr>`
      )
    })
    .join("")
  return (
    `<tr><td class="marge" style="padding:10px 40px">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.carte};border-radius:12px">` +
    `<tr><td style="padding:18px 22px 8px">` +
    `<p style="${police};margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${C.forest}">${html(titre)}</p>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rangees}</table>` +
    `</td></tr></table></td></tr>`
  )
}

function message(sujet: string, { apercu, titre, paragraphes, sections, bouton, notes }: Contenu): Message {
  const site = urlDuSite()
  const corps = [
    // En-tête : logo en PNG (le SVG n'est pas affiché par Gmail ni Outlook) ; images bloquées : texte alternatif blanc
    `<tr><td align="center" style="background:${C.forest};padding:36px 40px 30px;text-align:center">` +
      `<a href="${echapper(site)}" style="display:inline-block;text-decoration:none">` +
      `<img src="${echapper(urlDuSite(LOGO.chemin))}" width="${LOGO.largeur}" height="${LOGO.hauteur}" alt="${NOM}" ` +
      `style="display:block;margin:0 auto;border:0;outline:none;width:${LOGO.largeur}px;height:auto;${police};font-size:22px;color:${C.blanc}"></a>` +
      `<p style="${police};margin:14px 0 0;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:${C.sable}">` +
      `${contact.address.locality} · ${contact.address.island}</p></td></tr>`,
    // Titre centré et filet sable
    `<tr><td class="marge" align="center" style="padding:40px 40px 0;text-align:center">` +
      `<h1 style="${police};margin:0;font-size:26px;line-height:1.25;font-weight:500;color:${C.forest}">${html(titre)}</h1>` +
      `<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:18px auto 0"><tr>` +
      `<td style="width:44px;height:2px;background:${C.sable};font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>`,
    `<tr><td class="marge" style="${police};padding:28px 40px 8px;color:${C.encre}">` +
      paragraphes.map((p) => `<p class="texte" style="margin:0 0 16px;font-size:16px;line-height:1.65;${justifie}">${html(p)}</p>`).join("") +
      `</td></tr>`,
    ...(sections ?? []).map(carte),
    bouton &&
      `<tr><td class="marge" align="center" style="padding:30px 40px 6px;text-align:center">` +
        `<a href="${echapper(bouton.url)}" style="display:inline-block;background:${C.forest};color:${C.blanc};${police};font-size:15px;` +
        `font-weight:500;letter-spacing:0.02em;text-decoration:none;padding:15px 32px;border-radius:4px">${html(bouton.libelle)}</a></td></tr>`,
    ...(notes ?? []).map(
      (n) => `<tr><td class="marge" style="${police};padding:16px 40px 0;font-size:13px;line-height:1.6;color:${C.gris};${justifie}">${html(n)}</td></tr>`,
    ),
    `<tr><td style="height:40px;font-size:0;line-height:0">&nbsp;</td></tr>`,
  ]
    .filter(Boolean)
    .join("\n")

  const page = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${html(sujet)}</title>
<style>@media (max-width:620px){.cadre{padding:16px 6px!important}.marge{padding-left:20px!important;padding-right:20px!important}.texte{font-size:15px!important}h1{font-size:23px!important}}</style></head>
<body style="margin:0;padding:0;background:${C.fond}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${html(apercu)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fond}"><tr><td class="cadre" align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.blanc};border-radius:16px;overflow:hidden">
${corps}
</table></td></tr>
<tr><td align="center" style="${police};padding:24px 24px 0;font-size:12px;line-height:1.7;color:${C.gris};text-align:center">
${NOM} · ${contact.address.locality}, ${contact.address.island}, ${contact.address.country}<br>
<a href="${echapper(site)}" style="color:${C.gris};text-decoration:underline">${echapper(site.replace(/^https?:\/\/|\/$/g, ""))}</a></td></tr>
</table></td></tr></table></body></html>`

  const texte = [
    titre.toUpperCase(),
    ...paragraphes,
    ...(sections ?? []).map((s) => [s.titre.toUpperCase(), ...s.lignes.map(([libelle, valeur]) => `${libelle} : ${valeur}`)].join("\n")),
    bouton && `${bouton.libelle} : ${bouton.url}`,
    ...(notes ?? []),
    `${NOM} · ${contact.address.locality}, ${contact.address.island}, ${contact.address.country}\n${site}`,
  ]
    .filter(Boolean)
    .join("\n\n")

  return { sujet, html: page, texte }
}

// --- Réservations ---

// `groupe` : toutes les chambres concernées par l'e-mail (la réservation seule, ou toutes celles d'une demande de
// plusieurs chambres), mêmes dates et même statut
export type Sejour = { reservation: Reservation; client: ClientPublic; hebergement: Hebergement; groupe: Reservation[] }

const somme = (s: Sejour, champ: "adultes" | "enfants" | "montantTotal") => s.groupe.reduce((total, r) => total + r[champ], 0)
const voyageurs = (s: Sejour) =>
  [pluriel(somme(s, "adultes"), "adulte"), somme(s, "enfants") ? pluriel(somme(s, "enfants"), "enfant") : ""].filter(Boolean).join(", ")
const references = (s: Sejour) => s.groupe.map((r) => r.reference).join(", ")
// « Bungalow Océan » ou « 2 × Bungalow Océan »
const hebergementDe = (s: Sejour) => (s.groupe.length > 1 ? `${s.groupe.length} × ${s.hebergement.nom}` : s.hebergement.nom)
const plage = (r: Reservation) => formaterPlage(r.arrivee, r.depart)
const nomComplet = (c: ClientPublic) => [c.prenom, c.nom].filter(Boolean).join(" ")

function recapitulatif(s: Sejour): Ligne[] {
  const r = s.reservation
  return [
    [s.groupe.length > 1 ? "Références" : "Référence", references(s)],
    ["Hébergement", hebergementDe(s)],
    ["Dates", `${plage(r)} · ${pluriel(nombreNuits(r.arrivee, r.depart), "nuit")}`],
    ["Voyageurs", voyageurs(s)],
    ["Navette aéroport", r.navette ? "Demandée" : "Non demandée"],
    // Comme « Mon compte » : montant estimé tant que le séjour n'est pas confirmé
    [r.statut === "confirmee" ? "Montant total" : "Montant estimé", formaterPrix(somme(s, "montantTotal")), true],
  ]
}

const votreSejour = (s: Sejour): Section[] => [{ titre: "Votre séjour", lignes: recapitulatif(s) }]

// Échéance de l'option, à l'heure de l'île (sans échéance connue : la durée d'une option)
const jusqua = (r: Reservation) => (r.expireLe ? `jusqu’au ${formaterHeure(r.expireLe)} (heure de Sainte-Marie)` : "pendant 48 h")
const avant = (r: Reservation) => (r.expireLe ? `avant le ${formaterHeure(r.expireLe)}` : "sous 48 h")

export function accuseDeReception(s: Sejour): Message {
  const r = s.reservation
  return message(`Demande reçue : ${hebergementDe(s)}, ${plage(r)}`, {
    apercu: `Vos dates sont bloquées le temps que ${HOTES} confirment votre séjour.`,
    titre: "Votre demande est bien arrivée",
    paragraphes: [
      `Bonjour ${s.client.prenom},`,
      `Merci pour votre demande. Vos dates sont bloquées ${jusqua(r)}, le temps que ${HOTES} confirment votre séjour personnellement.`,
      "Aucun paiement pour l’instant : une fois le séjour confirmé, ils vous indiqueront les modalités d’acompte.",
    ],
    sections: votreSejour(s),
    bouton: { libelle: "Suivre ma demande", url: urlDuSite("/compte") },
    notes: ["Une question, une précision sur votre arrivée ? Il suffit de répondre à cet e-mail."],
  })
}

export function alerteNouvelleDemande(s: Sejour): Message {
  const { reservation: r, client: c } = s
  return message(`Nouvelle demande : ${hebergementDe(s)}, ${plage(r)} (${nomComplet(c)})`, {
    apercu: `${references(s)} · ${formaterPrix(somme(s, "montantTotal"))} · à traiter ${avant(r)}`,
    titre: "Nouvelle demande de réservation",
    paragraphes: [
      `${nomComplet(c)} demande ${hebergementDe(s)} pour ${voyageurs(s)}. Les dates restent bloquées ${jusqua(r)} : sans réponse, la demande expire.`,
      ...(s.groupe.length > 1 ? ["Les chambres ont été attribuées automatiquement ; la demande se confirme ou se refuse en entier."] : []),
    ],
    sections: [
      { titre: "Séjour", lignes: recapitulatif(s) },
      {
        titre: "Client",
        lignes: [
          ["Nom", `${nomComplet(c)}${c.pays ? `, ${c.pays}` : ""}`],
          ["E-mail", c.email],
          ["Téléphone / WhatsApp", r.telephone || c.telephone || "—"],
          ["Message", r.message || "—"],
        ],
      },
    ],
    notes: ["À confirmer ou refuser dans le logiciel Chez L’Avocatier.", "Répondre à cet e-mail écrit directement au client."],
  })
}

// Mot écrit par les hôtes au moment d'agir (refus, annulation, modification) : un paragraphe tel quel
const motDesHotes = (mot?: string): string[] => (mot?.trim() ? [mot.trim()] : [])

export function decisionDesHotes(s: Sejour, statut: "confirmee" | "refusee" | "annulee", mot?: string): Message {
  const r = s.reservation
  const bonjour = `Bonjour ${s.client.prenom},`
  if (statut === "confirmee") {
    return message(`Séjour confirmé : ${hebergementDe(s)}, ${plage(r)}`, {
      apercu: `${HOTES} vous attendent ${plage(r)}.`,
      titre: "Votre séjour est confirmé",
      paragraphes: [
        bonjour,
        `Bonne nouvelle : ${HOTES} confirment votre séjour et vous recontactent très vite pour les modalités d’acompte.`,
        `Arrivée ${HORAIRES.arrivee.toLowerCase()}, départ ${HORAIRES.depart.toLowerCase()}. ${contact.airport}${r.navette ? " : la navette demandée vous attendra." : "."}`,
      ],
      sections: votreSejour(s),
      bouton: { libelle: "Voir mon séjour", url: urlDuSite("/compte") },
      notes: ["Une question avant votre arrivée ? Il suffit de répondre à cet e-mail."],
    })
  }
  if (statut === "refusee") {
    return message(`Votre demande ${references(s)} n’a pas pu être acceptée`, {
      apercu: "Vos dates sont libérées, aucun paiement n’a été demandé.",
      titre: "Votre demande n’a pas pu être acceptée",
      paragraphes: [
        bonjour,
        `${HOTES} ne peuvent malheureusement pas vous accueillir à ces dates. Votre demande est close et aucun paiement n’a été demandé.`,
        ...motDesHotes(mot),
        "D’autres dates ou un autre hébergement vous conviendraient peut-être.",
      ],
      sections: [{ titre: "Votre demande", lignes: recapitulatif(s) }],
      bouton: { libelle: "Choisir d’autres dates", url: urlDuSite("/reserver") },
    })
  }
  return message(`Réservation annulée : ${hebergementDe(s)}, ${plage(r)}`, {
    apercu: `Votre réservation ${r.reference} est annulée.`,
    titre: "Votre réservation est annulée",
    paragraphes: [
      bonjour,
      `${HOTES} ont annulé votre réservation ${r.reference}.`,
      ...motDesHotes(mot),
      "Pour toute question, il suffit de répondre à cet e-mail.",
    ],
    sections: votreSejour(s),
    bouton: { libelle: "Voir mon compte", url: urlDuSite("/compte") },
  })
}

// Séjour modifié par les hôtes (dates, hébergement, voyageurs, montant) : ce qui change, puis le séjour à jour
export function modificationParLesHotes(s: Sejour, changements: string[], mot?: string): Message {
  const r = s.reservation
  return message(`Votre séjour ${r.reference} a été modifié`, {
    apercu: changements.join(" · "),
    titre: r.statut === "option" ? "Votre demande a été modifiée" : "Votre séjour a été modifié",
    paragraphes: [
      `Bonjour ${s.client.prenom},`,
      `${HOTES} ont mis à jour votre ${r.statut === "option" ? "demande" : "réservation"} ${r.reference}. Voici ce qui change ; le récapitulatif ci-dessous est à jour.`,
      ...motDesHotes(mot),
    ],
    sections: [
      // « Dates : 12 – 15 nov. → 13 – 16 nov. » : libellé à gauche, changement à droite
      {
        titre: "Ce qui change",
        lignes: changements.map((c): Ligne => {
          const [quoi, ...detail] = c.split(" : ")
          return [quoi, detail.join(" : ")]
        }),
      },
      ...votreSejour(s),
    ],
    bouton: { libelle: "Voir mon séjour", url: urlDuSite("/compte") },
    notes: ["Une question ou un changement qui ne vous convient pas ? Il suffit de répondre à cet e-mail."],
  })
}

export function annulationParLeClient(s: Sejour): Message {
  const r = s.reservation
  return message(`Demande annulée par le client : ${hebergementDe(s)}, ${plage(r)}`, {
    apercu: `${nomComplet(s.client)} a annulé sa demande ${references(s)}.`,
    titre: "Demande annulée par le client",
    paragraphes: [`${nomComplet(s.client)} a annulé sa demande ${references(s)}. Les dates sont de nouveau libres.`],
    sections: [{ titre: "Séjour", lignes: recapitulatif(s) }],
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
