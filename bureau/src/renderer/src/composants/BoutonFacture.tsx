import { Button, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, Spinner, Tooltip, type ButtonProps } from "@fluentui/react-components"
import { DocumentPdfRegular } from "@fluentui/react-icons"
import { useState } from "react"
import { formaterHeure } from "@partage/dates"
import { DEVISES, formaterDansDevise } from "@partage/devises"
import type { CodeDevise, Reservation } from "@partage/types"
import { factureDe, useDonneesChargees, useLectureSeule } from "../donnees"
import { useFichiers } from "../fichiers"

// Facture PDF d'un séjour confirmé, restaurant et bar compris, avec les autres chambres de son groupe au nom du
// même client. Première édition : devise demandée par le client (ariary, euro, dollar…), contenu et taux figés ;
// ensuite, la même facture se réimprime
export default function BoutonFacture({ reservation: r, appearance }: { reservation: Reservation; appearance?: ButtonProps["appearance"] }) {
  const lectureSeule = useLectureSeule()
  const { d } = useDonneesChargees()
  const { imprimerFacture } = useFichiers()
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const figee = factureDe(r, d)
  const devises = [...new Set<CodeDevise>(["MGA", "EUR", ...d.devises.actives])]

  async function imprimer(devise?: CodeDevise) {
    setEnCours(true)
    setErreur(await imprimerFacture(r, devise))
    setEnCours(false)
  }

  const icone = enCours ? <Spinner size="tiny" /> : <DocumentPdfRegular />
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
