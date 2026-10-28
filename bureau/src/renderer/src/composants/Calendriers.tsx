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
  MessageBar,
  MessageBarBody,
  Option,
  OptionGroup,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Tooltip,
  makeStyles,
  tokens,
} from "@fluentui/react-components"
import { ArrowSyncRegular, CalendarSyncRegular, CopyRegular, DeleteRegular, LinkAddRegular } from "@fluentui/react-icons"
import { useState, type FormEvent } from "react"
import { formaterHeure, pluriel } from "@partage/dates"
import type { BilanSynchronisation, Plateforme } from "@partage/types"
import { chambresTriees, nomChambre, useDonneesChargees, useLectureSeule, type Calendrier } from "../donnees"
import { PLATEFORMES } from "../libelles"
import { useAnnoncer } from "../toasts"
import { Carte, Vide } from "./commun"
import { useActionsStyles } from "./useReservationStyles.styles"

const useStyles = makeStyles({
  pile: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalL },
  formulaire: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)",
    columnGap: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalL,
    alignItems: "end",
  },
  pleine: { gridColumn: "1 / -1" },
  champ: { minWidth: 0, width: "100%" },
  actions: { display: "flex", justifyContent: "flex-end", columnGap: tokens.spacingHorizontalXS },
  erreur: { color: tokens.colorStatusDangerForeground1 },
  secondaire: { color: tokens.colorNeutralForeground3 },
  envoi: { justifySelf: "start" },
})

