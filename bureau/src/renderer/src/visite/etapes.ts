// Visite guidée du logiciel (bouton du Guide) : chaque étape ouvre un écran, éclaire l'élément marqué
// `data-visite="<cible>"` et le présente avec la voix de Nico (ElevenLabs), pré-générée par
// `npm run voix` (scripts/voix-visite.mjs) dans assets/visite/<id>.mp3.
// Fichier lu tel quel par Node pour la génération : types effaçables seulement, aucun import.
// À tenir à jour avec les écrans (et le Guide) ; un texte modifié = relancer `npm run voix`.

export type PageVisite =
  | "aujourdhui"
  | "reservations"
  | "planning"
  | "chambres"
  | "restaurant"
  | "clients"
  | "journal"
  | "revenus"
  | "statistiques"
  | "tarifs"
  | "utilisateurs"
  | "parametres"
  | "guide"

export type EtapeVisite = {
  id: string // nom du fichier audio
  page?: PageVisite // écran à ouvrir (sinon : celui de l'étape précédente)
  cible?: string // valeur de data-visite ; absente ou introuvable : bulle au centre
  titre: string
  texte: string // sous-titre affiché
  voix?: string // texte dit, quand il diffère de l'affichage (raccourcis, sigles)
  gerants?: boolean // écran réservé aux gérants : étape sautée pour la réception
}

// Voix et modèle ElevenLabs de la génération
export const VOIX_VISITE = { voix: "MAZdzkb78f8SA7DNBT41", nom: "Nico", modele: "eleven_multilingual_v2" }

