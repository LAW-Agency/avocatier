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
  DialogTrigger,
  Dropdown,
  Field,
  Input,
  Menu,
  MenuDivider,
  MenuItem,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MessageBar,
  MessageBarBody,
  Option,
  Spinner,
  Subtitle1,
  Subtitle2,
  Text,
  Textarea,
  Tooltip,
  mergeClasses,
  type BadgeProps,
} from "@fluentui/react-components"
import {
  AddRegular,
  ArrowCounterclockwiseRegular,
  BedRegular,
  BroomRegular,
  CalendarAddRegular,
  CheckmarkCircleRegular,
  DeleteRegular,
  DoorArrowLeftRegular,
  DoorArrowRightRegular,
  MoreHorizontalRegular,
  NoteRegular,
  PersonRegular,
  ProhibitedRegular,
  RenameRegular,
  WrenchRegular,
  type FluentIcon,
} from "@fluentui/react-icons"
import { useState, type FormEvent } from "react"
import { formaterDate, pluriel } from "@partage/dates"
import type { Chambre, EtatChambre } from "@partage/types"
import { EnTete } from "../composants/commun"
import FicheReservation from "../composants/FicheReservation"
import { Indicateur } from "../composants/graphiques"
import { useFormulairesStyles } from "../composants/useFormulairesStyles.styles"
import { chambresTriees, nomDe, useDonneesChargees, useLectureSeule, type Donnees, type HebergementCourt } from "../donnees"
import { ETATS_CHAMBRE } from "../libelles"
import { usePrix } from "../montants"
import { useAnnoncer } from "../toasts"
import { useChambresStyles } from "./useChambresStyles.styles"

const STYLE_ETAT: Record<EtatChambre, { couleur: BadgeProps["color"]; Icone: FluentIcon }> = {
  propre: { couleur: "success", Icone: CheckmarkCircleRegular },
  a_nettoyer: { couleur: "warning", Icone: BroomRegular },
  maintenance: { couleur: "danger", Icone: WrenchRegular },
}

// Client présent dans la chambre ce soir (arrivé ou attendu), sans départ enregistré
const occupantDe = (d: Donnees, chambreId: string) =>
  d.reservations.find(
    (r) => r.chambreId === chambreId && r.statut === "confirmee" && !r.departLe && r.arrivee <= d.aujourdhui && r.depart > d.aujourdhui,
  )

// Numéro proposé pour une nouvelle chambre : celui qui suit le plus grand de la catégorie (« Océan 5 » → « Océan 6 »),
// sinon le nom court de la catégorie (« Bungalow Océan » → « Océan 1 »)
function numeroSuivant(d: Donnees, hebergementId: string): string {
  const motifs = d.chambres
    .filter((c) => c.hebergementId === hebergementId)
    .map((c) => c.numero.match(/^(.*?)(\d+)$/))
    .filter((m): m is RegExpMatchArray => m !== null)
  if (motifs.length > 0) {
    const prefixe = motifs[0][1]
    const plusGrand = Math.max(...motifs.filter((m) => m[1] === prefixe).map((m) => Number(m[2])))
    return `${prefixe}${plusGrand + 1}`
  }
  const nom = d.hebergements.find((h) => h.id === hebergementId)?.nom ?? ""
  return `${nom.replace(/^(Bungalow|Chambre)\s+/i, "")} 1`.trim()
}

