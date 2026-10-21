import { Avatar, Badge, Body1, Button, Caption1, CounterBadge, Link, ProgressBar, Tab, TabList, Text, mergeClasses } from "@fluentui/react-components"
import {
  BedRegular,
  CalendarAddRegular,
  CalendarLtrRegular,
  ChatRegular,
  DoorArrowLeftRegular,
  DoorArrowRightRegular,
  MailInboxCheckmarkRegular,
  MailInboxRegular,
  MoneyRegular,
  VehicleBusRegular,
} from "@fluentui/react-icons"
import { useState } from "react"
import { ajouterJours, formaterDate, formaterPlage, formaterPrix, nombreNuits, pluriel, tempsRestant } from "@partage/dates"
import type { Reservation } from "@partage/types"
import ActionsReservation, { BoutonReception } from "../composants/ActionsReservation"
import { Carte, EnTete, Vide } from "../composants/commun"
import FicheReservation from "../composants/FicheReservation"
import { Indicateur } from "../composants/graphiques"
import { nomDe, soldeDe, useDonneesChargees } from "../donnees"
import { situationDuJour } from "../situation"
import { encaissementsDans, pourcent } from "../statistiques"
import { useAujourdhuiStyles } from "./useAujourdhuiStyles.styles"

type Onglet = "arrivees" | "departs" | "surPlace"

// Tableau du jour : chiffres clés ; à gauche les demandes à traiter, à droite les mouvements du jour (avec
// l'arrivée et le départ à enregistrer) et les arrivées de la semaine
export default function Aujourdhui() {
  const styles = useAujourdhuiStyles()
  const donnees = useDonneesChargees()
  const { d, naviguer, ouvrirNouvelleReservation, gerant } = donnees
  const { arrivees, departs, occupes, total } = situationDuJour(d, d.aujourdhui)
  const [onglet, setOnglet] = useState<Onglet>("arrivees")

  const aTraiter = d.reservations.filter((r) => r.statut === "option").sort((a, b) => (a.expireLe ?? "").localeCompare(b.expireLe ?? ""))
  const confirmees = d.reservations.filter((r) => r.statut === "confirmee")
  const surPlace = confirmees.filter((r) => r.arrivee <= d.aujourdhui && r.depart > d.aujourdhui && !arrivees.includes(r))
  const semaine = confirmees
    .filter((r) => r.arrivee > d.aujourdhui && r.arrivee <= ajouterJours(d.aujourdhui, 7))
    .sort((a, b) => a.arrivee.localeCompare(b.arrivee))
  const aNettoyer = d.hebergements.filter((h) => h.etat === "a_nettoyer").length
  const encaisse = encaissementsDans(d.paiements, { debut: d.aujourdhui, fin: ajouterJours(d.aujourdhui, 1) }).reduce((t, p) => t + p.montant, 0)
  const arriveesAttendues = arrivees.filter((r) => !r.arriveeLe).length
  const departsAttendus = departs.filter((r) => !r.departLe).length
  const listes: Record<Onglet, Reservation[]> = { arrivees, departs, surPlace }
  const vides: Record<Onglet, string> = { arrivees: "Aucune arrivée aujourd'hui.", departs: "Aucun départ aujourd'hui.", surPlace: "Aucun client sur place." }

  return (
    <>
      <EnTete
        titre={`Bonjour ${d.hote.prenom}`}
        description={`${formaterDate(d.aujourdhui, { weekday: "long", month: "long" })} · ${
          aTraiter.length > 0 ? `${pluriel(aTraiter.length, "demande attend", "demandes attendent")} votre réponse` : "aucune demande en attente"
        }`}
        actions={
          <>
            <Button icon={<CalendarLtrRegular />} onClick={() => naviguer({ page: "planning" })}>
              Planning
            </Button>
            <Button appearance="primary" icon={<CalendarAddRegular />} onClick={() => ouvrirNouvelleReservation()}>
              Nouvelle réservation
            </Button>
          </>
        }
      />

      <div className={styles.chiffres}>
        <Indicateur Icone={MailInboxRegular} libelle="À traiter" valeur={aTraiter.length} note="Demandes en attente de réponse" />
        <Indicateur
          Icone={DoorArrowRightRegular}
          libelle="Arrivées"
          valeur={arrivees.length}
          note={arriveesAttendues ? `${pluriel(arriveesAttendues, "client attendu", "clients attendus")}` : arrivees.length ? "Tous arrivés" : semaine.length ? `${pluriel(semaine.length, "autre", "autres")} sous 7 jours` : "Aucune autre sous 7 jours"}
        />
        <Indicateur
          Icone={DoorArrowLeftRegular}
          libelle="Départs"
          valeur={departs.length}
          note={departsAttendus ? `${pluriel(departsAttendus, "départ", "départs")} à enregistrer` : `${pluriel(surPlace.length, "séjour en cours", "séjours en cours")}`}
        />
        <Indicateur
          Icone={BedRegular}
          libelle="Taux d'occupation ce soir"
          valeur={pourcent(total ? occupes / total : 0)}
          note={`${occupes} / ${pluriel(total, "hébergement")}${aNettoyer ? ` · ${pluriel(aNettoyer, "chambre")} à nettoyer` : " · chambres prêtes"}`}
        >
          <ProgressBar value={total ? occupes / total : 0} thickness="large" aria-label="Taux d'occupation" />
        </Indicateur>
      </div>

      <div className={styles.grille}>
        <Carte
          titre="Demandes à traiter"
          description="Les dates sont bloquées 48 h : confirmez ou refusez avant l'échéance."
          action={
            <Button appearance="subtle" onClick={() => naviguer({ page: "reservations", filtre: "option" })}>
              Toutes les demandes
            </Button>
          }
        >
          {aTraiter.length === 0 ? (
            <Vide Icone={MailInboxCheckmarkRegular} titre="Rien à traiter" texte="Les nouvelles demandes envoyées depuis le site apparaîtront ici." />
          ) : (
            <ul className={styles.liste}>
              {aTraiter.map((r) => (
                <Demande key={r.id} reservation={r} donnees={donnees} />
              ))}
            </ul>
          )}
        </Carte>

        <div className={styles.colonne}>
          <Carte titre="Aujourd'hui" action={gerant ? <Badge appearance="tint" color="success" icon={<MoneyRegular />}>{`${formaterPrix(encaisse)} encaissés`}</Badge> : undefined}>
            <TabList selectedValue={onglet} onTabSelect={(_e, data) => setOnglet(data.value as Onglet)} size="small">
              <Tab value="arrivees">
                Arrivées <CounterBadge count={arrivees.length} showZero appearance="ghost" color="informative" size="small" />
              </Tab>
              <Tab value="departs">
                Départs <CounterBadge count={departs.length} showZero appearance="ghost" color="informative" size="small" />
              </Tab>
              <Tab value="surPlace">
                Sur place <CounterBadge count={surPlace.length} showZero appearance="ghost" color="informative" size="small" />
              </Tab>
            </TabList>
            <Sejours reservations={listes[onglet]} vide={vides[onglet]} donnees={donnees} reception />
          </Carte>

          <Carte titre="Cette semaine" description="Arrivées des 7 prochains jours" action={<Badge appearance="outline">{semaine.length}</Badge>}>
            <Sejours reservations={semaine} vide="Aucune arrivée prévue cette semaine." donnees={donnees} avecDate />
          </Carte>
        </div>
      </div>
    </>
  )
}

