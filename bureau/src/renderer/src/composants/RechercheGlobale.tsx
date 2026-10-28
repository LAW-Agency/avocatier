import { Caption1, Combobox, Option, OptionGroup, Text, makeStyles, mergeClasses, tokens } from "@fluentui/react-components"
import {
  AlertRegular,
  BedRegular,
  BookOpenRegular,
  CalendarAddRegular,
  CalendarLtrRegular,
  CalendarCancelRegular,
  DataTrendingRegular,
  FullScreenMaximizeRegular,
  HistoryRegular,
  HomeRegular,
  MailInboxRegular,
  MoneyRegular,
  PeopleRegular,
  PeopleTeamRegular,
  PersonRegular,
  PlayCircleRegular,
  SearchRegular,
  SettingsRegular,
  TagRegular,
  WeatherMoonRegular,
  type FluentIcon,
} from "@fluentui/react-icons"
import { forwardRef, type ReactNode } from "react"
import { formaterPlage } from "@partage/dates"
import { libelleStatutHote } from "@partage/statuts"
import { PAGES_GERANTS, chambresTriees, clientsVisibles, nomChambre, nomDe, useDonnees, type Vue } from "../donnees"
import { numeroRecu } from "../documents"
import { ETATS_CHAMBRE, MODES_PAIEMENT } from "../libelles"
import { SECTIONS_GUIDE, normaliser } from "../pages/Guide"
import { useReglages } from "../reglages"
import { usePrix } from "../montants"
import { lancerVisite } from "./VisiteGuidee"

const useStyles = makeStyles({
  champ: { width: "100%", minWidth: 0 },
  liste: { maxHeight: "min(70vh, 560px)" },
  option: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalM, minWidth: 0 },
  icone: { fontSize: tokens.fontSizeBase500, color: tokens.colorNeutralForeground3, flexShrink: 0 },
  texte: { display: "flex", flexDirection: "column", minWidth: 0 },
  detail: { color: tokens.colorNeutralForeground3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
})

type Resultat = { cle: string; libelle: string; detail?: string; Icone: FluentIcon; ouvrir: () => void }
type Groupe = { titre: string; resultats: Resultat[] }

const PAR_GROUPE = 5

// Écrans du logiciel, avec des mots qui y mènent (« ménage » → Chambres)
const ECRANS: { vue: Vue; libelle: string; mots: string; Icone: FluentIcon }[] = [
  { vue: { page: "aujourdhui" }, libelle: "Aujourd'hui", mots: "accueil tableau de bord widgets arrivées départs", Icone: HomeRegular },
  { vue: { page: "reservations" }, libelle: "Réservations", mots: "demandes options à traiter confirmées", Icone: MailInboxRegular },
  { vue: { page: "planning" }, libelle: "Planning", mots: "calendrier occupation bloquer dates booking airbnb ical synchroniser double réservation", Icone: CalendarLtrRegular },
  { vue: { page: "chambres" }, libelle: "Chambres", mots: "ménage nettoyer maintenance bungalows", Icone: BedRegular },
  { vue: { page: "clients" }, libelle: "Clients", mots: "fiches coordonnées nouveau client fusionner doublon effacer rgpd exporter", Icone: PeopleRegular },
  { vue: { page: "revenus" }, libelle: "Revenus", mots: "chiffre d'affaires encaissements reste à encaisser exporter comptabilité", Icone: MoneyRegular },
  { vue: { page: "statistiques" }, libelle: "Statistiques", mots: "occupation revpar provenance pays", Icone: DataTrendingRegular },
  { vue: { page: "tarifs" }, libelle: "Tarifs", mots: "prix saisons devises taux", Icone: TagRegular },
  { vue: { page: "utilisateurs" }, libelle: "Utilisateurs", mots: "équipe comptes rôles mot de passe", Icone: PeopleTeamRegular },
  { vue: { page: "journal" }, libelle: "Journal d'activité", mots: "audit historique actions connexions", Icone: HistoryRegular },
  { vue: { page: "notifications" }, libelle: "Notifications", mots: "alertes cloche impayés non soldé trop-perçu rembourser oublis départ arrivée", Icone: AlertRegular },
  { vue: { page: "guide" }, libelle: "Guide", mots: "aide mode d'emploi documentation", Icone: BookOpenRegular },
  { vue: { page: "parametres" }, libelle: "Paramètres", mots: "réglages thème zoom notifications démarrage version mise à jour factures reçus nif stat coordonnées", Icone: SettingsRegular },
]

