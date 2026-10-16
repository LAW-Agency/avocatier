import { Ban, Check, CircleSlash, Clock, Flag, TimerOff, type LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { libelleStatutHote } from "@/lib/reservation/statuts"
import type { DateISO, Reservation } from "@/lib/reservation/types"

type VarianteBadge = "default" | "secondary" | "destructive" | "outline"

// Séjour confirmé déjà passé : plus aucune action possible dessus
export function estTermine(r: Reservation, aujourdhui: DateISO) {
  return r.statut === "confirmee" && r.depart <= aujourdhui
}

const STYLES: Record<Reservation["statut"] | "termine", { variante: VarianteBadge; icone: LucideIcon }> = {
  option: { variante: "secondary", icone: Clock },
  confirmee: { variante: "default", icone: Check },
  refusee: { variante: "destructive", icone: Ban },
  annulee: { variante: "outline", icone: CircleSlash },
  expiree: { variante: "outline", icone: TimerOff },
  termine: { variante: "outline", icone: Flag },
}

// Pastille de statut côté hôtes (« À traiter », « Confirmée »…, ou « Séjour terminé »)
export function BadgeStatut({ reservation, termine = false }: { reservation: Reservation; termine?: boolean }) {
  const cle = termine ? "termine" : reservation.statut
  const { variante, icone: Icone } = STYLES[cle]
  return (
    <Badge variant={variante}>
      <Icone data-icon="inline-start" />
      {termine ? "Séjour terminé" : libelleStatutHote[reservation.statut]}
    </Badge>
  )
}

// Provenance d'une demande, à la suite de « reçue le 16 oct., 03:30 »
export const SOURCES: Record<Reservation["source"], string> = {
  site: "sur le site",
  booking: "via Booking.com",
  telephone: "par téléphone",
  whatsapp: "par WhatsApp",
}
