import { pluriel } from "@partage/dates"
import { alertesDe } from "../alertes"
import { EnTete } from "../composants/commun"
import { ListeNotifications } from "../composants/Notifications"
import { useDonneesChargees } from "../donnees"

// Notifications en plein écran (ouvert depuis le panneau de la cloche) : mêmes rubriques, en cartes
export default function Notifications() {
  const { d } = useDonneesChargees()
  const { total } = alertesDe(d)
  return (
    <>
      <EnTete titre="Notifications" description={total ? `${pluriel(total, "point")} à régler : impayés au départ, oublis de la réception, remboursements, demandes.` : "Tout est à jour."} />
      <ListeNotifications pleinePage />
    </>
  )
}
