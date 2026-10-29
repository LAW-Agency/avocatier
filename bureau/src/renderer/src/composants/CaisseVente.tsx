import {
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
  Input,
  MessageBar,
  MessageBarBody,
  Option,
  Radio,
  RadioGroup,
  SearchBox,
  Spinner,
  Subtitle2,
  Tab,
  TabList,
  ToggleButton,
  Tooltip,
} from "@fluentui/react-components"
import { AddRegular, BedRegular, DeleteRegular, FoodRegular, MoneyRegular, ReceiptRegular, SubtractRegular } from "@fluentui/react-icons"
import { useMemo, useState, type FormEvent } from "react"
import { formaterPlage } from "@partage/dates"
import { DEVISES, formaterDansDevise } from "@partage/devises"
import type { Article, CodeDevise, LigneTicket, ModePaiement, ReglagesDevises, ReglementTicket, SejourCaisse } from "@partage/types"
import { aPayerEn, ariaryPourUn, calculerReglement, MODES_CAISSE, montantsSuggeres, totalLignes, type Caisse, type DonneesEcranCaisse, type Vente } from "../caisse"
import { useFichiers } from "../fichiers"
import { MODES_PAIEMENT } from "../libelles"
import { useRestaurantStyles } from "../pages/useRestaurantStyles.styles"
import { useReglages } from "../reglages"
import { useAnnoncer } from "../toasts"
import { Vide } from "./commun"
import { useFormulairesStyles } from "./useFormulairesStyles.styles"

const ariary = (montant: number) => formaterDansDevise(montant, "MGA")
const TOUT = "__tout"