export type RechercheGlobaleProps = { className?: string; disabled?: boolean }

// Recherche de la barre de titre (Ctrl + F) : écrans, actions, réservations, clients, hébergements, dates
// bloquées, encaissements, saisons et équipe (gérants), sections du guide. Sur l'écran Réservations, la saisie
// filtre aussi la liste.
export const RechercheGlobale = forwardRef<HTMLInputElement, RechercheGlobaleProps>(({ className, disabled }, ref) => {
  const formaterPrix = usePrix()
  const styles = useStyles()
  const { donnees: d, naviguer, recherche, setRecherche, ouvrirNouvelleReservation } = useDonnees()
  const { sombre, modifier } = useReglages()
  const gerant = d?.hote.role === "hote"
  const cherche = normaliser(recherche.trim())
  const trouve = (...textes: (string | undefined)[]) => normaliser(textes.filter(Boolean).join(" ")).includes(cherche)

  const aller = (vue: Vue) => () => naviguer(vue)
  // Une réservation s'ouvre dans la liste, filtrée sur sa référence
  const versReservation = (reference: string) => () => {
    naviguer({ page: "reservations", filtre: null })
    setRecherche(reference)
  }

  const groupes: Groupe[] = []
  if (cherche && d) {
    const clientDe = (id: string) => d.clients.find((c) => c.id === id)
    const hebergementDe = (id: string) => d.hebergements.find((h) => h.id === id)
    const numeroDe = (id: string) => d.chambres.find((c) => c.id === id)?.numero

    groupes.push({
      titre: "Écrans",
      resultats: ECRANS.filter((e) => (gerant || !PAGES_GERANTS.includes(e.vue.page)) && trouve(e.libelle, e.mots)).map((e) => ({
        cle: `ecran-${e.vue.page}`,
        libelle: e.libelle,
        Icone: e.Icone,
        ouvrir: aller(e.vue),
      })),
    })

    const actions: (Resultat & { mots: string })[] = [
      { cle: "action-reservation", libelle: "Nouvelle réservation", detail: "Ctrl + N", mots: "nouvelle réservation créer saisir ajouter", Icone: CalendarAddRegular, ouvrir: () => ouvrirNouvelleReservation() },
      { cle: "action-client", libelle: "Nouveau client", detail: "Écran Clients", mots: "nouveau client créer ajouter", Icone: PersonRegular, ouvrir: aller({ page: "clients" }) },
      { cle: "action-blocage", libelle: "Bloquer des dates", detail: "Écran Planning", mots: "bloquer fermer dates blocage", Icone: CalendarCancelRegular, ouvrir: aller({ page: "planning" }) },
      { cle: "action-visite", libelle: "Lancer la visite guidée", detail: "Chaque écran expliqué à voix haute", mots: "visite guidée tutoriel découvrir aide voix formation", Icone: PlayCircleRegular, ouvrir: lancerVisite },
      {
        cle: "action-theme",
        libelle: sombre ? "Passer au thème clair" : "Passer au thème sombre",
        mots: "thème sombre clair nuit jour couleur",
        Icone: WeatherMoonRegular,
        ouvrir: () => void modifier({ theme: sombre ? "clair" : "sombre" }),
      },
      { cle: "action-plein-ecran", libelle: "Plein écran", detail: "F11", mots: "plein écran agrandir f11", Icone: FullScreenMaximizeRegular, ouvrir: () => window.avocatier.basculerPleinEcran() },
    ]
    groupes.push({ titre: "Actions", resultats: actions.filter((a) => trouve(a.libelle, a.mots)) })

    groupes.push({
      titre: "Réservations",
      resultats: d.reservations
        .filter((r) => {
          const client = clientDe(r.clientId)
          return trouve(r.reference, r.factureNumero, nomDe(client), client?.email ?? "", r.telephone, client?.telephone, hebergementDe(r.hebergementId)?.nom, numeroDe(r.chambreId))
        })
        .sort((a, b) => b.arrivee.localeCompare(a.arrivee))
        .map((r) => ({
          cle: `reservation-${r.id}`,
          libelle: `${r.reference} · ${nomDe(clientDe(r.clientId))}`,
          detail: `${formaterPlage(r.arrivee, r.depart)} · ${nomChambre(d, r.chambreId)} · ${libelleStatutHote[r.statut]}`,
          Icone: MailInboxRegular,
          ouvrir: versReservation(r.reference),
        })),
    })

    groupes.push({
      titre: "Clients",
      resultats: clientsVisibles(d.clients)
        .filter((c) => trouve(nomDe(c), c.email, c.telephone, c.pays))
        .map((c) => ({
          cle: `client-${c.id}`,
          libelle: nomDe(c),
          detail: [c.email, c.telephone, c.pays].filter(Boolean).join(" · "),
          Icone: PeopleRegular,
          ouvrir: aller({ page: "client", id: c.id }),
        })),
    })

    groupes.push({
      titre: "Hébergements",
      resultats: d.hebergements
        .filter((h) => trouve(h.nom, h.type, h.literie, h.vue))
        .map((h) => ({
          cle: `hebergement-${h.id}`,
          libelle: h.nom,
          detail: `${h.type === "bungalow" ? "Bungalow" : "Chambre"} · ${h.capaciteMax} pers. · ${h.vue}`,
          Icone: BedRegular,
          ouvrir: aller({ page: "chambres" }),
        })),
    })

    groupes.push({
      titre: "Chambres",
      resultats: chambresTriees(d)
        .filter((c) => trouve(c.numero, hebergementDe(c.hebergementId)?.nom, c.noteEtat))
        .map((c) => ({
          cle: `chambre-${c.id}`,
          libelle: c.numero,
          detail: [hebergementDe(c.hebergementId)?.nom, c.active ? ETATS_CHAMBRE[c.etat] : "désactivée", c.noteEtat].filter(Boolean).join(" · "),
          Icone: BedRegular,
          ouvrir: aller({ page: "chambres" }),
        })),
    })

    groupes.push({
      titre: "Dates bloquées",
      resultats: d.blocages
        .filter((b) => trouve(b.raison, hebergementDe(b.hebergementId)?.nom, numeroDe(b.chambreId), "blocage bloquée fermeture"))
        .map((b) => ({
          cle: `blocage-${b.id}`,
          libelle: b.raison || "Dates bloquées",
          detail: `${nomChambre(d, b.chambreId)} · ${formaterPlage(b.debut, b.fin)}`,
          Icone: CalendarCancelRegular,
          ouvrir: aller({ page: "planning" }),
        })),
    })

    groupes.push({
      titre: "Encaissements",
      resultats: d.paiements
        .filter((p) => {
          const r = d.reservations.find((x) => x.id === p.reservationId)
          return trouve(p.note, MODES_PAIEMENT[p.mode], formaterPrix(p.montant), String(p.montant), r?.reference, numeroRecu(p))
        })
        .sort((a, b) => b.le.localeCompare(a.le))
        .map((p) => {
          const r = d.reservations.find((x) => x.id === p.reservationId)
          return {
            cle: `paiement-${p.id}`,
            libelle: `${formaterPrix(p.montant)} · ${MODES_PAIEMENT[p.mode]}`,
            detail: [r?.reference, r && nomDe(clientDe(r.clientId)), p.note].filter(Boolean).join(" · "),
            Icone: MoneyRegular,
            ouvrir: r ? versReservation(r.reference) : aller({ page: "reservations" }),
          }
        }),
    })

    if (gerant) {
      groupes.push({
        titre: "Saisons",
        resultats: d.saisons
          .filter((s) => trouve(s.nom, "saison"))
          .map((s) => ({
            cle: `saison-${s.nom}`,
            libelle: s.nom,
            detail: `Du ${s.debut.split("-").reverse().join("/")} au ${s.fin.split("-").reverse().join("/")} · +${Math.round((s.coefficient - 1) * 100)} % · ${s.sejourMin} nuit${s.sejourMin > 1 ? "s" : ""} min.`,
            Icone: TagRegular,
            ouvrir: aller({ page: "tarifs" }),
          })),
      })
      groupes.push({
        titre: "Équipe",
        resultats: d.equipe
          .filter((m) => trouve(nomDe(m), m.email))
          .map((m) => ({
            cle: `membre-${m.id}`,
            libelle: nomDe(m),
            detail: `${m.email}${m.actif ? "" : " · désactivé"}`,
            Icone: PeopleTeamRegular,
            ouvrir: aller({ page: "utilisateurs" }),
          })),
      })
    }

    groupes.push({
      titre: "Guide",
      resultats: SECTIONS_GUIDE.filter((s) => trouve(s.titre, s.resume, s.motsCles)).map((s) => ({
        cle: `guide-${s.id}`,
        libelle: s.titre,
        detail: s.resume,
        Icone: BookOpenRegular,
        ouvrir: aller({ page: "guide", section: s.id }),
      })),
    })

    groupes.push({
      titre: "Recherche",
      resultats: [
        {
          cle: "toutes-reservations",
          libelle: `Toutes les réservations pour « ${recherche.trim()} »`,
          Icone: SearchRegular,
          ouvrir: () => naviguer({ page: "reservations", filtre: null }),
        },
      ],
    })
  }

  const affiches = groupes.map((g) => ({ ...g, resultats: g.resultats.slice(0, PAR_GROUPE) })).filter((g) => g.resultats.length > 0)
  const parCle = new Map(affiches.flatMap((g) => g.resultats.map((r) => [r.cle, r] as const)))

  return (
    <Combobox
      ref={ref}
      root={{ "data-visite": "recherche" } as Record<string, string>}
      className={mergeClasses(styles.champ, className)}
      freeform
      disabled={disabled}
      placeholder="Rechercher partout : client, référence, hébergement, écran… (Ctrl + F)"
      aria-label="Rechercher dans tous les modules"
      expandIcon={<SearchRegular />}
      value={recherche}
      selectedOptions={[]}
      listbox={{ className: styles.liste }}
      onChange={(e) => setRecherche(e.target.value)}
      onOptionSelect={(_e, data) => {
        const resultat = data.optionValue ? parCle.get(data.optionValue) : undefined
        if (!resultat) return
        // La liste des réservations garde la recherche ; ailleurs, le champ se vide
        if (resultat.cle !== "toutes-reservations") setRecherche("")
        resultat.ouvrir()
      }}
    >
      {affiches.map((g) => (
        <OptionGroup key={g.titre} label={g.titre}>
          {g.resultats.map((r) => (
            <Option key={r.cle} value={r.cle} text={r.libelle}>
              <Ligne Icone={r.Icone} libelle={r.libelle} detail={r.detail} />
            </Option>
          ))}
        </OptionGroup>
      ))}
      {cherche && affiches.length === 1 && (
        <OptionGroup label="Aucun autre résultat">
          <Option value="aucun" text="Aucun résultat" disabled>
            Aucun écran, client ni hébergement ne correspond.
          </Option>
        </OptionGroup>
      )}
    </Combobox>
  )
})
RechercheGlobale.displayName = "RechercheGlobale"

function Ligne({ Icone, libelle, detail }: { Icone: FluentIcon; libelle: string; detail?: ReactNode }) {
  const styles = useStyles()
  return (
    <span className={styles.option}>
      <Icone className={styles.icone} />
      <span className={styles.texte}>
        <Text truncate wrap={false}>
          {libelle}
        </Text>
        {detail && <Caption1 className={styles.detail}>{detail}</Caption1>}
      </span>
    </span>
  )
}
