import {
  Body1,
  Button,
  Caption1,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  MessageBar,
  MessageBarBody,
  ProgressBar,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components"
import { ArrowDownloadRegular, ArrowSyncRegular } from "@fluentui/react-icons"
import { useEffect, useRef, useState } from "react"
import type { EtatMiseAJour } from "../../../partage/ipc"

const useStyles = makeStyles({
  surface: { maxWidth: "520px", width: "100%" },
  corps: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalL },
  titre: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalS },
  icone: { fontSize: "24px", color: tokens.colorBrandForeground1 },
  notes: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalXS,
    maxHeight: "200px",
    overflowY: "auto",
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  texteNotes: { whiteSpace: "pre-wrap" },
  progression: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalS },
  secondaire: { color: tokens.colorNeutralForeground3 },
  // Libellé sur une ligne : la colonne des boutons de la fenêtre est sinon trop étroite
  bouton: { whiteSpace: "nowrap", flexShrink: 0 },
})

// Fenêtre des mises à jour (src/main/misesAJour.ts), montée une fois dans la coquille : s'ouvre quand une nouvelle
// version est trouvée (une seule fois par version si on choisit « Plus tard » ; les paramètres la proposent encore)
// et reste ouverte pendant le téléchargement, jusqu'au redémarrage qui l'installe
export default function FenetreMiseAJour() {
  const styles = useStyles()
  const [etat, setEtat] = useState<EtatMiseAJour | null>(null)
  const [ouverte, setOuverte] = useState(false)
  // Version remise à plus tard : la recherche des 4 heures ne la repropose pas
  const ecartee = useRef<string | null>(null)
  const [versionActuelle, setVersionActuelle] = useState<string | null>(null)

  useEffect(() => {
    void window.avocatier.infos().then((infos) => setVersionActuelle(infos.version))
    const recevoir = (nouveau: EtatMiseAJour) => {
      setEtat(nouveau)
      if (nouveau.etat === "telechargement" || (nouveau.etat === "disponible" && nouveau.version !== ecartee.current)) setOuverte(true)
    }
    void window.avocatier.etatMiseAJour().then(recevoir)
    return window.avocatier.surMiseAJour(recevoir)
  }, [])

  // Pas de fermeture pendant le téléchargement et l'installation : le logiciel redémarre à la fin
  const fermable = etat?.etat === "disponible" || etat?.etat === "erreur"
  function plusTard() {
    if (etat?.etat === "disponible") ecartee.current = etat.version
    setOuverte(false)
  }

  if (!etat) return null
  return (
    <Dialog open={ouverte} modalType={fermable ? "modal" : "alert"} onOpenChange={(_e, d) => !d.open && fermable && plusTard()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>
            <span className={styles.titre}>
              <ArrowSyncRegular className={styles.icone} />
              {etat.etat === "prete" ? "Installation de la mise à jour" : "Mise à jour disponible"}
            </span>
          </DialogTitle>
          <DialogContent className={styles.corps}>
            {etat.etat === "disponible" && (
              <>
                <Body1>
                  La version <Text weight="semibold">{etat.version}</Text> du logiciel est disponible
                  {versionActuelle ? ` (vous utilisez la version ${versionActuelle})` : ""}.
                </Body1>
                {etat.notes && (
                  <div className={styles.notes}>
                    <Text weight="semibold">Nouveautés</Text>
                    <Body1 className={styles.texteNotes}>{etat.notes}</Body1>
                  </div>
                )}
                <Caption1 className={styles.secondaire}>
                  Le logiciel se ferme puis redémarre tout seul pour l&apos;installer (moins d&apos;une minute). Terminez d&apos;abord une saisie en cours.
                </Caption1>
              </>
            )}
            {etat.etat === "telechargement" && (
              <div className={styles.progression}>
                <Body1>Téléchargement de la version {etat.version}…</Body1>
                <ProgressBar value={etat.pourcent / 100} thickness="large" aria-label="Téléchargement de la mise à jour" />
                <Caption1 className={styles.secondaire}>{etat.pourcent} % · le logiciel redémarrera tout seul à la fin.</Caption1>
              </div>
            )}
            {etat.etat === "prete" && (
              <div className={styles.progression}>
                <Body1>Version {etat.version} téléchargée : le logiciel redémarre pour l&apos;installer.</Body1>
                <ProgressBar thickness="large" aria-label="Installation de la mise à jour" />
              </div>
            )}
            {etat.etat === "erreur" && (
              <MessageBar intent="error">
                <MessageBarBody>{etat.message}</MessageBarBody>
              </MessageBar>
            )}
          </DialogContent>
          {fermable && (
            <DialogActions>
              <Button className={styles.bouton} onClick={plusTard}>
                Plus tard
              </Button>
              <Button className={styles.bouton} appearance="primary" icon={<ArrowDownloadRegular />} onClick={() => window.avocatier.mettreAJour()}>
                {etat.etat === "erreur" ? "Réessayer" : "Mettre à jour"}
              </Button>
            </DialogActions>
          )}
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
