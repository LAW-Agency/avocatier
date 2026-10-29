import { decrireReservation, journaliser, json, lireCorps, pourLaCaisse } from "@/lib/api/hotes"
import { caisse } from "@/lib/reservation"
import { formaterDansDevise } from "@/lib/reservation/devises"
import type { CodeDevise, LigneTicket, ModePaiement, NouveauTicket, ReglementTicket } from "@/lib/reservation/types"

const liste = (valeur: unknown): Record<string, unknown>[] =>
  Array.isArray(valeur) ? valeur.filter((x): x is Record<string, unknown> => !!x && typeof x === "object") : []

// Vente d'un poste de caisse : { id, numero, posteId, sessionId?, le, libelle?, lignes: [{ articleId?, libelle,
// prixUnitaire, quantite }], reservationId? (sur la chambre) ou reglements: [{ mode, devise, montant, contreValeur,
// rendu }], differe? (vendu hors connexion) }. Renvoyer la même vente ne la duplique pas.
export const POST = pourLaCaisse(async (requete, membre) => {
  const c = await lireCorps(requete)
  const ticket: NouveauTicket = {
    id: String(c?.id ?? ""),
    numero: String(c?.numero ?? ""),
    posteId: String(c?.posteId ?? ""),
    le: String(c?.le ?? ""),
    libelle: String(c?.libelle ?? ""),
    ...(typeof c?.sessionId === "string" && c.sessionId && { sessionId: c.sessionId }),
    ...(typeof c?.reservationId === "string" && c.reservationId && { reservationId: c.reservationId }),
    differe: c?.differe === true,
    lignes: liste(c?.lignes).map(
      (l): LigneTicket => ({
        ...(typeof l.articleId === "string" && l.articleId && { articleId: l.articleId }),
        libelle: String(l.libelle ?? ""),
        prixUnitaire: Number(l.prixUnitaire),
        quantite: Number(l.quantite),
      }),
    ),
    reglements: liste(c?.reglements).map(
      (r): ReglementTicket => ({
        mode: String(r.mode ?? "") as ModePaiement,
        devise: String(r.devise ?? "") as CodeDevise,
        montant: Number(r.montant),
        contreValeur: Number(r.contreValeur),
        rendu: Number(r.rendu ?? 0),
      }),
    ),
  }
  const resultat = await caisse.enregistrerTicket(ticket, membre.id)
  if (!resultat.ok) return json({ erreur: resultat.erreur }, 409)
  const t = resultat.ticket
  if (!resultat.deja) {
    journaliser(membre, "restaurant", t.statut === "chambre" ? "Ticket mis sur la chambre" : "Ticket encaissé", async () => {
      const detail = t.reservationId ? await decrireReservation(t.reservationId) : `reçu ${t.reglements.map((r) => formaterDansDevise(r.montant, r.devise)).join(" + ")}`
      return [t.numero, formaterDansDevise(t.total, "MGA"), detail, ticket.differe && "vendu hors connexion"].filter(Boolean).join(" · ")
    })
  }
  return json({ ok: true, ticket: t, deja: resultat.deja })
})
