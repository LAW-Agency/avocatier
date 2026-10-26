import { Body1, Button, Caption1, Dropdown, Field, Input, MessageBar, MessageBarBody, Option, Spinner, Subtitle2, Switch, Textarea, Tooltip, mergeClasses } from "@fluentui/react-components"
import {
  AlertRegular,
  SaveRegular,
  FullScreenMaximizeRegular,
  ZoomInRegular,
  ZoomOutRegular,
  ArrowExitRegular,
  ArrowSyncRegular,
  BrightnessHighRegular,
  CurrencyDollarEuroRegular,
  DesktopRegular,
  GlobeRegular,
  InfoRegular,
  KeyRegular,
  PersonRegular,
  WindowRegular,
  type FluentIcon,
} from "@fluentui/react-icons"
import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import type { ReglagesFacturation } from "@partage/types"
import { DEVISES_LOGICIEL, NIVEAUX_ZOOM, type DeviseLogiciel, type EtatMiseAJour, type InfosLogiciel, type Theme } from "../../../partage/ipc"
import { EnTete } from "../composants/commun"
import { nomDe, useDonneesChargees, useLectureSeule } from "../donnees"
import { ROLES } from "../libelles"
import { DEVISES_AFFICHAGE, formaterEn } from "../montants"
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

// Coordonnées de l'hôtel imprimées sur les factures et les reçus (gérants), communes à toute l'équipe : gardées
// sur le serveur, pas sur ce poste
function Facturation({ initiales }: { initiales: ReglagesFacturation }) {
  const lectureSeule = useLectureSeule()
  const styles = useParametresStyles()
  const { executer } = useDonneesChargees()
  const [valeurs, setValeurs] = useState(initiales)
  const [enCours, setEnCours] = useState(false)
  const [etat, setEtat] = useState<{ erreur?: string; ok?: boolean }>({})
  const champ = (nom: keyof ReglagesFacturation) => ({
    value: valeurs[nom],
    onChange: (_e: unknown, data: { value: string }) => {
      setValeurs({ ...valeurs, [nom]: data.value })
      setEtat({})
    },
  })

  async function enregistrer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    const resultat = await executer("PUT", "/api/hotes/facturation", valeurs)
    setEnCours(false)
    setEtat(resultat.ok ? { ok: true } : { erreur: resultat.erreur })
  }

  return (
    <form className={styles.formulaire} onSubmit={enregistrer}>
      <Caption1 className={mergeClasses(styles.explication, styles.pleine)}>
        En-tête et pied des factures et des reçus PDF (fiche d&apos;une réservation). Communs à toute l&apos;équipe.
      </Caption1>
      <Field label="Nom de l'établissement" required>
        <Input {...champ("raisonSociale")} maxLength={120} />
      </Field>
      <Field label="Identifiants légaux" hint="NIF, STAT, RCS… une ligne chacun">
        <Textarea {...champ("identifiants")} resize="vertical" maxLength={300} rows={2} />
      </Field>
      <Field label="Adresse">
        <Textarea {...champ("adresse")} resize="vertical" maxLength={300} rows={2} />
      </Field>
      <div className={styles.colonne}>
        <Field label="Téléphone">
          <Input type="tel" {...champ("telephone")} maxLength={40} />
        </Field>
        <Field label="E-mail">
          <Input type="email" {...champ("email")} maxLength={120} />
        </Field>
      </div>
      <Field label="Mentions en bas des factures" hint="Conditions de paiement, coordonnées bancaires, mobile money…" className={styles.pleine}>
        <Textarea {...champ("mentions")} resize="vertical" maxLength={1000} rows={3} />
      </Field>
      {etat.erreur && (
        <MessageBar intent="error" className={styles.pleine}>
          <MessageBarBody>{etat.erreur}</MessageBarBody>
        </MessageBar>
      )}
      <div className={mergeClasses(styles.commande, styles.pleine)}>
        <Button type="submit" appearance="primary" disabled={enCours || lectureSeule} icon={enCours ? <Spinner size="tiny" /> : <SaveRegular />}>
          Enregistrer
        </Button>
        {etat.ok && <Caption1>Enregistré : les prochaines factures et les prochains reçus en tiendront compte.</Caption1>}
      </div>
    </form>
  )
}

const HEURE = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" })

function explicationMiseAJour(etat: EtatMiseAJour | null): string {
  switch (etat?.etat) {
    case undefined:
      return "…"
    case "indisponible":
      return "Disponible une fois le logiciel installé."
    case "a-jour":
      return etat.verifieLe ? `Le logiciel est à jour (vérifié le ${HEURE.format(new Date(etat.verifieLe))}).` : "Recherche automatique au lancement puis toutes les 4 heures."
    case "recherche":
      return "Recherche d'une nouvelle version…"
    case "telechargement":
      return `Téléchargement de la version ${etat.version} : ${etat.pourcent} %`
    case "prete":
      return `Version ${etat.version} téléchargée : redémarrez pour l'installer (sinon, à la prochaine fermeture).`
    case "erreur":
      return etat.message
  }
}

