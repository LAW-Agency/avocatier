import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import nodemailer, { type Transporter } from "nodemailer"
import { echapper } from "./modeles"

// Envoi des e-mails par SMTP : n'importe quel fournisseur (Brevo, Resend, OVH, serveur de l'agence…),
// réglé par SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD et EMAIL_FROM.
// Sans SMTP_HOST : en développement, chaque e-mail est écrit dans .emails/ (à ouvrir dans le navigateur) ;
// en production, il n'est que signalé dans les journaux.

export type Email = {
  a: string | string[]
  sujet: string
  html: string
  texte: string
  repondreA?: string
}

const globalSmtp = globalThis as typeof globalThis & { __avocatierSmtp?: Transporter }

function smtp(): Transporter | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env
  if (!SMTP_HOST) return null
  if (!globalSmtp.__avocatierSmtp) {
    const port = Number(SMTP_PORT || 587)
    globalSmtp.__avocatierSmtp = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465, // 465 : TLS d'emblée ; 587 : STARTTLS
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
    })
  }
  return globalSmtp.__avocatierSmtp
}

// Ne lève jamais d'exception : un e-mail perdu ne doit pas faire échouer une réservation déjà enregistrée
export async function envoyerEmail({ a, sujet, html, texte, repondreA }: Email): Promise<void> {
  const destinataires = [a].flat().filter(Boolean)
  if (destinataires.length === 0) return
  try {
    const transporteur = smtp()
    if (transporteur) {
      const from = process.env.EMAIL_FROM || process.env.SMTP_USER
      await transporteur.sendMail({ from, to: destinataires, replyTo: repondreA, subject: sujet, html, text: texte })
      return
    }
    if (process.env.NODE_ENV === "production") {
      console.error(`[e-mail] SMTP non configuré : « ${sujet} » non envoyé à ${destinataires.join(", ")}`)
      return
    }
    await enregistrerApercu({ a: destinataires, sujet, html, texte, repondreA })
  } catch (erreur) {
    console.error(`[e-mail] échec de l'envoi de « ${sujet} » à ${destinataires.join(", ")}`, erreur)
  }
}

// Développement : l'e-mail tel qu'il partirait, avec un bandeau destinataires / sujet en tête
async function enregistrerApercu({ a, sujet, html, repondreA }: Email) {
  const dossier = path.join(process.cwd(), ".emails")
  await mkdir(dossier, { recursive: true })
  const nom = `${new Date().toISOString().replace(/[:.]/g, "-")}-${sujet.normalize("NFD").replace(/[^\w]+/g, "-").slice(0, 50)}.html`
  const bandeau =
    `<div style="font:13px/1.5 monospace;background:#fff8dc;border-bottom:1px solid #e5d9a8;padding:10px 16px">` +
    echapper(`Aperçu (SMTP non configuré)\nÀ : ${[a].flat().join(", ")}${repondreA ? `\nRépondre à : ${repondreA}` : ""}\nSujet : ${sujet}`).replace(/\n/g, "<br>") +
    `</div>`
  await writeFile(path.join(dossier, nom), html.replace(/<body([^>]*)>/, `<body$1>${bandeau}`), "utf8")
  console.info(`[e-mail] « ${sujet} » → ${[a].flat().join(", ")} : aperçu dans .emails/${nom}`)
}
