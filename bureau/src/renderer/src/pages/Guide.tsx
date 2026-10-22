import { Button, Caption1, MessageBar, MessageBarBody, SearchBox, Subtitle2, Text, makeStyles, mergeClasses, tokens } from "@fluentui/react-components"
import {
  AlertRegular,
  BedRegular,
  BookOpenRegular,
  CalendarLtrRegular,
  DataTrendingRegular,
  GlobeRegular,
  HistoryRegular,
  HomeRegular,
  KeyboardRegular,
  MailInboxRegular,
  MoneyRegular,
  PeopleRegular,
  PeopleTeamRegular,
  QuestionCircleRegular,
  RocketRegular,
  SearchRegular,
  SettingsRegular,
  TagRegular,
  type FluentIcon,
} from "@fluentui/react-icons"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { EnTete, Vide } from "../composants/commun"
import { useDonneesChargees, type Vue } from "../donnees"

const useStyles = makeStyles({
  mise: { display: "grid", gridTemplateColumns: "240px minmax(0, 1fr)", columnGap: tokens.spacingHorizontalXXL, alignItems: "start", "@media (max-width: 1100px)": { gridTemplateColumns: "minmax(0, 1fr)" } },
  sommaire: {
    position: "sticky",
    top: 0,
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalXXS,
    "@media (max-width: 1100px)": { position: "static", flexDirection: "row", flexWrap: "wrap", columnGap: tokens.spacingHorizontalXS },
  },
  lien: { justifyContent: "flex-start", textAlign: "left", fontWeight: tokens.fontWeightRegular },
  lienActif: { backgroundColor: tokens.colorSubtleBackgroundSelected, fontWeight: tokens.fontWeightSemibold },
  sections: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalL, minWidth: 0 },
  section: {
    scrollMarginTop: tokens.spacingVerticalL,
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalXL,
    borderRadius: tokens.borderRadiusXLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  titre: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalM, margin: 0 },
  iconeTitre: { fontSize: tokens.fontSizeBase600, color: tokens.colorBrandForeground1, flexShrink: 0 },
  resume: { color: tokens.colorNeutralForeground3 },
  texte: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalS,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase400,
    "& p": { margin: 0 },
    "& ul, & ol": { margin: 0, paddingLeft: tokens.spacingHorizontalXL, display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalXS },
    "& h3": { margin: `${tokens.spacingVerticalS} 0 0`, fontSize: tokens.fontSizeBase300, fontWeight: tokens.fontWeightSemibold },
  },
  tableau: {
    borderCollapse: "collapse",
    width: "100%",
    "& th, & td": { textAlign: "left", verticalAlign: "top", padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`, borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}` },
    "& th": { fontWeight: tokens.fontWeightSemibold, backgroundColor: tokens.colorNeutralBackground3 },
    "& tr:last-child td": { borderBottomStyle: "none" },
  },
  touche: {
    display: "inline-block",
    minWidth: "20px",
    padding: `0 ${tokens.spacingHorizontalXS}`,
    textAlign: "center",
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    lineHeight: "20px",
    borderRadius: tokens.borderRadiusMedium,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    borderBottomWidth: tokens.strokeWidthThick,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  aller: { alignSelf: "flex-start" },
})

// Touche de clavier : <T>Ctrl</T> + <T>F</T>
function T({ children }: { children: ReactNode }) {
  return <kbd className={useStyles().touche}>{children}</kbd>
}

function Tableau({ children }: { children: ReactNode }) {
  return <table className={useStyles().tableau}>{children}</table>
}

export type SectionGuide = {
  id: string
  titre: string
  resume: string
  Icone: FluentIcon
  motsCles: string // pour la recherche (barre du haut et recherche du guide)
  ecran?: Vue // bouton « Ouvrir l'écran »
  gerants?: boolean // écran réservé aux gérants
  contenu: ReactNode
}