// Mises à jour automatiques (src/main/misesAJour.ts) : état suivi en direct, recherche et installation à la demande
function MiseAJour() {
  const [etat, setEtat] = useState<EtatMiseAJour | null>(null)
  useEffect(() => {
    void window.avocatier.etatMiseAJour().then(setEtat)
    return window.avocatier.surMiseAJour(setEtat)
  }, [])
  const occupe = etat?.etat === "recherche" || etat?.etat === "telechargement"
  return (
    <Ligne Icone={ArrowSyncRegular} titre="Mises à jour" explication={explicationMiseAJour(etat)}>
      {etat?.etat === "prete" ? (
        <Button appearance="primary" icon={<ArrowSyncRegular />} onClick={() => window.avocatier.installerMiseAJour()}>
          Redémarrer et installer
        </Button>
      ) : (
        <Button
          disabled={!etat || etat.etat === "indisponible" || occupe}
          icon={occupe ? <Spinner size="tiny" /> : <ArrowSyncRegular />}
          onClick={() => window.avocatier.rechercherMiseAJour()}
        >
          Rechercher
        </Button>
      )}
    </Ligne>
  )
}

// Paramètres du poste (gardés sur cet ordinateur) et du compte connecté
export default function Parametres({ onDeconnexion }: { onDeconnexion: () => void }) {
  const styles = useParametresStyles()
  const { reglages, modifier } = useReglages()
  const { d, gerant } = useDonneesChargees()
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
        <Ligne
          Icone={CurrencyDollarEuroRegular}
          titre="Devise des montants"
          explication={`Montants du logiciel convertis au taux saisi dans Tarifs (exemple : 100 € = ${formaterEn(100, reglages.devise, d.devises.taux)}). Saisies, factures et reçus restent en euros.`}
        >
          <Dropdown
            className={styles.choix}
            value={`${DEVISES_AFFICHAGE[reglages.devise].nom} (${DEVISES_AFFICHAGE[reglages.devise].symbole})`}
            selectedOptions={[reglages.devise]}
            onOptionSelect={(_e, data) => modifier({ devise: data.optionValue as DeviseLogiciel })}
          >
            {DEVISES_LOGICIEL.map((code) => (
              <Option key={code} value={code} text={`${DEVISES_AFFICHAGE[code].nom} (${DEVISES_AFFICHAGE[code].symbole})`}>
                {`${DEVISES_AFFICHAGE[code].nom} (${DEVISES_AFFICHAGE[code].symbole})`}
              </Option>
            ))}
          </Dropdown>
        </Ligne>
        <Ligne Icone={ZoomInRegular} titre="Taille de l'affichage" explication="Raccourcis : Ctrl + pour agrandir, Ctrl - pour réduire, Ctrl 0 pour revenir à 100 % (ou Ctrl + molette).">
          <Tooltip content="Réduire (Ctrl -)" relationship="label">
            <Button icon={<ZoomOutRegular />} disabled={reglages.zoom <= NIVEAUX_ZOOM[0]} onClick={() => window.avocatier.zoomer("moins")} />
          </Tooltip>
          <Button appearance="subtle" className={styles.zoom} onClick={() => window.avocatier.zoomer("initial")} title="Revenir à 100 % (Ctrl 0)">
            {Math.round(reglages.zoom * 100)} %
          </Button>
          <Tooltip content="Agrandir (Ctrl +)" relationship="label">
            <Button icon={<ZoomInRegular />} disabled={reglages.zoom >= NIVEAUX_ZOOM[NIVEAUX_ZOOM.length - 1]} onClick={() => window.avocatier.zoomer("plus")} />
          </Tooltip>
        </Ligne>
        <Ligne Icone={FullScreenMaximizeRegular} titre="Plein écran" explication="Masque la barre des tâches de Windows. Raccourci : F11 pour entrer et sortir.">
          <Button icon={<FullScreenMaximizeRegular />} onClick={() => window.avocatier.basculerPleinEcran()}>
            Basculer (F11)
          </Button>
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

      {gerant && (
        <Groupe titre="Factures et reçus">
          <Facturation initiales={d.facturation} />
        </Groupe>
      )}

      <Groupe titre="À propos">
        <Ligne Icone={InfoRegular} titre="Chez L'Avocatier, logiciel des hôtes" explication={`Version ${infos?.version ?? "…"} · LAW Agency`} />
        <MiseAJour />
      </Groupe>
    </div>
  )
}
