import type { PontAvocatier } from "../partage/ipc"

declare global {
  interface Window {
    avocatier: PontAvocatier
  }
}
