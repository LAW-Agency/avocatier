import {
  Body1,
  Button,
  Caption1,
  Dropdown,
  Field,
  Input,
  Link,
  MessageBar,
  MessageBarBody,
  Option,
  Spinner,
  Subtitle2,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Tooltip,
  mergeClasses,
  tokens,
} from "@fluentui/react-components"
import { AddRegular, ArrowSyncRegular, DeleteRegular, SaveRegular } from "@fluentui/react-icons"
import { useState, type FormEvent } from "react"
import { formaterHeure, formaterPrix, nombreNuits } from "@partage/dates"
import { CODES_DEVISES, DEVISE_REFERENCE, DEVISES, formaterMontant } from "@partage/devises"
import { chevauchementSaisons, estJourAnnee } from "@partage/regles"
import { SOURCE_TAUX, type TauxDuJour } from "@partage/tauxDeChange"
import type { CodeDevise, RegleSaison } from "@partage/types"
import { Carte, EnTete } from "../composants/commun"
import { useDonneesChargees } from "../donnees"
import { COULEURS_SAISONS, useTarifsStyles } from "./useTarifsStyles.styles"

const SAISONS_MAX = 12
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
const INITIALES_MOIS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]

// Tarifs : prix de base des hébergements, règles des saisons, devises proposées sur la vitrine
export default function Tarifs() {
  return (
    <>
      <EnTete titre="Tarifs" description="Prix par nuit, saisons et devises affichées aux visiteurs du site." />
      <Carte titre="Prix par nuit" description="Prix de base en euros, appliqué en saison normale. Le site calcule le total de chaque séjour nuit par nuit.">
        <FormulaireTarifs />
      </Carte>
      <Carte titre="Devises de la vitrine" description="Les visiteurs choisissent leur région dans le pied de page du site ; les prix s'affichent alors dans leur devise.">
        <FormulaireDevises />
      </Carte>
    </>
  )
}

// Montant saisi (virgule et espaces acceptés), ou null tant qu'il n'est pas lisible
function lire(texte: string): number | null {
  const n = Number(texte.replace(/\s/g, "").replace(",", "."))
  return texte.trim() === "" || !Number.isFinite(n) ? null : n
}

// Saison en cours de saisie : textes bruts des champs, `cle` stable pour React
type LigneSaison = { cle: number; nom: string; debutJour: string; debutMois: string; finJour: string; finMois: string; majoration: string; sejourMin: string }

// « MM-JJ » envoyé au serveur ; chaîne incomplète tant que le jour ou le mois manque (refusée par le serveur)
const jourAnnee = (jour: string, mois: string) => `${mois}-${jour.trim().padStart(2, "0")}`

function versLigne(s: RegleSaison, cle: number): LigneSaison {
  const [debutMois, debutJour] = s.debut.split("-")
  const [finMois, finJour] = s.fin.split("-")
  return { cle, nom: s.nom, debutJour: String(Number(debutJour)), debutMois, finJour: String(Number(finJour)), finMois, majoration: String(Math.round((s.coefficient - 1) * 100)), sejourMin: String(s.sejourMin) }
}

// Saison complète et lisible, sinon null (aperçus et frise l'ignorent)
function versRegle(l: LigneSaison): RegleSaison | null {
  const debut = jourAnnee(l.debutJour, l.debutMois)
  const fin = jourAnnee(l.finJour, l.finMois)
  const majoration = lire(l.majoration)
  if (!l.nom.trim() || !estJourAnnee(debut) || !estJourAnnee(fin) || majoration === null) return null
  return { nom: l.nom.trim(), debut, fin, coefficient: 1 + majoration / 100, sejourMin: lire(l.sejourMin) ?? 1 }
}

const libelleJour = (mmjj: string) => {
  const [mois, jour] = mmjj.split("-").map(Number)
  return `${jour === 1 ? "1er" : jour} ${MOIS[mois - 1]}`
}

// Rang du jour dans une année de 365 jours (0 = 1er janvier)
const rang = (mmjj: string) => nombreNuits("2025-01-01", `2025-${mmjj}`)