export const ETAPES_VISITE: EtapeVisite[] = [
  {
    id: "01-bienvenue",
    page: "guide",
    titre: "Bienvenue",
    texte:
      "Bonjour et bienvenue dans le logiciel des hôtes de Chez L'Avocatier. Je vais vous faire faire le tour de chaque écran, en quelques minutes. Les boutons de cette bulle mettent en pause, reviennent en arrière ou passent à la suite ; la touche Échap arrête la visite.",
  },
  {
    id: "02-navigation",
    cible: "navigation",
    titre: "La navigation",
    texte:
      "À gauche, la navigation. La partie Activité regroupe le travail de tous les jours : Aujourd'hui, Réservations, Planning, Chambres, Clients et Journal. Les gérants voient en plus la partie Gestion : revenus, statistiques, tarifs et utilisateurs.",
  },
  {
    id: "03-recherche",
    cible: "recherche",
    titre: "La recherche",
    texte: "En haut, la recherche trouve tout : un client, une référence de réservation, un téléphone, une chambre, ou une page du guide. Raccourci : Ctrl + F.",
    voix: "En haut, la recherche trouve tout : un client, une référence de réservation, un téléphone, une chambre, ou une page du guide. Raccourci : Contrôle F.",
  },
  {
    id: "04-nouvelle-reservation",
    cible: "barre-nouvelle-reservation",
    titre: "Nouvelle réservation",
    texte: "Ce bouton saisit une réservation depuis n'importe quel écran : un client au téléphone, sur WhatsApp, venu de Booking.com ou au comptoir. Raccourci : Ctrl + N.",
    voix: "Ce bouton saisit une réservation depuis n'importe quel écran : un client au téléphone, sur WhatsApp, venu de Booking ou au comptoir. Raccourci : Contrôle N.",
  },
  {
    id: "05-cloche",
    cible: "cloche",
    titre: "Les notifications",
    texte: "La cloche compte ce qui reste à régler : demandes à traiter, départs non soldés, chambres à préparer, navettes du jour. Un clic ouvre le panneau des notifications.",
  },
  {
    id: "06-ce-soir",
    cible: "ce-soir",
    titre: "La situation du soir",
    texte: "En bas de la navigation, la situation du soir : le nombre de chambres occupées, et les arrivées et départs du jour.",
  },
  {
    id: "07-aujourdhui",
    page: "aujourdhui",
    cible: "aujourdhui-entete",
    titre: "Aujourd'hui",
    texte: "Voici l'écran Aujourd'hui, votre tableau de bord. En haut, la date du jour et le nombre de demandes qui attendent votre réponse.",
  },
  {
    id: "08-widgets",
    cible: "aujourdhui-widgets",
    titre: "Les widgets",
    texte:
      "Chaque carte est un widget : demandes à traiter, arrivées et départs à enregistrer, clients sur place, chambres à préparer, occupation de la semaine. Vous confirmez une demande ou enregistrez une arrivée directement d'ici.",
  },
  {
    id: "09-personnaliser",
    cible: "aujourdhui-personnaliser",
    titre: "Personnaliser",
    texte: "Personnaliser déplace les widgets, change leur largeur, en masque ou en ajoute. La disposition est gardée sur cet ordinateur.",
  },
  {
    id: "10-reservations",
    page: "reservations",
    cible: "reservations-onglets",
    titre: "Réservations",
    texte:
      "L'écran Réservations liste les demandes et les séjours. Les onglets filtrent par statut. Une demande du site reste en option 48 heures, dates bloquées, en attendant votre réponse.",
    voix: "L'écran Réservations liste les demandes et les séjours. Les onglets filtrent par statut. Une demande du site reste en option quarante-huit heures, dates bloquées, en attendant votre réponse.",
  },
  {
    id: "11-liste-reservations",
    cible: "reservations-liste",
    titre: "La liste et les fiches",
    texte:
      "Confirmez une demande d'un clic, ou ouvrez sa fiche avec Détails : séjour, message du client, encaissements, historique, modification et facture. Exporter enregistre la liste dans un classeur Excel.",
  },
  {
    id: "12-planning",
    page: "planning",
    cible: "planning-outils",
    titre: "Planning",
    texte: "Le Planning montre l'occupation de chaque chambre, nuit par nuit. Ici, choisissez la période : un jour, une, deux ou trois semaines. Avancez avec les flèches, ou allez directement à une date.",
  },
  {
    id: "13-grille",
    cible: "planning-grille",
    titre: "La grille",
    texte:
      "Une ligne par chambre, regroupées par catégorie. Chaque séjour est une barre : cliquez-la pour ouvrir sa fiche, ou cliquez une nuit libre pour réserver cette chambre. Un clic sur une catégorie la replie.",
  },
  {
    id: "14-affichage",
    cible: "planning-affichage",
    titre: "Le menu Affichage",
    texte: "Le menu Affichage règle l'ordre des chambres, la hauteur des lignes et le texte des barres. Ces choix sont gardés sur cet ordinateur.",
  },
  {
    id: "15-blocage",
    cible: "planning-blocage",
    titre: "Bloquer des dates",
    texte: "Bloquer des dates ferme des nuits à la réservation : travaux, fermeture, privatisation. Ces nuits ne sont plus proposées sur le site.",
  },
  {
    id: "16-calendriers",
    cible: "planning-calendriers",
    titre: "Booking.com et Airbnb",
    texte:
      "Ici, les calendriers de Booking.com et d'Airbnb. Une fois reliés, leurs réservations ferment les dates sur le site, et les nôtres ferment les leurs : plus de double réservation.",
    voix: "Ici, les calendriers de Booking et d'Airbnb. Une fois reliés, leurs réservations ferment les dates sur le site, et les nôtres ferment les leurs : plus de double réservation.",
  },
  {
    id: "17-chambres",
    page: "chambres",
    cible: "chambres-filtres",
    titre: "Chambres",
    texte: "L'écran Chambres suit le ménage et la maintenance. Les onglets filtrent les chambres disponibles ce soir, occupées, à nettoyer ou en maintenance.",
  },
  {
    id: "18-etat-chambres",
    cible: "chambres-categorie",
    titre: "L'état de chaque chambre",
    texte:
      "Chaque chambre est propre, à nettoyer ou en maintenance, avec une note. Au départ d'un client, elle passe d'elle-même à nettoyer. Une chambre qui n'est pas propre n'est pas proposée pour une arrivée du jour.",
  },
  {
    id: "19-vue-chambres",
    cible: "chambres-affichage",
    titre: "Cartes ou liste",
    texte: "Ce choix passe des cartes à une liste compacte, pour voir tout l'hôtel sur une seule page.",
  },
  {
    id: "19b-restaurant",
    page: "restaurant",
    cible: "restaurant-onglets",
    titre: "Restaurant et Bar",
    texte:
      "Restaurant et Bar, c'est la caisse. On ouvre la caisse avec le fond, on vend en touchant les articles, puis on encaisse sur place ou on met sur la chambre : le montant s'ajoute à la note du séjour et figure sur la facture du départ. En fin de service, la clôture compte le tiroir et calcule l'écart.",
  },
  {
    id: "20-clients",
    page: "clients",
    cible: "clients-outils",
    titre: "Clients",
    texte: "L'écran Clients réunit les comptes créés sur le site et les clients enregistrés au comptoir. Filtrez par nom, e-mail ou téléphone, exportez, ou ajoutez un client.",
  },
  {
    id: "21-fiche-client",
    cible: "clients-liste",
    titre: "La fiche client",
    texte: "Un clic ouvre la fiche du client : coordonnées, séjours passés et à venir, et une note interne, jamais montrée au client, pour ses préférences ou ses allergies.",
  },
  {
    id: "22-journal",
    page: "journal",
    cible: "journal-filtres",
    titre: "Journal",
    texte: "Le Journal note qui a fait quoi, et quand : connexions, décisions, encaissements, modifications. Toute l'équipe le consulte ; seuls les gérants l'effacent.",
  },
  {
    id: "23-revenus",
    page: "revenus",
    cible: "revenus-mois",
    gerants: true,
    titre: "Revenus",
    texte: "Réservé aux gérants, l'écran Revenus montre le chiffre d'affaires des douze derniers mois et les encaissements, par mode de paiement et par provenance.",
  },
  {
    id: "24-reste",
    cible: "revenus-reste",
    gerants: true,
    titre: "Reste à encaisser",
    texte: "Plus bas, les séjours qui restent à encaisser et les trop-perçus à rembourser. Les encaissements s'exportent pour la comptabilité.",
  },
  {
    id: "25-statistiques",
    page: "statistiques",
    cible: "statistiques-occupation",
    gerants: true,
    titre: "Statistiques",
    texte: "Les Statistiques donnent le taux d'occupation, le prix moyen, la durée des séjours, les annulations et la provenance des clients, comparés à la période précédente.",
  },
  {
    id: "26-tarifs",
    page: "tarifs",
    cible: "tarifs-prix",
    gerants: true,
    titre: "Tarifs",
    texte: "Dans Tarifs : le prix de base par nuit de chaque catégorie, en euros, et les saisons, avec leur majoration et leur séjour minimum. Les réservations déjà faites gardent leur prix.",
  },
  {
    id: "27-devises",
    cible: "tarifs-devises",
    gerants: true,
    titre: "Devises",
    texte: "Ici, les devises proposées aux visiteurs du site, avec leur taux. Récupérer les taux du jour remplit les champs : vérifiez, puis enregistrez.",
  },
  {
    id: "28-utilisateurs",
    page: "utilisateurs",
    cible: "utilisateurs-liste",
    gerants: true,
    titre: "Utilisateurs",
    texte: "L'écran Utilisateurs gère les comptes de l'équipe : gérant ou réception, création avec un mot de passe provisoire, désactivation.",
  },
  {
    id: "29-parametres",
    page: "parametres",
    cible: "parametres-apparence",
    titre: "Paramètres",
    texte: "Dans Paramètres : le thème clair ou sombre, la devise des montants, ariary par défaut, la taille de l'affichage, les notifications de Windows et les mises à jour du logiciel.",
  },
  {
    id: "30-fin",
    page: "guide",
    cible: "guide-visite",
    titre: "Bonne saison !",
    texte: "C'est la fin de la visite. Le Guide détaille chaque écran : ouvrez-le à tout moment avec F1, et relancez cette visite avec ce bouton. Bonne saison à Chez L'Avocatier !",
    voix: "C'est la fin de la visite. Le Guide détaille chaque écran : ouvrez-le à tout moment avec la touche F1, et relancez cette visite avec ce bouton. Bonne saison à Chez L'Avocatier !",
  },
]