// Gestion des chambres : chambres numérotées de chaque catégorie (ajout, numéro, désactivation, suppression pour
// les gérants), état du ménage et de la maintenance, occupant du jour, prochaine arrivée. Le départ enregistré à la
// réception passe la chambre « À nettoyer » (côté serveur).
export default function Chambres() {
  const lectureSeule = useLectureSeule()
  const styles = useChambresStyles()
  const { d, gerant } = useDonneesChargees()
  const [ajout, setAjout] = useState<string | null>(null) // catégorie de la chambre à ajouter
  const actives = d.chambres.filter((c) => c.active)
  const compte = (etat: EtatChambre) => actives.filter((c) => c.etat === etat).length
  const occupees = actives.filter((c) => occupantDe(d, c.id)).length
  const triees = chambresTriees(d)

  return (
    <>
      <EnTete
        titre="Chambres"
        description="Chambres numérotées de chaque catégorie : ménage, maintenance et occupation aujourd'hui."
        actions={
          gerant && (
            <Button appearance="primary" icon={<AddRegular />} disabled={lectureSeule} onClick={() => setAjout(d.hebergements[0]?.id ?? "")}>
              Ajouter une chambre
            </Button>
          )
        }
      />
      <div className={styles.resume}>
        <Indicateur Icone={BedRegular} libelle="Occupées ce soir" valeur={`${occupees} / ${actives.length}`} />
        <Indicateur Icone={CheckmarkCircleRegular} libelle="Propres" valeur={compte("propre")} />
        <Indicateur Icone={BroomRegular} libelle="À nettoyer" valeur={compte("a_nettoyer")} />
        <Indicateur Icone={WrenchRegular} libelle="En maintenance" valeur={compte("maintenance")} />
      </div>
      {d.hebergements.map((h) => (
        <Categorie key={h.id} hebergement={h} chambres={triees.filter((c) => c.hebergementId === h.id)} onAjouter={() => setAjout(h.id)} />
      ))}
      {ajout !== null && <FenetreChambre hebergementId={ajout} onFin={() => setAjout(null)} />}
    </>
  )
}

function Categorie({ hebergement: h, chambres, onAjouter }: { hebergement: HebergementCourt; chambres: Chambre[]; onAjouter: () => void }) {
  const lectureSeule = useLectureSeule()
  const styles = useChambresStyles()
  const formaterPrix = usePrix()
  const { gerant } = useDonneesChargees()
  const actives = chambres.filter((c) => c.active).length

  return (
    <section className={styles.categorie} aria-labelledby={`categorie-${h.id}`}>
      <div className={styles.enteteCategorie}>
        <div className={styles.titre}>
          <Subtitle1 as="h2" id={`categorie-${h.id}`} className={styles.nom}>
            {h.nom}
          </Subtitle1>
          <Caption1 className={styles.secondaire}>
            {actives === 0 ? "Aucune chambre en vente" : `${pluriel(actives, "chambre")} en vente`}
            {chambres.length > actives && ` (+ ${pluriel(chambres.length - actives, "désactivée")})`} · {pluriel(h.capaciteMax, "personne")} par chambre ·{" "}
            {formaterPrix(h.prixNuit)} / nuit
          </Caption1>
        </div>
        {gerant && (
          <Button appearance="subtle" icon={<AddRegular />} disabled={lectureSeule} onClick={onAjouter}>
            Ajouter
          </Button>
        )}
      </div>
      {chambres.length === 0 ? (
        <Body1 className={styles.secondaire}>
          Cette catégorie n&apos;a aucune chambre : elle n&apos;est pas proposée sur le site.
          {gerant ? " Ajoutez-en une pour l'ouvrir à la réservation." : " Un gérant peut en ajouter."}
        </Body1>
      ) : (
        <div className={styles.grille}>
          {chambres.map((c) => (
            <CarteChambre key={c.id} chambre={c} hebergement={h} />
          ))}
        </div>
      )}
    </section>
  )
}

