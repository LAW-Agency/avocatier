import {
  Avatar,
  Badge,
  Button,
  Caption1,
  CounterBadge,
  Hamburger,
  Link,
  Menu,
  MenuDivider,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  NavDrawer,
  NavDrawerBody,
  NavDrawerFooter,
  NavDrawerHeader,
  NavItem,
  NavSectionHeader,
  ProgressBar,
  Text,
  Skeleton,
  SkeletonItem,
  Spinner,
  Tooltip,
  mergeClasses,
} from "@fluentui/react-components"
import {
  ArrowSyncRegular,
  BedFilled,
  BedRegular,
  FoodFilled,
  FoodRegular,
  CalendarAddRegular,
  CalendarLtrFilled,
  CalendarLtrRegular,
  DataTrendingFilled,
  DataTrendingRegular,
  BookOpenFilled,
  BookOpenRegular,
  GlobeRegular,
  HistoryFilled,
  HistoryRegular,
  HomeFilled,
  HomeRegular,
  MailInboxFilled,
  MailInboxRegular,
  MoneyFilled,
  MoneyRegular,
  PeopleFilled,
  PeopleRegular,
  PeopleTeamFilled,
  PeopleTeamRegular,
  SettingsFilled,
  SettingsRegular,
  SignOutRegular,
  TagFilled,
  TagRegular,
  WifiWarningRegular,
  bundleIcon,
  type FluentIcon,
} from "@fluentui/react-icons"
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import { pluriel } from "@partage/dates"
import type { Annonce, Destination } from "../../partage/ipc"
import { BarreTitre } from "./composants/BarreTitre"
import { EcranLancement } from "./composants/EcranLancement"
import FenetreBienvenue from "./composants/FenetreBienvenue"
import FenetreMiseAJour from "./composants/FenetreMiseAJour"
import { BoutonNotifications, PanneauNotifications } from "./composants/Notifications"
import NouvelleReservation from "./composants/NouvelleReservation"
import { RechercheGlobale } from "./composants/RechercheGlobale"
import VisiteGuidee from "./composants/VisiteGuidee"
import { useApparitionStyles } from "./composants/useCommunStyles.styles"
import { PAGES_CAISSIER, PAGES_GERANTS, useDonnees, type Vue } from "./donnees"
import { ROLES } from "./libelles"
import Aujourdhui from "./pages/Aujourdhui"
import Chambres from "./pages/Chambres"
import Clients from "./pages/Clients"
import FicheClient from "./pages/FicheClient"
import Guide from "./pages/Guide"
import Journal from "./pages/Journal"
import Notifications from "./pages/Notifications"
import Parametres from "./pages/Parametres"
import Planning from "./pages/Planning"
import Reservations from "./pages/Reservations"
import Restaurant from "./pages/Restaurant"
import Revenus from "./pages/Revenus"
import Statistiques from "./pages/Statistiques"
import Tarifs from "./pages/Tarifs"
import Utilisateurs from "./pages/Utilisateurs"
import { useRappels } from "./rappels"
import { situationDuJour } from "./situation"
import { useAnnoncer } from "./toasts"
import { MONTEE, SORTIE, logoRetenu, mouvementReduit, retenirLogo, transformationVers } from "./ouverture"
import { useCoquilleStyles } from "./useCoquilleStyles.styles"

type PageNav = Exclude<Vue["page"], "client">
type Rubrique = { page: PageNav; libelle: string; Icone: FluentIcon }

const ACTIVITE: Rubrique[] = [
  {
    page: "aujourdhui",
    libelle: "Aujourd'hui",
    Icone: bundleIcon(HomeFilled, HomeRegular),
  },
  {
    page: "reservations",
    libelle: "Réservations",
    Icone: bundleIcon(MailInboxFilled, MailInboxRegular),
  },
  {
    page: "planning",
    libelle: "Planning",
    Icone: bundleIcon(CalendarLtrFilled, CalendarLtrRegular),
  },
  {
    page: "chambres",
    libelle: "Chambres",
    Icone: bundleIcon(BedFilled, BedRegular),
  },
  {
    page: "restaurant",
    libelle: "Restaurant et Bar",
    Icone: bundleIcon(FoodFilled, FoodRegular),
  },
  {
    page: "clients",
    libelle: "Clients",
    Icone: bundleIcon(PeopleFilled, PeopleRegular),
  },
  {
    page: "journal",
    libelle: "Journal",
    Icone: bundleIcon(HistoryFilled, HistoryRegular),
  },
]

