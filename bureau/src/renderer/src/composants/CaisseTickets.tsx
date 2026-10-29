import {
  Badge,
  Body1,
  Button,
  Caption1,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Dropdown,
  Field,
  MessageBar,
  MessageBarBody,
  Option,
  SearchBox,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Textarea,
  Tooltip,
  mergeClasses,
} from "@fluentui/react-components"
import { ChevronLeftRegular, ChevronRightRegular, DismissCircleRegular, ReceiptRegular, TextBulletListSquareRegular } from "@fluentui/react-icons"
import { useState, type FormEvent } from "react"
import { ajouterJours, formaterDate } from "@partage/dates"
import { formaterDansDevise } from "@partage/devises"
import type { DateISO, StatutTicket, Ticket } from "@partage/types"
import { resumeTicket, type Caisse, type DonneesEcranCaisse } from "../caisse"
import { useDonneesChargees } from "../donnees"
import { useFichiers } from "../fichiers"
import { MODES_PAIEMENT } from "../libelles"
import { useRestaurantStyles } from "../pages/useRestaurantStyles.styles"
import ChampDate from "./ChampDate"
import { AfficherPlus, ChargementLogo, PAR_PAQUET, Vide } from "./commun"
import { useCadreTableStyles } from "./useCommunStyles.styles"
import { useFormulairesStyles } from "./useFormulairesStyles.styles"

const ariary = (montant: number) => formaterDansDevise(montant, "MGA")

const heure = (instant: string) =>
  new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Indian/Antananarivo" }).format(new Date(instant))

const sansAccents = (texte: string) => texte.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr")

type Filtre = "tous" | StatutTicket

