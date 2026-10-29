import {
  Badge,
  Body1,
  Button,
  Caption1,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Spinner,
  Subtitle2,
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
import { LockClosedRegular, LockOpenRegular, ReceiptRegular } from "@fluentui/react-icons"
import { useState, type FormEvent } from "react"
import { DEVISES, formaterDansDevise } from "@partage/devises"
import type { CodeDevise, SessionCaisse } from "@partage/types"
import type { Caisse, DonneesEcranCaisse } from "../caisse"
import { useDonneesChargees } from "../donnees"
import { useFichiers } from "../fichiers"
import { MODES_PAIEMENT } from "../libelles"
import { useRestaurantStyles } from "../pages/useRestaurantStyles.styles"
import { useReglages } from "../reglages"
import { useAnnoncer } from "../toasts"
import { Carte, Vide } from "./commun"
import { useCadreTableStyles } from "./useCommunStyles.styles"
import { useFormulairesStyles } from "./useFormulairesStyles.styles"

const ariary = (montant: number) => formaterDansDevise(montant, "MGA")
const heure = (instant: string) =>
  new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Indian/Antananarivo" }).format(new Date(instant))
const lireMontant = (texte: string) => Number(texte.replace(/\s/g, "").replace(",", "."))
const signe = (ecart: number, devise: CodeDevise) => `${ecart > 0 ? "+" : ""}${formaterDansDevise(ecart, devise)}`

// Ouverture de la caisse du poste : fond de caisse compté (ariary), avant la première vente du service
export function OuvertureCaisse({ caisse }: { caisse: Caisse }) {
  const styles = useRestaurantStyles()
  const [fond, setFond] = useState("")
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    setErreur(await caisse.ouvrir(lireMontant(fond || "0")))
    setEnCours(false)
  }

  return (
    <Carte titre="Ouvrir la caisse" className={styles.accueil}>
      <Body1>Comptez les espèces du tiroir avant le service : c&apos;est le fond de caisse. À la clôture, le logiciel calcule ce qui doit s&apos;y trouver.</Body1>
      <form className={styles.champLigne} onSubmit={envoyer}>
        <Field label="Fond de caisse" style={{ flex: 1 }}>
          <Input input={{ inputMode: "numeric", style: { textAlign: "right" } }} contentAfter="Ar" value={fond} onChange={(_e, data) => setFond(data.value)} placeholder="0" autoFocus />
        </Field>
        <Button type="submit" appearance="primary" disabled={enCours || caisse.lectureSeule} icon={enCours ? <Spinner size="tiny" /> : <LockOpenRegular />}>
          Ouvrir la caisse
        </Button>
      </form>
      {erreur && (
        <MessageBar intent="error">
          <MessageBarBody>{erreur}</MessageBarBody>
        </MessageBar>
      )}
    </Carte>
  )
}

