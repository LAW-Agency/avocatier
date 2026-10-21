import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Spinner,
  Textarea,
} from "@fluentui/react-components"
import { PersonAddRegular } from "@fluentui/react-icons"
import { useState, type FormEvent, type ReactElement } from "react"
import type { ClientPublic } from "@partage/types"
import { useDonnees } from "../donnees"
import { useFormulairesStyles } from "./useFormulairesStyles.styles"

const VIDE = { prenom: "", nom: "", telephone: "", email: "", pays: "Madagascar", note: "" }

// Champs d'un client venu au comptoir ou au téléphone (sans compte sur le site ; e-mail facultatif)
export function ChampsClient({ valeurs, onChange }: { valeurs: typeof VIDE; onChange: (valeurs: typeof VIDE) => void }) {
  const styles = useFormulairesStyles()
  const champ = (nom: keyof typeof VIDE) => ({ value: valeurs[nom], onChange: (_e: unknown, d: { value: string }) => onChange({ ...valeurs, [nom]: d.value }) })
  return (
    <div className={styles.grille}>
      <Field label="Prénom" required>
        <Input {...champ("prenom")} autoFocus />
      </Field>
      <Field label="Nom">
        <Input {...champ("nom")} />
      </Field>
      <Field label="Téléphone / WhatsApp">
        <Input type="tel" {...champ("telephone")} />
      </Field>
      <Field label="E-mail" hint="Facultatif">
        <Input type="email" {...champ("email")} />
      </Field>
      <Field label="Pays" className={styles.pleine}>
        <Input {...champ("pays")} />
      </Field>
      <Field label="Note interne" hint="Visible seulement par l'équipe : préférences, pièce d'identité vue…" className={styles.pleine}>
        <Textarea {...champ("note")} resize="vertical" />
      </Field>
    </div>
  )
}

export function useCreationClient() {
  const { executer } = useDonnees()
  const [valeurs, setValeurs] = useState(VIDE)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  async function creer(): Promise<ClientPublic | null> {
    setEnCours(true)
    setErreur(null)
    const resultat = await executer<{ client: ClientPublic }>("POST", "/api/hotes/clients", valeurs)
    setEnCours(false)
    if (!resultat.ok) {
      setErreur(resultat.erreur)
      return null
    }
    setValeurs(VIDE)
    return resultat.donnees.client
  }
  return { valeurs, setValeurs, enCours, erreur, creer }
}

// Fenêtre « Nouveau client » (écran Clients)
export default function NouveauClient({ declencheur, onCree }: { declencheur?: ReactElement; onCree?: (client: ClientPublic) => void }) {
  const styles = useFormulairesStyles()
  const [ouvert, setOuvert] = useState(false)
  const { valeurs, setValeurs, enCours, erreur, creer } = useCreationClient()

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    const client = await creer()
    if (!client) return
    setOuvert(false)
    onCree?.(client)
  }

  return (
    <Dialog open={ouvert} onOpenChange={(_e, d) => setOuvert(d.open)}>
      <DialogTrigger disableButtonEnhancement>
        {declencheur ?? (
          <Button appearance="primary" icon={<PersonAddRegular />}>
            Nouveau client
          </Button>
        )}
      </DialogTrigger>
      <DialogSurface className={styles.surface}>
        <form onSubmit={envoyer}>
          <DialogBody>
            <DialogTitle>Nouveau client</DialogTitle>
            <DialogContent className={styles.corps}>
              <ChampsClient valeurs={valeurs} onChange={setValeurs} />
              {erreur && (
                <MessageBar intent="error">
                  <MessageBarBody>{erreur}</MessageBarBody>
                </MessageBar>
              )}
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button>Annuler</Button>
              </DialogTrigger>
              <Button type="submit" appearance="primary" disabled={enCours} icon={enCours ? <Spinner size="tiny" /> : undefined}>
                Enregistrer le client
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  )
}
