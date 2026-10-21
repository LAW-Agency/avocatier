import { FluentProvider, Spinner, tokens } from "@fluentui/react-components"
import { useEffect, useState, useSyncExternalStore } from "react"
import type { Reglages, Session } from "../../partage/ipc"
import Connexion from "./Connexion"
import Coquille from "./Coquille"
import { FournisseurDonnees } from "./donnees"
import { ContexteReglages } from "./reglages"
import { themeClair, themeSombre } from "./theme"
import { useAppStyles, useBarresDeDefilement } from "./useAppStyles.styles"

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
  const styles = useAppStyles()
  useBarresDeDefilement()
  const systemeSombre = useSombre()
  const [etat, setEtat] = useState<Etat>({ chargement: true })
  const [reglages, setReglages] = useState<Reglages | null>(null)
  const sombre = reglages?.theme === "sombre" || (reglages?.theme !== "clair" && systemeSombre)

  useEffect(() => {
    let annule = false
    Promise.all([window.avocatier.session(), window.avocatier.reglages()]).then(([{ session, serveurParDefaut }, r]) => {
      if (annule) return
      setReglages(r)
      setEtat({ chargement: false, session, serveurParDefaut })
    })
    // Jeton refusé par le serveur (expiré, mot de passe changé, compte désactivé) : retour à la connexion
    const finExpiree = window.avocatier.surSessionExpiree(() => setEtat((e) => (e.chargement ? e : { ...e, session: null, expiree: true })))
    const finReglages = window.avocatier.surReglages(setReglages)
    return () => {
      annule = true
      finExpiree()
      finReglages()
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
          <div className={styles.attente}>
            <Spinner size="large" />
          </div>
        ) : etat.session ? (
          <FournisseurDonnees key={etat.session.hote.email}>
            <Coquille
              onDeconnexion={async () => {
                await window.avocatier.deconnexion()
                setEtat({ ...etat, session: null, expiree: false })
              }}
            />
          </FournisseurDonnees>
        ) : (
          <Connexion
            serveurParDefaut={etat.serveurParDefaut}
            expiree={etat.expiree ?? false}
            onConnecte={(session) => setEtat({ ...etat, session, serveurParDefaut: session.serveur, expiree: false })}
          />
        )}
      </ContexteReglages>
    </FluentProvider>
  )
}
