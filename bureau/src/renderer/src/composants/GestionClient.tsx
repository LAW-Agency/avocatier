import {
  Body1,
  Button,
  Combobox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Option,
  Spinner,
} from "@fluentui/react-components"
import { PeopleSwapRegular, PersonDeleteRegular, SaveRegular } from "@fluentui/react-icons"
import { useState, type FormEvent, type ReactElement } from "react"
import type { ClientPublic } from "@partage/types"
import { clientsVisibles, nomDe, useDonneesChargees } from "../donnees"
import { useAnnoncer } from "../toasts"
import { useActionsStyles } from "./useReservationStyles.styles"
import { useFormulairesStyles } from "./useFormulairesStyles.styles"

const normaliser = (texte: string) => texte.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()

export type FenetreClient = "coordonnees" | "fusion" | "effacement"

// Fenêtres de la fiche client, ouvertes depuis ses boutons et son menu (une à la fois). Fenêtres contrôlées : un
// élément de menu qui servirait de déclencheur disparaîtrait avec le menu, et sa fenêtre avec lui
export function FenetresClient({ client, ouverte, onFermer }: { client: ClientPublic; ouverte: FenetreClient | null; onFermer: () => void }) {
  const fenetre = (nom: FenetreClient, contenu: ReactElement) => (
    <Dialog open={ouverte === nom} onOpenChange={(_e, data) => !data.open && onFermer()}>
      {contenu}
    </Dialog>
  )
  return (
    <>
      {fenetre("coordonnees", <FormulaireCoordonnees client={client} onFin={onFermer} />)}
      {fenetre("fusion", <FormulaireFusion client={client} onFin={onFermer} />)}
      {fenetre("effacement", <ConfirmationEffacement client={client} onFin={onFermer} />)}
    </>
  )
}

// Coordonnées corrigées par l'équipe. Pour un compte du site, l'e-mail est l'identifiant de connexion du client
function FormulaireCoordonnees({ client, onFin }: { client: ClientPublic; onFin: () => void }) {
  const styles = useFormulairesStyles()
  const { executer } = useDonneesChargees()
  const [valeurs, setValeurs] = useState({ prenom: client.prenom, nom: client.nom, telephone: client.telephone, email: client.email, pays: client.pays })
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const compte = client.origine === "site"
  const champ = (nom: keyof typeof valeurs) => ({ value: valeurs[nom], onChange: (_e: unknown, d: { value: string }) => setValeurs({ ...valeurs, [nom]: d.value }) })

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    setErreur(null)
    const resultat = await executer("PATCH", `/api/hotes/clients/${encodeURIComponent(client.id)}`, { coordonnees: valeurs })
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    onFin()
  }

  return (
    <DialogSurface className={styles.surface}>
      <form onSubmit={envoyer}>
        <DialogBody>
          <DialogTitle>Modifier les coordonnées</DialogTitle>
          <DialogContent className={styles.corps}>
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
              <Field
                label="E-mail"
                required={compte}
                hint={compte ? "Le client se connecte au site avec cette adresse : prévenez-le si vous la changez." : "Facultatif"}
              >
                <Input type="email" {...champ("email")} />
              </Field>
              <Field label="Pays" className={styles.pleine}>
                <Input {...champ("pays")} />
              </Field>
            </div>
            {erreur && (
              <MessageBar intent="error">
                <MessageBarBody>{erreur}</MessageBarBody>
              </MessageBar>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onFin}>Annuler</Button>
            <Button type="submit" appearance="primary" disabled={enCours} icon={enCours ? <Spinner size="tiny" /> : <SaveRegular />}>
              Enregistrer
            </Button>
          </DialogActions>
        </DialogBody>
      </form>
    </DialogSurface>
  )
}