// Guide complet du logiciel et du site : une section par écran, plus la réservation en ligne, les
// notifications, les raccourcis et le dépannage. Repris par la recherche de la barre de titre.
export const SECTIONS_GUIDE: SectionGuide[] = [
  {
    id: "premiers-pas",
    titre: "Premiers pas",
    resume: "Connexion, rôles de l'équipe et organisation de la fenêtre.",
    Icone: RocketRegular,
    motsCles: "connexion compte mot de passe oublié se souvenir de moi rôle gérant réception navigation fenêtre barre de titre déconnexion serveur",
    contenu: (
      <>
        <p>
          Le logiciel des hôtes est relié au site <strong>Chez L&apos;Avocatier</strong> : il lit et modifie les mêmes réservations, en direct. Rien n&apos;est gardé seulement sur cet
          ordinateur, à part vos préférences d&apos;affichage.
        </p>
        <h3>Se connecter</h3>
        <ul>
          <li>Saisissez l&apos;adresse e-mail et le mot de passe de votre compte de l&apos;équipe (créé par un gérant, écran Utilisateurs).</li>
          <li>
            <strong>Se souvenir de moi</strong> garde la connexion d&apos;un lancement à l&apos;autre, chiffrée par Windows. Décochez-le sur un ordinateur partagé.
          </li>
          <li>
            <strong>Mot de passe oublié ?</strong> ouvre la page de récupération du site : un lien valable une heure est envoyé par e-mail.
          </li>
          <li>Une notification confirme chaque connexion, déconnexion ou refus. Si le serveur refuse votre session (mot de passe changé, compte désactivé), vous revenez à l&apos;écran de connexion.</li>
        </ul>
        <h3>Deux rôles</h3>
        <Tableau>
          <thead>
            <tr>
              <th>Rôle</th>
              <th>Accès</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Gérant</td>
              <td>Tout le logiciel : Revenus, Statistiques, Tarifs, Utilisateurs, suppression des encaissements et du journal compris.</td>
            </tr>
            <tr>
              <td>Réception</td>
              <td>Aujourd&apos;hui, Réservations, Planning, Chambres, Clients, encaissements, Journal (en lecture), Guide et Paramètres.</td>
            </tr>
          </tbody>
        </Tableau>
        <h3>La fenêtre</h3>
        <ul>
          <li>En haut : le logo, la recherche (tous les modules), le bouton Nouvelle réservation, le thème clair / sombre et les boutons de la fenêtre.</li>
          <li>À gauche : la navigation (réductible en icônes avec le bouton ☰), la situation du soir, les Paramètres et votre compte (menu : ouvrir le site, se déconnecter).</li>
          <li>La croix ne quitte pas le logiciel : il reste près de l&apos;horloge de Windows pour continuer à recevoir les demandes (réglable). Pour quitter, clic droit sur l&apos;icône puis Quitter.</li>
        </ul>
      </>
    ),
  },
  {
    id: "site",
    titre: "Le site et la réservation en ligne",
    resume: "Ce que voient les clients, et comment une demande arrive dans le logiciel.",
    Icone: GlobeRegular,
    motsCles: "site vitrine réservation en ligne réserver compte client option 48 h e-mail devise séjour minimum navette demande parcours",
    contenu: (
      <>
        <p>Le site présente l&apos;hôtel (bungalows, restaurant, expériences, galerie, infos pratiques) et permet de demander un séjour à la page Réserver.</p>
        <h3>Parcours du client</h3>
        <ol>
          <li>Il choisit ses dates : les nuits déjà prises ou bloquées ne sont pas proposées, et le séjour minimum de la saison s&apos;applique.</li>
          <li>Il indique le nombre de voyageurs, puis choisit un hébergement assez grand ; le prix est calculé nuit par nuit selon les saisons.</li>
          <li>Il se connecte ou crée son compte client (obligatoire), complète ses coordonnées, son message et la navette aéroport s&apos;il le souhaite.</li>
          <li>
            Sa demande devient une <strong>option de 48 h</strong> : les dates sont bloquées et la demande apparaît dans le logiciel (notification, compteur « À traiter »).
          </li>
        </ol>
        <h3>Après la demande</h3>
        <ul>
          <li>Le client et les hôtes reçoivent un e-mail récapitulatif.</li>
          <li>Quand vous confirmez ou refusez, le client est prévenu par e-mail automatiquement.</li>
          <li>Sans réponse sous 48 h, l&apos;option expire et les dates se libèrent.</li>
          <li>Le client peut annuler sa demande depuis son compte : vous en êtes prévenu dans le logiciel.</li>
        </ul>
        <h3>Prix et devises</h3>
        <p>
          Les tarifs sont toujours en euros. Le visiteur peut choisir une autre devise dans le pied de page du site : le prix est alors converti à titre indicatif, au taux
          saisi dans l&apos;écran Tarifs.
        </p>
      </>
    ),
  },
  {
    id: "aujourdhui",
    titre: "Aujourd'hui et ses widgets",
    resume: "Le tableau de bord du jour, personnalisable.",
    Icone: HomeRegular,
    ecran: { page: "aujourdhui" },
    motsCles: "tableau de bord accueil widget personnaliser disposition grille arrivées départs sur place semaine occupation demandes à traiter raccourcis",
    contenu: (
      <>
        <p>L&apos;écran d&apos;accueil réunit ce qu&apos;il faut traiter aujourd&apos;hui : demandes en attente, arrivées et départs à enregistrer, clients sur place, chambres à préparer.</p>
        <h3>Personnaliser le tableau de bord</h3>
        <ol>
          <li>
            Cliquez sur <strong>Personnaliser</strong> en haut de l&apos;écran.
          </li>
          <li>Glissez un widget par sa poignée pour le déplacer, ou utilisez son menu (Déplacer avant / après).</li>
          <li>Choisissez sa largeur dans son menu : 1, 2, 3 ou 4 colonnes.</li>
          <li>Masquez un widget avec sa croix ; retrouvez-le avec Ajouter un widget.</li>
          <li>
            Cliquez sur <strong>Terminé</strong>. La disposition est gardée sur cet ordinateur ; Réinitialiser revient à la disposition d&apos;origine.
          </li>
        </ol>
        <p>Les widgets réservés aux gérants (encaissements du jour, par exemple) ne s&apos;affichent pas pour la réception.</p>
      </>
    ),
  },
  {
    id: "reservations",
    titre: "Réservations",
    resume: "Demandes du site et séjours confirmés : statuts, décisions, saisie directe.",
    Icone: MailInboxRegular,
    ecran: { page: "reservations" },
    motsCles:
      "réservation demande option confirmer refuser annuler expirée statut fiche historique nouvelle réservation téléphone whatsapp booking airbnb sur place arrivée départ référence AVO modifier changer dates prolonger remise montant mot message client facture exporter excel csv",
    contenu: (
      <>
        <Tableau>
          <thead>
            <tr>
              <th>Statut</th>
              <th>Signification</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>À traiter</td>
              <td>Demande du site en option 48 h : les dates sont bloquées en attendant votre réponse.</td>
            </tr>
            <tr>
              <td>Confirmée</td>
              <td>Séjour accepté (ou saisi dans le logiciel). Puis « Sur place » à l&apos;arrivée et « Parti » au départ.</td>
            </tr>
            <tr>
              <td>Refusée</td>
              <td>Demande déclinée : les dates se libèrent, le client est prévenu.</td>
            </tr>
            <tr>
              <td>Annulée</td>
              <td>Annulée par le client ou par les hôtes (impossible après le départ).</td>
            </tr>
            <tr>
              <td>Expirée</td>
              <td>Option sans réponse au bout de 48 h.</td>
            </tr>
          </tbody>
        </Tableau>
        <h3>Traiter une demande</h3>
        <ul>
          <li>Confirmez directement depuis la liste, Aujourd&apos;hui ou la fiche ; le refus et l&apos;annulation demandent une confirmation.</li>
          <li>
            Au refus ou à l&apos;annulation, un <strong>mot pour le client</strong> (facultatif) est ajouté à son e-mail et à l&apos;historique : la raison, d&apos;autres dates à
            proposer…
          </li>
          <li>La fiche (bouton Détails) montre le séjour, le message, les encaissements, les coordonnées et l&apos;historique de la réservation.</li>
        </ul>
        <h3>Modifier une réservation</h3>
        <ul>
          <li>
            Bouton <strong>Modifier</strong> au pied de la fiche : dates, hébergement, voyageurs, navette et montant (une remise se fait ici). « Appliquer le tarif » recalcule le
            montant pour les nouvelles dates.
          </li>
          <li>Le résumé « Ce qui change » s&apos;affiche avant d&apos;enregistrer ; la modification est notée dans l&apos;historique et au journal.</li>
          <li>Le client peut être prévenu par e-mail, avec un mot de votre part. Client arrivé : sa date d&apos;arrivée ne change plus, mais le séjour se prolonge jusqu&apos;au jour du départ.</li>
        </ul>
        <h3>Saisir une réservation</h3>
        <p>
          Bouton <strong>Nouvelle réservation</strong> (barre de titre, Aujourd&apos;hui, Planning ou fiche client) pour un client au téléphone, sur WhatsApp, via Booking.com,
          Airbnb ou au comptoir. Choisissez ou créez le client, l&apos;hébergement libre aux dates voulues ; le tarif est calculé et reste modifiable. La réservation est confirmée
          d&apos;office.
        </p>
        <h3>Facture et export</h3>
        <ul>
          <li>
            <strong>Éditer la facture</strong> (séjour confirmé) attribue un numéro (FA-2026-0001), définitif, et enregistre le PDF : séjour, règlements reçus et reste à payer. Les
            éditions suivantes gardent le même numéro.
          </li>
          <li>
            <strong>Exporter</strong> enregistre la liste affichée (onglet et recherche compris) pour Excel.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "planning",
    titre: "Planning et dates bloquées",
    resume: "Occupation par hébergement et fermeture de dates.",
    Icone: CalendarLtrRegular,
    ecran: { page: "planning" },
    motsCles:
      "planning calendrier occupation bloquer dates blocage fermeture travaux privatisation booking airbnb ical synchroniser importer exporter lien double réservation conflit libérer",
    contenu: (
      <>
        <p>Une ligne par hébergement, une colonne par nuit : les réservations et les dates bloquées apparaissent en barres. Naviguez de semaine en semaine.</p>
        <h3>Bloquer des dates</h3>
        <ul>
          <li>Utilisez la carte « Bloquer des dates » pour des travaux, une fermeture ou une privatisation : ces nuits ne sont plus proposées sur le site.</li>
          <li>Un blocage est refusé s&apos;il chevauche une réservation active.</li>
          <li>Libérez une période depuis la liste « Dates bloquées à venir ».</li>
        </ul>
        <h3>Calendriers Booking.com, Airbnb…</h3>
        <ul>
          <li>
            Un gérant relie, pour chaque hébergement, le <strong>lien iCal</strong> donné par la plateforme (dans son calendrier : « Exporter » ou « Synchroniser les calendriers »).
            Ses réservations ferment alors les dates sur le site et dans le logiciel, avec le nom de la plateforme.
          </li>
          <li>
            Dans l&apos;autre sens, le bouton <strong>copier</strong> donne notre lien d&apos;export, à coller dans la plateforme (« Importer un calendrier ») : nos réservations y
            ferment les dates. Ce lien ne contient que des dates, aucun nom.
          </li>
          <li>
            Synchronisation toutes les 10 minutes tant que le logiciel est ouvert, chaque nuit par le serveur, et juste avant chaque demande du site. Le bouton de synchronisation la
            lance tout de suite.
          </li>
          <li>Les dates importées ne se libèrent pas ici : annulez sur la plateforme, elles disparaissent à la synchronisation suivante.</li>
          <li>
            Une réservation Booking.com (ou Airbnb) saisie aussi à la main, avec cette provenance, n&apos;est pas un doublon : une seule barre s&apos;affiche.
          </li>
          <li>
            <strong>Double réservation</strong> : si une plateforme vend des nuits déjà prises ici, une barre rouge, un bandeau (Planning et Aujourd&apos;hui) et une notification
            qui reste affichée vous préviennent. Déplacez ou annulez l&apos;une des deux réservations.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "chambres",
    titre: "Chambres",
    resume: "Ménage, maintenance et occupation de chaque hébergement.",
    Icone: BedRegular,
    ecran: { page: "chambres" },
    motsCles: "chambre bungalow ménage nettoyer propre maintenance état note occupant prochaine arrivée",
    contenu: (
      <ul>
        <li>Chaque hébergement est Propre, À nettoyer ou En maintenance, avec une note (« moustiquaire à changer »…).</li>
        <li>Le départ enregistré d&apos;un client passe automatiquement sa chambre « À nettoyer ».</li>
        <li>Une pastille orange dans la navigation signale les chambres à nettoyer.</li>
      </ul>
    ),
  },
  {
    id: "clients",
    titre: "Clients",
    resume: "Comptes du site et clients enregistrés à la réception.",
    Icone: PeopleRegular,
    ecran: { page: "clients" },
    motsCles: "client fiche coordonnées téléphone e-mail pays note interne séjours comptoir nouveau client modifier fusionner doublon effacer supprimer rgpd données personnelles exporter",
    contenu: (
      <>
        <ul>
          <li>La liste réunit les comptes créés sur le site et les clients enregistrés au comptoir (sans compte, e-mail facultatif). « Exporter » l&apos;enregistre pour Excel.</li>
          <li>La fiche client donne ses coordonnées, ses chiffres, ses séjours à venir et passés, et une note interne jamais montrée au client (préférences, allergies…).</li>
          <li>Depuis la fiche, Nouvelle réservation est préremplie avec ce client.</li>
          <li>
            <strong>Modifier</strong> corrige les coordonnées. Pour un compte du site, l&apos;e-mail est son identifiant de connexion : il reste obligatoire, prévenez le client si
            vous le changez.
          </li>
        </ul>
        <h3>Doublons et effacement (gérants)</h3>
        <ul>
          <li>
            Menu <strong>…</strong> de la fiche, « Fusionner avec une autre fiche » : pour un client enregistré deux fois. Séjours, encaissements et notes sont réunis ; la fiche du
            compte du site est gardée. Deux comptes du site ne se fusionnent pas.
          </li>
          <li>
            « Effacer les données du client », à sa demande seulement (RGPD) : nom, coordonnées, note et messages disparaissent, son compte du site est fermé. Ses séjours restent
            pour la comptabilité sous le nom « Client effacé ». Impossible tant qu&apos;un séjour est en cours ou à venir.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "encaissements",
    titre: "Encaissements",
    resume: "Paiements, remboursements et reste dû d'une réservation.",
    Icone: MoneyRegular,
    motsCles: "encaissement paiement remboursement espèces carte mobile money virement solde reste dû acompte reçu pdf imprimer",
    contenu: (
      <ul>
        <li>Dans la fiche d&apos;une réservation : montant total, déjà payé, reste dû, et la saisie d&apos;un paiement (espèces, carte, mobile money, virement…).</li>
        <li>Un montant négatif enregistre un remboursement.</li>
        <li>
          Chaque encaissement a un numéro de reçu (RE-000042) ; l&apos;icône de reçu à côté du montant enregistre le <strong>reçu PDF</strong>, à imprimer ou envoyer au client.
        </li>
        <li>Seuls les gérants suppriment un encaissement saisi par erreur ; la réception corrige par un remboursement.</li>
      </ul>
    ),
  },
  {
    id: "gestion",
    titre: "Revenus et statistiques",
    resume: "Chiffre d'affaires, encaissements, occupation et provenance (gérants).",
    Icone: DataTrendingRegular,
    ecran: { page: "revenus" },
    gerants: true,
    motsCles: "revenus chiffre d'affaires statistiques occupation prix moyen revpar provenance pays annulations reste à encaisser période exporter comptabilité excel",
    contenu: (
      <ul>
        <li>
          <strong>Revenus</strong> : chiffre d&apos;affaires des séjours confirmés réparti nuit par nuit, encaissements par mode, par provenance, et séjours non soldés.
          « Exporter les encaissements » enregistre ceux de la période choisie pour Excel (comptabilité).
        </li>
        <li>
          <strong>Statistiques</strong> : taux d&apos;occupation, prix moyen, RevPAR, durée des séjours, annulations, provenance et pays, avec l&apos;évolution par rapport à la période
          précédente.
        </li>
      </ul>
    ),
  },
  {
    id: "tarifs",
    titre: "Tarifs et devises",
    resume: "Prix de base, saisons et devises de la vitrine (gérants).",
    Icone: TagRegular,
    ecran: { page: "tarifs" },
    gerants: true,
    motsCles: "tarif prix nuit saison haute saison majoration séjour minimum devise taux de change ariary euro taux du jour",
    contenu: (
      <>
        <ul>
          <li>Prix de base par nuit et par hébergement, en euros : il s&apos;applique en saison normale.</li>
          <li>Une saison a des dates sans année (elle revient chaque année, peut passer le 31 décembre), une majoration en % et un séjour minimum. Deux saisons ne peuvent pas partager une nuit.</li>
          <li>Les réservations existantes gardent leur montant ; seules les nouvelles demandes prennent les nouveaux tarifs.</li>
        </ul>
        <h3>Devises</h3>
        <p>Choisissez les devises proposées aux visiteurs, la devise par défaut et les taux. « Récupérer les taux du jour » remplit les champs sans enregistrer : vérifiez, puis enregistrez.</p>
      </>
    ),
  },
  {
    id: "utilisateurs",
    titre: "Utilisateurs",
    resume: "Comptes de l'équipe (gérants).",
    Icone: PeopleTeamRegular,
    ecran: { page: "utilisateurs" },
    gerants: true,
    motsCles: "utilisateur équipe compte créer rôle gérant réception mot de passe provisoire réinitialiser désactiver réactiver",
    contenu: (
      <ul>
        <li>Créez un compte avec un mot de passe provisoire, à donner de vive voix ; la personne le change ensuite par « Mot de passe oublié ».</li>
        <li>Changez un rôle, réinitialisez un mot de passe, désactivez ou réactivez un compte : ses connexions ouvertes sont alors coupées.</li>
        <li>Il reste toujours au moins un gérant actif, et vous ne pouvez pas retirer vos propres droits.</li>
      </ul>
    ),
  },
  {
    id: "journal",
    titre: "Journal d'activité",
    resume: "Historique des connexions et des actions de l'équipe.",
    Icone: HistoryRegular,
    ecran: { page: "journal" },
    motsCles: "journal audit historique activité traçabilité qui a fait quoi supprimer effacer connexion",
    contenu: (
      <>
        <p>
          Le journal note automatiquement, avec l&apos;auteur et l&apos;heure : connexions (et tentatives refusées), déconnexions, décisions sur les réservations, saisies, arrivées et
          départs, encaissements, dates bloquées, état des chambres, clients, tarifs, devises et comptes de l&apos;équipe.
        </p>
        <ul>
          <li>Filtrez par texte, catégorie, membre de l&apos;équipe ou période.</li>
          <li>Toute l&apos;équipe peut le consulter.</li>
          <li>
            <strong>Seuls les gérants</strong> suppriment des entrées : cochez-les puis « Supprimer la sélection », ou « Effacer le journal » (plus de 30, 90 ou 365 jours, ou
            tout). Chaque effacement reste lui-même noté au journal.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "recherche",
    titre: "Recherche",
    resume: "Retrouver n'importe quoi depuis la barre de titre.",
    Icone: SearchRegular,
    motsCles: "recherche rechercher trouver barre ctrl f client référence hébergement écran module",
    contenu: (
      <>
        <p>
          La recherche de la barre de titre (<T>Ctrl</T> + <T>F</T>) parcourt tous les modules : écrans du logiciel, réservations (référence, client, téléphone), clients,
          hébergements, dates bloquées, saisons et équipe (gérants), et ce guide.
        </p>
        <ul>
          <li>Les accents et majuscules ne comptent pas : « joelle » trouve « Joëlle ».</li>
          <li>Flèches haut / bas puis Entrée pour ouvrir un résultat ; « Toutes les réservations » affiche la liste filtrée.</li>
        </ul>
      </>
    ),
  },
  {
    id: "notifications",
    titre: "Notifications et suivi en direct",
    resume: "Comment le logiciel vous prévient des nouveautés.",
    Icone: AlertRegular,
    motsCles: "notification suivi en direct toast alerte nouvelle demande annulation option expirée zone de notification icône horloge windows",
    contenu: (
      <ul>
        <li>Le logiciel vérifie les nouveautés toutes les 15 secondes, même fenêtre fermée dans la zone de notification.</li>
        <li>Nouvelle demande, annulation par un client, option expirée : une notification s&apos;affiche en bas à droite pendant une minute, avec un lien vers la liste concernée.</li>
        <li>
          Nouvelles dates bloquées par Booking.com ou Airbnb : même notification, vers le Planning. Une double réservation reste affichée jusqu&apos;à ce que vous la fermiez.
        </li>
        <li>Si la fenêtre n&apos;est pas au premier plan, une notification Windows s&apos;ajoute (désactivable dans Paramètres) ; un clic ouvre la liste.</li>
        <li>Le titre de la fenêtre affiche le nombre de demandes à traiter, par exemple « (2) Chez L&apos;Avocatier ».</li>
      </ul>
    ),
  },
  {
    id: "parametres",
    titre: "Paramètres",
    resume: "Préférences de ce poste et de votre compte.",
    Icone: SettingsRegular,
    ecran: { page: "parametres" },
    motsCles: "paramètres thème clair sombre zoom taille affichage plein écran notifications démarrage windows se souvenir serveur version factures reçus coordonnées nif stat mentions",
    contenu: (
      <ul>
        <li>Thème (comme Windows, clair, sombre), taille de l&apos;affichage (zoom) et plein écran.</li>
        <li>Notifications de Windows, maintien dans la zone de notification à la fermeture, lancement au démarrage de Windows.</li>
        <li>Se souvenir de moi, adresse du serveur, déconnexion et version du logiciel.</li>
        <li>
          <strong>Factures et reçus</strong> (gérants) : nom de l&apos;établissement, adresse, contacts, identifiants légaux (NIF, STAT…) et mentions du bas des factures. Ces
          réglages sont communs à toute l&apos;équipe.
        </li>
      </ul>
    ),
  },
  {
    id: "raccourcis",
    titre: "Raccourcis clavier",
    resume: "Aller plus vite au clavier.",
    Icone: KeyboardRegular,
    motsCles: "raccourci clavier zoom agrandir réduire plein écran f11 ctrl plus moins recherche nouvelle réservation",
    contenu: (
      <Tableau>
        <thead>
          <tr>
            <th>Touches</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <T>Ctrl</T> + <T>+</T>
            </td>
            <td>Agrandir l&apos;affichage (zoom)</td>
          </tr>
          <tr>
            <td>
              <T>Ctrl</T> + <T>-</T>
            </td>
            <td>Réduire l&apos;affichage</td>
          </tr>
          <tr>
            <td>
              <T>Ctrl</T> + <T>0</T>
            </td>
            <td>Revenir à 100 %</td>
          </tr>
          <tr>
            <td>
              <T>Ctrl</T> + molette
            </td>
            <td>Zoom à la souris</td>
          </tr>
          <tr>
            <td>
              <T>F11</T>
            </td>
            <td>Entrer en plein écran ou en sortir</td>
          </tr>
          <tr>
            <td>
              <T>Ctrl</T> + <T>F</T>
            </td>
            <td>Rechercher dans tous les modules</td>
          </tr>
          <tr>
            <td>
              <T>Ctrl</T> + <T>N</T>
            </td>
            <td>Nouvelle réservation</td>
          </tr>
          <tr>
            <td>
              <T>F1</T>
            </td>
            <td>Ouvrir ce guide</td>
          </tr>
          <tr>
            <td>
              <T>Échap</T>
            </td>
            <td>Fermer une fenêtre ou un menu</td>
          </tr>
        </tbody>
      </Tableau>
    ),
  },
  {
    id: "depannage",
    titre: "Dépannage",
    resume: "Que faire si quelque chose ne marche pas.",
    Icone: QuestionCircleRegular,
    motsCles: "problème erreur dépannage serveur injoignable internet session expirée mot de passe dates prises chevauchement actualiser aide",
    contenu: (
      <>
        <h3>« Serveur injoignable » ou « Connexion au serveur perdue »</h3>
        <p>Vérifiez la connexion Internet, puis cliquez sur Actualiser. Les informations affichées restent visibles mais peuvent dater.</p>
        <h3>« Session expirée »</h3>
        <p>Votre mot de passe a changé, votre compte a été désactivé ou la session est trop ancienne : reconnectez-vous.</p>
        <h3>« Ces dates ne sont plus disponibles »</h3>
        <p>Un autre séjour ou un blocage occupe déjà ces nuits (une demande du site a pu arriver entre-temps). Consultez le Planning.</p>
        <h3>Mot de passe oublié</h3>
        <p>Lien « Mot de passe oublié ? » de l&apos;écran de connexion, ou demandez à un gérant de le réinitialiser (Utilisateurs).</p>
        <h3>L&apos;affichage est trop grand ou trop petit</h3>
        <p>
          <T>Ctrl</T> + <T>0</T> revient à 100 %.
        </p>
      </>
    ),
  },
]

// Guide complet : sommaire à gauche, sections à droite ; `section` : ancre ouverte depuis la recherche
export default function Guide({ section }: { section?: string }) {
  const styles = useStyles()
  const { gerant, naviguer } = useDonneesChargees()
  const [filtre, setFiltre] = useState("")
  const [active, setActive] = useState(section ?? SECTIONS_GUIDE[0].id)
  const refs = useRef(new Map<string, HTMLElement>())

  const cherche = normaliser(filtre.trim())
  const sections = SECTIONS_GUIDE.filter((s) => !cherche || normaliser(`${s.titre} ${s.resume} ${s.motsCles}`).includes(cherche))

  useEffect(() => {
    if (section) refs.current.get(section)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [section])

  // Section lue : celle dont le titre a passé le haut de la zone de lecture
  useEffect(() => {
    const observateur = new IntersectionObserver(
      (entrees) => {
        const visible = entrees.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActive(visible.target.id.replace("guide-", ""))
      },
      { rootMargin: "0px 0px -70% 0px" },
    )
    for (const element of refs.current.values()) observateur.observe(element)
    return () => observateur.disconnect()
  }, [cherche])

  return (
    <>
      <EnTete
        titre="Guide"
        description="Mode d'emploi complet du logiciel des hôtes et du site Chez L'Avocatier."
        actions={<SearchBox placeholder="Rechercher dans le guide" value={filtre} onChange={(_e, d) => setFiltre(d.value)} />}
      />
      <MessageBar intent="info" icon={<BookOpenRegular />}>
        <MessageBarBody>
          Appuyez sur <T>F1</T> depuis n&apos;importe quel écran pour revenir ici. La recherche de la barre de titre trouve aussi les sections du guide.
        </MessageBarBody>
      </MessageBar>
      <div className={styles.mise}>
        <nav className={styles.sommaire} aria-label="Sommaire du guide">
          {sections.map((s) => (
            <Button
              key={s.id}
              appearance="subtle"
              icon={<s.Icone />}
              className={mergeClasses(styles.lien, active === s.id && styles.lienActif)}
              aria-current={active === s.id ? "location" : undefined}
              onClick={() => {
                setActive(s.id)
                refs.current.get(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
              }}
            >
              {s.titre}
            </Button>
          ))}
        </nav>
        <div className={styles.sections}>
          {sections.length === 0 && <Vide Icone={SearchRegular} titre="Aucune section" texte="Aucune section du guide ne correspond à cette recherche." />}
          {sections.map((s) => (
            <section
              key={s.id}
              id={`guide-${s.id}`}
              ref={(element) => {
                if (element) refs.current.set(s.id, element)
                else refs.current.delete(s.id)
              }}
              className={styles.section}
            >
              <Subtitle2 as="h2" className={styles.titre}>
                <s.Icone className={styles.iconeTitre} />
                {s.titre}
              </Subtitle2>
              <Caption1 className={styles.resume}>
                {s.resume}
                {s.gerants && " Réservé aux gérants."}
              </Caption1>
              <div className={styles.texte}>{s.contenu}</div>
              {s.ecran && (!s.gerants || gerant) && (
                <Button className={styles.aller} onClick={() => naviguer(s.ecran!)}>
                  <Text>Ouvrir l&apos;écran</Text>
                </Button>
              )}
            </section>
          ))}
        </div>
      </div>
    </>
  )
}

export const normaliser = (texte: string) => texte.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
