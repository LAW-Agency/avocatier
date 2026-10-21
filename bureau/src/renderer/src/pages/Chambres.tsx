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
  Field,
  Menu,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MessageBar,
  MessageBarBody,
  Subtitle2,
  Text,
  Textarea,
  mergeClasses,
  type BadgeProps,
} from "@fluentui/react-components"
import {
  BedRegular,
  BroomRegular,
  CalendarAddRegular,
  CheckmarkCircleRegular,
  DoorArrowLeftRegular,
  DoorArrowRightRegular,
  NoteRegular,
  PersonRegular,
  WrenchRegular,
  type FluentIcon,
} from "@fluentui/react-icons"
import { useState } from "react"
import { formaterDate, pluriel } from "@partage/dates"
import type { EtatChambre } from "@partage/types"
import { EnTete } from "../composants/commun"
import FicheReservation from "../composants/FicheReservation"
import { Indicateur } from "../composants/graphiques"
import { nomDe, useDonneesChargees, type HebergementCourt } from "../donnees"
import { ETATS_CHAMBRE } from "../libelles"
import { useChambresStyles } from "./useChambresStyles.styles"

const STYLE_ETAT: Record<EtatChambre, { couleur: BadgeProps["color"]; Icone: FluentIcon }> = {
  propre: { couleur: "success", Icone: CheckmarkCircleRegular },
  a_nettoyer: { couleur: "warning", Icone: BroomRegular },
  maintenance: { couleur: "danger", Icone: WrenchRegular },
}

// Gestion des chambres : état du ménage et de la maintenance, occupant du jour, prochaine arrivée.
// Le départ enregistré à la réception passe la chambre « À nettoyer » (côté serveur).
export default function Chambres() {
  const styles = useChambresStyles()
  const { d } = useDonneesChargees()
  const compte = (etat: EtatChambre) => d.hebergements.filter((h) => h.etat === etat).length
  const occupees = d.hebergements.filter((h) =>
    d.reservations.some((r) => r.hebergementId === h.id && r.statut === "confirmee" && !r.departLe && r.arrivee <= d.aujourdhui && r.depart > d.aujourdhui),
  ).length

  return (
    <>
      <EnTete titre="Chambres" description="Ménage, maintenance et occupation de chaque hébergement aujourd'hui." />
      <div className={styles.resume}>
        <Indicateur Icone={BedRegular} libelle="Occupées ce soir" valeur={`${occupees} / ${d.hebergements.length}`} />
        <Indicateur Icone={CheckmarkCircleRegular} libelle="Propres" valeur={compte("propre")} />
        <Indicateur Icone={BroomRegular} libelle="À nettoyer" valeur={compte("a_nettoyer")} />
        <Indicateur Icone={WrenchRegular} libelle="En maintenance" valeur={compte("maintenance")} />
      </div>
      <div className={styles.grille}>
        {d.hebergements.map((h) => (
          <CarteChambre key={h.id} hebergement={h} />
        ))}
      </div>
    </>
  )
}

function CarteChambre({ hebergement: h }: { hebergement: HebergementCourt }) {
  const styles = useChambresStyles()
  const { d, clientDe, executer, ouvrirNouvelleReservation } = useDonneesChargees()
  const [erreur, setErreur] = useState<string | null>(null)
  const actives = d.reservations.filter((r) => r.hebergementId === h.id && r.statut === "confirmee")
  const occupant = actives.find((r) => !r.departLe && r.arrivee <= d.aujourdhui && r.depart > d.aujourdhui)
  const departAujourdhui = actives.find((r) => r.depart === d.aujourdhui && !r.departLe)
  const prochaine = actives.filter((r) => r.arrivee > d.aujourdhui).sort((a, b) => a.arrivee.localeCompare(b.arrivee))[0]
  const bloquee = d.blocages.find((b) => b.hebergementId === h.id && b.debut <= d.aujourdhui && b.fin > d.aujourdhui)
  const { couleur, Icone } = STYLE_ETAT[h.etat]

  async function changer(etat: EtatChambre, noteEtat = h.noteEtat) {
    const resultat = await executer("PATCH", `/api/hotes/chambres/${encodeURIComponent(h.id)}`, { etat, noteEtat })
    setErreur(resultat.ok ? null : resultat.erreur)
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
  } else {
    situation = { Icone: BedRegular, titre: "Libre ce soir", detail: prochaine ? `Prochaine arrivée le ${formaterDate(prochaine.arrivee, { year: undefined })}` : "Aucune arrivée prévue" }
  }
  const reservationDuJour = occupant ?? departAujourdhui

  return (
    <section className={mergeClasses(styles.carte, styles[h.etat])}>
      <div className={styles.entete}>
        <div className={styles.titre}>
          <Subtitle2 as="h2" className={styles.nom}>
            {h.nom}
          </Subtitle2>
          <Caption1 className={styles.secondaire} truncate wrap={false} title={h.literie}>
            {h.type === "bungalow" ? "Bungalow" : "Chambre"} · {pluriel(h.capaciteMax, "personne")} · {h.literie}
          </Caption1>
        </div>
        <Badge appearance="tint" color={couleur} icon={<Icone />} shape="rounded">
          {ETATS_CHAMBRE[h.etat]}
        </Badge>
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

      {h.noteEtat && (
        <Body1 className={styles.note}>
          <NoteRegular /> {h.noteEtat}
        </Body1>
      )}
      {erreur && (
        <MessageBar intent="error">
          <MessageBarBody>{erreur}</MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.pied}>
        <Menu checkedValues={{ etat: [h.etat] }} onCheckedValueChange={(_e, data) => changer(data.checkedItems[0] as EtatChambre)}>
          <MenuTrigger disableButtonEnhancement>
            <Button icon={<BroomRegular />}>État</Button>
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
        <NoteChambre hebergement={h} onEnregistrer={(note) => changer(h.etat, note)} />
        <Button appearance="subtle" icon={<CalendarAddRegular />} onClick={() => ouvrirNouvelleReservation({ hebergementId: h.id })}>
          Réserver
        </Button>
      </div>
    </section>
  )
}

// Note de ménage ou de maintenance (« ampoule salle de bains », « moustiquaire à changer »…)
function NoteChambre({ hebergement: h, onEnregistrer }: { hebergement: HebergementCourt; onEnregistrer: (note: string) => Promise<void> }) {
  const [note, setNote] = useState(h.noteEtat)
  return (
    <Dialog onOpenChange={(_e, data) => data.open && setNote(h.noteEtat)}>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="subtle" icon={<NoteRegular />}>
          Note
        </Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Note : {h.nom}</DialogTitle>
          <DialogContent>
            <Field label="Ménage ou maintenance" hint="Visible par toute l'équipe sur la carte de la chambre.">
              <Textarea value={note} onChange={(_e, data) => setNote(data.value)} maxLength={200} resize="vertical" />
            </Field>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button>Annuler</Button>
            </DialogTrigger>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="primary" onClick={() => onEnregistrer(note)}>
                Enregistrer
              </Button>
            </DialogTrigger>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
