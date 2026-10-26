import { FluentProvider, Toaster, tokens } from "@fluentui/react-components"
import { useEffect, useEffectEvent, useState, useSyncExternalStore } from "react"
import type { Reglages, Session } from "../../partage/ipc"
import Connexion from "./Connexion"
import Coquille from "./Coquille"
import { ChargementLogo } from "./composants/commun"
import { FournisseurDonnees } from "./donnees"
import { ROLES } from "./libelles"
import { ContexteReglages } from "./reglages"
import { themeClair, themeSombre } from "./theme"
import { TOASTER, useAnnoncer } from "./toasts"
import { useBarresDeDefilement, useFenetresLimitees } from "./useAppStyles.styles"

// Fenêtre avec Mica (Windows 11) : voir MICA dans src/main/index.ts
const MICA = new URLSearchParams(window.location.search).get("mica") === "1"

// Thème de Windows, suivi en direct (choix « Comme Windows » des paramètres)
const requeteSombre = window.matchMedia("(prefers-color-scheme: dark)")
function useSombre() {
  return useSyncExternalStore(
    (rappel) => {
      requeteSombre.addEventListener("change", rappel)
      return () => requeteSombre.removeEventListener("change", rappel)
    },
    () => requeteSombre.matches,
  )
}

type Etat = { chargement: true } | { chargement: false; session: Session | null; serveurParDefaut: string; expiree?: boolean }

export default function App() {
  useBarresDeDefilement()
  useFenetresLimitees()
  const systemeSombre = useSombre()
  const [etat, setEtat] = useState<Etat>({ chargement: true })
  const [reglages, setReglages] = useState<Reglages | null>(null)
  const sombre = reglages?.theme === "sombre" || (reglages?.theme !== "clair" && systemeSombre)
  const { annoncer } = useAnnoncer()

  // Notifications de la fenêtre : zoom (Ctrl + / Ctrl -), plein écran (F11), session refusée par le serveur
  const surZoom = useEffectEvent((facteur: number) =>
    annoncer({ id: "zoom", titre: `Zoom : ${Math.round(facteur * 100)} %`, texte: "Ctrl + pour agrandir, Ctrl - pour réduire, Ctrl 0 pour revenir à 100 %.", duree: 2500 }),
  )
  const surPleinEcran = useEffectEvent((pleinEcran: boolean) =>
    annoncer({ id: "plein-ecran", titre: pleinEcran ? "Plein écran" : "Plein écran quitté", texte: pleinEcran ? "Appuyez sur F11 pour revenir à la fenêtre." : undefined, duree: 2500 }),
  )
  const surExpiree = useEffectEvent(() =>
    annoncer({
      titre: "Session expirée",
      texte: "Le serveur a refusé votre connexion (mot de passe changé, compte désactivé ou session trop ancienne). Reconnectez-vous.",
      intent: "warning",
      duree: 10_000,
    }),
  )
  // Connexion gardée depuis le lancement précédent (« Se souvenir de moi »)
  const surSessionReprise = useEffectEvent((session: Session) =>
    annoncer({ titre: `Bon retour, ${session.hote.prenom}`, texte: `Connexion reprise en tant que ${ROLES[session.hote.role].toLowerCase()}.`, intent: "success" }),
  )

  useEffect(() => {
    let annule = false
    Promise.all([window.avocatier.session(), window.avocatier.reglages()]).then(([{ session, serveurParDefaut }, r]) => {
      if (annule) return
      setReglages(r)
      setEtat({ chargement: false, session, serveurParDefaut })
      if (session) surSessionReprise(session)
    })
    // Jeton refusé par le serveur (expiré, mot de passe changé, compte désactivé) : retour à la connexion
    const finExpiree = window.avocatier.surSessionExpiree(() => {
      setEtat((e) => (e.chargement ? e : { ...e, session: null, expiree: true }))
      surExpiree()
    })
    const finReglages = window.avocatier.surReglages(setReglages)
    const finZoom = window.avocatier.surZoom(surZoom)
    const finPleinEcran = window.avocatier.surPleinEcran(surPleinEcran)
    return () => {
      annule = true
      finExpiree()
      finReglages()
      finZoom()
      finPleinEcran()
    }
  }, [])

  // Réglages et session lus, premier écran (connexion ou chargement des données) peint deux images plus tard :
  // le processus principal peut afficher la fenêtre sans flash ni changement de thème
  const pret = !etat.chargement && reglages !== null
  useEffect(() => {
    if (!pret) return
    let image = requestAnimationFrame(() => {
      image = requestAnimationFrame(() => window.avocatier.signalerPrete())
    })
    return () => cancelAnimationFrame(image)
  }, [pret])

  return (
    // Hauteur et fond en style, jamais en className : Fluent recopie la className du fournisseur sur ses portails
    // (fenêtres, menus, notifications), qui devenaient des calques plein écran bloquant les clics
    <FluentProvider theme={sombre ? themeSombre : themeClair} style={{ height: "100%", backgroundColor: MICA ? "transparent" : tokens.colorNeutralBackground3 }}>
      <ContexteReglages value={{ reglages, sombre, modifier: (m) => window.avocatier.modifierReglages(m).then(setReglages) }}>
        {etat.chargement || !reglages ? (
          <ChargementLogo texte="Un instant…" />
        ) : etat.session ? (
          <FournisseurDonnees key={etat.session.hote.email}>
            <Coquille
              onDeconnexion={async () => {
                const prenom = etat.session?.hote.prenom
                // Écran d'attente (Spinner) le temps de fermer la session
                setEtat({ chargement: true })
                await window.avocatier.deconnexion()
                setEtat({ ...etat, session: null, expiree: false })
                annoncer({ titre: "Vous êtes déconnecté", texte: `À bientôt${prenom ? `, ${prenom}` : ""}. Les nouvelles demandes ne sont plus suivies sur cet ordinateur.` })
              }}
            />
          </FournisseurDonnees>
        ) : (
          <Connexion
            serveurParDefaut={etat.serveurParDefaut}
            expiree={etat.expiree ?? false}
            onConnecte={(session) => {
              setEtat({ ...etat, session, serveurParDefaut: session.serveur, expiree: false })
              annoncer({ titre: "Connexion réussie", texte: `Bienvenue, ${session.hote.prenom}. Vous êtes connecté en tant que ${ROLES[session.hote.role].toLowerCase()}.`, intent: "success" })
            }}
          />
        )}
      </ContexteReglages>
      <Toaster toasterId={TOASTER} position="bottom-end" />
    </FluentProvider>
  )
}