function FriseAnnee({ saisons }: { saisons: { regle: RegleSaison; couleur: string }[] }) {
  const styles = useTarifsStyles()
  const segments = saisons.flatMap(({ regle, couleur }) => {
    const debut = rang(regle.debut)
    const fin = rang(regle.fin) + 1
    const plages = debut < fin ? [[debut, fin]] : [[debut, 365], [0, fin]] // passe le 31 décembre
    return plages.map(([de, a]) => ({ cle: `${regle.nom}-${de}`, nom: regle.nom, couleur, de, a }))
  })
  return (
    <div aria-hidden className={styles.frise}>
      <div className={styles.barreFrise}>
        {segments.map((s) => (
          <div key={s.cle} title={s.nom} style={{ position: "absolute", top: 0, bottom: 0, left: `${(s.de / 365) * 100}%`, width: `${((s.a - s.de) / 365) * 100}%`, backgroundColor: s.couleur }} />
        ))}
      </div>
      <div className={styles.mois}>
        {INITIALES_MOIS.map((initiale, i) => (
          <Caption1 key={i}>{initiale}</Caption1>
        ))}
      </div>
    </div>
  )
}

function ChampJourMois({ label, jour, mois, onJour, onMois }: { label: string; jour: string; mois: string; onJour: (v: string) => void; onMois: (v: string) => void }) {
  const styles = useTarifsStyles()
  return (
    <Field label={label} required className={styles.champ}>
      <div className={styles.jourMois}>
        <Input className={styles.jour} input={{ className: styles.nombre, inputMode: "numeric" }} placeholder="Jour" aria-label={`${label} : jour`} value={jour} onChange={(_e, d) => onJour(d.value)} />
        <Dropdown
          className={styles.moisListe}
          placeholder="Mois"
          aria-label={`${label} : mois`}
          value={mois ? MOIS[Number(mois) - 1] : ""}
          selectedOptions={mois ? [mois] : []}
          onOptionSelect={(_e, d) => onMois(d.optionValue ?? "")}
        >
          {MOIS.map((nom, i) => (
            <Option key={nom} value={String(i + 1).padStart(2, "0")}>
              {nom}
            </Option>
          ))}
        </Dropdown>
      </div>
    </Field>
  )
}