// Vente au comptoir : articles de la carte par catégorie (un clic = un de plus sur le ticket), ticket en cours,
// puis encaissement sur place ou mise sur la note d'une chambre
export default function CaisseVente({ caisse, donnees }: { caisse: Caisse; donnees: DonneesEcranCaisse }) {
  const styles = useRestaurantStyles()
  const { annoncer } = useAnnoncer()
  const { reglages } = useReglages()
  const { imprimerTicket } = useFichiers()
  const [lignes, setLignes] = useState<LigneTicket[]>([])
  const [libelle, setLibelle] = useState("")
  const [categorie, setCategorie] = useState(TOUT)
  const [recherche, setRecherche] = useState("")
  const [fenetre, setFenetre] = useState<"encaisser" | "chambre" | null>(null)

  const actifs = donnees.articles.filter((a) => a.actif)
  const categories = [...new Set(actifs.map((a) => a.categorie))]
  const filtre = recherche.trim().toLocaleLowerCase("fr")
  const visibles = actifs.filter(
    (a) => (filtre ? a.nom.toLocaleLowerCase("fr").includes(filtre) : categorie === TOUT || a.categorie === categorie),
  )
  const total = totalLignes(lignes)

  function ajouter(a: Article) {
    setLignes((avant) => {
      const i = avant.findIndex((l) => l.articleId === a.id)
      if (i === -1) return [...avant, { articleId: a.id, libelle: a.nom, prixUnitaire: a.prix, quantite: 1 }]
      return avant.map((l, n) => (n === i ? { ...l, quantite: l.quantite + 1 } : l))
    })
  }

  const changerQuantite = (index: number, ecart: number) =>
    setLignes((avant) => avant.flatMap((l, n) => (n !== index ? [l] : l.quantite + ecart > 0 ? [{ ...l, quantite: l.quantite + ecart }] : [])))

  // Vente enregistrée : ticket vidé, annonce, impression automatique si le poste le demande
  async function valider(vente: Vente): Promise<string | null> {
    const resultat = await caisse.vendre(vente)
    if (!resultat.ok) return resultat.erreur
    const { ticket } = resultat.donnees
    const rendu = ticket.reglements.reduce((t, r) => t + r.rendu, 0)
    const chambre = "reservationId" in vente ? donnees.sejours.find((s) => s.reservationId === vente.reservationId)?.chambre : undefined
    setLignes([])
    setLibelle("")
    setFenetre(null)
    annoncer({
      titre: chambre ? `Ticket ${ticket.numero} mis sur la chambre ${chambre}` : `Ticket ${ticket.numero} encaissé`,
      texte: rendu ? `Monnaie à rendre : ${ariary(rendu)}` : ariary(ticket.total),
      intent: "success",
      duree: 8000,
      ...(!reglages.impressionAuto && {
        lien: (
          <Button size="small" icon={<ReceiptRegular />} onClick={() => void imprimerTicket(ticket, chambre)}>
            Imprimer le ticket
          </Button>
        ),
      }),
    })
    if (reglages.impressionAuto) void imprimerTicket(ticket, chambre)
    return null
  }

  return (
    <div className={styles.vente}>
      <div className={styles.articles}>
        <div className={styles.filtres}>
          <SearchBox className={styles.recherche} placeholder="Chercher un article" value={recherche} onChange={(_e, data) => setRecherche(data.value)} />
          {!filtre && categories.length > 1 && (
            <TabList size="small" selectedValue={categorie} onTabSelect={(_e, data) => setCategorie(String(data.value))}>
              <Tab value={TOUT}>Tout</Tab>
              {categories.map((c) => (
                <Tab key={c} value={c}>
                  {c}
                </Tab>
              ))}
            </TabList>
          )}
        </div>
        {actifs.length === 0 ? (
          <Vide Icone={FoodRegular} titre="La carte est vide" texte="Ajoutez les plats et les boissons dans l'onglet Carte pour commencer à vendre." />
        ) : visibles.length === 0 ? (
          <Body1 className={styles.secondaire}>Aucun article ne correspond.</Body1>
        ) : (
          <div className={styles.grille}>
            {visibles.map((a) => (
              <button key={a.id} type="button" className={styles.article} onClick={() => ajouter(a)} title={a.description || undefined}>
                <span className={styles.nomArticle}>{a.nom}</span>
                <span className={styles.prixArticle}>{ariary(a.prix)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <aside className={styles.ticket} aria-label="Ticket en cours">
        <Subtitle2>Ticket en cours</Subtitle2>
        <Input value={libelle} onChange={(_e, data) => setLibelle(data.value)} placeholder="Table, nom du client (facultatif)" aria-label="Table ou nom du client" />
        <ul className={styles.lignes}>
          {lignes.length === 0 && <li className={styles.vide}>Touchez un article pour l&apos;ajouter.</li>}
          {lignes.map((l, i) => (
            <li key={`${l.articleId ?? l.libelle}-${i}`} className={styles.ligne}>
              <div>
                <Body1 block>{l.libelle}</Body1>
                <Caption1 className={styles.secondaire}>{ariary(l.prixUnitaire)}</Caption1>
              </div>
              <span className={styles.quantite}>
                <Button
                  size="small"
                  appearance="subtle"
                  icon={l.quantite === 1 ? <DeleteRegular /> : <SubtractRegular />}
                  aria-label={l.quantite === 1 ? `Retirer ${l.libelle}` : `Un ${l.libelle} de moins`}
                  onClick={() => changerQuantite(i, -1)}
                />
                <span className={styles.chiffreQuantite}>{l.quantite}</span>
                <Button size="small" appearance="subtle" icon={<AddRegular />} aria-label={`Un ${l.libelle} de plus`} onClick={() => changerQuantite(i, 1)} />
              </span>
              <span className={styles.montantLigne}>{ariary(l.prixUnitaire * l.quantite)}</span>
            </li>
          ))}
        </ul>
        <div className={styles.total}>
          <Subtitle2>Total</Subtitle2>
          <span className={styles.montantTotal}>{ariary(total)}</span>
        </div>
        <div className={styles.boutons}>
          <Button className={styles.encaisser} appearance="primary" size="large" icon={<MoneyRegular />} disabled={!lignes.length || caisse.lectureSeule} onClick={() => setFenetre("encaisser")}>
            Encaisser
          </Button>
          <Tooltip content={donnees.sejours.length ? "Sur la note du séjour, réglé au départ" : "Aucun client sur place aujourd'hui"} relationship="description">
            <Button icon={<BedRegular />} disabled={!lignes.length || caisse.lectureSeule || !donnees.sejours.length} onClick={() => setFenetre("chambre")}>
              Sur la chambre
            </Button>
          </Tooltip>
          <Button icon={<DeleteRegular />} disabled={!lignes.length} onClick={() => setLignes([])}>
            Vider
          </Button>
        </div>
      </aside>

      {fenetre === "encaisser" && (
        <FenetreEncaissement total={total} devises={donnees.devises} onAnnuler={() => setFenetre(null)} onValider={(reglement) => valider({ libelle, lignes, reglement })} />
      )}
      {fenetre === "chambre" && (
        <FenetreChambre total={total} sejours={donnees.sejours} onAnnuler={() => setFenetre(null)} onValider={(reservationId) => valider({ libelle, lignes, reservationId })} />
      )}
    </div>
  )
}

// Encaissement : mode, devise, montant reçu (espèces) et monnaie à rendre en ariary
function FenetreEncaissement({
  total,
  devises,
  onAnnuler,
  onValider,
}: {
  total: number
  devises: ReglagesDevises
  onAnnuler: () => void
  onValider: (reglement: ReglementTicket) => Promise<string | null>
}) {
  const styles = useRestaurantStyles()
  const formulaire = useFormulairesStyles()
  const [mode, setMode] = useState<ModePaiement>("especes")
  const [devise, setDevise] = useState<CodeDevise>("MGA")
  const [recu, setRecu] = useState(String(total))
  // Saisie à la française : virgule décimale (5,53)
  const decimal = (montant: number) => String(montant).replace(".", ",")
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  // Ariary d'abord, puis les devises proposées sur le site (euro, dollar…)
  const choixDevises = useMemo(() => [...new Set<CodeDevise>(["MGA", "EUR", ...devises.actives])], [devises.actives])
  const du = aPayerEn(total, devise, devises.taux)
  const valeur = Number(recu.replace(/\s/g, "").replace(",", "."))
  const calcul = calculerReglement(total, mode, devise, valeur, devises.taux)

  function choisirDevise(code: CodeDevise) {
    setDevise(code)
    setRecu(decimal(aPayerEn(total, code, devises.taux)))
  }

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    if ("erreur" in calcul) return setErreur(calcul.erreur)
    setEnCours(true)
    setErreur(await onValider(calcul.reglement))
    setEnCours(false)
  }

  return (
    <Dialog open onOpenChange={(_e, data) => !data.open && onAnnuler()}>
      <DialogSurface className={formulaire.surface} style={{ maxWidth: "600px" }}>
        <form onSubmit={envoyer}>
          <DialogBody>
            <DialogTitle>Encaisser {ariary(total)}</DialogTitle>
            <DialogContent className={formulaire.corps}>
              <Field label="Mode de paiement">
                <div className={styles.modes}>
                  {MODES_CAISSE.map((m) => (
                    <ToggleButton key={m} checked={mode === m} appearance={mode === m ? "primary" : "secondary"} onClick={() => setMode(m)}>
                      {MODES_PAIEMENT[m]}
                    </ToggleButton>
                  ))}
                </div>
              </Field>
              <div className={formulaire.grille}>
                <Field label="Devise">
                  <Dropdown className={formulaire.champ} value={`${DEVISES[devise].nom} (${DEVISES[devise].symbole})`} selectedOptions={[devise]} onOptionSelect={(_e, data) => choisirDevise(data.optionValue as CodeDevise)}>
                    {choixDevises.map((code) => (
                      <Option key={code} value={code} text={`${DEVISES[code].nom} (${DEVISES[code].symbole})`}>
                        {`${DEVISES[code].nom} (${DEVISES[code].symbole})`}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
                <Field label={mode === "especes" ? "Montant reçu" : "Montant débité"} hint={devise !== "MGA" && mode === "especes" ? `À payer : ${formaterDansDevise(du, devise)}` : undefined}>
                  <Input
                    className={formulaire.champ}
                    input={{ className: formulaire.nombre, inputMode: "decimal" }}
                    contentAfter={DEVISES[devise].symbole}
                    value={mode === "especes" ? recu : decimal(du)}
                    disabled={mode !== "especes"}
                    onChange={(_e, data) => setRecu(data.value)}
                    autoFocus
                  />
                </Field>
              </div>
              {mode === "especes" && devise === "MGA" && (
                <div className={styles.suggestions}>
                  {montantsSuggeres(total).map((m) => (
                    <Button key={m} size="small" appearance={valeur === m ? "primary" : "secondary"} onClick={() => setRecu(String(m))}>
                      {m === total ? "Montant exact" : ariary(m)}
                    </Button>
                  ))}
                </div>
              )}
              {mode === "especes" && (
                <div className={formulaire.encart}>
                  <div className={formulaire.ligneEncart}>
                    <Body1>Monnaie à rendre</Body1>
                    <span className={styles.rendu}>{"reglement" in calcul ? ariary(calcul.reglement.rendu) : "—"}</span>
                  </div>
                  {devise !== "MGA" && (
                    <Caption1 className={formulaire.secondaire}>
                      Au taux de Tarifs : 1 {DEVISES[devise].symbole} = {ariary(Math.round(ariaryPourUn(devise, devises.taux)))}. La monnaie se rend en ariary.
                    </Caption1>
                  )}
                </div>
              )}
              {erreur && (
                <MessageBar intent="error">
                  <MessageBarBody>{erreur}</MessageBarBody>
                </MessageBar>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={onAnnuler}>Annuler</Button>
              <Button type="submit" appearance="primary" disabled={enCours || "erreur" in calcul} icon={enCours ? <Spinner size="tiny" /> : <MoneyRegular />}>
                Valider l&apos;encaissement
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  )
}

// Mise sur la chambre : clients attendus ou sur place aujourd'hui ; un séjour déjà facturé ne prend plus rien
function FenetreChambre({
  total,
  sejours,
  onAnnuler,
  onValider,
}: {
  total: number
  sejours: SejourCaisse[]
  onAnnuler: () => void
  onValider: (reservationId: string) => Promise<string | null>
}) {
  const styles = useRestaurantStyles()
  const formulaire = useFormulairesStyles()
  const [choix, setChoix] = useState("")
  const [filtre, setFiltre] = useState("")
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const texte = filtre.trim().toLocaleLowerCase("fr")
  const visibles = sejours.filter((s) => !texte || `${s.chambre} ${s.client} ${s.reference}`.toLocaleLowerCase("fr").includes(texte))

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    if (!choix) return setErreur("Choisissez la chambre.")
    setEnCours(true)
    setErreur(await onValider(choix))
    setEnCours(false)
  }

  return (
    <Dialog open onOpenChange={(_e, data) => !data.open && onAnnuler()}>
      <DialogSurface className={formulaire.surface} style={{ maxWidth: "560px" }}>
        <form onSubmit={envoyer}>
          <DialogBody>
            <DialogTitle>Mettre {ariary(total)} sur une chambre</DialogTitle>
            <DialogContent className={formulaire.corps}>
              <SearchBox placeholder="Chambre ou nom du client" value={filtre} onChange={(_e, data) => setFiltre(data.value)} autoFocus />
              <RadioGroup className={styles.sejours} value={choix} onChange={(_e, data) => setChoix(data.value)} aria-label="Séjour">
                {visibles.map((s) => (
                  <Radio
                    key={s.reservationId}
                    value={s.reservationId}
                    disabled={s.facture}
                    label={
                      <>
                        <strong>{s.chambre}</strong> · {s.client}
                        <br />
                        <Caption1 className={styles.secondaire}>
                          {formaterPlage(s.arrivee, s.depart)} · {s.reference}
                          {s.facture && " · déjà facturé"}
                        </Caption1>
                      </>
                    }
                  />
                ))}
              </RadioGroup>
              {visibles.length === 0 && <Body1 className={styles.secondaire}>Aucun séjour ne correspond.</Body1>}
              <Caption1 className={formulaire.secondaire}>Le montant s&apos;ajoute à la note du séjour : il se règle au départ, avec la facture.</Caption1>
              {erreur && (
                <MessageBar intent="error">
                  <MessageBarBody>{erreur}</MessageBarBody>
                </MessageBar>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={onAnnuler}>Annuler</Button>
              <Button type="submit" appearance="primary" disabled={enCours || !choix} icon={enCours ? <Spinner size="tiny" /> : <BedRegular />}>
                Mettre sur la chambre
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  )
}
