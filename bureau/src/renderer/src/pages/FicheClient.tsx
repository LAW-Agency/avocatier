import {
  Avatar,
  Badge,
  Body1,
  Breadcrumb,
  BreadcrumbButton,
  BreadcrumbDivider,
  BreadcrumbItem,
  Button,
  Caption1,
  CounterBadge,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MessageBar,
  MessageBarBody,
  Spinner,
  Subtitle2,
  Tab,
  TabList,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Textarea,
  Tooltip,
  mergeClasses,
} from "@fluentui/react-components"
import {
  BedRegular,
  CalendarAddRegular,
  CallRegular,
  DocumentPdfRegular,
  EarthRegular,
  EditRegular,
  FoodRegular,
  MailRegular,
  MoneyRegular,
  MoreHorizontalRegular,
  OpenRegular,
  PeopleRegular,
  PeopleSwapRegular,
  PersonDeleteRegular,
  ReceiptRegular,
  SaveRegular,
  StarRegular,
} from "@fluentui/react-icons"
import { useState } from "react"
import { formaterDate, formaterHeure, formaterPlage, nombreNuits, pluriel } from "@partage/dates"
import { formaterDansDevise } from "@partage/devises"
import { convertir } from "@partage/folio"
import type { ClientPublic, Consommation, Facture, Paiement, Reservation } from "@partage/types"
import { BoutonReception } from "../composants/ActionsReservation"
import BoutonFacture from "../composants/BoutonFacture"
import Chronologie, { evenementsClient } from "../composants/Chronologie"
import { Carte, EnTete, Vide } from "../composants/commun"
import FicheReservation from "../composants/FicheReservation"
import { FenetresClient, type FenetreClient } from "../composants/GestionClient"
import TableReservations from "../composants/TableReservations"
import TicketsRestaurant from "../composants/TicketsRestaurant"
import { useApparitionStyles, useCadreTableStyles } from "../composants/useCommunStyles.styles"
import { numeroRecu } from "../documents"
import { nomChambre, nomDe, soldeDe, useDonneesChargees, useLectureSeule } from "../donnees"
import { useFichiers } from "../fichiers"
import { MODES_PAIEMENT } from "../libelles"
import { useFicheClientStyles } from "./useClientsStyles.styles"
import { usePrix } from "../montants"

type Onglet = "sejours" | "restaurant" | "encaissements" | "factures" | "historique"

