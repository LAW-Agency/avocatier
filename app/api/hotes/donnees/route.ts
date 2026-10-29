import { json, pourLaCaisse } from "@/lib/api/hotes"
import { urlDuSite } from "@/lib/email/modeles"
import { comptes, gestion, moteur } from "@/lib/reservation"
import { aujourdhuiISO } from "@/lib/reservation/dates"

// Tout ce qu'affiche le logiciel des hôtes, chargé en une fois (rechargé après chaque action et à chaque
// changement signalé par le suivi en direct). L'équipe n'est envoyée qu'aux gérants ; un caissier ne reçoit ni
// réservations, ni clients, ni encaissements des séjours, ni calendriers (seulement de quoi tenir la caisse).
export const GET = pourLaCaisse(async (_requete, membre) => {
  const gerant = membre.role === "hote"
  const caissier = membre.role === "caissier"
  const [[hebergements, saisons, devises, chambres, facturation, equipe], sejours] = await Promise.all([
    Promise.all([
      moteur.listerHebergements(),
      moteur.listerReglesSaisons(),
      moteur.reglagesDevises(),
      moteur.listerChambres(),
      gestion.reglagesFacturation(),
      gerant ? gestion.listerEquipe() : Promise.resolve([]),
    ]),
    caissier
      ? null
      : Promise.all([
          moteur.toutesLesReservations(),
          comptes.listerClients(),
          moteur.listerBlocages(),
          gestion.listerPaiements(),
          gestion.listerCalendriers(),
          gestion.listerConsommations(),
          gestion.listerFactures(),
        ]),
  ])
  const [reservations, clients, blocages, paiements, calendriers, consommations, factures] = sejours ?? [[], [], [], [], [], [], []]
  return json({
    hote: { id: membre.id, prenom: membre.prenom, nom: membre.nom, email: membre.email, role: membre.role },
    // Date du jour à Sainte-Marie, quel que soit le fuseau de l'ordinateur des hôtes
    aujourdhui: aujourdhuiISO(),
    reservations,
    clients,
    // Catégories, sans le contenu des fiches (textes, photos) inutile au logiciel
    hebergements: hebergements.map(({ id, nom, type, capaciteMax, prixNuit, literie, vue }) => ({ id, nom, type, capaciteMax, prixNuit, literie, vue })),
    // Chambres numérotées de chaque catégorie, avec leur ménage
    chambres,
    blocages,
    saisons,
    devises,
    paiements,
    // Restaurant et bar sur la note des séjours, et factures figées
    consommations,
    factures,
    equipe: equipe.map(({ id, prenom, nom, email, role, actif, creeLe }) => ({ id, prenom, nom, email, role, actif, creeLe })),
    // Lien d'export complet (adresse publique du site), à coller dans la plateforme ; le jeton reste côté serveur
    calendriers: calendriers.map(({ jeton, ...c }) => ({ ...c, urlExport: urlDuSite(`/calendrier/${jeton}.ics`) })),
    facturation,
  })
})
