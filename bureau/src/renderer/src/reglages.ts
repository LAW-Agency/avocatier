import { createContext, use } from "react"
import type { Reglages } from "../../partage/ipc"

// Préférences du poste (src/main/reglages.ts), lues au démarrage et suivies en direct ;
// `sombre` : thème réellement affiché (choix « Système » résolu)
type ContexteReglages = {
  reglages: Reglages | null
  sombre: boolean
  modifier: (modification: Partial<Reglages>) => Promise<void>
}

export const ContexteReglages = createContext<ContexteReglages | null>(null)

export function useReglages() {
  const contexte = use(ContexteReglages)
  if (!contexte?.reglages) throw new Error("useReglages avant le chargement des réglages")
  return { ...contexte, reglages: contexte.reglages }
}
