import {
  Body1,
  Button,
  Caption1,
  Checkbox,
  Field,
  Input,
  Link,
  MessageBar,
  MessageBarBody,
  Spinner,
  Subtitle1,
  Title2,
  Tooltip,
} from "@fluentui/react-components"
import { EyeOffRegular, EyeRegular, GlobeRegular, LockClosedRegular, MailRegular } from "@fluentui/react-icons"
import { useState, type FormEvent } from "react"
import type { Session } from "../../partage/ipc"
import photo from "./assets/connexion.jpeg"
import { BarreTitre } from "./composants/BarreTitre"
import { Logotype } from "./composants/Logotype"
import { useReglages } from "./reglages"
import { useConnexionStyles } from "./useConnexionStyles.styles"

// Récupération du mot de passe sur le site (même parcours que les clients) ; adresse saisie illisible :
// celle par défaut
function lienRecuperation(serveur: string, parDefaut: string): string {
  try {
    return new URL("/compte/mot-de-passe-oublie", serveur).toString()
  } catch {
    return new URL("/compte/mot-de-passe-oublie", parDefaut).toString()
  }
}

interface ConnexionProps {
  serveurParDefaut: string
  expiree: boolean
  onConnecte: (session: Session) => void
}

// Connexion de l'équipe (gérants, réception) avec son compte : logo au centre, puis photo et formulaire.
// L'adresse du serveur ne se change qu'en cas de besoin (site déplacé sur le serveur de l'agence)
export default function Connexion({ serveurParDefaut, expiree, onConnecte }: ConnexionProps) {
  const styles = useConnexionStyles()
  const { reglages } = useReglages()
  const [email, setEmail] = useState(reglages.dernierEmail)
  const [motDePasse, setMotDePasse] = useState("")
  const [visible, setVisible] = useState(false)
  const [seSouvenir, setSeSouvenir] = useState(reglages.seSouvenir)
  const [serveur, setServeur] = useState(serveurParDefaut)
  const [parametres, setParametres] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    setErreur(null)
    const resultat = await window.avocatier.connexion(email, motDePasse, serveur, seSouvenir)
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    onConnecte({ hote: resultat.donnees, serveur })
  }

  return (
    <div className={styles.ecran}>
      <BarreTitre />
      <div className={styles.centre}>
        <Logotype hauteur={72} couleur="origine" />

        <div className={styles.carte}>
          <div className={styles.photo} style={{ backgroundImage: `url("${photo}")` }} role="img" aria-label="Coucher de soleil sur la plage de Vohilava">
            <div className={styles.legende}>
              <Subtitle1 className={styles.legendeTexte}>Vohilava, île Sainte-Marie</Subtitle1>
              <Caption1 className={styles.legendeTexte}>Bungalows face à l&apos;océan Indien</Caption1>
            </div>
          </div>

          <form className={styles.formulaire} onSubmit={envoyer}>
            <div className={styles.entete}>
              <Title2 as="h1" className={styles.titre}>
                Se connecter
              </Title2>
              <Body1 className={styles.sousTitre}>Logiciel des hôtes et de la réception.</Body1>
            </div>

            {expiree && !erreur && (
              <MessageBar intent="warning">
                <MessageBarBody>Votre session a expiré. Reconnectez-vous pour continuer.</MessageBarBody>
              </MessageBar>
            )}
            {erreur && (
              <MessageBar intent="error">
                <MessageBarBody>{erreur}</MessageBarBody>
              </MessageBar>
            )}

            <Field label="Adresse e-mail" required>
              <Input
                type="email"
                size="large"
                value={email}
                onChange={(_e, d) => setEmail(d.value)}
                contentBefore={<MailRegular />}
                autoComplete="username"
                autoFocus={!email}
                required
              />
            </Field>
            <Field label="Mot de passe" required>
              <Input
                type={visible ? "text" : "password"}
                size="large"
                value={motDePasse}
                onChange={(_e, d) => setMotDePasse(d.value)}
                contentBefore={<LockClosedRegular />}
                contentAfter={
                  <Tooltip content={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"} relationship="label">
                    <Button
                      appearance="transparent"
                      size="small"
                      icon={visible ? <EyeOffRegular /> : <EyeRegular />}
                      aria-pressed={visible}
                      onClick={() => setVisible(!visible)}
                    />
                  </Tooltip>
                }
                autoComplete="current-password"
                autoFocus={!!email}
                required
              />
            </Field>
            {parametres && (
              <Field label="Serveur" hint="Adresse du site Chez L'Avocatier. À ne changer qu'à la demande de l'agence.">
                <Input value={serveur} onChange={(_e, d) => setServeur(d.value)} contentBefore={<GlobeRegular />} />
              </Field>
            )}

            <div className={styles.options}>
              <Checkbox label="Se souvenir de moi" checked={seSouvenir} onChange={(_e, d) => setSeSouvenir(d.checked === true)} />
              <Link as="button" type="button" onClick={() => window.avocatier.ouvrirLien(lienRecuperation(serveur, serveurParDefaut))}>
                Mot de passe oublié ?
              </Link>
            </div>

            <Button type="submit" appearance="primary" size="large" className={styles.envoyer} disabled={enCours} icon={enCours ? <Spinner size="tiny" /> : undefined}>
              {enCours ? "Connexion…" : "Se connecter"}
            </Button>

            <Caption1 className={styles.pied}>
              <Link as="button" type="button" onClick={() => setParametres(!parametres)}>
                {parametres ? "Masquer les paramètres de connexion" : "Paramètres de connexion"}
              </Link>
            </Caption1>
          </form>
        </div>
      </div>
    </div>
  )
}
