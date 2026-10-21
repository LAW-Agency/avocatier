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
  NavDrawer,
  NavDrawerBody,
  NavDrawerFooter,
  NavDrawerHeader,
  NavItem,
  NavSectionHeader,
  ProgressBar,
  SearchBox,
  Text,
  Skeleton,
  SkeletonItem,
  Toast,
  ToastBody,
  ToastTitle,
  ToastTrigger,
  Toaster,
  Tooltip,
  mergeClasses,
  useId,
  useToastController,
} from "@fluentui/react-components"
import {
  ArrowSyncRegular,
  BedFilled,
  BedRegular,
  CalendarAddRegular,
  CalendarLtrFilled,
  CalendarLtrRegular,
  DataTrendingFilled,
  DataTrendingRegular,
  DismissRegular,
  GlobeRegular,
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
  bundleIcon,
  type FluentIcon,
} from "@fluentui/react-icons"
import { useEffect, useEffectEvent, useState, type ReactNode } from "react"
import { pluriel } from "@partage/dates"
import type { StatutReservation } from "@partage/types"
import type { Annonce } from "../../partage/ipc"
import embleme from "./assets/embleme-blanc.svg"
import { BarreTitre } from "./composants/BarreTitre"
import NouvelleReservation from "./composants/NouvelleReservation"
import { PAGES_GERANTS, useDonnees, type Vue } from "./donnees"
import { ROLES } from "./libelles"
import Aujourdhui from "./pages/Aujourdhui"
import Chambres from "./pages/Chambres"
import Clients from "./pages/Clients"
import FicheClient from "./pages/FicheClient"
import Parametres from "./pages/Parametres"
import Planning from "./pages/Planning"
import Reservations from "./pages/Reservations"
import Revenus from "./pages/Revenus"
import Statistiques from "./pages/Statistiques"
import Tarifs from "./pages/Tarifs"
import Utilisateurs from "./pages/Utilisateurs"
import { situationDuJour } from "./situation"
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
    page: "clients",
    libelle: "Clients",
    Icone: bundleIcon(PeopleFilled, PeopleRegular),
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

const PARAMETRES: Rubrique = {
  page: "parametres",
  libelle: "Paramètres",
  Icone: bundleIcon(SettingsFilled, SettingsRegular),
}

