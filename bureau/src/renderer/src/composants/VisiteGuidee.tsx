import { Button, Caption1, ProgressBar, Subtitle2, Text, Tooltip, makeStyles, mergeClasses, tokens } from "@fluentui/react-components"
import { ChevronLeftRegular, ChevronRightRegular, DismissRegular, PauseRegular, PlayRegular, Speaker2Regular, SpeakerMuteRegular } from "@fluentui/react-icons"
import { useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react"
import { useDonneesChargees, type Vue } from "../donnees"
import { useAnnoncer } from "../toasts"
import { donneesAssezFournies, donneesDeDemonstration } from "../visite/demonstration"
import { ETAPES_VISITE, VOIX_VISITE, type EtapeVisite } from "../visite/etapes"

// Visite guidée (bouton du Guide) : ouvre chaque écran, éclaire l'élément `data-visite` de l'étape et le
// présente avec la voix de Nico (MP3 pré-générés par `npm run voix`, sous-titres seuls s'ils manquent).
// Le reste de la fenêtre est assombri et ne réagit pas pendant la visite. Base presque vide : données
// d'exemple affichées le temps de la visite, sans rien enregistrer (visite/demonstration.ts).

// Lancement depuis n'importe quel écran, sans contexte : petit magasin partagé
let enCours = false
const abonnes = new Set<() => void>()
const prevenir = () => abonnes.forEach((rappel) => rappel())
export function lancerVisite() {
  enCours = true
  prevenir()
}
function arreterVisite() {
  enCours = false
  prevenir()
}
function abonner(rappel: () => void) {
  abonnes.add(rappel)
  return () => abonnes.delete(rappel)
}

const AUDIOS = import.meta.glob<string>("../assets/visite/*.mp3", { eager: true, query: "?url", import: "default" })
const audioDe = (etape: EtapeVisite): string | undefined => AUDIOS[`../assets/visite/${etape.id}.mp3`]
// Sans voix : temps de lecture du sous-titre (environ 2,5 mots par seconde)
const dureeLecture = (texte: string) => Math.max(4000, (texte.split(/\s+/).length / 2.5) * 1000)

const MARGE = 6 // autour de l'élément éclairé
const LARGEUR_BULLE = 380
const ECART = 14

type Cadre = { etapeId: string; zone: { x: number; y: number; l: number; h: number } | null }

const useStyles = makeStyles({
  bloqueur: { position: "fixed", inset: 0, zIndex: 1000 },
  voile: { backgroundColor: "rgba(0, 0, 0, 0.5)", transition: "background-color 300ms ease" },
  projecteur: {
    position: "fixed",
    zIndex: 1001,
    pointerEvents: "none",
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
    outline: `${tokens.strokeWidthThick} solid ${tokens.colorBrandStroke1}`,
    outlineOffset: "2px",
    transition: "top 350ms ease, left 350ms ease, width 350ms ease, height 350ms ease",
  },
  bulle: {
    position: "fixed",
    zIndex: 1002,
    width: `${LARGEUR_BULLE}px`,
    maxWidth: "calc(100vw - 32px)",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalL,
    borderRadius: tokens.borderRadiusXLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow64,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    transition: "top 350ms ease, left 350ms ease, bottom 350ms ease",
  },
  haut: { display: "flex", alignItems: "center", justifyContent: "space-between", columnGap: tokens.spacingHorizontalS },
  compteur: { color: tokens.colorBrandForeground1, fontWeight: tokens.fontWeightSemibold },
  titre: { margin: 0 },
  texte: { lineHeight: tokens.lineHeightBase400 },
  note: { color: tokens.colorNeutralForeground3 },
  commandes: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalXS, marginTop: tokens.spacingVerticalXS },
  espace: { flexGrow: 1 },
})

export default function VisiteGuidee() {
  const active = useSyncExternalStore(abonner, () => enCours)
  return active ? <Visite /> : null
}

