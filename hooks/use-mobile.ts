import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 768
const REQUETE = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

// Lu avec useSyncExternalStore (la règle react-hooks/set-state-in-effect interdit setState dans un effet)
export function useIsMobile() {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(REQUETE)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    () => window.matchMedia(REQUETE).matches,
    () => false,
  )
}