// Fiche d'un client : coordonnées et chiffres (hébergement, restaurant et bar, encaissé, reste), séjour du moment,
// puis en onglets ses séjours, ses tickets du restaurant et du bar article par article, ses encaissements, ses
// factures et tout son historique ; à côté, la note interne et ses habitudes. Coordonnées modifiables par toute
// l'équipe ; fusion de deux fiches et effacement (RGPD) réservés aux gérants
export default function FicheClient({ id }: { id: string }) {
  const lectureSeule = useLectureSeule()
  const formaterPrix = usePrix()
  const styles = useFicheClientStyles()
  const apparition = useApparitionStyles()
  const { d, gerant, naviguer, ouvrirNouvelleReservation } = useDonneesChargees()
  const [fenetre, setFenetre] = useState<FenetreClient | null>(null)
  const [onglet, setOnglet] = useState<Onglet>("sejours")
  const client = d.clients.find((c) => c.id === id)

  const filAriane = (
    <Breadcrumb aria-label="Fil d'Ariane">
      <BreadcrumbItem>
        <BreadcrumbButton onClick={() => naviguer({ page: "clients" })}>Clients</BreadcrumbButton>
      </BreadcrumbItem>
      <BreadcrumbDivider />
      <BreadcrumbItem>
        <BreadcrumbButton current>{client ? nomDe(client) : "Client introuvable"}</BreadcrumbButton>
      </BreadcrumbItem>
    </Breadcrumb>
  )
  if (!client) {
    return (
      <>
        {filAriane}
        <Vide Icone={PeopleRegular} titre="Client introuvable" texte="Ce compte n'existe plus." />
      </>
    )
  }

  const sejours = d.reservations.filter((r) => r.clientId === client.id)
  const ids = new Set(sejours.map((r) => r.id))
  const aVenir = sejours.filter((r) => (r.statut === "option" || r.statut === "confirmee") && r.depart > d.aujourdhui).sort((a, b) => a.arrivee.localeCompare(b.arrivee))
  const autres = sejours.filter((r) => !aVenir.includes(r)).sort((a, b) => b.arrivee.localeCompare(a.arrivee))
  const confirmes = sejours.filter((r) => r.statut === "confirmee")
  const passes = confirmes.filter((r) => r.depart <= d.aujourdhui).sort((a, b) => b.depart.localeCompare(a.depart))
  const tickets = d.consommations.filter((c) => ids.has(c.reservationId))
  const paiements = d.paiements.filter((p) => ids.has(p.reservationId)).sort((a, b) => b.le.localeCompare(a.le))
  const factures = d.factures.filter((f) => f.clientId === client.id || f.reservationIds.some((x) => ids.has(x)))
  // Anciennes factures (avant les factures figées) : numéro gardé sur la réservation
  const anciennes = sejours.filter((r) => r.factureNumero && !factures.some((f) => f.reservationIds.includes(r.id)))
  // Reste dû : hébergement des séjours confirmés et restaurant de tous (une demande en option ne doit encore rien)
  const soldes = sejours.filter((r) => r.statut !== "option").map((r) => soldeDe(r, d))
  const resteDu = soldes.reduce((t, s) => t + Math.max(0, s), 0)
  const tropPercu = soldes.reduce((t, s) => t + Math.max(0, -s), 0)
  const restaurant = tickets.reduce((t, c) => t + c.total, 0)
  const encaisse = paiements.reduce((t, p) => t + p.montant, 0)
  // Séjour du moment : arrivé et pas encore parti, ou attendu aujourd'hui
  const enCours = confirmes.find((r) => !r.departLe && r.arrivee <= d.aujourdhui && r.depart >= d.aujourdhui && (r.arriveeLe || r.depart > d.aujourdhui))

  const chiffres: { libelle: string; valeur: string; detail: string; ton?: "alerte" | "ok" }[] = [
    {
      libelle: "Séjours",
      valeur: String(sejours.length),
      detail: [aVenir.length && `${aVenir.length} à venir`, passes.length && `${passes.length} passé${passes.length > 1 ? "s" : ""}`].filter(Boolean).join(", ") || "Aucun",
    },
    { libelle: "Nuits confirmées", valeur: String(confirmes.reduce((t, r) => t + nombreNuits(r.arrivee, r.depart), 0)), detail: pluriel(confirmes.length, "séjour confirmé", "séjours confirmés") },
    { libelle: "Hébergement", valeur: formaterPrix(confirmes.reduce((t, r) => t + r.montantTotal, 0)), detail: "Séjours confirmés" },
    { libelle: "Restaurant et bar", valeur: formaterPrix(convertir(restaurant, "MGA", "EUR", d.devises.taux)), detail: tickets.length ? `${pluriel(tickets.length, "ticket")} sur la chambre` : "Aucun ticket" },
    { libelle: "Encaissé", valeur: formaterPrix(encaisse), detail: pluriel(paiements.length, "règlement") },
    tropPercu > 0 && resteDu === 0
      ? { libelle: "Trop-perçu", valeur: formaterPrix(tropPercu), detail: "À rembourser", ton: "alerte" }
      : resteDu > 0
        ? { libelle: "Reste à payer", valeur: formaterPrix(resteDu), detail: "Hébergement et restaurant", ton: "alerte" }
        : { libelle: "Reste à payer", valeur: formaterPrix(0), detail: sejours.length ? "Tout est réglé" : "Rien à régler", ton: sejours.length ? "ok" : undefined },
  ]

  const onglets: { valeur: Onglet; libelle: string; nombre: number }[] = [
    { valeur: "sejours", libelle: "Séjours", nombre: sejours.length },
    { valeur: "restaurant", libelle: "Restaurant et bar", nombre: tickets.length },
    { valeur: "encaissements", libelle: "Encaissements", nombre: paiements.length },
    { valeur: "factures", libelle: "Factures", nombre: factures.length + anciennes.length },
    { valeur: "historique", libelle: "Historique", nombre: 0 },
  ]
  const articlesVendus = tickets.reduce((t, c) => t + c.lignes.reduce((n, l) => n + l.quantite, 0), 0)
  const nonFactures = tickets.filter((c) => !c.factureId).reduce((t, c) => t + c.total, 0)

  return (
    <>
      {filAriane}
      <EnTete
        titre={
          <span className={styles.titre}>
            <Avatar name={nomDe(client)} color="colorful" size={56} />
            <span className={styles.nomEtBadges}>
              {nomDe(client)}
              <span className={styles.badges}>
                {enCours?.arriveeLe && (
                  <Badge appearance="filled" color="success" shape="rounded" icon={<BedRegular />}>
                    En séjour · {d.chambres.find((c) => c.id === enCours.chambreId)?.numero}
                  </Badge>
                )}
                {passes.length >= 2 && (
                  <Badge appearance="tint" color="brand" shape="rounded" icon={<StarRegular />}>
                    Client fidèle · {passes.length} séjours
                  </Badge>
                )}
                <Badge appearance="tint" color="informative" shape="rounded">
                  {client.origine === "reception" ? "Client de la réception" : "Compte du site"}
                </Badge>
              </span>
            </span>
          </span>
        }
        description={
          client.effaceLe
            ? `Données effacées à la demande du client le ${formaterHeure(client.effaceLe)} : seuls ses séjours restent, pour la comptabilité.`
            : [`Client depuis le ${formaterHeure(client.creeLe)}`, passes[0] && `dernier départ le ${formaterDate(passes[0].depart, { weekday: undefined })}`].filter(Boolean).join(" · ")
        }
        actions={
          !client.effaceLe && (
            <>
              {client.telephone && (
                <Button icon={<CallRegular />} onClick={() => window.avocatier.ouvrirLien(`tel:${client.telephone.replace(/\s/g, "")}`)}>
                  Appeler
                </Button>
              )}
              {client.email && (
                <Button icon={<MailRegular />} onClick={() => window.avocatier.ouvrirLien(`mailto:${client.email}`)}>
                  Écrire
                </Button>
              )}
              <Button icon={<EditRegular />} disabled={lectureSeule} onClick={() => setFenetre("coordonnees")}>
                Modifier
              </Button>
              {gerant && (
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <Tooltip content="Autres actions" relationship="label">
                      <Button icon={<MoreHorizontalRegular />} disabled={lectureSeule} />
                    </Tooltip>
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      <MenuItem icon={<PeopleSwapRegular />} onClick={() => setFenetre("fusion")}>
                        Fusionner avec une autre fiche…
                      </MenuItem>
                      <MenuItem icon={<PersonDeleteRegular />} onClick={() => setFenetre("effacement")}>
                        Effacer les données du client…
                      </MenuItem>
                    </MenuList>
                  </MenuPopover>
                </Menu>
              )}
              <Button appearance="primary" icon={<CalendarAddRegular />} disabled={lectureSeule} onClick={() => ouvrirNouvelleReservation({ clientId: client.id })}>
                Nouvelle réservation
              </Button>
            </>
          )
        }
      />
      <FenetresClient key={client.id} client={client} ouverte={fenetre} onFermer={() => setFenetre(null)} />

      <Carte>
        <div className={styles.resume}>
          <div className={styles.contacts}>
            <Body1 className={styles.contact}>
              <MailRegular /> {client.email || "E-mail non renseigné"}
            </Body1>
            <Body1 className={styles.contact}>
              <CallRegular /> {client.telephone || "Téléphone non renseigné"}
            </Body1>
            <Body1 className={styles.contact}>
              <EarthRegular /> {client.pays || "Pays non renseigné"}
            </Body1>
          </div>
          <dl className={styles.chiffres}>
            {chiffres.map((c) => (
              <div key={c.libelle} className={styles.chiffre}>
                <dt>
                  <Caption1 className={styles.libelle}>{c.libelle}</Caption1>
                </dt>
                <dd className={mergeClasses(styles.valeur, c.ton === "alerte" && styles.reste, c.ton === "ok" && styles.solde)}>{c.valeur}</dd>
                <dd className={styles.dd}>
                  <Caption1 className={styles.libelle}>{c.detail}</Caption1>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Carte>

      {enCours && <SejourEnCours reservation={enCours} />}

      <div className={styles.grille}>
        <div className={styles.principal}>
          <TabList selectedValue={onglet} onTabSelect={(_e, data) => setOnglet(data.value as Onglet)}>
            {onglets.map((o) => (
              <Tab key={o.valeur} value={o.valeur}>
                <span className={styles.onglet}>
                  {o.libelle}
                  {o.nombre > 0 && <CounterBadge count={o.nombre} overflowCount={999} appearance="ghost" color="informative" size="small" />}
                </span>
              </Tab>
            ))}
          </TabList>

          <div key={onglet} className={mergeClasses(styles.section, apparition.root)}>
            {onglet === "sejours" && (
              <>
                <Subtitle2 as="h2" className={styles.titreSection}>
                  À venir
                </Subtitle2>
                <TableReservations
                  reservations={aVenir}
                  avecClient={false}
                  vide={{
                    titre: "Aucun séjour à venir",
                    texte: "Ce client n'a pas de demande ni de réservation en cours.",
                    action: (
                      <Button icon={<CalendarAddRegular />} disabled={lectureSeule} onClick={() => ouvrirNouvelleReservation({ clientId: client.id })}>
                        Créer une réservation
                      </Button>
                    ),
                  }}
                />
                <Subtitle2 as="h2" className={styles.titreSection}>
                  Séjours passés, annulés ou refusés
                </Subtitle2>
                <TableReservations reservations={autres} avecClient={false} vide={{ titre: "Aucun séjour passé", texte: "Les séjours terminés, annulés ou refusés apparaîtront ici." }} />
              </>
            )}

            {onglet === "restaurant" &&
              (tickets.length ? (
                <>
                  <Body1 className={styles.libelle}>
                    {pluriel(tickets.length, "ticket")} mis sur la chambre, {pluriel(articlesVendus, "article")} : <Text weight="semibold">{formaterDansDevise(restaurant, "MGA")}</Text>
                    {nonFactures > 0 && `, dont ${formaterDansDevise(nonFactures, "MGA")} pas encore facturés`}
                  </Body1>
                  <TicketsRestaurant consommations={tickets} avecSejour />
                </>
              ) : (
                <Vide Icone={FoodRegular} titre="Aucun ticket" texte="Les consommations du restaurant et du bar mises sur la chambre de ce client apparaîtront ici, article par article." />
              ))}

            {onglet === "encaissements" && <EncaissementsClient paiements={paiements} />}

            {onglet === "factures" && <FacturesClient factures={factures} anciennes={anciennes} />}

            {onglet === "historique" && (
              <Carte>
                <Chronologie evenements={evenementsClient(client, sejours, d, formaterPrix)} recentEnHaut />
              </Carte>
            )}
          </div>
        </div>

        <aside className={styles.cote}>
          {!client.effaceLe && <NoteInterne key={`${client.id}-${client.note}`} client={client} />}
          <Habitudes sejours={confirmes} tickets={tickets} paiements={paiements} />
        </aside>
      </div>
    </>
  )
}

// Séjour du moment mis en avant : chambre, nuit en cours, reste à payer, et de quoi enregistrer l'arrivée ou le
// départ sans chercher la réservation
function SejourEnCours({ reservation: r }: { reservation: Reservation }) {
  const styles = useFicheClientStyles()
  const formaterPrix = usePrix()
  const { d } = useDonneesChargees()
  const nuits = nombreNuits(r.arrivee, r.depart)
  const nuit = Math.min(nuits, nombreNuits(r.arrivee, d.aujourdhui) + 1)
  const solde = soldeDe(r, d)
  const titre = !r.arriveeLe
    ? r.arrivee === d.aujourdhui
      ? "Arrive aujourd'hui"
      : "Arrivée pas encore enregistrée"
    : r.depart === d.aujourdhui
      ? "Part aujourd'hui"
      : `En séjour · nuit ${nuit} sur ${nuits}`
  return (
    <section className={styles.enCours} aria-label="Séjour du moment">
      <span className={styles.enCoursIcone} aria-hidden>
        <BedRegular />
      </span>
      <div className={styles.texteLigne}>
        <Text weight="semibold" size={400}>
          {titre}
        </Text>
        <Caption1 className={styles.libelle}>
          {nomChambre(d, r.chambreId)} · {formaterPlage(r.arrivee, r.depart)} · {r.reference}
        </Caption1>
      </div>
      <div className={styles.enCoursSolde}>
        <Caption1 className={styles.libelle}>{solde > 0 ? "Reste à payer" : solde < 0 ? "Trop-perçu" : "Soldé"}</Caption1>
        <Text weight="semibold" size={400} className={solde > 0 ? styles.reste : styles.solde}>
          {formaterPrix(Math.abs(solde))}
        </Text>
      </div>
      <div className={styles.enCoursActions}>
        <BoutonReception reservation={r} aujourdhui={d.aujourdhui} />
        <FicheReservation reservation={r} declencheur={<Button icon={<OpenRegular />}>Ouvrir le séjour</Button>} />
      </div>
    </section>
  )
}

// Tous les règlements du client, toutes réservations confondues, avec le reçu à réimprimer
function EncaissementsClient({ paiements }: { paiements: Paiement[] }) {
  const styles = useFicheClientStyles()
  const cadre = useCadreTableStyles()
  const formaterPrix = usePrix()
  const { d } = useDonneesChargees()
  const { imprimerRecu } = useFichiers()
  const [enCours, setEnCours] = useState<string | null>(null)
  const membre = (id?: string) => (id === d.hote.id ? d.hote.prenom : d.equipe.find((m) => m.id === id)?.prenom)
  if (!paiements.length) return <Vide Icone={MoneyRegular} titre="Aucun encaissement" texte="Les acomptes, règlements et remboursements de ce client apparaîtront ici." />
  return (
    <div className={cadre.root}>
      <Table aria-label="Encaissements du client">
        <TableHeader className={cadre.entete}>
          <TableRow>
            <TableHeaderCell className={cadre.premiere}>Date</TableHeaderCell>
            <TableHeaderCell>Règlement</TableHeaderCell>
            <TableHeaderCell>Séjour</TableHeaderCell>
            <TableHeaderCell style={{ width: "160px" }}>
              <span className={cadre.droite}>Montant</span>
            </TableHeaderCell>
            <TableHeaderCell className={cadre.derniere} style={{ width: "56px" }} aria-label="Reçu" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {paiements.map((p) => {
            const r = d.reservations.find((x) => x.id === p.reservationId)
            return (
              <TableRow key={p.id}>
                <TableCell className={cadre.premiere}>
                  <TableCellLayout description={`Reçu ${numeroRecu(p)}${membre(p.enregistrePar) ? `, par ${membre(p.enregistrePar)}` : ""}`}>{formaterHeure(p.le)}</TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout description={p.note || undefined}>
                    {p.montant < 0 ? "Remboursement · " : ""}
                    {MODES_PAIEMENT[p.mode]}
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout truncate description={r && nomChambre(d, r.chambreId)}>
                    {r ? `${r.reference} · ${formaterPlage(r.arrivee, r.depart)}` : "—"}
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <span className={styles.montantColonne}>
                    <Text weight="semibold" className={cadre.nombre}>
                      {formaterPrix(p.montant)}
                    </Text>
                    {p.devise !== "EUR" && p.montantDevise !== undefined && <Caption1 className={styles.libelle}>reçu {formaterDansDevise(p.montantDevise, p.devise)}</Caption1>}
                  </span>
                </TableCell>
                <TableCell className={cadre.derniere}>
                  <Tooltip content="Reçu (PDF)" relationship="label">
                    <Button
                      appearance="subtle"
                      size="small"
                      disabled={enCours === p.id}
                      icon={enCours === p.id ? <Spinner size="tiny" /> : <ReceiptRegular />}
                      onClick={async () => {
                        setEnCours(p.id)
                        await imprimerRecu(p)
                        setEnCours(null)
                      }}
                    />
                  </Tooltip>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

// Factures du client (figées, et anciennes factures gardées sur la réservation), réimprimables à l'identique
function FacturesClient({ factures, anciennes }: { factures: Facture[]; anciennes: Reservation[] }) {
  const styles = useFicheClientStyles()
  const { d } = useDonneesChargees()
  const sejour = (id: string) => d.reservations.find((r) => r.id === id)
  const lignes = [
    ...factures.map((f) => ({
      id: f.id,
      le: f.le,
      numero: f.numero,
      total: formaterDansDevise(f.total, f.devise),
      sejours: f.reservationIds.map(sejour).filter((r): r is Reservation => !!r),
    })),
    ...anciennes.map((r) => ({ id: r.id, le: r.factureLe ?? r.creeLe, numero: r.factureNumero ?? "", total: "", sejours: [r] })),
  ].sort((a, b) => b.le.localeCompare(a.le))
  if (!lignes.length) return <Vide Icone={DocumentPdfRegular} titre="Aucune facture" texte="Les factures éditées au départ (séjour, restaurant et bar, règlements) apparaîtront ici." />
  return (
    <ul className={styles.factures}>
      {lignes.map((f) => (
        <li key={f.id} className={styles.facture}>
          <span className={mergeClasses(styles.enCoursIcone, styles.iconeNeutre)} aria-hidden>
            <DocumentPdfRegular />
          </span>
          <div className={styles.texteLigne}>
            <Text weight="semibold">{f.numero}</Text>
            <Caption1 className={styles.libelle}>
              Éditée le {formaterHeure(f.le)} · {f.sejours.map((r) => `${r.reference} (${d.chambres.find((c) => c.id === r.chambreId)?.numero ?? "?"})`).join(", ")}
            </Caption1>
          </div>
          {f.total && <Text weight="semibold">{f.total}</Text>}
          {f.sejours[0] && <BoutonFacture reservation={f.sejours[0]} appearance="subtle" />}
        </li>
      ))}
    </ul>
  )
}

// Valeur la plus fréquente d'une liste
function plusFrequent<T>(valeurs: T[]): T | undefined {
  const comptes = new Map<T, number>()
  for (const v of valeurs) comptes.set(v, (comptes.get(v) ?? 0) + 1)
  return [...comptes].sort((a, b) => b[1] - a[1])[0]?.[0]
}

// Ce que le client choisit d'habitude, pour l'accueillir sans lui reposer les questions
function Habitudes({ sejours, tickets, paiements }: { sejours: Reservation[]; tickets: Consommation[]; paiements: Paiement[] }) {
  const styles = useFicheClientStyles()
  const { d } = useDonneesChargees()
  const categorie = plusFrequent(sejours.map((r) => r.hebergementId))
  const voyageurs = plusFrequent(sejours.map((r) => `${pluriel(r.adultes, "adulte")}${r.enfants ? `, ${pluriel(r.enfants, "enfant")}` : ""}`))
  const mode = plusFrequent(paiements.filter((p) => p.montant > 0).map((p) => p.mode))
  const navettes = sejours.filter((r) => r.navette).length
  const favoris = [...tickets.flatMap((c) => c.lignes).reduce((m, l) => m.set(l.libelle, (m.get(l.libelle) ?? 0) + l.quantite), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const faits = [
    { libelle: "Hébergement préféré", valeur: categorie && d.hebergements.find((h) => h.id === categorie)?.nom },
    { libelle: "Vient d'habitude à", valeur: voyageurs },
    { libelle: "Navette aéroport", valeur: navettes ? `Demandée ${navettes} fois sur ${sejours.length}` : undefined },
    { libelle: "Règle d'habitude par", valeur: mode && MODES_PAIEMENT[mode] },
  ].filter((f): f is { libelle: string; valeur: string } => !!f.valeur)
  if (!faits.length && !favoris.length) return null
  return (
    <Carte titre="En bref" description="Tiré de ses séjours confirmés, de ses tickets et de ses règlements">
      <dl className={styles.habitudes}>
        {faits.map((f) => (
          <div key={f.libelle} className={styles.habitude}>
            <dt>
              <Caption1 className={styles.libelle}>{f.libelle}</Caption1>
            </dt>
            <dd className={styles.dd}>
              <Body1>{f.valeur}</Body1>
            </dd>
          </div>
        ))}
        {favoris.length > 0 && (
          <div className={styles.habitude}>
            <dt>
              <Caption1 className={styles.libelle}>Restaurant et bar : ses favoris</Caption1>
            </dt>
            <dd className={styles.dd}>
              <ol className={styles.favoris}>
                {favoris.map(([libelle, quantite]) => (
                  <li key={libelle} className={styles.favori}>
                    <Body1>{libelle}</Body1>
                    <Caption1 className={styles.libelle}>× {quantite}</Caption1>
                  </li>
                ))}
              </ol>
            </dd>
          </div>
        )}
      </dl>
    </Carte>
  )
}

// Note de l'équipe sur le client (préférences, allergies, pièce d'identité vue…), jamais montrée au client
function NoteInterne({ client }: { client: ClientPublic }) {
  const lectureSeule = useLectureSeule()
  const styles = useFicheClientStyles()
  const { executer } = useDonneesChargees()
  const [note, setNote] = useState(client.note)
  const [enCours, setEnCours] = useState(false)
  const [etat, setEtat] = useState<{ erreur?: string; ok?: boolean }>({})

  async function enregistrer() {
    setEnCours(true)
    const resultat = await executer("PATCH", `/api/hotes/clients/${encodeURIComponent(client.id)}`, { note })
    setEnCours(false)
    setEtat(resultat.ok ? { ok: true } : { erreur: resultat.erreur })
  }

  return (
    <Carte titre="Note interne" description="Visible seulement par l'équipe : préférences, allergies, pièce d'identité vue…">
      <div className={styles.note}>
        <Textarea
          value={note}
          onChange={(_e, data) => {
            setNote(data.value)
            setEtat({})
          }}
          resize="vertical"
          rows={4}
          maxLength={1000}
          aria-label="Note interne"
        />
        <div className={styles.actionsNote}>
          <Button disabled={enCours || lectureSeule || note === client.note} icon={enCours ? <Spinner size="tiny" /> : <SaveRegular />} onClick={enregistrer}>
            Enregistrer la note
          </Button>
          {etat.ok && <Caption1>Note enregistrée.</Caption1>}
        </div>
        {etat.erreur && (
          <MessageBar intent="error">
            <MessageBarBody>{etat.erreur}</MessageBarBody>
          </MessageBar>
        )}
      </div>
    </Carte>
  )
}