function Visite() {
  const styles = useStyles()
  const { d, gerant, vue, naviguer, demonstration, setDemonstration } = useDonneesChargees()
  const { annoncer } = useAnnoncer()
  // Étapes des écrans de gérants sautées pour la réception
  const etapes = useMemo(() => ETAPES_VISITE.filter((e) => !e.gerants || gerant), [gerant])
  const [index, setIndex] = useState(0)
  const [pause, setPause] = useState(false)
  const [muet, setMuet] = useState(false)
  const [cadre, setCadre] = useState<Cadre | null>(null)
  const [progression, setProgression] = useState(0)
  const audio = useRef<HTMLAudioElement | null>(null)
  const pauseActuelle = useRef(pause)
  const muetActuel = useRef(muet)
  const etape = etapes[index]
  const derniere = index === etapes.length - 1
  // Élément trouvé (ou cherché en vain) pour cette étape : la voix peut partir
  const pret = cadre?.etapeId === etape.id

  // Base presque vide : exemples le temps de la visite, vraies données rendues à la fin
  const demarrer = useEffectEvent(() => {
    if (!donneesAssezFournies(d)) setDemonstration(donneesDeDemonstration(d))
  })
  const finir = useEffectEvent(() => {
    if (demonstration) annoncer({ id: "visite", titre: "Visite terminée", texte: "Les données d'exemple ont été retirées.", intent: "success" })
    setDemonstration(null)
  })
  useEffect(() => {
    demarrer()
    return () => finir()
  }, [])

  // Écran de l'étape : le sien, ou celui de la dernière étape qui en ouvre un (retour en arrière compris)
  const page = etapes.slice(0, index + 1).findLast((e) => e.page)?.page
  useEffect(() => {
    if (page && vue.page !== page) naviguer({ page } as Vue)
  }, [page, vue.page, naviguer])

  // Recherche de l'élément (l'écran se prépare en transition), défilement jusqu'à lui une fois, puis suivi
  // de sa position (données rechargées, fenêtre redimensionnée…) ; introuvable au bout de 3 s : bulle au centre
  useEffect(() => {
    const debut = Date.now()
    let defile = false
    const suivre = () => {
      const element = etape.cible ? document.querySelector<HTMLElement>(`[data-visite="${etape.cible}"]`) : null
      const r = element?.getBoundingClientRect()
      if (!element || !r || (r.width === 0 && r.height === 0)) {
        if (!etape.cible || Date.now() - debut > 3000) setCadre((c) => (c?.etapeId === etape.id && !c.zone ? c : { etapeId: etape.id, zone: null }))
        return
      }
      if (!defile) {
        element.scrollIntoView({ block: "center", behavior: "smooth" })
        defile = true
      }
      // Élément plus haut que la fenêtre : seule sa partie visible est éclairée
      const y = Math.max(r.top, MARGE * 2)
      const bas = Math.min(r.bottom, window.innerHeight - MARGE * 2)
      const zone = { x: r.left, y, l: r.width, h: Math.max(0, bas - y) }
      setCadre((c) =>
        c?.etapeId === etape.id && c.zone && Math.abs(c.zone.x - zone.x) < 1 && Math.abs(c.zone.y - zone.y) < 1 && Math.abs(c.zone.l - zone.l) < 1 && Math.abs(c.zone.h - zone.h) < 1
          ? c
          : { etapeId: etape.id, zone },
      )
    }
    const minuterie = setInterval(suivre, 120)
    return () => clearInterval(minuterie)
  }, [etape])

  const suivanteAuto = useEffectEvent(() => {
    if (derniere) arreterVisite()
    else setIndex((i) => i + 1)
  })

  // Lecture de l'étape : la voix si son MP3 existe, sinon le temps de lire le sous-titre ; étape suivante à la fin
  useEffect(() => {
    if (!pret) return
    const url = audioDe(etape)
    const lecteur = url ? new Audio(url) : null
    audio.current = lecteur
    let ecoule = 0
    let fini = false
    let attente: ReturnType<typeof setTimeout> | undefined
    const terminer = () => {
      if (fini) return
      fini = true
      setProgression(1)
      attente = setTimeout(suivanteAuto, 900)
    }
    if (lecteur) {
      lecteur.muted = muetActuel.current
      lecteur.onended = terminer
      // Lecture refusée ou fichier illisible : sous-titres seuls
      if (!pauseActuelle.current) lecteur.play().catch(() => (audio.current = null))
    }
    const duree = dureeLecture(etape.texte)
    const minuterie = setInterval(() => {
      const a = audio.current
      if (a) {
        if (a.duration) setProgression(a.currentTime / a.duration)
      } else if (!pauseActuelle.current && !fini) {
        ecoule += 100
        setProgression(Math.min(1, ecoule / duree))
        if (ecoule >= duree) terminer()
      }
    }, 100)
    return () => {
      fini = true
      clearInterval(minuterie)
      clearTimeout(attente)
      lecteur?.pause()
      audio.current = null
      setProgression(0)
    }
  }, [etape, pret])

  useEffect(() => {
    pauseActuelle.current = pause
    const a = audio.current
    if (a) {
      if (pause) a.pause()
      else a.play().catch(() => (audio.current = null))
    }
  }, [pause])
  useEffect(() => {
    muetActuel.current = muet
    if (audio.current) audio.current.muted = muet
  }, [muet])

  const aller = (i: number) => {
    setPause(false)
    setIndex(Math.max(0, Math.min(etapes.length - 1, i)))
  }

  // Clavier : Échap arrête, flèches pour naviguer, Espace pour la pause ; fenêtre cachée : pause
  const surTouche = useEffectEvent((e: KeyboardEvent) => {
    const actions: Record<string, () => void> = {
      Escape: arreterVisite,
      ArrowRight: () => (derniere ? arreterVisite() : aller(index + 1)),
      ArrowLeft: () => aller(index - 1),
      " ": () => setPause((p) => !p),
    }
    const action = actions[e.key]
    if (!action) return
    e.preventDefault()
    e.stopPropagation()
    action()
  })
  useEffect(() => {
    const surVisibilite = () => document.visibilityState === "hidden" && setPause(true)
    window.addEventListener("keydown", surTouche, true)
    document.addEventListener("visibilitychange", surVisibilite)
    return () => {
      window.removeEventListener("keydown", surTouche, true)
      document.removeEventListener("visibilitychange", surVisibilite)
    }
  }, [])

  const zone = pret && cadre ? cadre.zone : null
  return (
    <>
      <div className={mergeClasses(styles.bloqueur, !zone && styles.voile)} aria-hidden />
      {zone && <div className={styles.projecteur} style={{ top: zone.y - MARGE, left: zone.x - MARGE, width: zone.l + MARGE * 2, height: zone.h + MARGE * 2 }} />}
      <div className={styles.bulle} style={placerBulle(zone)} role="dialog" aria-label={`Visite guidée : ${etape.titre}`}>
        <div className={styles.haut}>
          <Caption1 className={styles.compteur}>
            Visite guidée · {index + 1} / {etapes.length}
          </Caption1>
          <Tooltip content="Arrêter la visite (Échap)" relationship="label">
            <Button appearance="subtle" size="small" icon={<DismissRegular />} onClick={arreterVisite} />
          </Tooltip>
        </div>
        <Subtitle2 as="h2" className={styles.titre}>
          {etape.titre}
        </Subtitle2>
        <Text className={styles.texte} aria-live="polite">
          {etape.texte}
        </Text>
        <ProgressBar value={progression} thickness="medium" aria-label="Avancement de l'étape" />
        {demonstration && <Caption1 className={styles.note}>Données d&apos;exemple pendant la visite : rien n&apos;est enregistré, elles disparaissent à la fin.</Caption1>}
        {!audioDe(etape) && <Caption1 className={styles.note}>Voix de {VOIX_VISITE.nom} pas encore installée pour cette étape : sous-titres seuls.</Caption1>}
        <div className={styles.commandes}>
          <Tooltip content="Étape précédente (←)" relationship="label">
            <Button appearance="subtle" icon={<ChevronLeftRegular />} disabled={index === 0} onClick={() => aller(index - 1)} />
          </Tooltip>
          <Tooltip content={pause ? "Reprendre (Espace)" : "Pause (Espace)"} relationship="label">
            <Button appearance="subtle" icon={pause ? <PlayRegular /> : <PauseRegular />} onClick={() => setPause((p) => !p)} />
          </Tooltip>
          <Tooltip content={muet ? "Remettre le son" : "Couper le son"} relationship="label">
            <Button appearance="subtle" icon={muet ? <SpeakerMuteRegular /> : <Speaker2Regular />} onClick={() => setMuet((m) => !m)} />
          </Tooltip>
          <span className={styles.espace} />
          <Button appearance="primary" icon={derniere ? undefined : <ChevronRightRegular />} iconPosition="after" onClick={() => (derniere ? arreterVisite() : aller(index + 1))}>
            {derniere ? "Terminer" : "Suivant"}
          </Button>
        </div>
      </div>
    </>
  )
}