// Tickets d'un jour (jour précédent / suivant d'un clic) : totaux qui servent aussi de filtres, recherche par numéro,
// article, table ou chambre, choix du poste ; plus récents en premier. Réimpression et annulation (motif
// obligatoire, ticket barré mais gardé)
export default function CaisseTickets({ caisse, donnees, jour, onJour }: { caisse: Caisse; donnees: DonneesEcranCaisse; jour: DateISO; onJour: (jour: DateISO) => void }) {
  const styles = useRestaurantStyles()
  const cadre = useCadreTableStyles()
  const { d, gerant } = useDonneesChargees()
  const { imprimerTicket } = useFichiers()
  const [aAnnuler, setAAnnuler] = useState<Ticket | null>(null)
  const [impression, setImpression] = useState<string | null>(null)
  const [filtre, setFiltre] = useState<Filtre>("tous")
  const [recherche, setRecherche] = useState("")
  const [posteId, setPosteId] = useState("tous")
  const [affichees, setAffichees] = useState(PAR_PAQUET)
  const aujourdhui = jour === donnees.aujourdhui

  // Chambre d'un ticket : séjour en cours, ou réservation connue de la réception et des gérants
  function chambreDe(t: Ticket): string | undefined {
    if (!t.reservationId) return undefined
    const sejour = donnees.sejours.find((s) => s.reservationId === t.reservationId)
    if (sejour) return sejour.chambre
    const r = d.reservations.find((x) => x.id === t.reservationId)
    return r ? d.chambres.find((c) => c.id === r.chambreId)?.numero : undefined
  }

  const caissierDe = (t: Ticket) => d.equipe.find((m) => m.id === t.caissierId)?.prenom ?? (t.caissierId === d.hote.id ? d.hote.prenom : undefined)
  const posteDe = (t: Ticket) => donnees.postes.find((p) => p.id === t.posteId)?.nom

  // Totaux du jour (du poste choisi), puis filtre et recherche sur la liste
  const duPoste = donnees.tickets.filter((t) => posteId === "tous" || t.posteId === posteId)
  const deStatut = (statut: StatutTicket) => duPoste.filter((t) => t.statut === statut)
  const somme = (statut: StatutTicket) => deStatut(statut).reduce((s, t) => s + t.total, 0)
  const nombre = (n: number) => `${n} ticket${n > 1 ? "s" : ""}`
  const pastilles: { filtre: Filtre; libelle: string; valeur: string; detail: string }[] = [
    { filtre: "tous", libelle: "Ventes du jour", valeur: ariary(somme("paye") + somme("chambre")), detail: nombre(duPoste.length - deStatut("annule").length) },
    { filtre: "paye", libelle: "Encaissé sur place", valeur: ariary(somme("paye")), detail: nombre(deStatut("paye").length) },
    { filtre: "chambre", libelle: "Sur les chambres", valeur: ariary(somme("chambre")), detail: nombre(deStatut("chambre").length) },
    { filtre: "annule", libelle: "Annulés", valeur: String(deStatut("annule").length), detail: deStatut("annule").length ? ariary(somme("annule")) : "aucun" },
  ]
  const mots = sansAccents(recherche.trim()).split(/\s+/).filter(Boolean)
  const tickets = duPoste
    .filter((t) => filtre === "tous" || t.statut === filtre)
    .filter((t) => {
      if (!mots.length) return true
      const texte = sansAccents([t.numero, t.libelle, resumeTicket(t), chambreDe(t) ?? "", caissierDe(t) ?? ""].join(" "))
      return mots.every((m) => texte.includes(m))
    })
    .sort((a, b) => b.le.localeCompare(a.le))

  function changerJour(nouveau: DateISO) {
    setAffichees(PAR_PAQUET)
    onJour(nouveau)
  }

  async function reimprimer(t: Ticket) {
    setImpression(t.id)
    await imprimerTicket(t, chambreDe(t))
    setImpression(null)
  }

  // Hors gérants, seuls les tickets du jour s'annulent (vérifié aussi par le serveur)
  const annulable = (t: Ticket) => t.statut !== "annule" && !t.factureId && (gerant || aujourdhui)

  return (
    <div className={styles.page}>
      <div className={styles.barreOutils} data-visite="caisse-tickets-outils">
        <div className={styles.navigationJour}>
          <Tooltip content="Jour précédent" relationship="label">
            <Button appearance="subtle" icon={<ChevronLeftRegular />} onClick={() => changerJour(ajouterJours(jour, -1))} />
          </Tooltip>
          <ChampDate className={styles.champJour} valeur={jour} onChange={(valeur) => valeur && changerJour(valeur)} />
          <Tooltip content="Jour suivant" relationship="label">
            <Button appearance="subtle" icon={<ChevronRightRegular />} disabled={aujourdhui} onClick={() => changerJour(ajouterJours(jour, 1))} />
          </Tooltip>
          {aujourdhui ? (
            <Caption1 className={styles.secondaire}>Aujourd&apos;hui</Caption1>
          ) : (
            <Button appearance="transparent" onClick={() => changerJour(donnees.aujourdhui)}>
              Revenir à aujourd&apos;hui
            </Button>
          )}
        </div>
        <div className={styles.navigationJour}>
          {donnees.postes.length > 1 && (
            <Dropdown
              className={styles.choixPoste}
              aria-label="Poste de caisse"
              value={posteId === "tous" ? "Tous les postes" : (donnees.postes.find((p) => p.id === posteId)?.nom ?? "")}
              selectedOptions={[posteId]}
              onOptionSelect={(_e, data) => {
                setPosteId(data.optionValue ?? "tous")
                setAffichees(PAR_PAQUET)
              }}
            >
              <Option value="tous">Tous les postes</Option>
              {donnees.postes.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.nom}
                </Option>
              ))}
            </Dropdown>
          )}
          <SearchBox
            className={styles.recherche}
            placeholder="N°, article, table, chambre"
            value={recherche}
            onChange={(_e, data) => {
              setRecherche(data.value)
              setAffichees(PAR_PAQUET)
            }}
          />
        </div>
      </div>

      {/* Autre jour demandé : emblème en squelette tant que ses tickets ne sont pas arrivés */}
      {caisse.jourEnCours && !caisse.erreur ? (
        <ChargementLogo texte={`Tickets du ${formaterDate(jour, { month: "long" })}…`} taille="moyen" />
      ) : (
        <>
          <div className={styles.pastilles} role="radiogroup" aria-label="Filtrer les tickets">
            {pastilles.map((p) => (
              <button
                key={p.filtre}
                type="button"
                role="radio"
                aria-checked={filtre === p.filtre}
                className={mergeClasses(styles.pastille, filtre === p.filtre && styles.pastilleActive)}
                onClick={() => {
                  setFiltre(p.filtre)
                  setAffichees(PAR_PAQUET)
                }}
              >
                <Caption1 className={styles.secondaire}>{p.libelle}</Caption1>
                <span className={styles.chiffre}>{p.valeur}</span>
                <Caption1 className={styles.secondaire}>{p.detail}</Caption1>
              </button>
            ))}
          </div>

          {tickets.length === 0 ? (
            donnees.tickets.length === 0 ? (
              <Vide Icone={TextBulletListSquareRegular} titre="Aucun ticket ce jour-là" texte="Les ventes de tous les postes de caisse s'affichent ici." />
            ) : (
              <Vide Icone={TextBulletListSquareRegular} titre="Aucun ticket ne correspond" texte="Changez le filtre, le poste ou la recherche." />
            )
          ) : (
            <>
              <div className={cadre.root} data-visite="caisse-tickets-liste">
                <Table aria-label="Tickets du jour" size="small">
                  <TableHeader className={cadre.entete}>
                    <TableRow>
                      <TableHeaderCell className={cadre.premiere} style={{ width: "64px" }}>
                        Heure
                      </TableHeaderCell>
                      <TableHeaderCell style={{ width: "140px" }}>Ticket</TableHeaderCell>
                      <TableHeaderCell>Détail</TableHeaderCell>
                      <TableHeaderCell style={{ width: "210px" }}>Règlement</TableHeaderCell>
                      <TableHeaderCell style={{ width: "110px" }}>
                        <span className={cadre.droite}>Total</span>
                      </TableHeaderCell>
                      <TableHeaderCell style={{ width: "80px" }} aria-label="Actions" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.slice(0, affichees).map((t) => {
                      const chambre = chambreDe(t)
                      const annule = t.statut === "annule"
                      const origine = [donnees.postes.length > 1 ? posteDe(t) : undefined, caissierDe(t)].filter(Boolean).join(" · ")
                      return (
                        <TableRow key={t.id}>
                          <TableCell className={mergeClasses(cadre.premiere, cadre.nombre)}>{heure(t.le)}</TableCell>
                          <TableCell>
                            <Body1 block className={mergeClasses(styles.nombre, annule && styles.annule)}>
                              {t.numero}
                            </Body1>
                            {origine && <Caption1 className={styles.secondaire}>{origine}</Caption1>}
                          </TableCell>
                          <TableCell>
                            <Body1 block className={annule ? styles.annule : undefined}>
                              {t.libelle && <strong>{t.libelle} · </strong>}
                              {resumeTicket(t)}
                            </Body1>
                            {annule && <Caption1 className={styles.secondaire}>Annulé : « {t.motifAnnulation} »</Caption1>}
                          </TableCell>
                          <TableCell>
                            {t.reservationId ? (
                              <Badge appearance="tint" color={annule ? "subtle" : "informative"} shape="rounded">
                                Chambre {chambre ?? ""}
                              </Badge>
                            ) : (
                              <Caption1>
                                {t.reglements.map((r) => `${MODES_PAIEMENT[r.mode]} ${formaterDansDevise(r.montant, r.devise)}`).join(", ")}
                                {t.reglements.some((r) => r.rendu) && ` · rendu ${ariary(t.reglements.reduce((s, r) => s + r.rendu, 0))}`}
                              </Caption1>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={mergeClasses(cadre.droite, cadre.nombre, styles.montantTicket, annule && styles.annule)}>{ariary(t.total)}</span>
                          </TableCell>
                          <TableCell>
                            <div className={styles.actionsLigne}>
                              <Tooltip content="Réimprimer le ticket" relationship="label">
                                <Button appearance="subtle" size="small" disabled={impression === t.id} icon={impression === t.id ? <Spinner size="tiny" /> : <ReceiptRegular />} onClick={() => reimprimer(t)} />
                              </Tooltip>
                              {annulable(t) && (
                                <Tooltip content="Annuler le ticket" relationship="label">
                                  <Button appearance="subtle" size="small" disabled={caisse.lectureSeule} icon={<DismissCircleRegular />} onClick={() => setAAnnuler(t)} />
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              <AfficherPlus affichees={affichees} total={tickets.length} unite={["ticket", "tickets"]} onPlus={() => setAffichees((n) => n + PAR_PAQUET)} />
            </>
          )}
        </>
      )}
      {aAnnuler && <FenetreAnnulation ticket={aAnnuler} caisse={caisse} onFin={() => setAAnnuler(null)} />}
    </div>
  )
}

function FenetreAnnulation({ ticket: t, caisse, onFin }: { ticket: Ticket; caisse: Caisse; onFin: () => void }) {
  const formulaire = useFormulairesStyles()
  const [motif, setMotif] = useState("")
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    const resultat = await caisse.ecrire("PATCH", `/api/hotes/caisse/tickets/${encodeURIComponent(t.id)}`, { annuler: true, motif })
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    onFin()
  }

  return (
    <Dialog open onOpenChange={(_e, data) => !data.open && onFin()}>
      <DialogSurface style={{ maxWidth: "480px" }}>
        <form onSubmit={envoyer}>
          <DialogBody>
            <DialogTitle>Annuler le ticket {t.numero}</DialogTitle>
            <DialogContent className={formulaire.corps}>
              <Body1>
                {resumeTicket(t)} · {ariary(t.total)}.{" "}
                {t.reservationId ? "Le montant est retiré de la note de la chambre." : "Rendez l'argent au client si besoin."} Le ticket reste dans la liste, barré, avec le motif.
              </Body1>
              <Field label="Motif" required>
                <Textarea value={motif} onChange={(_e, data) => setMotif(data.value)} placeholder="Erreur de saisie, plat renvoyé…" autoFocus />
              </Field>
              {erreur && (
                <MessageBar intent="error">
                  <MessageBarBody>{erreur}</MessageBarBody>
                </MessageBar>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={onFin}>Garder le ticket</Button>
              <Button type="submit" appearance="primary" disabled={enCours || !motif.trim() || caisse.lectureSeule} icon={enCours ? <Spinner size="tiny" /> : <DismissCircleRegular />}>
                Annuler le ticket
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  )
}