// Fenêtre principale une fois connecté : barre de titre avec recherche, navigation à gauche, écran courant
export default function Coquille({ onDeconnexion }: { onDeconnexion: () => void }) {
  const styles = useCoquilleStyles()
  const { donnees, erreur, recharger, vue, naviguer, recherche, setRecherche, ouvrirNouvelleReservation } = useDonnees()
  const [navOuverte, setNavOuverte] = useState(true)
  const idToasts = useId("annonces")
  const { dispatchToast } = useToastController(idToasts)
  const gerant = donnees?.hote.role === "hote"

  const aTraiter = donnees?.reservations.filter((r) => r.statut === "option").length ?? 0
  useEffect(() => window.avocatier.signalerATraiter(aTraiter), [aTraiter])

  // Suivi en direct (processus principal) : données rechargées, nouveautés annoncées une minute
  const surActivite = useEffectEvent((annonces: Annonce[]) => {
    void recharger()
    for (const a of annonces) {
      dispatchToast(
        <Toast>
          <ToastTitle
            action={
              <ToastTrigger>
                <Button appearance="transparent" size="small" icon={<DismissRegular />} aria-label="Fermer" />
              </ToastTrigger>
            }
          >
            {a.titre}
          </ToastTitle>
          <ToastBody subtitle={<Link onClick={() => naviguer({ page: "reservations", filtre: a.filtre })}>Voir les réservations</Link>}>{a.detail}</ToastBody>
        </Toast>,
        { toastId: a.id, intent: "info", timeout: 60_000, pauseOnHover: true },
      )
    }
  })
  const surNavigation = useEffectEvent((filtre: StatutReservation) => naviguer({ page: "reservations", filtre }))
  useEffect(() => {
    const finActivite = window.avocatier.surActivite(surActivite)
    const finNavigation = window.avocatier.surNavigation(surNavigation)
    return () => {
      finActivite()
      finNavigation()
    }
  }, [])

  const rubriques = [...ACTIVITE, ...(gerant ? GESTION : [])]
  const rubriqueActive: PageNav = vue.page === "client" ? "clients" : vue.page
  const situation = donnees ? situationDuJour(donnees, donnees.aujourdhui) : null
  const lienNav = (page: PageNav) => mergeClasses(styles.lienNav, rubriqueActive === page && styles.lienNavActif)

  let ecran: ReactNode
  if (!donnees) {
    ecran = erreur ? (
      <MessageBar intent="error">
        <MessageBarBody>{erreur}</MessageBarBody>
        <MessageBarActions>
          <Button onClick={recharger} icon={<ArrowSyncRegular />}>
            Réessayer
          </Button>
        </MessageBarActions>
      </MessageBar>
    ) : (
      <div className={styles.attente} role="status">
        <span aria-hidden className={styles.emblemeSquelette} style={{ maskImage: `url("${embleme}")` }} />
        <Caption1 className={styles.texteAttente}>Chargement des réservations…</Caption1>
      </div>
    )
  } else if (!gerant && PAGES_GERANTS.includes(vue.page)) ecran = <Aujourdhui />
  else if (vue.page === "aujourdhui") ecran = <Aujourdhui />
  else if (vue.page === "reservations") ecran = <Reservations filtre={vue.filtre ?? null} />
  else if (vue.page === "planning") ecran = <Planning />
  else if (vue.page === "chambres") ecran = <Chambres />
  else if (vue.page === "clients") ecran = <Clients />
  else if (vue.page === "client") ecran = <FicheClient id={vue.id} />
  else if (vue.page === "revenus") ecran = <Revenus />
  else if (vue.page === "statistiques") ecran = <Statistiques />
  else if (vue.page === "tarifs") ecran = <Tarifs />
  else if (vue.page === "utilisateurs") ecran = <Utilisateurs />
  else ecran = <Parametres onDeconnexion={onDeconnexion} />

  return (
    <div className={styles.coquille}>
      <BarreTitre
        centre={
          <SearchBox
            className={styles.recherche}
            placeholder="Rechercher un client, une référence, un hébergement"
            value={recherche}
            onChange={(_e, d) => {
              setRecherche(d.value)
              if (d.value && vue.page !== "reservations") naviguer({ page: "reservations", filtre: null })
            }}
            disabled={!donnees}
          />
        }
        actions={
          <Tooltip content="Nouvelle réservation" relationship="label">
            <Button appearance="subtle" icon={<CalendarAddRegular />} disabled={!donnees} onClick={() => ouvrirNouvelleReservation()} />
          </Tooltip>
        }
      />

      <div className={styles.corps}>
        {navOuverte ? (
          <NavDrawer type="inline" open selectedValue={rubriqueActive} onNavItemSelect={(_e, d) => naviguer({ page: d.value as PageNav } as Vue)} className={styles.nav}>
            <NavDrawerHeader>
              <Tooltip content="Réduire la navigation" relationship="label">
                <Hamburger onClick={() => setNavOuverte(false)} />
              </Tooltip>
            </NavDrawerHeader>
            <NavDrawerBody>
              <NavSectionHeader>Activité</NavSectionHeader>
              {ACTIVITE.map(({ page, libelle, Icone }) => (
                <NavItem key={page} value={page} icon={<Icone className={styles.iconeNav} />} className={lienNav(page)}>
                  <span className={styles.libelleNav}>{libelle}</span>
                  {page === "reservations" && aTraiter > 0 && <CounterBadge count={aTraiter} size="small" />}
                  {page === "chambres" && donnees?.hebergements.some((h) => h.etat === "a_nettoyer") && <Badge size="extra-small" color="warning" aria-label="Chambres à nettoyer" className={styles.pastilleNav} />}
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
                <div className={styles.ceSoir}>
                  <Caption1>Ce soir</Caption1>
                  <Text weight="semibold">
                    {situation.occupes} sur {situation.total} occupés
                  </Text>
                  <ProgressBar value={situation.total ? situation.occupes / situation.total : 0} thickness="large" />
                  <Caption1>
                    {pluriel(situation.arrivees.length, "arrivée")}, {pluriel(situation.departs.length, "départ")}
                  </Caption1>
                </div>
              )}
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
          <nav className={styles.rail} aria-label="Navigation">
            <Tooltip content="Ouvrir la navigation" relationship="label">
              <Hamburger onClick={() => setNavOuverte(true)} />
            </Tooltip>
            {[...rubriques, PARAMETRES].map(({ page, libelle, Icone }) => (
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
          </nav>
        )}

        <main className={styles.contenu}>
          {!donnees && !erreur ? (
            ecran
          ) : (
            <div className={styles.page}>
              {donnees && erreur && (
                <MessageBar intent="warning">
                  <MessageBarBody>Connexion au serveur perdue : les informations affichées peuvent dater. {erreur}</MessageBarBody>
                  <MessageBarActions>
                    <Button onClick={recharger} icon={<ArrowSyncRegular />}>
                      Actualiser
                    </Button>
                  </MessageBarActions>
                </MessageBar>
              )}
              {ecran}
            </div>
          )}
        </main>
      </div>

      {donnees && <NouvelleReservation />}
      <Toaster toasterId={idToasts} position="bottom-end" />
    </div>
  )
}

function MenuCompte({ prenom, nom, role, onDeconnexion }: { prenom: string; nom: string; role: string; onDeconnexion: () => void }) {
  const styles = useCoquilleStyles()
  const nomComplet = `${prenom} ${nom}`.trim()
  return (
    <Menu positioning="above-start">
      <MenuTrigger disableButtonEnhancement>
        <Button appearance="subtle" className={styles.compte}>
          <Avatar name={nomComplet} color="brand" size={32} />
          <span className={styles.compteTexte}>
            <Text weight="semibold" className={styles.tronque}>
              {nomComplet}
            </Text>
            <Caption1 className={styles.tronque}>{role}</Caption1>
          </span>
        </Button>
      </MenuTrigger>
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
