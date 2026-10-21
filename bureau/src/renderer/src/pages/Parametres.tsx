import { Body1, Button, Caption1, Dropdown, Option, Subtitle2, Switch } from "@fluentui/react-components"
import {
  AlertRegular,
  ArrowExitRegular,
  BrightnessHighRegular,
  DesktopRegular,
  GlobeRegular,
  InfoRegular,
  KeyRegular,
  PersonRegular,
  WindowRegular,
  type FluentIcon,
} from "@fluentui/react-icons"
import { useEffect, useState, type ReactNode } from "react"
import type { InfosLogiciel, Theme } from "../../../partage/ipc"
import { EnTete } from "../composants/commun"
import { nomDe, useDonneesChargees } from "../donnees"
import { ROLES } from "../libelles"
import { useReglages } from "../reglages"
import { useParametresStyles } from "./useParametresStyles.styles"

const THEMES: Record<Theme, string> = { systeme: "Comme Windows", clair: "Clair", sombre: "Sombre" }

function Ligne({ Icone, titre, explication, children }: { Icone: FluentIcon; titre: string; explication?: ReactNode; children?: ReactNode }) {
  const styles = useParametresStyles()
  return (
    <div className={styles.ligne}>
      <Icone className={styles.icone} />
      <div className={styles.texte}>
        <Body1>{titre}</Body1>
        {explication && <Caption1 className={styles.explication}>{explication}</Caption1>}
      </div>
      <div className={styles.commande}>{children}</div>
    </div>
  )
}

function Groupe({ titre, children }: { titre: string; children: ReactNode }) {
  const styles = useParametresStyles()
  return (
    <section className={styles.groupe}>
      <Subtitle2 as="h2" className={styles.titreGroupe}>
        {titre}
      </Subtitle2>
      {children}
    </section>
  )
}

// Paramètres du poste (gardés sur cet ordinateur) et du compte connecté
export default function Parametres({ onDeconnexion }: { onDeconnexion: () => void }) {
  const styles = useParametresStyles()
  const { reglages, modifier } = useReglages()
  const { d } = useDonneesChargees()
  const [infos, setInfos] = useState<InfosLogiciel | null>(null)
  const [serveur, setServeur] = useState("")
  useEffect(() => {
    window.avocatier.infos().then(setInfos)
    window.avocatier.session().then(({ session }) => setServeur(session?.serveur ?? ""))
  }, [])

  return (
    <div className={styles.page}>
      <EnTete titre="Paramètres" description="Réglages de ce poste et de votre compte." />

      <Groupe titre="Apparence">
        <Ligne Icone={BrightnessHighRegular} titre="Thème" explication="Aussi accessible par le bouton soleil / lune de la barre de titre.">
          <Dropdown className={styles.choix} value={THEMES[reglages.theme]} selectedOptions={[reglages.theme]} onOptionSelect={(_e, data) => modifier({ theme: data.optionValue as Theme })}>
            {(Object.keys(THEMES) as Theme[]).map((t) => (
              <Option key={t} value={t}>
                {THEMES[t]}
              </Option>
            ))}
          </Dropdown>
        </Ligne>
      </Groupe>

      <Groupe titre="Notifications et fenêtre">
        <Ligne Icone={AlertRegular} titre="Notifications de Windows" explication="Nouvelle demande, annulation par un client, option expirée, quand le logiciel est en arrière-plan.">
          <Switch checked={reglages.notifications} onChange={(_e, data) => modifier({ notifications: data.checked })} aria-label="Notifications de Windows" />
        </Ligne>
        <Ligne Icone={WindowRegular} titre="Rester ouvert à la fermeture" explication="La croix range le logiciel près de l'horloge pour continuer à recevoir les demandes.">
          <Switch checked={reglages.rangerDansZone} onChange={(_e, data) => modifier({ rangerDansZone: data.checked })} aria-label="Rester ouvert à la fermeture" />
        </Ligne>
        <Ligne
          Icone={DesktopRegular}
          titre="Lancer au démarrage de Windows"
          explication={infos?.installe === false ? "Disponible une fois le logiciel installé." : "Le logiciel s'ouvre à l'ouverture de votre session Windows."}
        >
          <Switch checked={reglages.demarrage} disabled={infos?.installe === false} onChange={(_e, data) => modifier({ demarrage: data.checked })} aria-label="Lancer au démarrage de Windows" />
        </Ligne>
      </Groupe>

      <Groupe titre="Compte">
        <Ligne Icone={PersonRegular} titre={nomDe(d.hote)} explication={`${d.hote.email} · ${ROLES[d.hote.role]}`} />
        <Ligne Icone={KeyRegular} titre="Se souvenir de moi" explication="Rester connecté d'un lancement à l'autre sur cet ordinateur (connexion chiffrée par Windows).">
          <Switch checked={reglages.seSouvenir} onChange={(_e, data) => modifier({ seSouvenir: data.checked })} aria-label="Se souvenir de moi" />
        </Ligne>
        <Ligne Icone={GlobeRegular} titre="Serveur" explication={serveur || "—"}>
          <Button onClick={() => serveur && window.avocatier.ouvrirLien(serveur)}>Ouvrir le site</Button>
        </Ligne>
        <Ligne Icone={ArrowExitRegular} titre="Se déconnecter" explication="Revenir à l'écran de connexion.">
          <Button onClick={onDeconnexion}>Se déconnecter</Button>
        </Ligne>
      </Groupe>

      <Groupe titre="À propos">
        <Ligne Icone={InfoRegular} titre="Chez L'Avocatier, logiciel des hôtes" explication={`Version ${infos?.version ?? "…"} · LAW Agency`} />
      </Groupe>
    </div>
  )
}
