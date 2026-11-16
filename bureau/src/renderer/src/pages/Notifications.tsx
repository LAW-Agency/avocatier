import { pluriel } from "@partage/dates"
import { useAlertes } from "../alertes"
import { EnTete } from "../composants/commun"
import { ListeNotifications } from "../composants/Notifications"

// Notifications en plein écran (ouvert depuis le panneau de la cloche) : mêmes rubriques, en cartes
export default function Notifications() {
  const { total } = useAlertes().alertes
  return (
    <>
      <EnTete titre="Notifications" description={total ? `${pluriel(total, "point")} à régler : impayés au départ, ménage, oublis de la réception, remboursements, navettes, demandes.` : "Tout est à jour."} />
      <ListeNotifications pleinePage />
    </>
  )
}