// Calendriers des plateformes (Booking.com, Airbnb…), un par hébergement et par plateforme. Import : leurs
// réservations ferment nos dates ; export : notre lien secret, collé chez elles, ferme leurs dates. Importés
// toutes les 10 minutes tant que le logiciel tourne, chaque nuit par le serveur, et juste avant chaque demande
// du site. Ajout et retrait réservés aux gérants ; synchronisation à la demande pour toute l'équipe.
export default function Calendriers() {
  const lectureSeule = useLectureSeule()
  const styles = useStyles()
  const { d, gerant, executer } = useDonneesChargees()
  const { annoncer } = useAnnoncer()
  const [enCours, setEnCours] = useState<string | null>(null)
  const importees = (c: Calendrier) => d.blocages.filter((b) => b.calendrierId === c.id && b.fin > d.aujourdhui).length
  // Dans l'ordre des chambres, puis des plateformes
  const ordre = chambresTriees(d).map((c) => c.id)
  const calendriers = [...d.calendriers].sort((a, b) => ordre.indexOf(a.chambreId) - ordre.indexOf(b.chambreId) || a.nom.localeCompare(b.nom))

  async function synchroniser(c: Calendrier) {
    setEnCours(c.id)
    const resultat = await executer<{ bilans: BilanSynchronisation[] }>("POST", "/api/hotes/calendriers/synchroniser", { id: c.id })
    setEnCours(null)
    const bilan = resultat.ok ? resultat.donnees.bilans[0] : undefined
    if (!resultat.ok || bilan?.erreur) annoncer({ titre: `${c.nom} : synchronisation impossible`, texte: resultat.ok ? bilan?.erreur : resultat.erreur, intent: "error" })
    else annoncer({ titre: `${c.nom} synchronisé`, texte: `${pluriel(bilan?.ajoutees.length ?? 0, "nouvelle période", "nouvelles périodes")}, ${pluriel(bilan?.retirees ?? 0, "période libérée", "périodes libérées")}.`, intent: "success" })
  }

  async function copier(c: Calendrier) {
    try {
      await navigator.clipboard.writeText(c.urlExport)
      annoncer({ titre: "Lien copié", texte: `Collez-le dans ${c.nom} (import d'un calendrier).`, intent: "success" })
    } catch {
      annoncer({ titre: "Copie impossible", texte: c.urlExport, intent: "warning", duree: 20_000 })
    }
  }

  return (
    <Carte
      data-visite="planning-calendriers"
      titre="Calendriers Booking.com, Airbnb…"
      description="Leurs réservations ferment les dates ici, et les nôtres ferment les dates chez eux. Synchronisés toutes les 10 minutes tant que le logiciel est ouvert, et chaque nuit."
    >
      <div className={styles.pile}>
        {calendriers.length === 0 ? (
          <Vide
            Icone={CalendarSyncRegular}
            titre="Aucun calendrier relié"
            texte={gerant ? "Ajoutez le lien iCal donné par Booking.com ou Airbnb pour chaque chambre (une annonce = une chambre)." : "Un gérant peut relier les calendriers de Booking.com ou Airbnb."}
          />
        ) : (
          <Table size="small" aria-label="Calendriers des plateformes">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Chambre</TableHeaderCell>
                <TableHeaderCell>Plateforme</TableHeaderCell>
                <TableHeaderCell>Importation</TableHeaderCell>
                <TableHeaderCell style={{ width: gerant ? "190px" : "150px" }} aria-label="Actions" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {calendriers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <TableCellLayout truncate description={d.hebergements.find((h) => h.id === c.hebergementId)?.nom}>
                      {d.chambres.find((x) => x.id === c.chambreId)?.numero}
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <TableCellLayout truncate description={PLATEFORMES[c.plateforme]}>
                      {c.nom}
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>
                    {!c.urlImport ? (
                      <Caption1 className={styles.secondaire}>Export seulement</Caption1>
                    ) : c.erreur ? (
                      <Tooltip content={c.erreur} relationship="description">
                        <Badge appearance="tint" color="danger" shape="rounded">
                          En échec
                        </Badge>
                      </Tooltip>
                    ) : (
                      <TableCellLayout description={pluriel(importees(c), "période à venir", "périodes à venir")}>
                        {c.synchroniseLe ? formaterHeure(c.synchroniseLe) : "Jamais"}
                      </TableCellLayout>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className={styles.actions}>
                      <Tooltip content="Copier notre lien d'export, à coller dans la plateforme" relationship="label">
                        <Button appearance="subtle" size="small" icon={<CopyRegular />} onClick={() => copier(c)} />
                      </Tooltip>
                      {c.urlImport && (
                        <Tooltip content="Synchroniser maintenant" relationship="label">
                          <Button
                            appearance="subtle"
                            size="small"
                            disabled={enCours === c.id || lectureSeule}
                            icon={enCours === c.id ? <Spinner size="tiny" /> : <ArrowSyncRegular />}
                            onClick={() => synchroniser(c)}
                          />
                        </Tooltip>
                      )}
                      {gerant && <RetirerCalendrier calendrier={c} hebergement={nomChambre(d, c.chambreId)} />}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {gerant && <AjouterCalendrier />}
      </div>
    </Carte>
  )
}

function RetirerCalendrier({ calendrier, hebergement }: { calendrier: Calendrier; hebergement: string }) {
  const lectureSeule = useLectureSeule()
  const actions = useActionsStyles()
  const { executer } = useDonneesChargees()
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [ouvert, setOuvert] = useState(false)
  return (
    <Dialog modalType="alert" open={ouvert} onOpenChange={(_e, data) => !enCours && setOuvert(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Tooltip content="Retirer ce calendrier" relationship="label">
          <Button appearance="subtle" size="small" disabled={lectureSeule} icon={<DeleteRegular />} />
        </Tooltip>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            Retirer {calendrier.nom} pour {hebergement} ?
          </DialogTitle>
          <DialogContent className={actions.pile}>
            <Body1>Les dates importées de ce calendrier seront libérées sur le site, et notre lien d&apos;export ne répondra plus : retirez-le aussi dans la plateforme.</Body1>
            {erreur && (
              <MessageBar intent="error">
                <MessageBarBody>{erreur}</MessageBarBody>
              </MessageBar>
            )}
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button disabled={enCours}>Retour</Button>
            </DialogTrigger>
            <Button
              className={actions.danger}
              disabled={enCours || lectureSeule}
              icon={enCours ? <Spinner size="tiny" /> : undefined}
              onClick={async () => {
                setEnCours(true)
                const resultat = await executer("DELETE", `/api/hotes/calendriers/${encodeURIComponent(calendrier.id)}`)
                setEnCours(false)
                if (!resultat.ok) setErreur(resultat.erreur)
              }}
            >
              Retirer
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

function AjouterCalendrier() {
  const lectureSeule = useLectureSeule()
  const styles = useStyles()
  const { d, executer } = useDonneesChargees()
  const { annoncer } = useAnnoncer()
  const chambres = chambresTriees(d).filter((c) => c.active)
  const [chambreId, setChambreId] = useState(chambres[0]?.id ?? "")
  const [plateforme, setPlateforme] = useState<Plateforme>("booking")
  const [nom, setNom] = useState(PLATEFORMES.booking)
  const [urlImport, setUrlImport] = useState("")
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    setErreur(null)
    const resultat = await executer<{ calendrier: Calendrier; bilan: BilanSynchronisation }>("POST", "/api/hotes/calendriers", { chambreId, plateforme, nom, urlImport })
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    const { bilan } = resultat.donnees
    annoncer({
      titre: `Calendrier ${nom} ajouté`,
      texte: bilan.erreur
        ? `Première importation impossible : ${bilan.erreur}`
        : `${urlImport ? `${pluriel(bilan.ajoutees.length, "période importée", "périodes importées")}. ` : ""}Copiez maintenant notre lien d'export (bouton copier) dans ${nom}.`,
      intent: bilan.erreur ? "warning" : "success",
      duree: 12_000,
    })
    setUrlImport("")
  }

  return (
    <form className={styles.formulaire} onSubmit={envoyer}>
      <Field label="Chambre" required>
        <Dropdown className={styles.champ} value={chambreId ? nomChambre(d, chambreId) : ""} selectedOptions={[chambreId]} onOptionSelect={(_e, data) => setChambreId(data.optionValue ?? "")}>
          {d.hebergements.map((h) => {
            const dansCategorie = chambres.filter((c) => c.hebergementId === h.id)
            return (
              dansCategorie.length > 0 && (
                <OptionGroup key={h.id} label={h.nom}>
                  {dansCategorie.map((c) => (
                    <Option key={c.id} value={c.id} text={nomChambre(d, c.id)}>
                      {c.numero}
                    </Option>
                  ))}
                </OptionGroup>
              )
            )
          })}
        </Dropdown>
      </Field>
      <Field label="Plateforme" required>
        <Dropdown
          className={styles.champ}
          value={PLATEFORMES[plateforme]}
          selectedOptions={[plateforme]}
          onOptionSelect={(_e, data) => {
            const choix = data.optionValue as Plateforme
            // Nom proposé : celui de la plateforme, tant qu'il n'a pas été changé
            if (nom === PLATEFORMES[plateforme] || !nom) setNom(choix === "autre" ? "" : PLATEFORMES[choix])
            setPlateforme(choix)
          }}
        >
          {(Object.keys(PLATEFORMES) as Plateforme[]).map((p) => (
            <Option key={p} value={p}>
              {PLATEFORMES[p]}
            </Option>
          ))}
        </Dropdown>
      </Field>
      <Field label="Nom" required>
        <Input value={nom} onChange={(_e, data) => setNom(data.value)} maxLength={40} placeholder="Expedia, Abritel…" />
      </Field>
      <Field
        label="Lien iCal de la plateforme"
        hint="Dans la plateforme : calendrier de l'hébergement, « Exporter » ou « Synchroniser les calendriers ». Vide : seulement notre export."
        className={styles.pleine}
      >
        <Input type="url" value={urlImport} onChange={(_e, data) => setUrlImport(data.value)} placeholder="https://admin.booking.com/hotel/hoteladmin/ical.html?t=…" />
      </Field>
      {erreur && (
        <MessageBar intent="error" className={styles.pleine}>
          <MessageBarBody>{erreur}</MessageBarBody>
        </MessageBar>
      )}
      <Button type="submit" appearance="primary" className={styles.envoi} disabled={enCours || lectureSeule || !chambreId || !nom.trim()} icon={enCours ? <Spinner size="tiny" /> : <LinkAddRegular />}>
        Relier ce calendrier
      </Button>
    </form>
  )
}
