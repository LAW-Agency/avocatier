import {
  Body1,
  Button,
  Caption1,
  Checkbox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components"
import { PlayCircleRegular } from "@fluentui/react-icons"
import { useEffect, useState } from "react"
import type { RoleEquipe } from "../../../partage/ipc"
import photo from "../assets/bienvenue.jpg"
import { NOUVEAUTES } from "../nouveautes"
import { useReglages } from "../reglages"
import { Logotype } from "./Logotype"
import { lancerVisite } from "./VisiteGuidee"

const useStyles = makeStyles({
  surface: { maxWidth: "560px", width: "100%", padding: 0, overflow: "hidden" },
  // Photo de la baie sous un voile vert nuit qui fonce vers le bas : le titre reste lisible
  entete: {
    position: "relative",
    height: "220px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalXXL}`,
    color: "#ffffff",
    backgroundImage: `linear-gradient(180deg, rgba(2, 11, 8, 0.15) 0%, rgba(2, 11, 8, 0.35) 45%, rgba(0, 60, 45, 0.88) 100%), url("${photo}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  logo: { position: "absolute", top: "18px", left: tokens.spacingHorizontalXXL, backgroundColor: "#ffffff" },
  pastille: {
    position: "absolute",
    top: "16px",
    right: "16px",
    padding: `2px ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(6px)",
    color: "#ffffff",
  },
  titre: { color: "#ffffff", textShadow: "0 1px 8px rgba(0, 0, 0, 0.35)" },
  sous: { marginTop: tokens.spacingVerticalXS, color: "#ffffff", opacity: 0.92 },
  corps: { padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalXXL} ${tokens.spacingVerticalXL}` },
  liste: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalM },
  nouveaute: { display: "flex", columnGap: tokens.spacingHorizontalM },
  icone: { fontSize: "22px", flexShrink: 0, color: tokens.colorBrandForeground1 },
  texte: { display: "flex", flexDirection: "column" },
  secondaire: { color: tokens.colorNeutralForeground3 },
  actions: { alignItems: "center" },
  // La case prend la place libre, les boutons restent à droite
  case: { marginRight: "auto" },
  bouton: { whiteSpace: "nowrap", flexShrink: 0 },
})

// Fenêtre de bienvenue, montée dans la coquille une fois les données chargées : au premier lancement, ou au
// premier lancement d'une version qui a ses nouveautés (nouveautes.ts). « Ne plus afficher » décoché : elle
// revient au lancement suivant
export default function FenetreBienvenue({ role }: { role: RoleEquipe }) {
  const styles = useStyles()
  const { reglages, modifier } = useReglages()
  const [version, setVersion] = useState<string | null>(null)
  const [ouverte, setOuverte] = useState(true)
  const [nePlusAfficher, setNePlusAfficher] = useState(true)

  useEffect(() => {
    void window.avocatier.infos().then((infos) => setVersion(infos.version))
  }, [])

  const premierLancement = reglages.versionPresentee === ""
  const notes = premierLancement ? NOUVEAUTES[0] : NOUVEAUTES.find((n) => n.version === version)
  const liste = notes?.liste.filter((n) => !n.pour || n.pour.includes(role)) ?? []
  if (!version || reglages.versionPresentee === version || !notes || liste.length === 0) return null

  function fermer() {
    setOuverte(false)
    if (nePlusAfficher && version) void modifier({ versionPresentee: version })
  }

  return (
    <Dialog open={ouverte} onOpenChange={(_e, d) => !d.open && fermer()}>
      <DialogSurface className={styles.surface}>
        <div className={styles.entete}>
          <Logotype hauteur={34} couleur="texte" className={styles.logo} />
          <Caption1 className={styles.pastille}>Version {version}</Caption1>
          <DialogTitle as="h2" className={styles.titre}>
            {premierLancement ? "Bienvenue dans le logiciel des hôtes" : `Bienvenue dans la version ${version}`}
          </DialogTitle>
          <Body1 className={styles.sous}>
            {premierLancement ? "Réservations, planning, chambres, clients et caisse au même endroit." : "Le logiciel a été mis à jour. Voici ce qui change."}
          </Body1>
        </div>
        <DialogBody className={styles.corps}>
          <DialogContent className={styles.liste}>
            {liste.map(({ titre, texte, Icone }) => (
              <div key={titre} className={styles.nouveaute}>
                <Icone className={styles.icone} />
                <div className={styles.texte}>
                  <Text weight="semibold">{titre}</Text>
                  <Caption1 className={styles.secondaire}>{texte}</Caption1>
                </div>
              </div>
            ))}
          </DialogContent>
          <DialogActions fluid className={styles.actions}>
            <Checkbox className={styles.case} label="Ne plus afficher pour cette version" checked={nePlusAfficher} onChange={(_e, d) => setNePlusAfficher(d.checked === true)} />
            <Button
              className={styles.bouton}
              icon={<PlayCircleRegular />}
              onClick={() => {
                fermer()
                lancerVisite()
              }}
            >
              Visite guidée
            </Button>
            <Button className={styles.bouton} appearance="primary" onClick={fermer}>
              Commencer
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
