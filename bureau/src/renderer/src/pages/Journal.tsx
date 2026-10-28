import {
  Avatar,
  Badge,
  Button,
  Caption1,
  Checkbox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Dropdown,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MessageBar,
  MessageBarBody,
  Option,
  SearchBox,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Tooltip,
  makeStyles,
  tokens,
  type BadgeProps,
} from "@fluentui/react-components"
import {
  ArrowSyncRegular,
  BedRegular,
  CalendarLtrRegular,
  ChevronDownRegular,
  DeleteRegular,
  HistoryRegular,
  LockClosedRegular,
  MailInboxRegular,
  MoneyRegular,
  PeopleRegular,
  PeopleTeamRegular,
  SignOutRegular,
  TagRegular,
  type FluentIcon,
} from "@fluentui/react-icons"
import { useCallback, useEffect, useState } from "react"
import { formaterHeure, pluriel } from "@partage/dates"
import type { CategorieJournal, EntreeJournal } from "@partage/types"
import { ChargementLogo, EnTete, Vide } from "../composants/commun"
import { useCadreTableStyles } from "../composants/useCommunStyles.styles"
import { useDonneesChargees, useLectureSeule } from "../donnees"
import { useAnnoncer } from "../toasts"

const CATEGORIES: Record<CategorieJournal, { libelle: string; Icone: FluentIcon; couleur: BadgeProps["color"] }> = {
  connexion: { libelle: "Connexion", Icone: SignOutRegular, couleur: "informative" },
  reservation: { libelle: "Réservation", Icone: MailInboxRegular, couleur: "brand" },
  client: { libelle: "Client", Icone: PeopleRegular, couleur: "informative" },
  chambre: { libelle: "Chambre", Icone: BedRegular, couleur: "warning" },
  paiement: { libelle: "Encaissement", Icone: MoneyRegular, couleur: "success" },
  planning: { libelle: "Planning", Icone: CalendarLtrRegular, couleur: "brand" },
  tarifs: { libelle: "Tarifs", Icone: TagRegular, couleur: "important" },
  equipe: { libelle: "Équipe", Icone: PeopleTeamRegular, couleur: "important" },
  journal: { libelle: "Journal", Icone: HistoryRegular, couleur: "danger" },
}

type Periode = "jour" | "semaine" | "mois" | "tout"
const PERIODES: Record<Periode, { libelle: string; jours: number | null }> = {
  jour: { libelle: "Dernières 24 heures", jours: 1 },
  semaine: { libelle: "7 derniers jours", jours: 7 },
  mois: { libelle: "30 derniers jours", jours: 30 },
  tout: { libelle: "Tout l'historique", jours: null },
}

// Effacements groupés proposés aux gérants
type Effacement = { ids: string[] } | { avant: string } | { tout: true }
const ANCIENNES = [30, 90, 365]

const PAR_PAGE = 100