// Clôture de la caisse de ce poste (bilan du service, espèces comptées, écart) et caisses du jour de tous les postes
export default function CaisseCloture({ caisse, donnees }: { caisse: Caisse; donnees: DonneesEcranCaisse }) {
  const styles = useRestaurantStyles()
  const cadre = useCadreTableStyles()
  const { d } = useDonneesChargees()
  const { imprimerCloture } = useFichiers()
  const [impression, setImpression] = useState<string | null>(null)
  const nomPoste = (id: string) => donnees.postes.find((p) => p.id === id)?.nom ?? "Poste"
  const nom = (id?: string) => d.equipe.find((m) => m.id === id)?.prenom ?? (id === d.hote.id ? d.hote.prenom : undefined)
  // Caisses ouvertes le jour affiché (onglet Tickets du jour), et celles encore ouvertes
  const sessions = donnees.sessions

  async function imprimer(s: SessionCaisse) {
    setImpression(s.id)
    await imprimerCloture(s, nomPoste(s.posteId))
    setImpression(null)
  }

  return (
    <div className={styles.page}>
      {caisse.session ? (
        <ClotureEnCours caisse={caisse} session={caisse.session} nomPoste={nomPoste(caisse.session.posteId)} ouvertePar={nom(caisse.session.ouvertePar)} />
      ) : (
        <MessageBar intent="info">
          <MessageBarBody>La caisse de ce poste est fermée. Elle s&apos;ouvre depuis l&apos;onglet Vente, avec le fond de caisse.</MessageBarBody>
        </MessageBar>
      )}

      <Subtitle2>Caisses du jour, tous postes</Subtitle2>
      {sessions.length === 0 ? (
        <Vide Icone={LockClosedRegular} titre="Aucune caisse ce jour-là" texte="Chaque ouverture et chaque clôture de caisse s'affichent ici, avec leur écart." />
      ) : (
        <div className={cadre.root}>
          <Table aria-label="Caisses du jour">
            <TableHeader className={cadre.entete}>
              <TableRow>
                <TableHeaderCell className={cadre.premiere}>Poste</TableHeaderCell>
                <TableHeaderCell>Ouverture</TableHeaderCell>
                <TableHeaderCell>Clôture</TableHeaderCell>
                <TableHeaderCell>
                  <span className={cadre.droite}>Ventes</span>
                </TableHeaderCell>
                <TableHeaderCell>Écart</TableHeaderCell>
                <TableHeaderCell style={{ width: "56px" }} aria-label="Actions" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => {
                const ecarts = Object.entries(s.bilan.ecarts ?? {}).filter(([, e]) => e !== 0) as [CodeDevise, number][]
                return (
                  <TableRow key={s.id}>
                    <TableCell className={cadre.premiere}>{nomPoste(s.posteId)}</TableCell>
                    <TableCell>
                      {heure(s.ouverteLe)}
                      {nom(s.ouvertePar) && <Caption1 className={styles.secondaire}> · {nom(s.ouvertePar)}</Caption1>}
                    </TableCell>
                    <TableCell>
                      {s.fermeeLe ? (
                        <>
                          {heure(s.fermeeLe)}
                          {nom(s.fermeePar) && <Caption1 className={styles.secondaire}> · {nom(s.fermeePar)}</Caption1>}
                        </>
                      ) : (
                        <Badge appearance="tint" color="success" shape="rounded">
                          Ouverte
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={mergeClasses(cadre.droite, cadre.nombre)}>{ariary(s.bilan.ventes)}</span>
                    </TableCell>
                    <TableCell>
                      {!s.fermeeLe ? (
                        <Caption1 className={styles.secondaire}>—</Caption1>
                      ) : ecarts.length ? (
                        <Tooltip content={s.commentaire || "Sans commentaire"} relationship="description">
                          <Badge appearance="tint" color="danger" shape="rounded">
                            {ecarts.map(([devise, e]) => signe(e, devise)).join(", ")}
                          </Badge>
                        </Tooltip>
                      ) : (
                        <Badge appearance="tint" color="success" shape="rounded">
                          Juste
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip content={s.fermeeLe ? "Imprimer le rapport de clôture" : "Imprimer la situation en cours"} relationship="label">
                        <Button appearance="subtle" size="small" disabled={impression === s.id} icon={impression === s.id ? <Spinner size="tiny" /> : <ReceiptRegular />} onClick={() => imprimer(s)} />
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// Bilan du service en cours et comptage du tiroir : écart calculé en direct, explication demandée s'il y en a un
function ClotureEnCours({ caisse, session, nomPoste, ouvertePar }: { caisse: Caisse; session: SessionCaisse; nomPoste: string; ouvertePar?: string }) {
  const styles = useRestaurantStyles()
  const formulaire = useFormulairesStyles()
  const { annoncer } = useAnnoncer()
  const { reglages } = useReglages()
  const { imprimerCloture } = useFichiers()
  const b = session.bilan
  const devises = Object.keys(b.attendues) as CodeDevise[]
  const [comptees, setComptees] = useState<Partial<Record<CodeDevise, string>>>({})
  const [commentaire, setCommentaire] = useState("")
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  // Tant qu'un montant n'est pas saisi, pas d'écart affiché pour sa devise
  const saisies = Object.fromEntries(devises.flatMap((d) => (comptees[d]?.trim() ? [[d, lireMontant(comptees[d]!)]] : []))) as Partial<Record<CodeDevise, number>>
  const toutCompte = devises.every((d) => saisies[d] !== undefined && Number.isFinite(saisies[d]))
  const ecarts = devises.map((d) => [d, toutCompte ? Math.round(((saisies[d] ?? 0) - (b.attendues[d] ?? 0)) * 100) / 100 : null] as const)
  const avecEcart = ecarts.some(([, e]) => e !== null && e !== 0)

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    const resultat = await caisse.cloturer(session.id, saisies, commentaire)
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    const fermee = resultat.donnees.session
    annoncer({
      titre: `Caisse clôturée · ${nomPoste}`,
      texte: avecEcart ? "Écart noté avec votre explication." : "Espèces justes.",
      intent: avecEcart ? "warning" : "success",
      duree: 10_000,
      ...(!reglages.impressionAuto && {
        lien: (
          <Button size="small" icon={<ReceiptRegular />} onClick={() => void imprimerCloture(fermee, nomPoste)}>
            Imprimer le rapport
          </Button>
        ),
      }),
    })
    if (reglages.impressionAuto) void imprimerCloture(fermee, nomPoste)
  }

  return (
    <Carte
      titre={`Caisse ouverte · ${nomPoste}`}
      description={`Depuis ${heure(session.ouverteLe)}${ouvertePar ? `, ouverte par ${ouvertePar}` : ""} · fond de caisse ${ariary(session.fondCaisse)}`}
    >
      <div className={styles.resume}>
        <div>
          <Caption1 className={styles.secondaire}>Ventes</Caption1>
          <div className={styles.chiffre}>{ariary(b.ventes)}</div>
        </div>
        <div>
          <Caption1 className={styles.secondaire}>Encaissé sur place</Caption1>
          <div className={styles.chiffre}>{ariary(b.encaisse)}</div>
        </div>
        <div>
          <Caption1 className={styles.secondaire}>Sur les chambres</Caption1>
          <div className={styles.chiffre}>{ariary(b.surChambres)}</div>
        </div>
        <div>
          <Caption1 className={styles.secondaire}>Tickets{b.annules ? ` (${b.annules} annulé${b.annules > 1 ? "s" : ""})` : ""}</Caption1>
          <div className={styles.chiffre}>{b.tickets}</div>
        </div>
      </div>
      {b.parMode.length > 0 && (
        <Body1>
          {b.parMode.map((m) => `${MODES_PAIEMENT[m.mode]} ${m.devise !== "MGA" ? `${formaterDansDevise(m.montant, m.devise)} (${ariary(m.contreValeur)})` : ariary(m.contreValeur)}`).join(" · ")}
        </Body1>
      )}
      <form className={formulaire.corps} onSubmit={envoyer}>
        <div className={formulaire.grille}>
          {devises.map((d) => {
            const ecart = ecarts.find(([x]) => x === d)?.[1] ?? null
            return (
              <Field
                key={d}
                label={`Espèces comptées en ${DEVISES[d].nom.toLowerCase()}`}
                hint={`Attendu : ${formaterDansDevise(b.attendues[d] ?? 0, d)}${ecart !== null ? ` · écart ${signe(ecart, d)}` : ""}`}
                validationState={ecart ? "warning" : ecart === 0 ? "success" : "none"}
              >
                <Input
                  input={{ inputMode: "decimal", style: { textAlign: "right" } }}
                  contentAfter={DEVISES[d].symbole}
                  value={comptees[d] ?? ""}
                  onChange={(_e, data) => setComptees({ ...comptees, [d]: data.value })}
                />
              </Field>
            )
          })}
          <Field label="Commentaire" required={avecEcart} hint={avecEcart ? "Expliquez l'écart (erreur de monnaie, dépense payée avec la caisse…)" : "Facultatif"} className={formulaire.pleine}>
            <Textarea value={commentaire} onChange={(_e, data) => setCommentaire(data.value)} />
          </Field>
        </div>
        {erreur && (
          <MessageBar intent="error">
            <MessageBarBody>{erreur}</MessageBarBody>
          </MessageBar>
        )}
        <div className={styles.barreOutils}>
          <Caption1 className={styles.secondaire}>{toutCompte ? "Le bilan sera figé : les ventes suivantes demanderont une nouvelle ouverture." : "Saisissez les espèces comptées pour voir l'écart."}</Caption1>
          <Button
            type="submit"
            appearance="primary"
            disabled={enCours || caisse.lectureSeule || !toutCompte || (avecEcart && !commentaire.trim())}
            icon={enCours ? <Spinner size="tiny" /> : <LockClosedRegular />}
          >
            Clôturer la caisse
          </Button>
        </div>
      </form>
    </Carte>
  )
}
