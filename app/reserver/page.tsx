import type { Metadata } from "next"
import ParcoursReservation from "@/components/reservation/ParcoursReservation"
import { clientConnecte } from "@/lib/auth/dal"
import { moteur } from "@/lib/reservation"
import { aujourdhuiISO } from "@/lib/reservation/dates"
import { lireSelection } from "@/lib/reservation/selection"

export const metadata: Metadata = {
  title: "Réserver votre séjour à Sainte-Marie | Chez L'Avocatier",
  description:
    "Choisissez vos dates et votre bungalow : demande en ligne en quelques minutes, confirmée par Joëlle et Stéphane sous 48 h. Vohilava, île Sainte-Marie.",
}

// Parcours du cahier des charges : dates → voyageurs → hébergement → coordonnées → demande → confirmation
export default async function ReserverPage({
  searchParams,
}: {
  searchParams: Promise<{ [cle: string]: string | string[] | undefined }>
}) {
  const [params, hebergements, saisons, periodes, client] = await Promise.all([
    searchParams,
    moteur.listerHebergements(),
    moteur.listerSaisons(),
    moteur.periodesOccupees(),
    clientConnecte(),
  ])

  return (
    <ParcoursReservation
      hebergements={hebergements}
      saisons={saisons}
      periodes={periodes}
      client={client}
      aujourdhui={aujourdhuiISO()}
      initial={lireSelection(params, hebergements.map((h) => h.slug))}
    />
  )
}