type Donnees = ReturnType<typeof useDonneesChargees>

// Demande en option : l'essentiel pour décider sans ouvrir la fiche, et les actions
function Demande({ reservation: r, donnees }: { reservation: Reservation; donnees: Donnees }) {
  const styles = useAujourdhuiStyles()
  const client = donnees.clientDe(r)
  const restant = r.expireLe ? tempsRestant(r.expireLe) : null

  return (
    <li className={styles.demande}>
      <div className={styles.ligne}>
        <Avatar name={nomDe(client)} color="colorful" />
        <div className={styles.infos}>
          <div className={styles.nom}>
            {client ? (
              <Link onClick={() => donnees.naviguer({ page: "client", id: client.id })}>
                <Text weight="semibold">{nomDe(client)}</Text>
              </Link>
            ) : (
              <Text weight="semibold">{nomDe(client)}</Text>
            )}
            <Badge appearance="tint" color={restant ? "warning" : "danger"} shape="rounded" size="small">
              {restant ? `Expire dans ${restant}` : "Option échue"}
            </Badge>
          </div>
          <Body1>
            {formaterPlage(r.arrivee, r.depart)}, {donnees.hebergementDe(r)?.nom}
          </Body1>
          <Caption1 className={styles.secondaire}>
            {pluriel(nombreNuits(r.arrivee, r.depart), "nuit")}, {pluriel(r.adultes + r.enfants, "voyageur")}
            {client?.pays && `, ${client.pays}`}
          </Caption1>
        </div>
        <Text className={styles.prix}>{formaterPrix(r.montantTotal)}</Text>
      </div>
      {(r.message || r.navette) && (
        <div className={styles.extrait}>
          {r.navette && (
            <span className={styles.extraitLigne}>
              <VehicleBusRegular /> Navette aéroport demandée
            </span>
          )}
          {r.message && (
            <span className={styles.extraitLigne}>
              <ChatRegular />
              <span className={styles.message}>« {r.message} »</span>
            </span>
          )}
        </div>
      )}
      <div className={styles.piedDemande}>
        <ActionsReservation reservationId={r.id} statut={r.statut} reference={r.reference} taille="small" />
        <FicheReservation
          reservation={r}
          declencheur={
            <Button appearance="subtle" size="small">
              Détails
            </Button>
          }
        />
      </div>
    </li>
  )
}

// Liste courte de séjours : une ligne par client ; à la réception, bouton d'arrivée ou de départ
function Sejours({ reservations, vide, donnees, avecDate = false, reception = false }: { reservations: Reservation[]; vide: string; donnees: Donnees; avecDate?: boolean; reception?: boolean }) {
  const styles = useAujourdhuiStyles()
  if (reservations.length === 0) {
    return (
      <Body1 className={styles.aucun}>
        <CalendarLtrRegular /> {vide}
      </Body1>
    )
  }
  return (
    <ul className={mergeClasses(styles.liste, styles.listeSerree)}>
      {reservations.map((r) => {
        const client = donnees.clientDe(r)
        const solde = soldeDe(r, donnees.d.paiements)
        return (
          <li key={r.id} className={styles.sejour}>
            <Avatar name={nomDe(client)} color="colorful" size={32} />
            <div className={styles.infos}>
              <Text weight="semibold" truncate wrap={false}>
                {nomDe(client)}
              </Text>
              <Caption1 className={styles.secondaire} truncate wrap={false}>
                {avecDate ? `${formaterDate(r.arrivee, { year: undefined })}, ` : ""}
                {donnees.hebergementDe(r)?.nom}, {pluriel(nombreNuits(r.arrivee, r.depart), "nuit")}
                {r.navette && ", navette"}
                {solde > 0 && `, reste ${formaterPrix(solde)}`}
              </Caption1>
            </div>
            {reception && <BoutonReception reservation={r} aujourdhui={donnees.d.aujourdhui} taille="small" />}
            <FicheReservation reservation={r} />
          </li>
        )
      })}
    </ul>
  )
}
