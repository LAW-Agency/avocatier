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
  Divider,
  MessageBar,
  MessageBarBody,
  Spinner,
  Subtitle2,
  Textarea,
  mergeClasses,
} from "@fluentui/react-components"
import { CalendarAddRegular, CallRegular, EarthRegular, MailRegular, PeopleRegular, SaveRegular } from "@fluentui/react-icons"
import { useState } from "react"
import { formaterHeure, formaterPrix, nombreNuits } from "@partage/dates"
import type { ClientPublic } from "@partage/types"
import { Carte, EnTete, Vide } from "../composants/commun"
import TableReservations from "../composants/TableReservations"
import { nomDe, soldeDe, useDonneesChargees } from "../donnees"
import { useFicheClientStyles } from "./useClientsStyles.styles"

// Fiche d'un client : coordonnées, chiffres et note interne, puis ses séjours à venir et passés
export default function FicheClient({ id }: { id: string }) {
  const styles = useFicheClientStyles()
  const { d, naviguer, ouvrirNouvelleReservation } = useDonneesChargees()
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
  const aVenir = sejours.filter((r) => (r.statut === "option" || r.statut === "confirmee") && r.depart > d.aujourdhui).sort((a, b) => a.arrivee.localeCompare(b.arrivee))
  const autres = sejours.filter((r) => !aVenir.includes(r)).sort((a, b) => b.arrivee.localeCompare(a.arrivee))
  const confirmes = sejours.filter((r) => r.statut === "confirmee")
  const resteDu = confirmes.reduce((t, r) => t + Math.max(0, soldeDe(r, d.paiements)), 0)
  const chiffres = [
    { libelle: "Réservations", valeur: String(sejours.length) },
    { libelle: "Nuits confirmées", valeur: String(confirmes.reduce((t, r) => t + nombreNuits(r.arrivee, r.depart), 0)) },
    { libelle: "Montant confirmé", valeur: formaterPrix(confirmes.reduce((t, r) => t + r.montantTotal, 0)) },
    { libelle: "Reste à payer", valeur: formaterPrix(resteDu), alerte: resteDu > 0 },
  ]

  return (
    <>
      {filAriane}
      <EnTete
        titre={
          <span className={styles.titre}>
            <Avatar name={nomDe(client)} color="colorful" size={56} />
            {nomDe(client)}
            {client.origine === "reception" && (
              <Badge appearance="tint" color="informative" shape="rounded">
                Client de la réception
              </Badge>
            )}
          </span>
        }
        description={`Fiche créée le ${formaterHeure(client.creeLe)}${client.origine === "site" ? " (compte du site)" : ""}`}
        actions={
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
            <Button appearance="primary" icon={<CalendarAddRegular />} onClick={() => ouvrirNouvelleReservation({ clientId: client.id })}>
              Nouvelle réservation
            </Button>
          </>
        }
      />

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
          <Divider vertical style={{ height: "100%" }} />
          <dl className={styles.chiffres}>
            {chiffres.map((c) => (
              <div key={c.libelle} className={styles.chiffre}>
                <dt>
                  <Caption1 className={styles.libelle}>{c.libelle}</Caption1>
                </dt>
                <dd className={mergeClasses(styles.valeur, c.alerte && styles.reste)}>{c.valeur}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Carte>

      <NoteInterne key={client.id} client={client} />

      <section className={styles.section}>
        <Subtitle2 as="h2" className={styles.titreSection}>
          Séjours à venir
        </Subtitle2>
        <TableReservations
          reservations={aVenir}
          avecClient={false}
          vide={{
            titre: "Aucun séjour à venir",
            texte: "Ce client n'a pas de demande ni de réservation en cours.",
            action: (
              <Button icon={<CalendarAddRegular />} onClick={() => ouvrirNouvelleReservation({ clientId: client.id })}>
                Créer une réservation
              </Button>
            ),
          }}
        />
      </section>

      <section className={styles.section}>
        <Subtitle2 as="h2" className={styles.titreSection}>
          Historique
        </Subtitle2>
        <TableReservations reservations={autres} avecClient={false} vide={{ titre: "Aucun séjour passé", texte: "Les séjours terminés, annulés ou refusés apparaîtront ici." }} />
      </section>
    </>
  )
}

// Note de l'équipe sur le client (préférences, allergies, pièce d'identité vue…), jamais montrée au client
function NoteInterne({ client }: { client: ClientPublic }) {
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
          maxLength={1000}
          aria-label="Note interne"
        />
        <div className={styles.actionsNote}>
          <Button disabled={enCours || note === client.note} icon={enCours ? <Spinner size="tiny" /> : <SaveRegular />} onClick={enregistrer}>
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