// Bulle sous l'élément s'il y a la place, sinon au-dessus, sinon à côté ; sans élément : en bas au centre
function placerBulle(zone: Cadre["zone"]): CSSProperties {
  const largeur = window.innerWidth
  const hauteur = window.innerHeight
  const place = 300 // hauteur approximative de la bulle
  const gauche = (x: number) => Math.max(16, Math.min(x, largeur - LARGEUR_BULLE - 16))
  if (!zone) return { left: gauche((largeur - LARGEUR_BULLE) / 2), bottom: 48 }
  const bas = zone.y + zone.h + MARGE + ECART
  const haut = zone.y - MARGE - ECART
  if (hauteur - bas >= place) return { left: gauche(zone.x), top: bas }
  if (haut >= place) return { left: gauche(zone.x), bottom: hauteur - haut }
  const sommet = Math.max(16, Math.min(zone.y, hauteur - place - 16))
  if (largeur - (zone.x + zone.l + MARGE + ECART) >= LARGEUR_BULLE + 16) return { left: zone.x + zone.l + MARGE + ECART, top: sommet }
  if (zone.x - MARGE - ECART >= LARGEUR_BULLE + 16) return { left: zone.x - MARGE - ECART - LARGEUR_BULLE, top: sommet }
  return { left: gauche((largeur - LARGEUR_BULLE) / 2), bottom: 48 }
}
