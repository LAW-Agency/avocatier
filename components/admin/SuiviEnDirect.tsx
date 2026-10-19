"use client"

import { usePathname, useRouter } from "next/navigation"
import { Bell, BellOff, BellRing } from "lucide-react"
import { useEffect, useRef, useSyncExternalStore } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formaterPlage } from "@/lib/reservation/dates"
import type { ActiviteReservation, FilActivite } from "@/lib/reservation/types"

// Interrogation régulière plutôt qu'une connexion ouverte (WebSocket, LISTEN/NOTIFY) : rien à maintenir
// sur Vercel, et une requête légère toutes les 15 s suffit pour des demandes de réservation.
// En arrière-plan, le navigateur espace les appels (jusqu'à une fois par minute) : on relance dès le retour.
const INTERVALLE_MS = 15_000

type Annonce = { titre: string; detail: string; lien: string }

// Seuls les événements venus des clients (ou de l'échéance) sont annoncés : les décisions des hôtes
// rafraîchissent la page sans notification
function annonce(e: ActiviteReservation): Annonce | null {
  const sejour = `${e.client} · ${e.hebergement}, ${formaterPlage(e.arrivee, e.depart)}`
  switch (e.statut) {
    case "option":
      return { titre: "Nouvelle demande de réservation", detail: sejour, lien: "/admin/reservations?statut=option" }
    case "annulee":
      return e.note === "Annulée par le client"
        ? { titre: "Demande annulée par le client", detail: sejour, lien: "/admin/reservations?statut=annulee" }
        : null
    case "expiree":
      return { titre: "Option expirée sans réponse", detail: sejour, lien: "/admin/reservations?statut=expiree" }
    default:
      return null
  }
}

// Carillon de deux notes (Web Audio, sans fichier son). Les navigateurs n'autorisent le son qu'après
// une interaction avec la page : le contexte audio est créé au premier clic ou à la première touche.
let audio: AudioContext | null = null
function debloquerSon() {
  audio ??= new AudioContext()
  if (audio.state === "suspended") audio.resume().catch(() => {})
}

function jouerCarillon() {
  if (!audio || audio.state !== "running") return
  const debut = audio.currentTime
  ;[
    { frequence: 880, decalage: 0 }, // la
    { frequence: 1318.5, decalage: 0.16 }, // mi, une quinte au-dessus
  ].forEach(({ frequence, decalage }) => {
    const oscillateur = audio!.createOscillator()
    const volume = audio!.createGain()
    oscillateur.type = "sine"
    oscillateur.frequency.value = frequence
    // Attaque brève puis extinction douce, pour un son de cloche discret
    volume.gain.setValueAtTime(0, debut + decalage)
    volume.gain.linearRampToValueAtTime(0.18, debut + decalage + 0.02)
    volume.gain.exponentialRampToValueAtTime(0.0001, debut + decalage + 0.9)
    oscillateur.connect(volume).connect(audio!.destination)
    oscillateur.start(debut + decalage)
    oscillateur.stop(debut + decalage + 0.95)
  })
}

// Notifications du navigateur : autorisation lue sans décalage d'hydratation (« indisponible » côté serveur)
type Autorisation = NotificationPermission | "indisponible"
const abonnes = new Set<() => void>()
function useAutorisation(): Autorisation {
  return useSyncExternalStore(
    (rappel) => {
      abonnes.add(rappel)
      return () => abonnes.delete(rappel)
    },
    () => ("Notification" in window ? Notification.permission : "indisponible"),
    () => "indisponible",
  )
}