// Deux fiches pour la même personne (créée au comptoir, puis compte ouvert sur le site…) : réunies en une seule.
// La fiche gardée est celle du compte du site s'il y en a un, sinon celle-ci
function FormulaireFusion({ client, onFin }: { client: ClientPublic; onFin: () => void }) {
  const styles = useFormulairesStyles()
  const { d, executer, naviguer } = useDonneesChargees()
  const { annoncer } = useAnnoncer()
  const [recherche, setRecherche] = useState("")
  const [autreId, setAutreId] = useState("")
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const autre = d.clients.find((c) => c.id === autreId)
  const candidats = clientsVisibles(d.clients)
    .filter((c) => c.id !== client.id && normaliser(`${nomDe(c)} ${c.email} ${c.telephone}`).includes(normaliser(recherche.trim())))
    .slice(0, 30)
  const gardee = autre && autre.origine === "site" && client.origine !== "site" ? autre : client
  const sejours = (c: ClientPublic) => d.reservations.filter((r) => r.clientId === c.id).length

  async function fusionner() {
    if (!autre) return
    setEnCours(true)
    setErreur(null)
    const resultat = await executer<{ client: ClientPublic }>("POST", `/api/hotes/clients/${encodeURIComponent(client.id)}/fusion`, { doublonId: autre.id })
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    annoncer({ titre: "Fiches réunies", texte: `Tous les séjours sont maintenant sur la fiche de ${nomDe(resultat.donnees.client)}.`, intent: "success" })
    onFin()
    naviguer({ page: "client", id: resultat.donnees.client.id })
  }

  return (
    <DialogSurface className={styles.surface}>
      <DialogBody>
        <DialogTitle>Fusionner avec une autre fiche</DialogTitle>
        <DialogContent className={styles.corps}>
          <Body1>
            Pour un client enregistré deux fois. Les réservations, les encaissements et la note des deux fiches sont réunis ; les coordonnées manquantes sont reprises de
            l&apos;autre fiche, qui disparaît. Cette opération ne peut pas être annulée.
          </Body1>
          <Field label="Autre fiche du même client" required>
            <Combobox
              className={styles.champ}
              placeholder="Rechercher par nom, e-mail ou téléphone"
              value={recherche}
              selectedOptions={autreId ? [autreId] : []}
              onChange={(e) => {
                setRecherche(e.target.value)
                setAutreId("")
              }}
              onOptionSelect={(_e, data) => {
                setAutreId(data.optionValue ?? "")
                setRecherche(data.optionText ?? "")
              }}
            >
              {candidats.map((c) => (
                <Option key={c.id} value={c.id} text={nomDe(c)}>
                  {nomDe(c)}
                  {(c.email || c.telephone) && ` · ${c.email || c.telephone}`}
                  {c.origine === "site" && " · compte du site"}
                </Option>
              ))}
            </Combobox>
          </Field>
          {autre && (
            <MessageBar intent={autre.origine === "site" && client.origine === "site" ? "error" : "info"}>
              <MessageBarBody>
                {autre.origine === "site" && client.origine === "site"
                  ? "Ces deux fiches sont des comptes du site, chacun avec son mot de passe : elles ne peuvent pas être réunies."
                  : `Fiche gardée : ${nomDe(gardee)}${gardee.origine === "site" ? " (compte du site, pour que le client garde sa connexion)" : ""}. ${sejours(client) + sejours(autre)} réservation(s) au total.`}
              </MessageBarBody>
            </MessageBar>
          )}
          {erreur && (
            <MessageBar intent="error">
              <MessageBarBody>{erreur}</MessageBarBody>
            </MessageBar>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onFin}>Annuler</Button>
          <Button
            appearance="primary"
            disabled={enCours || !autre || (autre.origine === "site" && client.origine === "site")}
            icon={enCours ? <Spinner size="tiny" /> : <PeopleSwapRegular />}
            onClick={fusionner}
          >
            Fusionner les fiches
          </Button>
        </DialogActions>
      </DialogBody>
    </DialogSurface>
  )
}

// Droit à l'effacement (RGPD) : la fiche disparaît, ou devient « Client effacé » si des séjours doivent rester
// dans la comptabilité. Impossible tant qu'un séjour est en cours ou à venir
function ConfirmationEffacement({ client, onFin }: { client: ClientPublic; onFin: () => void }) {
  const actions = useActionsStyles()
  const { d, executer, naviguer } = useDonneesChargees()
  const { annoncer } = useAnnoncer()
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const sejours = d.reservations.filter((r) => r.clientId === client.id).length

  async function effacer() {
    setEnCours(true)
    setErreur(null)
    const resultat = await executer("DELETE", `/api/hotes/clients/${encodeURIComponent(client.id)}`)
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    annoncer({ titre: "Données du client effacées", texte: sejours ? "Ses réservations restent, sous le nom « Client effacé »." : "Sa fiche est supprimée.", intent: "success" })
    onFin()
    naviguer({ page: "clients" })
  }

  return (
    <DialogSurface>
      <DialogBody>
        <DialogTitle>Effacer les données de {nomDe(client)} ?</DialogTitle>
        <DialogContent className={actions.pile}>
          <Body1>À faire uniquement à la demande du client (droit à l&apos;effacement). Cette opération ne peut pas être annulée.</Body1>
          <Body1>
            {sejours
              ? `Nom, e-mail, téléphone, pays, note et messages sont effacés${client.origine === "site" ? ", et son compte du site fermé" : ""}. Ses ${sejours} réservation(s) et leurs encaissements restent pour la comptabilité, sous le nom « Client effacé ».`
              : "Ce client n'a aucune réservation : sa fiche est supprimée."}
          </Body1>
          {erreur && (
            <MessageBar intent="error">
              <MessageBarBody>{erreur}</MessageBarBody>
            </MessageBar>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onFin}>Retour</Button>
          <Button className={actions.danger} disabled={enCours} icon={enCours ? <Spinner size="tiny" /> : <PersonDeleteRegular />} onClick={effacer}>
            Effacer définitivement
          </Button>
        </DialogActions>
      </DialogBody>
    </DialogSurface>
  )
}