const useStyles = makeStyles({
  filtres: { display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: tokens.spacingHorizontalM, rowGap: tokens.spacingVerticalS },
  recherche: { flex: 1, minWidth: "240px", maxWidth: "420px" },
  liste: { minWidth: "180px" },
  detail: { color: tokens.colorNeutralForeground2, whiteSpace: "normal", wordBreak: "break-word" },
  date: { whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", color: tokens.colorNeutralForeground2 },
  plus: { display: "flex", justifyContent: "center" },
})

const normaliser = (texte: string) => texte.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()

// Journal d'activité : connexions et actions de l'équipe (réservations, encaissements, chambres, tarifs, comptes).
// Consultable par toute l'équipe ; seuls les gérants suppriment des entrées (l'API le vérifie, et note
// l'effacement lui-même au journal)
export default function Journal() {
  const lectureSeule = useLectureSeule()
  const styles = useStyles()
  const cadre = useCadreTableStyles()
  const { d, gerant } = useDonneesChargees()
  const { annoncer } = useAnnoncer()
  const [entrees, setEntrees] = useState<EntreeJournal[] | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [texte, setTexte] = useState("")
  const [categorie, setCategorie] = useState<CategorieJournal | "toutes">("toutes")
  const [auteur, setAuteur] = useState("tous")
  const [periode, setPeriode] = useState<Periode>("tout")
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [affichees, setAffichees] = useState(PAR_PAGE)
  const [aConfirmer, setAConfirmer] = useState<{ effacement: Effacement; titre: string; texte: string } | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [actualisation, setActualisation] = useState(false)

  const charger = useCallback(async () => {
    const resultat = await window.avocatier.api<{ entrees: EntreeJournal[] }>("GET", "/api/hotes/journal")
    if (resultat.ok) {
      setEntrees(resultat.donnees.entrees)
      setErreur(null)
    } else setErreur(resultat.erreur)
  }, [])

  // Rechargé avec les données du logiciel (après chaque action de l'équipe et chaque nouveauté)
  useEffect(() => {
    void charger()
  }, [charger, d])

  const auteurs = [...new Set((entrees ?? []).map((e) => e.auteur))].sort((a, b) => a.localeCompare(b))
  const cherche = normaliser(texte.trim())
  const limite = PERIODES[periode].jours === null ? null : Date.now() - PERIODES[periode].jours! * 86_400_000
  const filtrees = (entrees ?? []).filter(
    (e) =>
      (categorie === "toutes" || e.categorie === categorie) &&
      (auteur === "tous" || e.auteur === auteur) &&
      (limite === null || Date.parse(e.le) >= limite) &&
      (!cherche || normaliser(`${e.auteur} ${e.action} ${e.detail} ${CATEGORIES[e.categorie].libelle}`).includes(cherche)),
  )
  const visibles = filtrees.slice(0, affichees)
  const toutesCochees = visibles.length > 0 && visibles.every((e) => selection.has(e.id))
  const quelquesCochees = visibles.some((e) => selection.has(e.id))

  function cocher(id: string, coche: boolean) {
    const suivante = new Set(selection)
    if (coche) suivante.add(id)
    else suivante.delete(id)
    setSelection(suivante)
  }

  async function effacer(effacement: Effacement) {
    setEnCours(true)
    const resultat = await window.avocatier.api<{ nombre: number }>("DELETE", "/api/hotes/journal", effacement)
    setEnCours(false)
    setAConfirmer(null)
    if (!resultat.ok) {
      annoncer({ titre: "Suppression impossible", texte: resultat.erreur, intent: "error" })
      return
    }
    setSelection(new Set())
    annoncer({ titre: "Journal mis à jour", texte: `${pluriel(resultat.donnees.nombre, "entrée supprimée", "entrées supprimées")}.`, intent: "success" })
    await charger()
  }

  const boutonSupprimer = (
    <Button
      icon={<DeleteRegular />}
      // Réception : bouton grisé mais atteignable, pour lire l'info-bulle
      disabled={(gerant && selection.size === 0) || lectureSeule}
      disabledFocusable={!gerant}
      onClick={() =>
        setAConfirmer({
          effacement: { ids: [...selection] },
          titre: `Supprimer ${pluriel(selection.size, "entrée", "entrées")} ?`,
          texte: "Les entrées cochées disparaîtront du journal pour toute l'équipe. La suppression sera elle-même notée au journal.",
        })
      }
    >
      Supprimer la sélection{selection.size > 0 ? ` (${selection.size})` : ""}
    </Button>
  )

  return (
    <>
      <EnTete
        titre="Journal d'activité"
        description="Historique des connexions et des actions de l'équipe : qui a fait quoi, et quand."
        actions={
          <>
            <Tooltip content="Actualiser" relationship="label">
              <Button
                disabled={actualisation}
                icon={actualisation ? <Spinner size="tiny" /> : <ArrowSyncRegular />}
                onClick={async () => {
                  setActualisation(true)
                  await charger()
                  setActualisation(false)
                }}
              />
            </Tooltip>
            {gerant ? (
              boutonSupprimer
            ) : (
              <Tooltip content="Seuls les gérants peuvent supprimer des entrées du journal." relationship="description">
                {boutonSupprimer}
              </Tooltip>
            )}
            {!gerant ? (
              <Tooltip content="Réservé aux gérants." relationship="description">
                <Button appearance="primary" icon={<LockClosedRegular />} iconPosition="after" disabledFocusable>
                  Effacer le journal
                </Button>
              </Tooltip>
            ) : (
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button appearance="primary" icon={<ChevronDownRegular />} iconPosition="after" disabled={lectureSeule}>
                  Effacer le journal
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  {ANCIENNES.map((jours) => (
                    <MenuItem
                      key={jours}
                      onClick={() =>
                        setAConfirmer({
                          effacement: { avant: new Date(Date.now() - jours * 86_400_000).toISOString() },
                          titre: `Effacer les entrées de plus de ${jours} jours ?`,
                          texte: "Les entrées plus anciennes disparaîtront du journal pour toute l'équipe. L'effacement sera lui-même noté au journal.",
                        })
                      }
                    >
                      Entrées de plus de {jours} jours
                    </MenuItem>
                  ))}
                  <MenuItem
                    icon={<DeleteRegular />}
                    onClick={() =>
                      setAConfirmer({
                        effacement: { tout: true },
                        titre: "Effacer tout le journal ?",
                        texte: "Toutes les entrées disparaîtront pour toute l'équipe. Seul l'effacement lui-même restera noté.",
                      })
                    }
                  >
                    Tout le journal
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
            )}
          </>
        }
      />

      {!gerant && (
        <MessageBar intent="info" icon={<LockClosedRegular />}>
          <MessageBarBody>Vous pouvez consulter le journal. Seuls les gérants peuvent en supprimer des entrées.</MessageBarBody>
        </MessageBar>
      )}
      {erreur && (
        <MessageBar intent="error">
          <MessageBarBody>{erreur}</MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.filtres} data-visite="journal-filtres">
        <SearchBox className={styles.recherche} placeholder="Rechercher une action, une référence, un nom" value={texte} onChange={(_e, data) => setTexte(data.value)} />
        <Dropdown
          className={styles.liste}
          aria-label="Catégorie"
          value={categorie === "toutes" ? "Toutes les catégories" : CATEGORIES[categorie].libelle}
          selectedOptions={[categorie]}
          onOptionSelect={(_e, data) => setCategorie(data.optionValue as CategorieJournal | "toutes")}
        >
          <Option value="toutes">Toutes les catégories</Option>
          {(Object.keys(CATEGORIES) as CategorieJournal[]).map((c) => (
            <Option key={c} value={c}>
              {CATEGORIES[c].libelle}
            </Option>
          ))}
        </Dropdown>
        <Dropdown
          className={styles.liste}
          aria-label="Membre de l'équipe"
          value={auteur === "tous" ? "Toute l'équipe" : auteur}
          selectedOptions={[auteur]}
          onOptionSelect={(_e, data) => setAuteur(data.optionValue ?? "tous")}
        >
          <Option value="tous">Toute l&apos;équipe</Option>
          {auteurs.map((a) => (
            <Option key={a} value={a}>
              {a}
            </Option>
          ))}
        </Dropdown>
        <Dropdown className={styles.liste} aria-label="Période" value={PERIODES[periode].libelle} selectedOptions={[periode]} onOptionSelect={(_e, data) => setPeriode(data.optionValue as Periode)}>
          {(Object.keys(PERIODES) as Periode[]).map((p) => (
            <Option key={p} value={p}>
              {PERIODES[p].libelle}
            </Option>
          ))}
        </Dropdown>
        <Caption1>{pluriel(filtrees.length, "entrée")}</Caption1>
      </div>

      {entrees === null && !erreur ? (
        <ChargementLogo taille="moyen" texte="Chargement du journal…" />
      ) : filtrees.length === 0 ? (
        <Vide
          Icone={HistoryRegular}
          titre="Aucune activité"
          texte={entrees?.length ? "Aucune entrée ne correspond à ces filtres." : "Les connexions et les actions de l'équipe apparaîtront ici."}
        />
      ) : (
        <>
          <div className={cadre.root}>
            <Table aria-label="Journal d'activité" size="small">
              <TableHeader className={cadre.entete}>
                <TableRow>
                  {gerant && (
                    <TableHeaderCell className={cadre.premiere} style={{ width: "44px" }}>
                      <Checkbox
                        aria-label="Tout cocher"
                        checked={toutesCochees ? true : quelquesCochees ? "mixed" : false}
                        onChange={(_e, data) => {
                          const suivante = new Set(selection)
                          for (const e of visibles) {
                            if (data.checked === true) suivante.add(e.id)
                            else suivante.delete(e.id)
                          }
                          setSelection(suivante)
                        }}
                      />
                    </TableHeaderCell>
                  )}
                  <TableHeaderCell className={gerant ? undefined : cadre.premiere} style={{ width: "150px" }}>
                    Date
                  </TableHeaderCell>
                  <TableHeaderCell style={{ width: "220px" }}>Membre</TableHeaderCell>
                  <TableHeaderCell style={{ width: "150px" }}>Catégorie</TableHeaderCell>
                  <TableHeaderCell>Action</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibles.map((e) => {
                  const { libelle, Icone, couleur } = CATEGORIES[e.categorie]
                  return (
                    <TableRow key={e.id} aria-selected={selection.has(e.id)}>
                      {gerant && (
                        <TableCell className={cadre.premiere}>
                          <Checkbox aria-label="Cocher cette entrée" checked={selection.has(e.id)} onChange={(_ev, data) => cocher(e.id, data.checked === true)} />
                        </TableCell>
                      )}
                      <TableCell className={gerant ? undefined : cadre.premiere}>
                        <span className={styles.date}>{formaterHeure(e.le)}</span>
                      </TableCell>
                      <TableCell>
                        <TableCellLayout media={<Avatar name={e.auteur} size={24} color={e.membreId === d.hote.id ? "brand" : "colorful"} />}>
                          {e.auteur}
                          {e.membreId === d.hote.id && " (vous)"}
                        </TableCellLayout>
                      </TableCell>
                      <TableCell>
                        <Badge appearance="tint" shape="rounded" color={couleur} icon={<Icone />}>
                          {libelle}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TableCellLayout description={e.detail ? <span className={styles.detail}>{e.detail}</span> : undefined}>
                          <Text weight="semibold">{e.action}</Text>
                        </TableCellLayout>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          {filtrees.length > affichees && (
            <div className={styles.plus}>
              <Button onClick={() => setAffichees(affichees + PAR_PAGE)}>Afficher {Math.min(PAR_PAGE, filtrees.length - affichees)} entrées de plus</Button>
            </div>
          )}
        </>
      )}

      {aConfirmer && (
        <Dialog open onOpenChange={(_e, data) => !data.open && !enCours && setAConfirmer(null)}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>{aConfirmer.titre}</DialogTitle>
              <DialogContent>{aConfirmer.texte}</DialogContent>
              <DialogActions>
                <Button onClick={() => setAConfirmer(null)} disabled={enCours}>
                  Annuler
                </Button>
                <Button appearance="primary" icon={enCours ? <Spinner size="tiny" /> : <DeleteRegular />} disabled={enCours || lectureSeule} onClick={() => effacer(aConfirmer.effacement)}>
                  Supprimer
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}
    </>
  )
}