const GESTION: Rubrique[] = [
  {
    page: "revenus",
    libelle: "Revenus",
    Icone: bundleIcon(MoneyFilled, MoneyRegular),
  },
  {
    page: "statistiques",
    libelle: "Statistiques",
    Icone: bundleIcon(DataTrendingFilled, DataTrendingRegular),
  },
  {
    page: "tarifs",
    libelle: "Tarifs",
    Icone: bundleIcon(TagFilled, TagRegular),
  },
  {
    page: "utilisateurs",
    libelle: "Utilisateurs",
    Icone: bundleIcon(PeopleTeamFilled, PeopleTeamRegular),
  },
]

const GUIDE: Rubrique = {
  page: "guide",
  libelle: "Guide",
  Icone: bundleIcon(BookOpenFilled, BookOpenRegular),
}

const PARAMETRES: Rubrique = {
  page: "parametres",
  libelle: "Paramètres",
  Icone: bundleIcon(SettingsFilled, SettingsRegular),
}

// Arrivée dans le logiciel (connexion validée, ou lancement avec la session gardée) : le grand logo de l'écran
// d'attente s'envole vers sa place dans la barre de titre, puis la recherche, la navigation et l'écran apparaissent
function useEnvol(racine: RefObject<HTMLDivElement | null>, affichee: boolean) {
  useLayoutEffect(() => {
    const r = racine.current
    const depart = logoRetenu()?.rect
    if (!affichee || !r || !depart || mouvementReduit()) return
    const [barre, corps] = Array.from(r.children) as HTMLElement[]
    const logo = barre?.firstElementChild?.firstElementChild as HTMLElement | null
    if (!barre || !corps || !logo) return
    const centre = barre.children[1] as HTMLElement | undefined
    const actions = barre.children[2]?.firstElementChild as HTMLElement | null
    const [nav, ...contenu] = Array.from(corps.children) as HTMLElement[]

    // Le logo a déjà attendu en grand le temps du chargement : il s'envole aussitôt les données arrivées
    const pause = 80
    const envol = 1000
    const suite = pause + envol - 350
    // `translate` et `filter` plutôt que `transform` et `opacity` : le tiroir de navigation de Fluent anime déjà
    // ces deux-là à son montage et l'emporterait
    const apparaitre = (el: HTMLElement | null | undefined, de: string, delai: number, duree = 800) =>
      el?.animate(
        [
          { filter: "opacity(0)", translate: de },
          { filter: "opacity(1)", translate: "0 0" },
        ],
        { duration: duree, delay: delai, easing: SORTIE, fill: "backwards" },
      )
    const animations = [
      logo.animate([{ transform: transformationVers(logo, depart) }, { transform: "none" }], { duration: envol, delay: pause, easing: MONTEE, fill: "backwards" }),
      apparaitre(centre, "0 -8px", suite),
      apparaitre(actions, "0 -8px", suite + 80),
      apparaitre(nav, "-32px 0", suite, 900),
      ...contenu.map((el, i) => apparaitre(el, "0 32px", suite + 150 + i * 80, 900)),
    ]
    return () => animations.forEach((a) => a?.cancel())
  }, [racine, affichee])
}

