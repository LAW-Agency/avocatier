import {
  Avatar,
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
  MenuList,
  MenuPopover,
  MenuTrigger,
  MessageBar,
  MessageBarBody,
  Option,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  makeStyles,
  tokens,
} from "@fluentui/react-components"
import {
  KeyRegular,
  MoreHorizontalRegular,
  PersonAddRegular,
  PersonAvailableRegular,
  PersonProhibitedRegular,
  ShieldPersonRegular,
  PersonRegular,
} from "@fluentui/react-icons"
import { useState, type FormEvent } from "react"
import { formaterHeure } from "@partage/dates"
import type { RoleEquipe } from "../../../partage/ipc"
import { ChampMotDePasse, motDePasseAleatoire } from "../composants/ChampMotDePasse"
import { Carte, EnTete } from "../composants/commun"
import { useCadreTableStyles } from "../composants/useCommunStyles.styles"
import { useFormulairesStyles } from "../composants/useFormulairesStyles.styles"
import { nomDe, useDonneesChargees, useLectureSeule, type MembreEquipe } from "../donnees"
import { ROLES } from "../libelles"

const useStyles = makeStyles({
  roles: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", columnGap: tokens.spacingHorizontalL },
  role: { display: "flex", columnGap: tokens.spacingHorizontalM, alignItems: "flex-start" },
  icone: { fontSize: tokens.fontSizeBase600, color: tokens.colorBrandForeground1, flexShrink: 0 },
  secondaire: { color: tokens.colorNeutralForeground3 },
  inactif: { opacity: 0.6 },
})

