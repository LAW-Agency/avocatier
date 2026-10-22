import { Button, Toast, ToastBody, ToastTitle, ToastTrigger, useToastController, type ToastIntent } from "@fluentui/react-components"
import { DismissRegular } from "@fluentui/react-icons"
import { useCallback, type ReactElement, type ReactNode } from "react"

// Toaster unique du logiciel (monté dans App) : connexion, déconnexion, zoom, nouveautés du suivi en direct
export const TOASTER = "avocatier"

export type Message = {
  titre: ReactNode
  texte?: ReactNode
  lien?: ReactElement // sous le texte (ex. « Voir les réservations »)
  intent?: ToastIntent
  id?: string // même id : la notification visible est mise à jour au lieu d'en empiler une autre
  duree?: number // en ms
}

export function useAnnoncer() {
  const { dispatchToast, updateToast, dismissToast } = useToastController(TOASTER)
  const annoncer = useCallback(
    ({ titre, texte, lien, intent = "info", id, duree = 5000 }: Message) => {
      const contenu = (
        <Toast>
          <ToastTitle
            action={
              <ToastTrigger>
                <Button appearance="transparent" size="small" icon={<DismissRegular />} aria-label="Fermer" />
              </ToastTrigger>
            }
          >
            {titre}
          </ToastTitle>
          {(texte || lien) && <ToastBody subtitle={lien}>{texte}</ToastBody>}
        </Toast>
      )
      if (id && visibles.has(id)) {
        updateToast({ toastId: id, content: contenu, intent, timeout: duree })
        return
      }
      dispatchToast(contenu, {
        toastId: id,
        intent,
        timeout: duree,
        pauseOnHover: true,
        onStatusChange: id
          ? (_e, { status }) => {
              if (status === "dismissed" || status === "unmounted") visibles.delete(id)
              else visibles.add(id)
            }
          : undefined,
      })
      if (id) visibles.add(id)
    },
    [dispatchToast, updateToast],
  )
  return { annoncer, retirer: dismissToast }
}

// Notifications à id encore affichées (le contrôleur de Fluent ne permet pas de le demander)
const visibles = new Set<string>()
