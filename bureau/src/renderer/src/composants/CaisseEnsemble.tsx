import {
  Badge,
  Body1,
  Caption1,
  Dropdown,
  MessageBar,
  MessageBarBody,
  Option,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  mergeClasses,
} from "@fluentui/react-components"
import { BedRegular, MoneyRegular, ReceiptRegular, WalletRegular } from "@fluentui/react-icons"
import { useEffect, useState } from "react"
import { ajouterJours, formaterDate, nombreNuits } from "@partage/dates"
import { DEVISES, formaterDansDevise } from "@partage/devises"
import type { BilanRestaurant, CodeDevise, DateISO } from "@partage/types"
import { MODES_PAIEMENT } from "../libelles"
import { useGestionStyles } from "../pages/useGestionStyles.styles"
import { useRestaurantStyles } from "../pages/useRestaurantStyles.styles"
import { evolution, repartition } from "../statistiques"
import { Carte, ChargementLogo, Vide } from "./commun"
import { Histogramme, Indicateur, Repartition } from "./graphiques"
import { useCadreTableStyles } from "./useCommunStyles.styles"

const ariary = (montant: number) => formaterDansDevise(montant, "MGA")
// « 1,2 M » au-dessus des barres
const court = (montant: number) => (montant >= 1_000_000 ? `${Math.round(montant / 100_000) / 10} M` : montant >= 1000 ? `${Math.round(montant / 1000)} k` : String(montant))

type ChoixPeriode = "jour" | "semaine" | "trente" | "mois" | "moisPrecedent" | "deuxMois"
const PERIODES: Record<ChoixPeriode, string> = {
  jour: "Aujourd'hui",
  semaine: "7 derniers jours",
  trente: "30 derniers jours",
  mois: "Ce mois-ci",
  moisPrecedent: "Le mois dernier",
  deuxMois: "2 derniers mois",
}

// Période (dates comprises) et la précédente de même longueur, pour l'évolution
function periode(choix: ChoixPeriode, aujourdhui: DateISO): { du: DateISO; au: DateISO; avant: { du: DateISO; au: DateISO } } {
  const debutMois = `${aujourdhui.slice(0, 8)}01`
  const glissante = (jours: number) => ({ du: ajouterJours(aujourdhui, -(jours - 1)), au: aujourdhui })
  const p =
    choix === "jour"
      ? glissante(1)
      : choix === "semaine"
        ? glissante(7)
        : choix === "trente"
          ? glissante(30)
          : choix === "deuxMois"
            ? glissante(60)
            : choix === "mois"
              ? { du: debutMois, au: aujourdhui }
              : (() => {
                  const fin = ajouterJours(debutMois, -1)
                  return { du: `${fin.slice(0, 8)}01`, au: fin }
                })()
  const longueur = nombreNuits(p.du, p.au) + 1
  return { ...p, avant: { du: ajouterJours(p.du, -longueur), au: ajouterJours(p.du, -1) } }
}

