import {
  Body1,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Spinner,
  Textarea,
  Tooltip,
  type ButtonProps,
} from "@fluentui/react-components"
import { DocumentDismissRegular, DocumentPdfRegular } from "@fluentui/react-icons"
import { useState, type FormEvent } from "react"
import { formaterHeure } from "@partage/dates"
import { DEVISES, formaterDansDevise } from "@partage/devises"
import type { CodeDevise, Reservation } from "@partage/types"
import { factureDe, useDonneesChargees, useLectureSeule } from "../donnees"
import { useFichiers } from "../fichiers"
import { useFormulairesStyles } from "./useFormulairesStyles.styles"

// Facture PDF d'un séjour confirmé, restaurant et bar compris, avec les autres chambres de son groupe au nom du
// même client. Première édition : devise demandée par le client (ariary, euro, dollar…), contenu et taux figés ;
// ensuite, la même facture se réimprime. Un gérant peut l'annuler par un avoir pour modifier le séjour
export default function BoutonFacture({ reservation: r, appearance }: { reservation: Reservation; appearance?: ButtonProps["appearance"] }) {
  const lectureSeule = useLectureSeule()
  const formulaire = useFormulairesStyles()
  const { d, gerant } = useDonneesChargees()
  const { imprimerFacture, annulerFacture } = useFichiers()
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [annulation, setAnnulation] = useState(false)
  const [motif, setMotif] = useState("")
  const figee = factureDe(r, d)
  const devises = [...new Set<CodeDevise>(["MGA", "EUR", ...d.devises.actives])]

  async function imprimer(devise?: CodeDevise) {
    setEnCours(true)
    setErreur(await imprimerFacture(r, devise))
    setEnCours(false)
  }

  async function annuler(e: FormEvent) {
    e.preventDefault()
    if (!figee) return
    setEnCours(true)
    const probleme = await annulerFacture(figee, motif)
    setEnCours(false)
    setErreur(probleme)
    if (!probleme) {
      setAnnulation(false)
      setMotif("")
    }
  }

  const icone = enCours ? <Spinner size="tiny" /> : <DocumentPdfRegular />
  // Facture figée, côté gérants : réimpression ou annulation par un avoir (séjour à modifier puis refacturer)
  if (figee && gerant) {
    return (
      <>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Tooltip content={erreur ?? `Facture ${figee.numero} du ${formaterHeure(figee.le)}, ${formaterDansDevise(figee.total, figee.devise)}`} relationship="description">
              <Button appearance={appearance} icon={icone} disabled={enCours}>
                Facture {figee.numero}
              </Button>
            </Tooltip>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem icon={<DocumentPdfRegular />} onClick={() => imprimer()}>
                Réimprimer la facture
              </MenuItem>
              <MenuItem icon={<DocumentDismissRegular />} disabled={lectureSeule} onClick={() => setAnnulation(true)}>
                Annuler par un avoir…
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
        <Dialog modalType="alert" open={annulation} onOpenChange={(_e, data) => !enCours && setAnnulation(data.open)}>
          <DialogSurface>
            <form onSubmit={annuler}>
              <DialogBody>
                <DialogTitle>Annuler la facture {figee.numero} ?</DialogTitle>
                <DialogContent className={formulaire.corps}>
                  <Body1>
                    Un avoir numéroté annule cette facture ({formaterDansDevise(figee.total, figee.devise)}) et s&apos;enregistre en PDF. La facture reste dans la suite des
                    numéros, marquée « Annulée ». Le séjour pourra ensuite être modifié puis facturé de nouveau ; les encaissements ne changent pas.
                  </Body1>
                  <Field label="Motif" required validationMessage={erreur ?? undefined}>
                    <Textarea value={motif} onChange={(_e, data) => setMotif(data.value)} maxLength={300} placeholder="Séjour prolongé, erreur de montant…" />
                  </Field>
                </DialogContent>
                <DialogActions>
                  <Button appearance="secondary" disabled={enCours} onClick={() => setAnnulation(false)}>
                    Retour
                  </Button>
                  <Button type="submit" appearance="primary" disabled={enCours || lectureSeule || !motif.trim()} icon={enCours ? <Spinner size="tiny" /> : <DocumentDismissRegular />}>
                    Annuler la facture
                  </Button>
                </DialogActions>
              </DialogBody>
            </form>
          </DialogSurface>
        </Dialog>
      </>
    )
  }
  // Déjà facturé (figée ou ancienne facture) : réimpression à l'identique
  if (figee || r.factureNumero) {
    const detail = figee
      ? `Facture ${figee.numero} du ${formaterHeure(figee.le)}, ${formaterDansDevise(figee.total, figee.devise)}${figee.reservationIds.length > 1 ? `, ${figee.reservationIds.length} chambres` : ""}`
      : `Facture ${r.factureNumero}, éditée le ${formaterHeure(r.factureLe ?? r.creeLe)}`
    return (
      <Tooltip content={erreur ?? detail} relationship="description">
        <Button appearance={appearance} icon={icone} disabled={enCours || lectureSeule} onClick={() => imprimer()}>
          Facture {figee?.numero ?? r.factureNumero}
        </Button>
      </Tooltip>
    )
  }
  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <Tooltip content={erreur ?? "Encaissez d'abord : la facture fige les montants et les règlements."} relationship="description">
          <Button appearance={appearance} icon={icone} disabled={enCours || lectureSeule}>
            Éditer la facture
          </Button>
        </Tooltip>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {devises.map((code) => (
            <MenuItem key={code} onClick={() => imprimer(code)}>
              En {DEVISES[code].nom.toLowerCase()} ({DEVISES[code].symbole})
            </MenuItem>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}
