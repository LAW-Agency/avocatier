import { Link } from "@fluentui/react-components"
import { useEffect, useEffectEvent, useRef, useState } from "react"
import { pluriel } from "@partage/dates"
import { rappelsDe } from "./alertes"
import { nomDe, type Donnees, type Vue } from "./donnees"
import { useReglages } from "./reglages"
import { useAnnoncer } from "./toasts"

// Un rappel déjà annoncé revient au bout de 2 h tant que la situation dure
const INTERVALLE_RAPPELS = 2 * 60 * 60 * 1000

// Petits rappels (désactivables dans Paramètres) : chambres à nettoyer, en premier celles qui reçoivent quelqu'un
// aujourd'hui, et navettes à prévoir. Annoncés à l'ouverture, dès qu'un nouveau apparaît (départ enregistré, nouvelle
// arrivée du jour…), puis toutes les 2 h ; notification de Windows en plus si la fenêtre est au second plan
export function useRappels(donnees: Donnees | null, naviguer: (vue: Vue) => void) {
  const { reglages } = useReglages()
  const { annoncer } = useAnnoncer()
  const annonces = useRef(new Map<string, number>()) // clé du rappel → dernière annonce
  const [horloge, setHorloge] = useState(0)
  useEffect(() => {
    const minuterie = setInterval(() => setHorloge((h) => h + 1), INTERVALLE_RAPPELS)
    return () => clearInterval(minuterie)
  }, [])

  const rappeler = useEffectEvent((d: Donnees) => {
    const { chambres, navettes } = rappelsDe(d)
    const maintenant = Date.now()
    // Une seule annonce par sujet, dès qu'un de ses rappels est nouveau ou n'a pas été annoncé depuis 2 h
    const aAnnoncer = (cles: string[]) => {
      if (!cles.some((cle) => maintenant - (annonces.current.get(cle) ?? 0) >= INTERVALLE_RAPPELS)) return false
      for (const cle of cles) annonces.current.set(cle, maintenant)
      return true
    }
    const client = (clientId: string) => nomDe(d.clients.find((c) => c.id === clientId))

    if (chambres.length > 0 && aAnnoncer(chambres.map(({ chambre: c, arrivee }) => `menage:${c.id}:${c.etat}:${arrivee?.id ?? ""}`))) {
      const urgentes = chambres.filter((x) => x.arrivee)
      const titre = urgentes.length
        ? `${pluriel(urgentes.length, "chambre")} à préparer avant une arrivée`
        : `Petit rappel : ${pluriel(chambres.length, "chambre")} à nettoyer`
      const detail = urgentes.length
        ? `${urgentes.map(({ chambre: c, arrivee }) => `${c.numero} (${client(arrivee!.clientId)})`).join(", ")} : pensez à les passer à « Propre » une fois prêtes.`
        : `N'oubliez pas ${chambres.map((x) => x.chambre.numero).join(", ")}, et de les passer à « Propre » une fois prêtes.`
      annoncer({
        id: "rappel-menage",
        titre,
        texte: detail,
        lien: <Link onClick={() => naviguer({ page: "chambres", filtre: "a_nettoyer" })}>Voir les chambres</Link>,
        intent: urgentes.length ? "warning" : "info",
        duree: 60_000,
      })
      window.avocatier.rappeler({ id: "rappel-menage", titre, detail, vers: { page: "chambres", filtre: "a_nettoyer" } })
    }

    if (navettes.length > 0 && aAnnoncer(navettes.map((r) => `navette:${r.id}:${r.arrivee}`))) {
      const titre = navettes.length > 1 ? `${navettes.length} navettes à prévoir` : "Navette à prévoir"
      const detail = navettes.map((r) => `${client(r.clientId)}, ${r.arrivee === d.aujourdhui ? "aujourd'hui" : "demain"}`).join(" · ")
      annoncer({ id: "rappel-navettes", titre, texte: `Aéroport : ${detail}.`, intent: "info", duree: 60_000 })
      window.avocatier.rappeler({ id: "rappel-navettes", titre, detail: `Aéroport : ${detail}.`, vers: { page: "reservations", filtre: "confirmee" } })
    }
  })

  // Données rechargées (suivi en direct, action de l'équipe) ou minuterie : rappels revus
  useEffect(() => {
    if (donnees && reglages.rappels) rappeler(donnees)
  }, [donnees, horloge, reglages.rappels])
}