// Déconnexion : tout s'efface sauf le logo de la barre de titre, qui repart ensuite vers le centre (EcranLancement)
async function sortie(racine: HTMLDivElement | null) {
  const [barre, corps] = Array.from(racine?.children ?? []) as HTMLElement[]
  const logo = barre?.firstElementChild?.firstElementChild ?? null
  if (barre && corps && !mouvementReduit()) {
    const parties = [barre.children[1], barre.children[2]?.firstElementChild, ...Array.from(corps.children)] as (HTMLElement | null | undefined)[]
    await Promise.all(
      parties.map(
        (el) =>
          el?.animate([{ filter: "opacity(1)" }, { filter: "opacity(0)" }], { duration: 280, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" }).finished.catch(() => {}),
      ),
    )
  }
  retenirLogo(logo, true)
}

// Fenêtre principale une fois connecté : barre de titre avec recherche, navigation à gauche, écran courant
export default function Coquille({ onDeconnexion: deconnecter }: { onDeconnexion: () => void }) {
  const styles = useCoquilleStyles()
  const apparition = useApparitionStyles()
  const { donnees, erreur, recharger, vue, naviguer, changementEcran, enLigne, setEnLigne, ouvrirNouvelleReservation } = useDonnees()
  const [navOuverte, setNavOuverte] = useState(true)
  // Panneau des notifications à droite du contenu, ouvert par la cloche de la barre de titre
  const [notificationsOuvertes, setNotificationsOuvertes] = useState(false)
  const champRecherche = useRef<HTMLInputElement>(null)
  const zoneDefilement = useRef<HTMLElement>(null)
  const racine = useRef<HTMLDivElement>(null)
  const onDeconnexion = () => sortie(racine.current).then(deconnecter)
  const { annoncer } = useAnnoncer()
  const gerant = donnees?.hote.role === "hote"
  // Caissier : ni réservations ni clients, rien de l'activité de l'hôtel
  const caissier = donnees?.hote.role === "caissier"

  const aTraiter = donnees?.reservations.filter((r) => r.statut === "option").length ?? 0
  // Pastilles de l'entrée Chambres : rouge s'il y a une chambre en maintenance, jaune s'il y en a à nettoyer
  const aNettoyer = donnees?.chambres.filter((c) => c.active && c.etat === "a_nettoyer").length ?? 0
  const enMaintenance = donnees?.chambres.filter((c) => c.active && c.etat === "maintenance").length ?? 0
  useEffect(() => window.avocatier.signalerATraiter(aTraiter), [aTraiter])
  useRappels(donnees, naviguer)

  // Suivi en direct (processus principal) : données rechargées, nouveautés annoncées une minute
  const surActivite = useEffectEvent((annonces: Annonce[]) => {
    void recharger()
    for (const a of annonces) {
      annoncer({
        id: a.id,
        titre: a.titre,
        texte: a.detail,
        lien: <Link onClick={() => naviguer(a.vers)}>{a.vers.page === "planning" ? "Voir le planning" : "Voir les réservations"}</Link>,
        // Double réservation : reste affichée jusqu'à ce qu'on la ferme
        ...(a.alerte ? { intent: "error" as const, duree: -1 } : { duree: 60_000 }),
      })
    }
  })
  const surNavigation = useEffectEvent((vers: Destination) => naviguer(vers))
  // Serveur injoignable (Internet coupé, site arrêté) : bandeau et pastille tant que ça dure, données
  // rechargées dès le retour
  const surConnexion = useEffectEvent((valeur: boolean) => {
    setEnLigne(valeur)
    if (valeur) {
      void recharger()
      annoncer({ id: "connexion", titre: "Connexion rétablie", texte: "Les informations sont de nouveau à jour.", intent: "success" })
    } else {
      annoncer({ id: "connexion", titre: "Connexion au serveur perdue", texte: "Lecture seule en attendant : vérifiez la connexion Internet. Le logiciel réessaie toutes les 5 secondes.", intent: "warning", duree: 10_000 })
    }
  })
  // Raccourcis de l'interface (zoom et plein écran : processus principal) : Ctrl + F recherche, Ctrl + N
  // nouvelle réservation, F1 guide
  const surTouche = useEffectEvent((e: KeyboardEvent) => {
    if (!donnees) return
    const touche = e.key.toLowerCase()
    if (e.ctrlKey && !e.altKey && !e.shiftKey && touche === "f") {
      e.preventDefault()
      champRecherche.current?.focus()
      champRecherche.current?.select()
    } else if (e.ctrlKey && !e.altKey && !e.shiftKey && touche === "n" && !caissier) {
      e.preventDefault()
      ouvrirNouvelleReservation()
    } else if (e.key === "F1") {
      e.preventDefault()
      naviguer({ page: "guide" })
    }
  })
  useEffect(() => {
    const finActivite = window.avocatier.surActivite(surActivite)
    const finNavigation = window.avocatier.surNavigation(surNavigation)
    const finConnexion = window.avocatier.surConnexion(surConnexion)
    void window.avocatier.etatConnexion().then((valeur) => !valeur && surConnexion(false))
    window.addEventListener("keydown", surTouche)
    return () => {
      finActivite()
      finNavigation()
      finConnexion()
      window.removeEventListener("keydown", surTouche)
    }
  }, [])

  const activite = caissier ? ACTIVITE.filter((r) => PAGES_CAISSIER.includes(r.page)) : ACTIVITE
  const rubriques = [...activite, ...(gerant ? GESTION : [])]
  // Caissier : la caisse tient lieu d'accueil
  const rubriqueActive: PageNav = caissier && !PAGES_CAISSIER.includes(vue.page) ? "restaurant" : vue.page === "client" ? "clients" : vue.page
  const situation = donnees && !caissier ? situationDuJour(donnees, donnees.aujourdhui) : null
  const cleEcran = vue.page === "client" ? `client-${vue.id}` : vue.page === "guide" ? `guide-${vue.section ?? ""}` : vue.page
  // Nouvel écran affiché en haut de la zone qui défile (sauf section du Guide : le Guide y défile lui-même)
  const versSectionGuide = vue.page === "guide" && !!vue.section
  useEffect(() => {
    if (!versSectionGuide) zoneDefilement.current?.scrollTo({ top: 0 })
  }, [cleEcran, versSectionGuide])
  const lienNav = (page: PageNav) => mergeClasses(styles.lienNav, rubriqueActive === page && styles.lienNavActif)

  let ecran: ReactNode
  if (!donnees) {
    ecran = erreur ? (
      <MessageBar intent="error">
        <MessageBarBody>{erreur}</MessageBarBody>
        <MessageBarActions>
          <BoutonRecharger libelle="Réessayer" />
        </MessageBarActions>
      </MessageBar>
    ) : (
      <EcranLancement />
    )
  } else if (caissier && !PAGES_CAISSIER.includes(vue.page)) ecran = <Restaurant />
  else if (!gerant && PAGES_GERANTS.includes(vue.page)) ecran = <Aujourdhui />
  else if (vue.page === "aujourdhui") ecran = <Aujourdhui />
  else if (vue.page === "reservations") ecran = <Reservations filtre={vue.filtre ?? null} />
  else if (vue.page === "planning") ecran = <Planning />
  else if (vue.page === "chambres") ecran = <Chambres filtre={vue.filtre ?? "toutes"} />
  else if (vue.page === "restaurant") ecran = <Restaurant onglet={vue.onglet} />
  else if (vue.page === "clients") ecran = <Clients />
  else if (vue.page === "client") ecran = <FicheClient id={vue.id} />
  else if (vue.page === "revenus") ecran = <Revenus />
  else if (vue.page === "statistiques") ecran = <Statistiques />
  else if (vue.page === "tarifs") ecran = <Tarifs />
  else if (vue.page === "utilisateurs") ecran = <Utilisateurs />
  else if (vue.page === "journal") ecran = <Journal />
  else if (vue.page === "notifications") ecran = <Notifications />
  else if (vue.page === "guide") ecran = <Guide key={vue.section} section={vue.section} />
  else ecran = <Parametres onDeconnexion={onDeconnexion} />

  // Premier chargement : le grand logo seul (même écran qu'au lancement), puis l'envol vers la barre de titre
  const premierChargement = !donnees && !erreur
  useEnvol(racine, !premierChargement)
  if (premierChargement) return <EcranLancement />

  return (
    <div ref={racine} className={styles.coquille}>
      <BarreTitre
        centre={
          <RechercheGlobale ref={champRecherche} className={styles.recherche} disabled={!donnees || caissier} />
        }
        actions={
          <>
            {!enLigne && (
              <Tooltip content="Le serveur ne répond pas : lecture seule, les informations affichées peuvent dater. Nouvel essai automatique." relationship="description">
                <Badge appearance="tint" color="danger" size="large" icon={<WifiWarningRegular />} className={styles.horsLigne}>
                  Hors connexion
                </Badge>
              </Tooltip>
            )}
            {!caissier && (
              <Tooltip content="Nouvelle réservation (Ctrl + N)" relationship="label">
                <Button appearance="subtle" icon={<CalendarAddRegular />} disabled={!donnees || !enLigne} onClick={() => ouvrirNouvelleReservation()} data-visite="barre-nouvelle-reservation" />
              </Tooltip>
            )}
            {donnees && !caissier && <BoutonNotifications ouvert={notificationsOuvertes} onBasculer={() => setNotificationsOuvertes((o) => !o)} />}
          </>
        }
      />

      <div className={styles.corps}>
        {navOuverte ? (
          <NavDrawer type="inline" open selectedValue={rubriqueActive} onNavItemSelect={(_e, d) => naviguer({ page: d.value as PageNav } as Vue)} className={styles.nav} data-visite="navigation">
            <NavDrawerHeader>
              <Tooltip content="Réduire la navigation" relationship="label">
                <Hamburger onClick={() => setNavOuverte(false)} />
              </Tooltip>
            </NavDrawerHeader>
            <NavDrawerBody>
              {activite.length > 0 && <NavSectionHeader>Activité</NavSectionHeader>}
              {activite.map(({ page, libelle, Icone }) => (
                <NavItem key={page} value={page} icon={<Icone className={styles.iconeNav} />} className={lienNav(page)}>
                  <span className={styles.libelleNav}>{libelle}</span>
                  {page === "reservations" && aTraiter > 0 && (
                    <span className={styles.pastilleNav}>
                      <CounterBadge count={aTraiter} size="small" />
                    </span>
                  )}
                  {page === "chambres" && (aNettoyer > 0 || enMaintenance > 0) && (
                    <span className={styles.pastilleNav}>
                      {enMaintenance > 0 && (
                        <Tooltip content={`${pluriel(enMaintenance, "chambre")} en maintenance`} relationship="label">
                          <CounterBadge count={enMaintenance} size="small" color="danger" />
                        </Tooltip>
                      )}
                      {aNettoyer > 0 && (
                        <Tooltip content={`${pluriel(aNettoyer, "chambre")} à nettoyer`} relationship="label">
                          <CounterBadge count={aNettoyer} size="small" className={styles.pastilleMenage} />
                        </Tooltip>
                      )}
                    </span>
                  )}
                </NavItem>
              ))}
              {!donnees && (
                <Skeleton aria-label="Chargement de la navigation" className={styles.squeletteNav}>
                  <SkeletonItem size={12} className={styles.squeletteTitre} />
                  {GESTION.map(({ page }) => (
                    <div key={page} className={styles.squeletteLigne}>
                      <SkeletonItem shape="square" size={20} />
                      <SkeletonItem size={16} />
                    </div>
                  ))}
                </Skeleton>
              )}
              {gerant && (
                <>
                  <NavSectionHeader>Gestion</NavSectionHeader>
                  {GESTION.map(({ page, libelle, Icone }) => (
                    <NavItem key={page} value={page} icon={<Icone className={styles.iconeNav} />} className={lienNav(page)}>
                      {libelle}
                    </NavItem>
                  ))}
                </>
              )}
            </NavDrawerBody>
            <NavDrawerFooter className={styles.piedNav}>
              {!donnees && (
                <Skeleton aria-label="Chargement de la situation du jour" className={styles.ceSoir}>
                  <SkeletonItem size={12} className={styles.squeletteCourt} />
                  <SkeletonItem size={16} />
                  <SkeletonItem size={8} />
                  <SkeletonItem size={12} className={styles.squeletteCourt} />
                </Skeleton>
              )}
              {situation && (
                // Toute la case ouvre le Planning : d'un coup d'œil, les chambres encore à vendre ce soir
                <Tooltip content="Ouvrir le planning" relationship="description" positioning="after">
                  <button type="button" className={mergeClasses(styles.ceSoir, styles.ceSoirBouton)} data-visite="ce-soir" onClick={() => naviguer({ page: "planning" })}>
                    <span className={styles.ceSoirEntete}>
                      <Caption1>Ce soir</Caption1>
                      <Caption1>
                        {situation.occupes} / {situation.total} occupées
                      </Caption1>
                    </span>
                    <span className={styles.ceSoirLibres}>
                      <span className={mergeClasses(styles.ceSoirNombre, situation.libres.length === 0 && styles.complet)}>{situation.libres.length}</span>
                      <Text weight="semibold">{situation.libres.length === 0 ? "Complet" : situation.libres.length > 1 ? "chambres libres" : "chambre libre"}</Text>
                    </span>
                    <ProgressBar value={situation.total ? situation.occupes / situation.total : 0} thickness="large" />
                    {situation.libres.length > 0 && (
                      <span className={styles.ceSoirPuces}>
                        {situation.libres.map((c) => (
                          <span key={c.id} className={mergeClasses(styles.puceChambre, c.etat !== "propre" && styles.puceANettoyer)} title={c.etat === "propre" ? "Prête" : c.etat === "maintenance" ? "En maintenance" : "À nettoyer"}>
                            {c.numero}
                          </span>
                        ))}
                      </span>
                    )}
                    <Caption1>
                      {pluriel(situation.arrivees.length, "arrivée")}, {pluriel(situation.departs.length, "départ")}
                    </Caption1>
                  </button>
                </Tooltip>
              )}
              <NavItem value={GUIDE.page} icon={<GUIDE.Icone className={styles.iconeNav} />} className={lienNav(GUIDE.page)}>
                {GUIDE.libelle}
              </NavItem>
              <NavItem value={PARAMETRES.page} icon={<PARAMETRES.Icone className={styles.iconeNav} />} className={lienNav(PARAMETRES.page)}>
                {PARAMETRES.libelle}
              </NavItem>
              {!donnees && (
                <Skeleton aria-label="Chargement du compte" className={styles.squeletteCompte}>
                  <SkeletonItem shape="circle" size={32} />
                  <div className={styles.compteTexte}>
                    <SkeletonItem size={16} className={styles.squeletteNom} />
                    <SkeletonItem size={12} className={styles.squeletteCourt} />
                  </div>
                </Skeleton>
              )}
              {donnees && <MenuCompte prenom={donnees.hote.prenom} nom={donnees.hote.nom} role={ROLES[donnees.hote.role]} onDeconnexion={onDeconnexion} />}
            </NavDrawerFooter>
          </NavDrawer>
        ) : (
          // Navigation réduite : icônes seules, libellés en info-bulle
          <nav className={styles.rail} aria-label="Navigation" data-visite="navigation">
            <Tooltip content="Ouvrir la navigation" relationship="label">
              <Hamburger onClick={() => setNavOuverte(true)} />
            </Tooltip>
            {[...rubriques, GUIDE, PARAMETRES].map(({ page, libelle, Icone }) => (
              <Tooltip key={page} content={libelle} relationship="label" positioning="after">
                <div className={styles.railBouton}>
                  <Button
                    appearance={rubriqueActive === page ? "secondary" : "subtle"}
                    size="large"
                    icon={<Icone filled={rubriqueActive === page} />}
                    aria-current={rubriqueActive === page ? "page" : undefined}
                    onClick={() => naviguer({ page } as Vue)}
                  />
                  {page === "reservations" && aTraiter > 0 && <CounterBadge count={aTraiter} size="extra-small" className={styles.railPastille} />}
                  {page === "chambres" && (enMaintenance > 0 || aNettoyer > 0) && (
                    <CounterBadge
                      count={enMaintenance || aNettoyer}
                      size="extra-small"
                      color={enMaintenance ? "danger" : "brand"}
                      aria-label={enMaintenance ? `${pluriel(enMaintenance, "chambre")} en maintenance` : `${pluriel(aNettoyer, "chambre")} à nettoyer`}
                      className={mergeClasses(styles.railPastille, !enMaintenance && styles.pastilleMenage)}
                    />
                  )}
                </div>
              </Tooltip>
            ))}
            {!donnees && (
              <Skeleton aria-label="Chargement de la navigation" className={styles.squeletteRail}>
                {GESTION.map(({ page }) => (
                  <SkeletonItem key={page} shape="square" size={40} />
                ))}
              </Skeleton>
            )}
            <div className={styles.railEspace} />
            {situation && (
              // Navigation réduite : le nombre de chambres libres ce soir reste visible, détail en info-bulle
              <Tooltip
                relationship="description"
                positioning="after"
                content={
                  <>
                    <Text weight="semibold" block>
                      Ce soir : {situation.libres.length === 0 ? "complet" : pluriel(situation.libres.length, "chambre libre", "chambres libres")}
                    </Text>
                    {situation.libres.length > 0 && <Text block>{situation.libres.map((c) => c.numero).join(", ")}</Text>}
                    <Caption1 block>
                      {situation.occupes} sur {situation.total} occupées · {pluriel(situation.arrivees.length, "arrivée")}, {pluriel(situation.departs.length, "départ")}
                    </Caption1>
                  </>
                }
              >
                <button type="button" className={styles.railLibres} data-visite="ce-soir" aria-label={`Ce soir : ${pluriel(situation.libres.length, "chambre libre", "chambres libres")}. Ouvrir le planning`} onClick={() => naviguer({ page: "planning" })}>
                  <span className={mergeClasses(styles.railNombre, situation.libres.length === 0 && styles.complet)}>{situation.libres.length}</span>
                  <span className={styles.railLegende}>{situation.libres.length > 1 ? "libres" : "libre"}</span>
                  <ProgressBar value={situation.total ? situation.occupes / situation.total : 0} thickness="medium" className={styles.railJauge} />
                </button>
              </Tooltip>
            )}
            {donnees ? (
              <MenuCompte prenom={donnees.hote.prenom} nom={donnees.hote.nom} role={ROLES[donnees.hote.role]} onDeconnexion={onDeconnexion} compact />
            ) : (
              <Skeleton aria-label="Chargement du compte">
                <SkeletonItem shape="circle" size={32} />
              </Skeleton>
            )}
          </nav>
        )}

        <main ref={zoneDefilement} className={styles.contenu}>
          {!donnees && !erreur ? (
            ecran
          ) : (
            <>
              <div className={styles.page}>
                {donnees && (erreur || !enLigne) && (
                  <MessageBar intent="warning">
                    <MessageBarBody>
                      <MessageBarTitle>Hors connexion : lecture seule</MessageBarTitle>
                      Les informations affichées peuvent dater ; les boutons qui enregistrent sont désactivés jusqu&apos;au retour de la connexion.{" "}
                      {erreur ?? "Nouvel essai automatique toutes les 5 secondes."}
                    </MessageBarBody>
                    <MessageBarActions>
                      <BoutonRecharger libelle="Actualiser" />
                    </MessageBarActions>
                  </MessageBar>
                )}
                {/* Clé par écran : le nouvel écran apparaît en fondu ; l'ancien s'atténue pendant que le suivant se prépare */}
                <div key={cleEcran} className={mergeClasses(styles.ecran, apparition.root, changementEcran && styles.ecranSuivant)}>
                  {ecran}
                </div>
              </div>
            </>
          )}
        </main>
        {donnees && <PanneauNotifications ouvert={notificationsOuvertes} onFermer={() => setNotificationsOuvertes(false)} />}
      </div>

      {donnees && <NouvelleReservation />}
      {donnees && <VisiteGuidee />}
      {donnees && <FenetreBienvenue role={donnees.hote.role} />}
      <FenetreMiseAJour />
    </div>
  )
}

// Nouvel essai de chargement des données, avec un Spinner jusqu'à la réponse
function BoutonRecharger({ libelle }: { libelle: string }) {
  const { recharger } = useDonnees()
  const [enCours, setEnCours] = useState(false)
  return (
    <Button
      disabled={enCours}
      icon={enCours ? <Spinner size="tiny" /> : <ArrowSyncRegular />}
      onClick={async () => {
        setEnCours(true)
        await recharger()
        setEnCours(false)
      }}
    >
      {libelle}
    </Button>
  )
}

// Compte connecté en bas de la navigation ; `compact` : avatar seul (navigation réduite), nom et rôle en info-bulle
function MenuCompte({ prenom, nom, role, onDeconnexion, compact = false }: { prenom: string; nom: string; role: string; onDeconnexion: () => void; compact?: boolean }) {
  const styles = useCoquilleStyles()
  const nomComplet = `${prenom} ${nom}`.trim()
  const avatar = <Avatar name={nomComplet} color="brand" size={32} />
  return (
    <Menu positioning={compact ? "after-bottom" : "above-start"}>
      {compact ? (
        <Tooltip content={`${nomComplet} · ${role}`} relationship="label" positioning="after">
          <MenuTrigger disableButtonEnhancement>
            <Button appearance="subtle" aria-label={`Compte de ${nomComplet}`} className={styles.compteRail}>
              {avatar}
            </Button>
          </MenuTrigger>
        </Tooltip>
      ) : (
        <MenuTrigger disableButtonEnhancement>
          <Button appearance="subtle" className={styles.compte}>
            {avatar}
            <span className={styles.compteTexte}>
              <Text weight="semibold" className={styles.tronque}>
                {nomComplet}
              </Text>
              <Caption1 className={styles.tronque}>{role}</Caption1>
            </span>
          </Button>
        </MenuTrigger>
      )}
      <MenuPopover>
        <MenuList>
          <MenuItem
            icon={<GlobeRegular />}
            onClick={async () => {
              const { session } = await window.avocatier.session()
              if (session) window.avocatier.ouvrirLien(session.serveur)
            }}
          >
            Ouvrir le site
          </MenuItem>
          <MenuDivider />
          <MenuItem icon={<SignOutRegular />} onClick={onDeconnexion}>
            Se déconnecter
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}