// Monté une fois dans la barre du haut : suit l'activité, rafraîchit les données du serveur (pastille
// « à traiter », tableaux) à chaque changement, annonce les nouveautés et rappelle le nombre de demandes dans
// le titre de l'onglet
export default function SuiviEnDirect({ aTraiter }: { aTraiter: number }) {
  const router = useRouter()
  const chemin = usePathname()
  const autorisation = useAutorisation()
  const etat = useRef<{ curseur: string; total: number } | null>(null)

  // « (2) Espace hôtes | … » : repris à chaque navigation, Next remettant le titre de la page
  useEffect(() => {
    const titre = document.title.replace(/^\(\d+\) /, "")
    document.title = aTraiter > 0 ? `(${aTraiter}) ${titre}` : titre
  }, [aTraiter, chemin])

  useEffect(() => {
    let minuterie: ReturnType<typeof setTimeout> | undefined
    let enCours = false
    let arrete = false

    async function verifier() {
      if (enCours || arrete) return
      enCours = true
      clearTimeout(minuterie)
      try {
        const depuis = etat.current ? `?depuis=${encodeURIComponent(etat.current.curseur)}` : ""
        const reponse = await fetch(`/admin/activite${depuis}`, { cache: "no-store" })
        // Session expirée : le proxy redirige vers la connexion (page HTML), on attend la prochaine navigation
        if (!reponse.ok || !reponse.headers.get("content-type")?.includes("application/json")) return
        const fil = (await reponse.json()) as FilActivite
        const precedent = etat.current
        etat.current = { curseur: fil.curseur, total: fil.total }
        if (!precedent || (precedent.curseur === fil.curseur && precedent.total === fil.total)) return

        router.refresh()
        const annonces = fil.evenements.flatMap((e) => {
          const a = annonce(e)
          return a ? [{ e, a }] : []
        })
        // Un seul carillon, même si plusieurs événements arrivent ensemble
        if (annonces.length > 0) jouerCarillon()
        for (const { e, a } of annonces) {
          toast(a.titre, {
            id: `${e.reservationId}-${e.le}`,
            description: a.detail,
            duration: 60_000, // une minute, ou jusqu'à la croix
            closeButton: true,
            action: { label: "Voir", onClick: () => router.push(a.lien) },
          })
          // Onglet en arrière-plan : notification du système si les hôtes l'ont autorisée
          if (document.hidden && "Notification" in window && Notification.permission === "granted") {
            const notification = new Notification(a.titre, { body: a.detail, icon: "/logo.png", tag: `${e.reservationId}-${e.le}` })
            notification.onclick = () => {
              window.focus()
              router.push(a.lien)
              notification.close()
            }
          }
        }
      } catch {
        // Réseau coupé (connexion de l'île) : nouvel essai au prochain tour
      } finally {
        enCours = false
        if (!arrete) minuterie = setTimeout(verifier, INTERVALLE_MS)
      }
    }

    const auRetour = () => {
      if (document.visibilityState === "visible") verifier()
    }
    verifier()
    window.addEventListener("pointerdown", debloquerSon)
    window.addEventListener("keydown", debloquerSon)
    document.addEventListener("visibilitychange", auRetour)
    window.addEventListener("online", verifier)
    return () => {
      arrete = true
      clearTimeout(minuterie)
      window.removeEventListener("pointerdown", debloquerSon)
      window.removeEventListener("keydown", debloquerSon)
      document.removeEventListener("visibilitychange", auRetour)
      window.removeEventListener("online", verifier)
    }
  }, [router])

  if (autorisation === "indisponible") return null

  const { Icone, libelle } = {
    default: { Icone: Bell, libelle: "Activer les notifications du navigateur" },
    granted: { Icone: BellRing, libelle: "Notifications du navigateur activées" },
    denied: { Icone: BellOff, libelle: "Notifications bloquées : à autoriser dans les réglages du navigateur" },
  }[autorisation]

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={libelle}
          // Seule la première demande ouvre la fenêtre du navigateur ; ensuite, le choix se change dans ses réglages
          aria-disabled={autorisation !== "default"}
          onClick={async () => {
            if (autorisation !== "default") return
            await Notification.requestPermission()
            abonnes.forEach((rappel) => rappel())
          }}
        >
          <Icone className={autorisation === "granted" ? "text-primary" : "text-muted-foreground"} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{libelle}</TooltipContent>
    </Tooltip>
  )
}