// Prix de base et saisons (plages de dates, majoration, séjour minimum) ; aperçu des prix de saison pendant la saisie
function FormulaireTarifs() {
  const styles = useTarifsStyles()
  const { d, executer } = useDonneesChargees()
  const [prix, setPrix] = useState(() => Object.fromEntries(d.hebergements.map((h) => [h.id, String(h.prixNuit)])))
  const [lignes, setLignes] = useState(() => d.saisons.map(versLigne))
  const [prochaineCle, setProchaineCle] = useState(d.saisons.length)
  const [enCours, setEnCours] = useState(false)
  const [etat, setEtat] = useState<{ erreur?: string; ok?: boolean }>({})

  const modifier = (cle: number, champs: Partial<LigneSaison>) => setLignes(lignes.map((l) => (l.cle === cle ? { ...l, ...champs } : l)))
  function ajouter() {
    setLignes([...lignes, { cle: prochaineCle, nom: "", debutJour: "", debutMois: "", finJour: "", finMois: "", majoration: "", sejourMin: "1" }])
    setProchaineCle(prochaineCle + 1)
  }

  const couleur = (i: number) => COULEURS_SAISONS[i % COULEURS_SAISONS.length]
  const completes = lignes.flatMap((l, i) => {
    const regle = versRegle(l)
    return regle ? [{ cle: l.cle, regle, couleur: couleur(i) }] : []
  })
  const chevauchement = chevauchementSaisons(completes.map((s) => s.regle))

  // Même arrondi que le devis (calculerDevis)
  function prixDeSaison(id: string, regle: RegleSaison): string {
    const base = lire(prix[id] ?? "")
    return base === null ? "—" : formaterPrix(Math.round(base * regle.coefficient))
  }

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    const resultat = await executer("PUT", "/api/hotes/tarifs", {
      prix: Object.fromEntries(d.hebergements.map((h) => [h.id, lire(prix[h.id] ?? "")])),
      saisons: lignes.map((l) => ({
        nom: l.nom.trim(),
        debut: jourAnnee(l.debutJour, l.debutMois),
        fin: jourAnnee(l.finJour, l.finMois),
        coefficient: 1 + (lire(l.majoration) ?? Number.NaN) / 100,
        sejourMin: lire(l.sejourMin),
      })),
    })
    setEnCours(false)
    setEtat(resultat.ok ? { ok: true } : { erreur: resultat.erreur })
  }

  return (
    <form className={styles.pile} onSubmit={envoyer}>
      <div className={styles.cadreTable}>
        <Table aria-label="Prix par nuit">
          <TableHeader className={styles.enteteTable}>
            <TableRow>
              <TableHeaderCell className={styles.premiere}>Hébergement</TableHeaderCell>
              <TableHeaderCell style={{ width: "180px" }}>Prix de base / nuit</TableHeaderCell>
              {completes.map((s) => (
                <TableHeaderCell key={s.cle} style={{ width: "120px" }}>
                  <span style={{ width: "100%", textAlign: "right" }}>{s.regle.nom}</span>
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {d.hebergements.map((h) => (
              <TableRow key={h.id}>
                <TableCell className={styles.premiere}>
                  <TableCellLayout description={`${h.type === "bungalow" ? "Bungalow" : "Chambre"}, ${h.capaciteMax} pers.`}>{h.nom}</TableCellLayout>
                </TableCell>
                <TableCell>
                  <Input
                    className={styles.champNombre}
                    input={{ className: styles.nombre, inputMode: "numeric" }}
                    contentAfter="€"
                    aria-label={`Prix de base de ${h.nom}`}
                    value={prix[h.id]}
                    onChange={(_e, data) => setPrix({ ...prix, [h.id]: data.value })}
                    required
                  />
                </TableCell>
                {completes.map((s) => (
                  <TableCell key={s.cle} className={styles.apercu}>
                    <span style={{ width: "100%" }}>{prixDeSaison(h.id, s.regle)}</span>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className={mergeClasses(styles.pile, styles.pileSerree)}>
        <div>
          <Subtitle2 as="h3" className={styles.titre}>Saisons</Subtitle2>
          <Body1 block className={styles.secondaire}>
            Chaque saison revient tous les ans aux mêmes dates. Sa majoration s&apos;applique à tous les hébergements, pour chaque nuit passée dans la saison ; son séjour minimum, aux arrivées pendant la saison.
          </Body1>
        </div>

        <FriseAnnee saisons={completes} />

        <div className={styles.saisons}>
          <div className={styles.normale}>
            <Body1 style={{ fontWeight: tokens.fontWeightSemibold }}>
              <span className={styles.pastille} style={{ backgroundColor: tokens.colorNeutralBackground5 }} />
              Saison normale
            </Body1>
            <Body1 className={styles.secondaire}>Toutes les nuits hors des saisons ci-dessous : prix de base, sans majoration, une nuit minimum.</Body1>
          </div>

          {lignes.map((l, i) => {
            const regle = versRegle(l)
            return (
              <fieldset key={l.cle} className={styles.saison}>
                <legend className={styles.invisible}>{l.nom || `Saison ${i + 1}`}</legend>
                <div className={styles.titreSaison}>
                  <Field
                    label={
                      <>
                        <span className={styles.pastille} style={{ backgroundColor: couleur(i) }} />
                        Nom de la saison
                      </>
                    }
                    required
                    style={{ flex: 1 }}
                  >
                    <Input placeholder="Vacances, Noël…" maxLength={40} value={l.nom} onChange={(_e, data) => modifier(l.cle, { nom: data.value })} />
                  </Field>
                  <Tooltip content={`Supprimer la saison ${l.nom}`.trim()} relationship="label">
                    <Button appearance="subtle" icon={<DeleteRegular />} onClick={() => setLignes(lignes.filter((autre) => autre.cle !== l.cle))} />
                  </Tooltip>
                </div>
                <div className={styles.deuxColonnes}>
                  <ChampJourMois label="Du" jour={l.debutJour} mois={l.debutMois} onJour={(debutJour) => modifier(l.cle, { debutJour })} onMois={(debutMois) => modifier(l.cle, { debutMois })} />
                  <ChampJourMois label="Au (dernière nuit)" jour={l.finJour} mois={l.finMois} onJour={(finJour) => modifier(l.cle, { finJour })} onMois={(finMois) => modifier(l.cle, { finMois })} />
                </div>
                <div className={styles.deuxColonnes}>
                  <Field label="Majoration" required className={styles.champ}>
                    <Input className={styles.champ} input={{ className: styles.nombre, inputMode: "decimal" }} contentAfter="%" value={l.majoration} onChange={(_e, data) => modifier(l.cle, { majoration: data.value })} />
                  </Field>
                  <Field label="Séjour minimum" required className={styles.champ}>
                    <Input className={styles.champ} input={{ className: styles.nombre, inputMode: "numeric" }} contentAfter="nuits" value={l.sejourMin} onChange={(_e, data) => modifier(l.cle, { sejourMin: data.value })} />
                  </Field>
                </div>
                {regle && (
                  <Caption1 className={styles.secondaire}>
                    Du {libelleJour(regle.debut)} au {libelleJour(regle.fin)} inclus, chaque année
                  </Caption1>
                )}
              </fieldset>
            )
          })}

          {lignes.length < SAISONS_MAX && (
            <Button className={styles.ajouter} icon={<AddRegular />} onClick={ajouter}>
              Ajouter une saison
            </Button>
          )}
        </div>
        <Caption1 className={styles.secondaire}>Une majoration négative accorde une remise (ex. −10 % en basse saison). Deux saisons ne peuvent pas se partager une même nuit.</Caption1>
      </div>

      {chevauchement && (
        <MessageBar intent="warning">
          <MessageBarBody>
            « {chevauchement[0]} » et « {chevauchement[1]} » se chevauchent : ajustez leurs dates avant d&apos;enregistrer.
          </MessageBarBody>
        </MessageBar>
      )}
      {etat.erreur && (
        <MessageBar intent="error">
          <MessageBarBody>{etat.erreur}</MessageBarBody>
        </MessageBar>
      )}
      {etat.ok && !enCours && (
        <MessageBar intent="success">
          <MessageBarBody>Tarifs enregistrés : ils s&apos;appliquent aux nouvelles demandes. Les réservations déjà reçues gardent leur montant.</MessageBarBody>
        </MessageBar>
      )}
      <div className={styles.actions}>
        <Button type="submit" appearance="primary" disabled={enCours} icon={enCours ? <Spinner size="tiny" /> : <SaveRegular />}>
          Enregistrer les tarifs
        </Button>
      </div>
    </form>
  )
}

const versTextes = (taux: Record<CodeDevise, number>) =>
  Object.fromEntries(CODES_DEVISES.map((c) => [c, String(taux[c]).replace(".", ",")])) as Record<CodeDevise, string>

// Devises proposées dans le pied de page de la vitrine, taux de conversion et devise par défaut
function FormulaireDevises() {
  const styles = useTarifsStyles()
  const { d, executer } = useDonneesChargees()
  const reglages = d.devises
  const exemple = d.hebergements[0]
  const [actives, setActives] = useState<CodeDevise[]>(reglages.actives)
  const [taux, setTaux] = useState(() => versTextes(reglages.taux))
  const [parDefaut, setParDefaut] = useState<CodeDevise>(reglages.parDefaut)
  const [enCours, setEnCours] = useState(false)
  const [etat, setEtat] = useState<{ erreur?: string; ok?: boolean }>({})
  // Taux du jour : remplissent les champs, enregistrés seulement avec « Enregistrer les devises »
  const [chargementTaux, setChargementTaux] = useState(false)
  const [tauxCharges, setTauxCharges] = useState<{ date: string } | { erreur: string } | null>(null)

  const estActive = (code: CodeDevise) => code === DEVISE_REFERENCE || actives.includes(code)
  function basculer(code: CodeDevise, active: boolean) {
    setActives(active ? [...actives, code] : actives.filter((c) => c !== code))
    // Devise par défaut retirée : retour à l'euro
    if (!active && parDefaut === code) setParDefaut(DEVISE_REFERENCE)
  }

  function apercu(code: CodeDevise): string {
    if (!exemple) return "—"
    const t = code === DEVISE_REFERENCE ? 1 : lire(taux[code])
    return t === null || t <= 0 ? "—" : formaterMontant(exemple.prixNuit, code, { ...reglages, taux: { ...reglages.taux, [code]: t } })
  }

  async function chargerTaux() {
    setChargementTaux(true)
    const resultat = await window.avocatier.api<TauxDuJour>("GET", "/api/hotes/taux-du-jour")
    setChargementTaux(false)
    if (!resultat.ok) return setTauxCharges({ erreur: resultat.erreur })
    if (!resultat.donnees.ok) return setTauxCharges({ erreur: resultat.donnees.erreur })
    setTaux(versTextes(resultat.donnees.taux))
    setTauxCharges({ date: resultat.donnees.date })
  }

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    setTauxCharges(null)
    const resultat = await executer("PUT", "/api/hotes/devises", {
      parDefaut,
      actives: CODES_DEVISES.filter(estActive),
      taux: Object.fromEntries(CODES_DEVISES.map((c) => [c, c === DEVISE_REFERENCE ? 1 : lire(taux[c])])),
    })
    setEnCours(false)
    setEtat(resultat.ok ? { ok: true } : { erreur: resultat.erreur })
  }

  return (
    <form className={styles.pile} onSubmit={envoyer}>
      <div className={styles.cadreTable}>
        <Table aria-label="Devises">
          <TableHeader className={styles.enteteTable}>
            <TableRow>
              <TableHeaderCell className={styles.premiere}>Devise</TableHeaderCell>
              <TableHeaderCell style={{ width: "120px" }}>Proposée</TableHeaderCell>
              <TableHeaderCell style={{ width: "180px" }}>Taux : 1 € =</TableHeaderCell>
              {exemple && (
                <TableHeaderCell style={{ width: "180px" }}>
                  <span style={{ width: "100%", textAlign: "right" }}>{exemple.nom}, 1 nuit</span>
                </TableHeaderCell>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {CODES_DEVISES.map((code) => {
              const info = DEVISES[code]
              const reference = code === DEVISE_REFERENCE
              return (
                <TableRow key={code}>
                  <TableCell className={styles.premiere}>
                    <TableCellLayout description={info.region}>
                      {info.nom} <span className={styles.secondaire}>({info.symbole})</span>
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <Switch checked={estActive(code)} disabled={reference} onChange={(_e, data) => basculer(code, data.checked)} aria-label={`Proposer ${info.nom.toLowerCase()} aux visiteurs`} />
                  </TableCell>
                  <TableCell>
                    <Input
                      className={styles.champNombre}
                      input={{ className: styles.nombre, inputMode: "decimal" }}
                      contentAfter={info.symbole}
                      value={reference ? "1" : taux[code]}
                      disabled={reference}
                      onChange={(_e, data) => setTaux({ ...taux, [code]: data.value })}
                      aria-label={`Taux de conversion : 1 euro en ${info.nom.toLowerCase()}`}
                      required={!reference}
                    />
                  </TableCell>
                  {exemple && (
                    <TableCell className={styles.apercu}>
                      <span style={{ width: "100%" }}>{apercu(code)}</span>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Field label="Devise par défaut de la vitrine" hint="Affichée tant que le visiteur n'a pas choisi sa région dans le pied de page." className={styles.defaut}>
        <Dropdown
          value={`${DEVISES[parDefaut].nom} (${DEVISES[parDefaut].symbole})`}
          selectedOptions={[parDefaut]}
          onOptionSelect={(_e, data) => data.optionValue && setParDefaut(data.optionValue as CodeDevise)}
        >
          {CODES_DEVISES.filter(estActive).map((code) => (
            <Option key={code} value={code}>
              {`${DEVISES[code].nom} (${DEVISES[code].symbole})`}
            </Option>
          ))}
        </Dropdown>
      </Field>

      <Body1 className={styles.secondaire}>
        Les tarifs restent fixés en euros : les autres devises sont une conversion indicative, arrondie (l&apos;ariary à 1 000 Ar près). Taux enregistrés le {formaterHeure(reglages.misAJourLe)}. Taux du jour fournis par{" "}
        <Link onClick={() => window.avocatier.ouvrirLien(SOURCE_TAUX.url)}>{SOURCE_TAUX.nom}</Link>.
      </Body1>

      {tauxCharges && "erreur" in tauxCharges && (
        <MessageBar intent="error">
          <MessageBarBody>{tauxCharges.erreur}</MessageBarBody>
        </MessageBar>
      )}
      {tauxCharges && "date" in tauxCharges && !chargementTaux && (
        <MessageBar intent="info">
          <MessageBarBody>Taux du {formaterHeure(tauxCharges.date)} reportés dans le tableau. Vérifiez-les, puis enregistrez pour les appliquer à la vitrine.</MessageBarBody>
        </MessageBar>
      )}
      {etat.erreur && (
        <MessageBar intent="error">
          <MessageBarBody>{etat.erreur}</MessageBarBody>
        </MessageBar>
      )}
      {etat.ok && !enCours && (
        <MessageBar intent="success">
          <MessageBarBody>Devises enregistrées : la vitrine affiche déjà les nouveaux montants.</MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.actions}>
        <Button type="submit" appearance="primary" disabled={enCours || chargementTaux} icon={enCours ? <Spinner size="tiny" /> : <SaveRegular />}>
          Enregistrer les devises
        </Button>
        <Button disabled={enCours || chargementTaux} icon={chargementTaux ? <Spinner size="tiny" /> : <ArrowSyncRegular />} onClick={chargerTaux}>
          Récupérer les taux du jour
        </Button>
      </div>
    </form>
  )
}
