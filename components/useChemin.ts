"use client"

import { usePathname } from "next/navigation"

// Chemin de la page courante, « /index » ramené à « / ». Après un revalidatePath("/", "layout") (décisions des
// hôtes), Vercel régénère l'accueil sous le chemin « /index » : usePathname le renvoie tel quel, au rendu serveur
// comme à l'hydratation, et l'accueil perdait son header transparent (HERO_PAGES) et son hero sous le header.
export function useChemin(): string {
  const chemin = usePathname()
  return chemin === "/index" ? "/" : chemin
}