function CarteChambre({ chambre: c, hebergement: h }: { chambre: Chambre; hebergement: HebergementCourt }) {
  const lectureSeule = useLectureSeule()
  const styles = useChambresStyles()
  const { d, gerant, clientDe, executer, ouvrirNouvelleReservation } = useDonneesChargees()
  const { annoncer } = useAnnoncer()
  const [erreur, setErreur] = useState<string | null>(null)
  const [renommer, setRenommer] = useState(false)
  const [supprimer, setSupprimer] = useState(false)
  // Modification en cours : Spinner sur le bouton qui l'a lancée (État, Note ou menu de gestion)
  const [enCours, setEnCours] = useState<"etat" | "noteEtat" | "active" | null>(null)
  const actives = d.reservations.filter((r) => r.chambreId === c.id && r.statut === "confirmee")
  const occupant = occupantDe(d, c.id)
  const departAujourdhui = actives.find((r) => r.depart === d.aujourdhui && !r.departLe)
  const prochaine = actives.filter((r) => r.arrivee > d.aujourdhui).sort((a, b) => a.arrivee.localeCompare(b.arrivee))[0]
  const bloquee = d.blocages.find((b) => b.chambreId === c.id && b.debut <= d.aujourdhui && b.fin > d.aujourdhui)
  const { couleur, Icone } = STYLE_ETAT[c.etat]

  async function modifier(modification: Partial<Pick<Chambre, "etat" | "noteEtat" | "active">>) {
    setEnCours(modification.active !== undefined ? "active" : modification.etat !== undefined ? "etat" : "noteEtat")
    const resultat = await executer("PATCH", `/api/hotes/chambres/${encodeURIComponent(c.id)}`, modification)
    setEnCours(null)
    setErreur(resultat.ok ? null : resultat.erreur)
    if (resultat.ok && modification.active !== undefined) {
      annoncer({
        titre: modification.active ? `${c.numero} remise en vente` : `${c.numero} désactivée`,
        texte: modification.active ? "Elle est de nouveau proposée sur le site." : "Elle n'est plus proposée sur le site ni attribuée ; son historique reste.",
        intent: "success",
      })
    }
  }

  // Situation du jour : occupant (arrivé ou attendu), départ du jour, dates bloquées ou libre
  let situation: { Icone: FluentIcon; titre: string; detail: string }
  if (occupant) {
    situation = {
      Icone: occupant.arriveeLe ? PersonRegular : DoorArrowRightRegular,
      titre: nomDe(clientDe(occupant)),
      detail: `${occupant.arriveeLe ? "Sur place" : occupant.arrivee === d.aujourdhui ? "Arrivée attendue aujourd'hui" : "Arrivée non enregistrée"} · départ le ${formaterDate(occupant.depart, { year: undefined })}`,
    }
  } else if (departAujourdhui) {
    situation = { Icone: DoorArrowLeftRegular, titre: nomDe(clientDe(departAujourdhui)), detail: "Départ aujourd'hui, pas encore enregistré" }
  } else if (bloquee) {
    situation = { Icone: NoteRegular, titre: "Dates bloquées", detail: `${bloquee.raison} · jusqu'au ${formaterDate(bloquee.fin, { year: undefined })}` }
  } else if (!c.active) {
    situation = { Icone: ProhibitedRegular, titre: "Désactivée", detail: "Plus proposée sur le site ni attribuée aux réservations" }
  } else {
    situation = { Icone: BedRegular, titre: "Libre ce soir", detail: prochaine ? `Prochaine arrivée le ${formaterDate(prochaine.arrivee, { year: undefined })}` : "Aucune arrivée prévue" }
  }
  const reservationDuJour = occupant ?? departAujourdhui

  return (
    <section className={mergeClasses(styles.carte, c.active ? styles[c.etat] : styles.desactivee)}>
      <div className={styles.entete}>
        <div className={styles.titre}>
          <Subtitle2 as="h3" className={styles.nom}>
            {c.numero}
          </Subtitle2>
          <Caption1 className={styles.secondaire} truncate wrap={false} title={h.literie}>
            {h.type === "bungalow" ? "Bungalow" : "Chambre"} · {pluriel(h.capaciteMax, "personne")} · {h.literie}
          </Caption1>
        </div>
        {/* État, puis le menu de gestion des gérants : en haut à droite, le pied garde la place des trois actions */}
        <div className={styles.enteteDroite}>
          {c.active ? (
            <Badge appearance="tint" color={couleur} icon={<Icone />} shape="rounded">
              {ETATS_CHAMBRE[c.etat]}
            </Badge>
          ) : (
            <Badge appearance="tint" color="subtle" icon={<ProhibitedRegular />} shape="rounded">
              Désactivée
            </Badge>
          )}
          {gerant && (
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Tooltip content={`Gérer ${c.numero}`} relationship="label">
                  <Button appearance="subtle" size="small" disabled={enCours === "active" || lectureSeule} icon={enCours === "active" ? <Spinner size="tiny" /> : <MoreHorizontalRegular />} />
                </Tooltip>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem icon={<RenameRegular />} onClick={() => setRenommer(true)}>
                    Changer le numéro
                  </MenuItem>
                  {c.active ? (
                    <MenuItem icon={<ProhibitedRegular />} onClick={() => modifier({ active: false })}>
                      Désactiver (plus proposée)
                    </MenuItem>
                  ) : (
                    <MenuItem icon={<ArrowCounterclockwiseRegular />} onClick={() => modifier({ active: true })}>
                      Remettre en vente
                    </MenuItem>
                  )}
                  <MenuDivider />
                  <MenuItem icon={<DeleteRegular />} onClick={() => setSupprimer(true)}>
                    Supprimer
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          )}
        </div>
      </div>

      <div className={styles.occupation}>
        <situation.Icone className={styles.icone} />
        <div className={styles.occupationTexte}>
          <Text weight="semibold" truncate wrap={false}>
            {situation.titre}
          </Text>
          <Caption1 className={styles.secondaire}>{situation.detail}</Caption1>
        </div>
        {reservationDuJour && <FicheReservation reservation={reservationDuJour} />}
      </div>

      {c.noteEtat && (
        <Body1 className={styles.note}>
          <NoteRegular /> {c.noteEtat}
        </Body1>
      )}
      {erreur && (
        <MessageBar intent="error">
          <MessageBarBody>{erreur}</MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.pied}>
        {c.active && (
          <>
            <Menu checkedValues={{ etat: [c.etat] }} onCheckedValueChange={(_e, data) => modifier({ etat: data.checkedItems[0] as EtatChambre })}>
              <MenuTrigger disableButtonEnhancement>
                <Button disabled={enCours === "etat" || lectureSeule} icon={enCours === "etat" ? <Spinner size="tiny" /> : <BroomRegular />}>
                  État
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  {(Object.keys(ETATS_CHAMBRE) as EtatChambre[]).map((etat) => {
                    const { Icone: IconeEtat } = STYLE_ETAT[etat]
                    return (
                      <MenuItemRadio key={etat} name="etat" value={etat} icon={<IconeEtat />}>
                        {ETATS_CHAMBRE[etat]}
                      </MenuItemRadio>
                    )
                  })}
                </MenuList>
              </MenuPopover>
            </Menu>
            <NoteChambre chambre={c} onEnregistrer={(noteEtat) => modifier({ noteEtat })} />
            <Button
              appearance="subtle"
              icon={<CalendarAddRegular />}
              disabled={lectureSeule}
              onClick={() => ouvrirNouvelleReservation({ hebergementId: c.hebergementId, chambreId: c.id })}
            >
              Réserver
            </Button>
          </>
        )}
      </div>
      {renommer && <FenetreChambre chambre={c} onFin={() => setRenommer(false)} />}
      {supprimer && <SupprimerChambre chambre={c} onFin={() => setSupprimer(false)} />}
    </section>
  )
}

// Note de ménage ou de maintenance (« ampoule salle de bains », « moustiquaire à changer »…)
function NoteChambre({ chambre: c, onEnregistrer }: { chambre: Chambre; onEnregistrer: (note: string) => Promise<void> }) {
  const lectureSeule = useLectureSeule()
  const [note, setNote] = useState(c.noteEtat)
  const [ouvert, setOuvert] = useState(false)
  const [enCours, setEnCours] = useState(false)

  async function enregistrer() {
    setEnCours(true)
    await onEnregistrer(note)
    setEnCours(false)
    setOuvert(false)
  }

  return (
    <Dialog
      open={ouvert}
      onOpenChange={(_e, data) => {
        if (enCours) return
        if (data.open) setNote(c.noteEtat)
        setOuvert(data.open)
      }}
    >
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="subtle" icon={<NoteRegular />} disabled={lectureSeule}>
          Note
        </Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Note : {c.numero}</DialogTitle>
          <DialogContent>
            <Field label="Ménage ou maintenance" hint="Visible par toute l'équipe sur la carte de la chambre.">
              <Textarea value={note} onChange={(_e, data) => setNote(data.value)} maxLength={200} resize="vertical" />
            </Field>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button disabled={enCours}>Annuler</Button>
            </DialogTrigger>
            <Button appearance="primary" disabled={enCours || lectureSeule} icon={enCours ? <Spinner size="tiny" /> : undefined} onClick={enregistrer}>
              Enregistrer
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

// Nouvelle chambre (`hebergementId` : catégorie proposée) ou nouveau numéro d'une chambre existante (`chambre`)
function FenetreChambre({ hebergementId: categorieInitiale = "", chambre, onFin }: { hebergementId?: string; chambre?: Chambre; onFin: () => void }) {
  const lectureSeule = useLectureSeule()
  const styles = useFormulairesStyles()
  const { d, executer } = useDonneesChargees()
  const { annoncer } = useAnnoncer()
  const [hebergementId, setHebergementId] = useState(chambre?.hebergementId ?? categorieInitiale)
  const [numero, setNumero] = useState(chambre?.numero ?? numeroSuivant(d, categorieInitiale))
  // Numéro proposé tant que l'équipe ne l'a pas changé : il suit la catégorie choisie
  const [numeroSaisi, setNumeroSaisi] = useState(Boolean(chambre))
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const hebergement = d.hebergements.find((h) => h.id === hebergementId)

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    const resultat = chambre
      ? await executer("PATCH", `/api/hotes/chambres/${encodeURIComponent(chambre.id)}`, { numero })
      : await executer("POST", "/api/hotes/chambres", { hebergementId, numero })
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    annoncer({
      titre: chambre ? `${chambre.numero} s'appelle maintenant ${numero.trim()}` : `${numero.trim()} ajoutée à ${hebergement?.nom}`,
      texte: chambre ? undefined : "Elle est proposée sur le site dès maintenant, au prix de sa catégorie.",
      intent: "success",
    })
    onFin()
  }

  return (
    <Dialog open onOpenChange={(_e, data) => !data.open && onFin()}>
      <DialogSurface>
        <form onSubmit={envoyer}>
          <DialogBody>
            <DialogTitle>{chambre ? `Changer le numéro de ${chambre.numero}` : "Ajouter une chambre"}</DialogTitle>
            <DialogContent className={styles.corps}>
              {!chambre && (
                <Field label="Catégorie" required hint="Prix, capacité et photos du site sont ceux de la catégorie.">
                  <Dropdown
                    value={hebergement?.nom ?? ""}
                    selectedOptions={hebergementId ? [hebergementId] : []}
                    onOptionSelect={(_e, data) => {
                      const id = data.optionValue ?? ""
                      setHebergementId(id)
                      if (!numeroSaisi) setNumero(numeroSuivant(d, id))
                    }}
                  >
                    {d.hebergements.map((h) => (
                      <Option key={h.id} value={h.id}>
                        {h.nom}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
              )}
              <Field label="Numéro" required hint="Unique dans l'hôtel, par exemple « Océan 3 ». Les clients ne le voient pas sur le site.">
                <Input
                  value={numero}
                  maxLength={30}
                  onChange={(_e, data) => {
                    setNumero(data.value)
                    setNumeroSaisi(true)
                  }}
                />
              </Field>
              {erreur && (
                <MessageBar intent="error">
                  <MessageBarBody>{erreur}</MessageBarBody>
                </MessageBar>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={onFin}>Annuler</Button>
              <Button type="submit" appearance="primary" disabled={enCours || lectureSeule || !numero.trim() || !hebergementId} icon={enCours ? <Spinner size="tiny" /> : undefined}>
                {chambre ? "Enregistrer" : "Ajouter"}
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  )
}

// Suppression : seulement pour une chambre sans aucune réservation (créée par erreur) ; sinon le serveur refuse et
// propose de la désactiver
function SupprimerChambre({ chambre: c, onFin }: { chambre: Chambre; onFin: () => void }) {
  const lectureSeule = useLectureSeule()
  const { d, executer } = useDonneesChargees()
  const { annoncer } = useAnnoncer()
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const historique = d.reservations.some((r) => r.chambreId === c.id)
  const calendriers = d.calendriers.filter((k) => k.chambreId === c.id).length

  async function confirmer() {
    setEnCours(true)
    const resultat = await executer("DELETE", `/api/hotes/chambres/${encodeURIComponent(c.id)}`)
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    annoncer({ titre: `${c.numero} supprimée`, intent: "success" })
    onFin()
  }

  return (
    <Dialog open onOpenChange={(_e, data) => !data.open && onFin()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Supprimer {c.numero} ?</DialogTitle>
          <DialogContent>
            {historique ? (
              <MessageBar intent="warning">
                <MessageBarBody>
                  Des réservations ont déjà été faites dans cette chambre : elle ne peut pas être supprimée. Désactivez-la plutôt, son historique
                  restera.
                </MessageBarBody>
              </MessageBar>
            ) : (
              <Body1>
                La chambre disparaît du logiciel et du site, avec ses dates bloquées
                {calendriers > 0 && ` et ${pluriel(calendriers, "calendrier")} de plateforme`}. Cette action est définitive.
              </Body1>
            )}
            {erreur && (
              <MessageBar intent="error">
                <MessageBarBody>{erreur}</MessageBarBody>
              </MessageBar>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onFin}>Annuler</Button>
            {!historique && (
              <Button appearance="primary" disabled={enCours || lectureSeule} icon={enCours ? <Spinner size="tiny" /> : <DeleteRegular />} onClick={confirmer}>
                Supprimer
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