// Utilisateurs (gérants) : comptes de l'équipe qui se connectent au logiciel. Gérant : tout ; réception :
// réservations, planning, chambres, clients et encaissements. Mots de passe provisoires donnés de vive voix.
export default function Utilisateurs() {
  const styles = useStyles()
  const cadre = useCadreTableStyles()
  const { d } = useDonneesChargees()
  const equipe = [...d.equipe].sort((a, b) => Number(b.actif) - Number(a.actif) || a.role.localeCompare(b.role) || a.prenom.localeCompare(b.prenom))

  return (
    <>
      <EnTete titre="Utilisateurs" description="Comptes de l'équipe qui se connectent au logiciel." actions={<NouvelUtilisateur />} />

      <Carte>
        <div className={styles.roles}>
          <div className={styles.role}>
            <ShieldPersonRegular className={styles.icone} />
            <div>
              <Body1 block>
                <strong>Gérant</strong>
              </Body1>
              <Caption1 className={styles.secondaire}>Tout le logiciel : tarifs, revenus, statistiques et utilisateurs compris.</Caption1>
            </div>
          </div>
          <div className={styles.role}>
            <PersonRegular className={styles.icone} />
            <div>
              <Body1 block>
                <strong>Réception</strong>
              </Body1>
              <Caption1 className={styles.secondaire}>Demandes, réservations sur place, arrivées et départs, chambres, clients et encaissements.</Caption1>
            </div>
          </div>
        </div>
      </Carte>

      <div className={cadre.root}>
        <Table aria-label="Utilisateurs">
          <TableHeader className={cadre.entete}>
            <TableRow>
              <TableHeaderCell className={cadre.premiere}>Utilisateur</TableHeaderCell>
              <TableHeaderCell>Rôle</TableHeaderCell>
              <TableHeaderCell>Statut</TableHeaderCell>
              <TableHeaderCell>Créé le</TableHeaderCell>
              <TableHeaderCell style={{ width: "64px" }} aria-label="Actions" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipe.map((m) => (
              <TableRow key={m.id} className={m.actif ? undefined : styles.inactif}>
                <TableCell className={cadre.premiere}>
                  <TableCellLayout media={<Avatar name={nomDe(m)} color={m.role === "hote" ? "brand" : "colorful"} />} description={m.email}>
                    {nomDe(m)}
                    {m.id === d.hote.id && " (vous)"}
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <Badge appearance="tint" color={m.role === "hote" ? "brand" : "informative"} shape="rounded" icon={m.role === "hote" ? <ShieldPersonRegular /> : <PersonRegular />}>
                    {ROLES[m.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge appearance="outline" color={m.actif ? "success" : "subtle"} shape="rounded">
                    {m.actif ? "Actif" : "Désactivé"}
                  </Badge>
                </TableCell>
                <TableCell>{formaterHeure(m.creeLe)}</TableCell>
                <TableCell>
                  <ActionsMembre membre={m} soiMeme={m.id === d.hote.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

function ActionsMembre({ membre: m, soiMeme }: { membre: MembreEquipe; soiMeme: boolean }) {
  const lectureSeule = useLectureSeule()
  const { executer } = useDonneesChargees()
  const [erreur, setErreur] = useState<string | null>(null)
  const [motDePasse, setMotDePasse] = useState(false)
  const [enCours, setEnCours] = useState(false)

  async function modifier(modification: { role?: RoleEquipe; actif?: boolean }) {
    setEnCours(true)
    const resultat = await executer("PATCH", `/api/hotes/equipe/${encodeURIComponent(m.id)}`, modification)
    setEnCours(false)
    setErreur(resultat.ok ? null : resultat.erreur)
  }

  return (
    <>
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <Button appearance="subtle" disabled={enCours || lectureSeule} icon={enCours ? <Spinner size="tiny" /> : <MoreHorizontalRegular />} aria-label={`Actions pour ${nomDe(m)}`} />
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            {m.role === "reception" ? (
              <MenuItem icon={<ShieldPersonRegular />} onClick={() => modifier({ role: "hote" })}>
                Rendre gérant
              </MenuItem>
            ) : (
              <MenuItem icon={<PersonRegular />} disabled={soiMeme} onClick={() => modifier({ role: "reception" })}>
                Passer en réception
              </MenuItem>
            )}
            <MenuItem icon={<KeyRegular />} onClick={() => setMotDePasse(true)}>
              Réinitialiser le mot de passe
            </MenuItem>
            <MenuDivider />
            {m.actif ? (
              <MenuItem icon={<PersonProhibitedRegular />} disabled={soiMeme} onClick={() => modifier({ actif: false })}>
                Désactiver le compte
              </MenuItem>
            ) : (
              <MenuItem icon={<PersonAvailableRegular />} onClick={() => modifier({ actif: true })}>
                Réactiver le compte
              </MenuItem>
            )}
          </MenuList>
        </MenuPopover>
      </Menu>
      {motDePasse && <NouveauMotDePasse membre={m} onFin={() => setMotDePasse(false)} />}
      {erreur && (
        <Dialog open onOpenChange={() => setErreur(null)}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Modification impossible</DialogTitle>
              <DialogContent>{erreur}</DialogContent>
              <DialogActions>
                <Button appearance="primary" onClick={() => setErreur(null)}>
                  Fermer
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}
    </>
  )
}

function NouveauMotDePasse({ membre: m, onFin }: { membre: MembreEquipe; onFin: () => void }) {
  const lectureSeule = useLectureSeule()
  const formulaire = useFormulairesStyles()
  const { executer } = useDonneesChargees()
  const [valeur, setValeur] = useState(motDePasseAleatoire)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    const resultat = await executer("PATCH", `/api/hotes/equipe/${encodeURIComponent(m.id)}`, { motDePasse: valeur })
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    onFin()
  }

  return (
    <Dialog open onOpenChange={(_e, data) => !data.open && onFin()}>
      <DialogSurface>
        <form onSubmit={envoyer}>
          <DialogBody>
            <DialogTitle>Nouveau mot de passe pour {nomDe(m)}</DialogTitle>
            <DialogContent className={formulaire.corps}>
              <Body1>Communiquez-le de vive voix. Ses connexions en cours seront fermées ; la personne pourra le changer par « Mot de passe oublié ».</Body1>
              <Field label="Mot de passe provisoire" hint="8 caractères minimum.">
                <ChampMotDePasse valeur={valeur} onValeur={setValeur} generer />
              </Field>
              {erreur && (
                <MessageBar intent="error">
                  <MessageBarBody>{erreur}</MessageBarBody>
                </MessageBar>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={onFin}>Annuler</Button>
              <Button type="submit" appearance="primary" disabled={enCours || lectureSeule || valeur.length < 8} icon={enCours ? <Spinner size="tiny" /> : <KeyRegular />}>
                Définir le mot de passe
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  )
}

function NouvelUtilisateur() {
  const lectureSeule = useLectureSeule()
  const formulaire = useFormulairesStyles()
  const { executer } = useDonneesChargees()
  const [ouvert, setOuvert] = useState(false)
  const [prenom, setPrenom] = useState("")
  const [nom, setNom] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<RoleEquipe>("reception")
  const [motDePasse, setMotDePasse] = useState(motDePasseAleatoire)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    setErreur(null)
    const resultat = await executer("POST", "/api/hotes/equipe", { prenom, nom, email, role, motDePasse })
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    setOuvert(false)
    setPrenom("")
    setNom("")
    setEmail("")
    setMotDePasse(motDePasseAleatoire())
  }

  return (
    <Dialog open={ouvert} onOpenChange={(_e, data) => setOuvert(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="primary" icon={<PersonAddRegular />} disabled={lectureSeule}>
          Ajouter un utilisateur
        </Button>
      </DialogTrigger>
      <DialogSurface className={formulaire.surface}>
        <form onSubmit={envoyer}>
          <DialogBody>
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
            <DialogContent className={formulaire.corps}>
              <div className={formulaire.grille}>
                <Field label="Prénom" required>
                  <Input value={prenom} onChange={(_e, data) => setPrenom(data.value)} autoFocus />
                </Field>
                <Field label="Nom">
                  <Input value={nom} onChange={(_e, data) => setNom(data.value)} />
                </Field>
                <Field label="Adresse e-mail" required hint="Sert d'identifiant de connexion" className={formulaire.pleine}>
                  <Input type="email" value={email} onChange={(_e, data) => setEmail(data.value)} />
                </Field>
                <Field label="Rôle" required>
                  <Dropdown className={formulaire.champ} value={ROLES[role]} selectedOptions={[role]} onOptionSelect={(_e, data) => setRole(data.optionValue as RoleEquipe)}>
                    <Option value="reception">{ROLES.reception}</Option>
                    <Option value="hote">{ROLES.hote}</Option>
                  </Dropdown>
                </Field>
                <Field label="Mot de passe provisoire" required hint="À donner de vive voix.">
                  <ChampMotDePasse valeur={motDePasse} onValeur={setMotDePasse} generer />
                </Field>
              </div>
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
              <Button type="submit" appearance="primary" disabled={enCours || lectureSeule} icon={enCours ? <Spinner size="tiny" /> : <PersonAddRegular />}>
                Créer le compte
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  )
}
