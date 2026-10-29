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
import { useLayoutEffect, useRef, useState, type FormEvent, type RefObject } from "react"
import type { Session } from "../../partage/ipc"
import photo from "./assets/connexion.jpeg"
import { BarreTitre } from "./composants/BarreTitre"
import { Logotype } from "./composants/Logotype"
import { useReglages } from "./reglages"
import { useAnnoncer } from "./toasts"
import { prechargerDonnees } from "./donnees"
import { AGRANDI, HAUTEUR_LOGO, MONTEE, SORTIE, logoRetenu, mouvementReduit, retenirLogo, transformationVers } from "./ouverture"
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

// Ouverture : le logo est déjà là, grand, au centre de l'écran ; il monte à sa place et, au moment où il s'y
// pose, la carte arrive du bas de la fenêtre (photo qui se pose, champs en cascade). Mesuré avant la première
// image : rien ne saute. Mouvement réduit dans Windows : tout est affiché d'emblée
function useOuverture(zone: RefObject<HTMLDivElement | null>, logo: RefObject<HTMLSpanElement | null>, carte: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const z = zone.current
    const l = logo.current
    const c = carte.current
    if (!z || !l || !c || mouvementReduit()) return

    // Décalage du logo jusqu'au centre de la zone, et de la carte jusque sous le bas de la fenêtre
    const rz = z.getBoundingClientRect()
    const rl = l.getBoundingClientRect()
    const rc = c.getBoundingClientRect()
    const dy = rz.top + rz.height / 2 - (rl.top + rl.height / 2)
    const sousLaFenetre = rz.bottom - rc.top
    const centre = `translateY(${dy}px) scale(${AGRANDI})`
    const photo = c.firstElementChild as HTMLElement | null
    const champs = Array.from(c.lastElementChild?.children ?? []) as HTMLElement[]

    // Temps (ms) : le logo reste au centre (la fenêtre s'affiche deux images après le rendu), monte, puis la carte
    const depart = logoRetenu()?.rect
    const arrivee = depart ? 500 : 0
    const pause = arrivee + 700
    const montee = 1000
    const carteDebut = pause + montee - 200

    // Pas de barre de défilement le temps que la carte monte
    z.style.overflowY = "hidden"
    const animations = [
      l.animate(
        [
          // Retour de la déconnexion encore en vol : le logo finit d'abord d'arriver au centre
          ...(depart ? [{ transform: transformationVers(l, depart), easing: MONTEE }] : []),
          { transform: centre, offset: depart ? arrivee / (pause + montee) : 0 },
          { transform: centre, offset: pause / (pause + montee), easing: MONTEE },
          { transform: "none" },
        ],
        { duration: pause + montee, fill: "backwards" },
      ),
      c.animate(
        [
          { opacity: 0, transform: `translateY(${sousLaFenetre}px)` },
          { opacity: 1, offset: 0.35 },
          { opacity: 1, transform: "none" },
        ],
        { duration: 1200, delay: carteDebut, easing: SORTIE, fill: "backwards" },
      ),
      ...(photo ? [photo.animate([{ transform: "scale(1.15)" }, { transform: "none" }], { duration: 1900, delay: carteDebut, easing: SORTIE, fill: "backwards" })] : []),
      ...champs.map((champ, i) =>
        champ.animate(
          [
            { opacity: 0, transform: "translateY(16px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 700, delay: carteDebut + 450 + i * 60, easing: SORTIE, fill: "backwards" },
        ),
      ),
    ]
    animations[1].finished.then(() => (z.style.overflowY = ""), () => {})
    return () => {
      animations.forEach((a) => a.cancel())
      z.style.overflowY = ""
    }
  }, [zone, logo, carte])
}

interface ConnexionProps {
  serveurParDefaut: string
  expiree: boolean
  onConnecte: (session: Session) => void
}

// Connexion de l'équipe (gérants, réception) avec son compte : logo au centre (repris de l'écran de lancement), puis photo et formulaire.
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
  const { annoncer } = useAnnoncer()
  const zone = useRef<HTMLDivElement>(null)
  const logo = useRef<HTMLSpanElement>(null)
  const carte = useRef<HTMLDivElement>(null)
  useOuverture(zone, logo, carte)

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    setErreur(null)
    const resultat = await window.avocatier.connexion(email, motDePasse, serveur, seSouvenir)
    setEnCours(false)
    if (!resultat.ok) {
      annoncer({ id: "connexion", titre: "Connexion refusée", texte: resultat.erreur, intent: "error", duree: 8000 })
      return setErreur(resultat.erreur)
    }
    prechargerDonnees()
    // Connexion validée : la carte redescend et s'efface, le logo reste en place et passe au logiciel
    if (carte.current && !mouvementReduit()) {
      await carte.current
        .animate(
          [
            { opacity: 1, transform: "none" },
            { opacity: 0, transform: "translateY(48px) scale(0.98)" },
          ],
          { duration: 420, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" },
        )
        .finished.catch(() => {})
    }
    retenirLogo(logo.current)
    onConnecte({ hote: resultat.donnees, serveur })
  }

  return (
    <div className={styles.ecran}>
      <BarreTitre logo={false} />
      <div ref={zone} className={styles.centre}>
        <Logotype ref={logo} hauteur={HAUTEUR_LOGO} couleur="origine" />

        <div ref={carte} className={styles.carte}>
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
