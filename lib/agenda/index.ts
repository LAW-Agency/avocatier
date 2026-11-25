import { after } from "next/server"
import { synchroniserAgenda } from "./synchronisation"

export { synchroniserAgenda } from "./synchronisation"

// À appeler après toute écriture qui peut changer une réservation (demande, décision, modification, annulation,
// arrivée, départ) : l'agenda Google du propriétaire est mis à jour après la réponse, sans la ralentir.
// Sans GOOGLE_AGENDA_ID ni compte de service, ne fait rien. Une erreur de Google ne touche jamais la réservation :
// elle est écrite dans les journaux et rattrapée au passage suivant (au plus tard la tâche planifiée de la nuit).
export function planifierAgenda() {
  if (!process.env.GOOGLE_AGENDA_ID) return
  after(async () => {
    try {
      const bilan = await synchroniserAgenda()
      if (bilan.erreurs.length > 0) console.error("Agenda Google :", bilan.erreurs.join(" | "))
    } catch (erreur) {
      console.error("Agenda Google : synchronisation impossible", erreur)
    }
  })
}