// Vue d'ensemble du restaurant et du bar (gérants) : ventes de tous les postes sur une période, évolution, ventes par
// jour, par poste, par caissier, par catégorie et par mode de paiement, articles les plus vendus et caisses à écart
export default function CaisseEnsemble({ aujourdhui }: { aujourdhui: DateISO }) {
  const styles = useRestaurantStyles()
  const gestion = useGestionStyles()
  const cadre = useCadreTableStyles()
  const [choix, setChoix] = useState<ChoixPeriode>("trente")
  const [bilans, setBilans] = useState<{ cle: string; actuel: BilanRestaurant; avant: BilanRestaurant } | { cle: string; erreur: string } | null>(null)
  const { du, au, avant } = periode(choix, aujourdhui)
  const cle = `${du}/${au}`

  useEffect(() => {
    let annule = false
    const lire = (p: { du: string; au: string }) => window.avocatier.api<BilanRestaurant>("GET", `/api/hotes/caisse/bilan?du=${p.du}&au=${p.au}`)
    void Promise.all([lire({ du, au }), lire(avant)]).then(([a, b]) => {
      if (annule) return
      setBilans(a.ok && b.ok ? { cle: `${du}/${au}`, actuel: a.donnees, avant: b.donnees } : { cle: `${du}/${au}`, erreur: a.ok ? (b.ok ? "" : b.erreur) : a.erreur })
    })
    return () => {
      annule = true
    }
  }, [du, au, avant.du, avant.au])

  const selecteur = (
    <div className={styles.barreOutils}>
      <Dropdown value={PERIODES[choix]} selectedOptions={[choix]} onOptionSelect={(_e, data) => setChoix(data.optionValue as ChoixPeriode)} aria-label="Période" className={gestion.periode}>
        {(Object.keys(PERIODES) as ChoixPeriode[]).map((c) => (
          <Option key={c} value={c}>
            {PERIODES[c]}
          </Option>
        ))}
      </Dropdown>
      <Caption1 className={styles.secondaire}>
        {du === au ? formaterDate(du, { month: "long" }) : `Du ${formaterDate(du, { weekday: undefined, month: "long", year: undefined })} au ${formaterDate(au, { weekday: undefined, month: "long" })}`} · tous les postes, en ariary
      </Caption1>
    </div>
  )

  if (!bilans || bilans.cle !== cle) return (
    <div className={styles.page}>
      {selecteur}
      <ChargementLogo texte="Calcul des ventes…" taille="moyen" />
    </div>
  )
  if ("erreur" in bilans) return (
    <div className={styles.page}>
      {selecteur}
      <MessageBar intent="error">
        <MessageBarBody>{bilans.erreur}</MessageBarBody>
      </MessageBar>
    </div>
  )

  const b = bilans.actuel
  const a = bilans.avant
  const ticketMoyen = (x: BilanRestaurant) => (x.tickets ? Math.round(x.ventes / x.tickets) : 0)
  // Un jour sans vente compte aussi (barre vide)
  const jours = Array.from({ length: nombreNuits(du, au) + 1 }, (_, i) => ajouterJours(du, i))
  const parJour = new Map(b.parJour.map((j) => [j.jour, j]))
  const libelleMode = (m: BilanRestaurant["parMode"][number]) => `${MODES_PAIEMENT[m.mode]}${m.devise !== "MGA" ? ` en ${DEVISES[m.devise].symbole}` : ""}`
  const aSurveiller = b.sessions.filter((s) => !s.fermeeLe || Object.values(s.ecarts).some((e) => e))
  const ecartTotal = b.sessions.reduce((t, s) => t + (s.ecarts.MGA ?? 0), 0)

  return (
    <div className={styles.page}>
      {selecteur}
      {b.tickets === 0 && b.annules === 0 ? (
        <Vide Icone={ReceiptRegular} titre="Aucune vente sur la période" texte="Les ventes de tous les postes de caisse s'afficheront ici." />
      ) : (
        <>
          <div className={gestion.chiffres} data-visite="caisse-chiffres">
            <Indicateur Icone={MoneyRegular} libelle="Ventes" valeur={ariary(b.ventes)} evolution={evolution(b.ventes, a.ventes)} note={`${b.tickets} tickets${b.annules ? ` · ${b.annules} annulés (${ariary(b.montantAnnule)})` : ""}`} />
            <Indicateur Icone={WalletRegular} libelle="Payé sur place" valeur={ariary(b.encaisse)} evolution={evolution(b.encaisse, a.encaisse)} note="Espèces, carte, mobile money" />
            <Indicateur Icone={BedRegular} libelle="Sur les chambres" valeur={ariary(b.surChambres)} evolution={evolution(b.surChambres, a.surChambres)} note="Réglé avec le séjour" />
            <Indicateur Icone={ReceiptRegular} libelle="Ticket moyen" valeur={ariary(ticketMoyen(b))} evolution={evolution(ticketMoyen(b), ticketMoyen(a))} note={`Période précédente : ${ariary(a.ventes)}`} />
          </div>

          {jours.length > 1 && (
            <Carte data-visite="caisse-details" titre="Ventes par jour" description="Tous les postes ; la part mise sur les chambres en plus clair">
              <Histogramme
                barres={jours.map((j) => ({
                  cle: j,
                  libelle: jours.length > 31 ? (j.endsWith("-01") || j === du ? formaterDate(j, { weekday: undefined, month: "short", year: undefined }) : "") : j.slice(8),
                  valeur: parJour.get(j)?.ventes ?? 0,
                  secondaire: parJour.get(j)?.surChambres ?? 0,
                  actuelle: j === aujourdhui,
                  etiquette: jours.length <= 14 ? court(parJour.get(j)?.ventes ?? 0) : "",
                }))}
                formater={ariary}
                legende={{ principale: "Ventes", secondaire: "Sur les chambres" }}
              />
            </Carte>
          )}

          <div className={gestion.moitie}>
            <Carte titre="Par poste">
              <Repartition lignes={repartition(b.parPoste.map((p) => ({ cle: p.posteId, valeur: p.ventes }))).map((p) => ({ cle: p.cle, libelle: b.parPoste.find((x) => x.posteId === p.cle)!.nom, part: p.part, detail: `${ariary(p.valeur)} · ${b.parPoste.find((x) => x.posteId === p.cle)!.tickets} tickets` }))} />
            </Carte>
            <Carte titre="Par caissier">
              <Repartition
                lignes={repartition(b.parCaissier.map((c, i) => ({ cle: c.membreId ?? `supprime-${i}`, valeur: c.ventes }))).map((c) => {
                  const m = b.parCaissier.find((x, i) => (x.membreId ?? `supprime-${i}`) === c.cle)!
                  return { cle: c.cle, libelle: m.nom, part: c.part, detail: `${ariary(c.valeur)} · ${m.tickets} tickets` }
                })}
              />
            </Carte>
            <Carte titre="Par catégorie de la carte">
              <Repartition lignes={repartition(b.parCategorie.map((c) => ({ cle: c.categorie, valeur: c.montant }))).map((c) => ({ cle: c.cle, libelle: c.cle, part: c.part, detail: ariary(c.valeur) }))} />
            </Carte>
            <Carte titre="Payé sur place, par mode" description="Montant net (monnaie rendue déduite) ; reçu dans une autre devise : montant reçu en plus">
              {b.parMode.length ? (
                <Repartition
                  lignes={repartition(b.parMode.map((m) => ({ cle: `${m.mode}-${m.devise}`, valeur: m.contreValeur }))).map((m) => {
                    const ligne = b.parMode.find((x) => `${x.mode}-${x.devise}` === m.cle)!
                    return { cle: m.cle, libelle: libelleMode(ligne), part: m.part, detail: `${ariary(m.valeur)}${ligne.devise !== "MGA" ? ` (${formaterDansDevise(ligne.montant, ligne.devise as CodeDevise)})` : ""}` }
                  })}
                />
              ) : (
                <Body1 className={styles.secondaire}>Tout a été mis sur les chambres.</Body1>
              )}
            </Carte>
          </div>

          <div className={gestion.moitie}>
            <Carte titre="Articles les plus vendus">
              <div className={cadre.root}>
                <Table size="small" aria-label="Articles les plus vendus">
                  <TableHeader className={cadre.entete}>
                    <TableRow>
                      <TableHeaderCell className={cadre.premiere}>Article</TableHeaderCell>
                      <TableHeaderCell style={{ width: "90px" }}>
                        <span className={cadre.droite}>Quantité</span>
                      </TableHeaderCell>
                      <TableHeaderCell style={{ width: "130px" }}>
                        <span className={cadre.droite}>Montant</span>
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {b.articles.map((x) => (
                      <TableRow key={x.libelle}>
                        <TableCell className={cadre.premiere}>{x.libelle}</TableCell>
                        <TableCell>
                          <span className={mergeClasses(cadre.droite, cadre.nombre)}>{x.quantite}</span>
                        </TableCell>
                        <TableCell>
                          <span className={mergeClasses(cadre.droite, cadre.nombre)}>{ariary(x.montant)}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Carte>
            <Carte
              titre="Caisses à surveiller"
              description={`${b.sessions.length} caisses sur la période · écart cumulé ${ecartTotal > 0 ? "+" : ""}${ariary(ecartTotal)}`}
            >
              {aSurveiller.length === 0 ? (
                <Body1 className={styles.secondaire}>Toutes les caisses de la période sont clôturées sans écart.</Body1>
              ) : (
                <div className={cadre.root}>
                  <Table size="small" aria-label="Caisses à surveiller">
                    <TableHeader className={cadre.entete}>
                      <TableRow>
                        <TableHeaderCell className={cadre.premiere}>Caisse</TableHeaderCell>
                        <TableHeaderCell style={{ width: "120px" }}>Écart</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aSurveiller.map((s) => {
                        const ecarts = Object.entries(s.ecarts).filter(([, e]) => e) as [CodeDevise, number][]
                        return (
                          <TableRow key={s.id}>
                            <TableCell className={cadre.premiere}>
                              <Body1 block>
                                {s.poste} · {formaterDate(s.ouverteLe.slice(0, 10), { year: undefined })}
                              </Body1>
                              <Caption1 className={styles.secondaire}>
                                {s.caissier}
                                {s.commentaire && ` · « ${s.commentaire} »`}
                              </Caption1>
                            </TableCell>
                            <TableCell>
                              {!s.fermeeLe ? (
                                <Badge appearance="tint" color="success" shape="rounded">
                                  Ouverte
                                </Badge>
                              ) : (
                                <Badge appearance="tint" color={ecarts.some(([, e]) => e < 0) ? "danger" : "warning"} shape="rounded">
                                  {ecarts.map(([d, e]) => `${e > 0 ? "+" : ""}${formaterDansDevise(e, d)}`).join(", ")}
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Carte>
          </div>
        </>
      )}
    </div>
  )
}
