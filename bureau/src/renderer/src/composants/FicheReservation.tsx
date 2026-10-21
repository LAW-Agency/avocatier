import {
  Avatar,
  Body1,
  Button,
  Caption1,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Link,
  Subtitle2,
  Text,
} from "@fluentui/react-components"
import { CallRegular, ChatRegular, DismissRegular, MailRegular, VehicleBusRegular } from "@fluentui/react-icons"
import { useState, type ReactElement, type ReactNode } from "react"
import { formaterHeure, formaterPlage, formaterPrix, nombreNuits, pluriel, tempsRestant } from "@partage/dates"
import { libelleEvenement } from "@partage/statuts"
import type { Reservation } from "@partage/types"
import { estTermine, nomDe, useDonneesChargees } from "../donnees"
import { SOURCES } from "../libelles"
import ActionsReservation, { BoutonReception } from "./ActionsReservation"
import { BadgeStatut } from "./commun"
import Encaissements from "./Encaissements"
import { useFicheStyles } from "./useReservationStyles.styles"

function Fait({ titre, children }: { titre: string; children: ReactNode }) {
  const styles = useFicheStyles()
  return (
    <div className={styles.fait}>
      <dt>
        <Caption1 className={styles.libelle}>{titre}</Caption1>
      </dt>
      <dd className={styles.dd}>
        <Body1>{children}</Body1>
      </dd>
    </div>
  )
}

interface FicheReservationProps {
  reservation: Reservation
  declencheur?: ReactElement // bouton par défaut : « Détails »
}

// Fenêtre de détail : à gauche le séjour, le message et les encaissements ; à droite, en panneau, qui joindre,
// l'accueil (arrivée, départ) et ce qui s'est passé ; décision en pied
export default function FicheReservation({ reservation, declencheur }: FicheReservationProps) {
  const styles = useFicheStyles()
  const { d, clientDe, hebergementDe, naviguer } = useDonneesChargees()
  // Données rechargées après une action : la fiche suit la version à jour de la réservation
  const r = d.reservations.find((x) => x.id === reservation.id) ?? reservation
  const [ouverte, setOuverte] = useState(false)
  const client = clientDe(r)
  const termine = estTermine(r, d.aujourdhui)
  const restant = r.statut === "option" && r.expireLe ? tempsRestant(r.expireLe) : null
  const actions = !termine && (r.statut === "option" || r.statut === "confirmee")
  const telephone = r.telephone || client?.telephone

  return (
    <Dialog open={ouverte} onOpenChange={(_e, data) => setOuverte(data.open)}>
      <DialogTrigger disableButtonEnhancement>{declencheur ?? <Button appearance="subtle">Détails</Button>}</DialogTrigger>
      <DialogSurface className={styles.surface}>
        <DialogBody className={styles.corps}>
          <DialogTitle
            className={styles.entete}
            action={
              <DialogTrigger action="close">
                <Button appearance="subtle" aria-label="Fermer" icon={<DismissRegular />} className={styles.fermer} />
              </DialogTrigger>
            }
          >
            <span className={styles.ligneStatut}>
              <BadgeStatut reservation={r} termine={termine} />
              {restant && (
                <Text size={200} weight="semibold" className={styles.expire}>
                  Expire dans {restant}
                </Text>
              )}
            </span>
            <span>{formaterPlage(r.arrivee, r.depart)}</span>
            <Caption1 className={styles.description}>
              Réservation {r.reference}, reçue le {formaterHeure(r.creeLe)} {SOURCES[r.source]}
            </Caption1>
          </DialogTitle>

          <DialogContent className={styles.contenu}>
            <div className={styles.principal}>
              <dl className={styles.faits}>
                <Fait titre="Hébergement">{hebergementDe(r)?.nom ?? "Inconnu"}</Fait>
                <Fait titre="Voyageurs">
                  {pluriel(r.adultes, "adulte")}
                  {r.enfants > 0 && `, ${pluriel(r.enfants, "enfant")}`}
                </Fait>
                <Fait titre="Durée">{pluriel(nombreNuits(r.arrivee, r.depart), "nuit")}</Fait>
                <Fait titre="Montant">
                  <Text weight="semibold">{formaterPrix(r.montantTotal)}</Text>
                </Fait>
              </dl>
              {r.navette && (
                <span className={styles.navette}>
                  <VehicleBusRegular /> Navette aéroport demandée
                </span>
              )}
              {r.message && (
                <div className={styles.section}>
                  <Caption1 className={styles.libelle}>
                    <ChatRegular /> Message du client
                  </Caption1>
                  <blockquote className={styles.citation}>
                    <Body1>{r.message}</Body1>
                  </blockquote>
                </div>
              )}
              {(r.statut === "option" || r.statut === "confirmee" || d.paiements.some((p) => p.reservationId === r.id)) && (
                <div className={styles.section}>
                  <Subtitle2>Encaissements</Subtitle2>
                  <Encaissements reservation={r} />
                </div>
              )}
            </div>

            <aside className={styles.panneau}>
              <div className={styles.section}>
                <Caption1 className={styles.libelle}>Client</Caption1>
                <div className={styles.client}>
                  <Avatar name={nomDe(client)} color="colorful" />
                  <div>
                    {client ? (
                      <Link
                        onClick={() => {
                          setOuverte(false)
                          naviguer({ page: "client", id: client.id })
                        }}
                      >
                        {nomDe(client)}
                      </Link>
                    ) : (
                      <Text weight="semibold">{nomDe(client)}</Text>
                    )}
                    {client?.pays && <Caption1 block>{client.pays}</Caption1>}
                  </div>
                </div>
                <div className={styles.contacts}>
                  {telephone && (
                    <Button appearance="transparent" size="small" icon={<CallRegular />} onClick={() => window.avocatier.ouvrirLien(`tel:${telephone.replace(/\s/g, "")}`)}>
                      {telephone}
                    </Button>
                  )}
                  {client?.email && (
                    <Button appearance="transparent" size="small" icon={<MailRegular />} onClick={() => window.avocatier.ouvrirLien(`mailto:${client.email}`)}>
                      {client.email}
                    </Button>
                  )}
                </div>
              </div>

              {r.statut === "confirmee" && (
                <div className={styles.section}>
                  <Caption1 className={styles.libelle}>Accueil</Caption1>
                  <Body1>{r.arriveeLe ? `Arrivé le ${formaterHeure(r.arriveeLe)}` : "Arrivée pas encore enregistrée"}</Body1>
                  {r.departLe && <Body1>Parti le {formaterHeure(r.departLe)}</Body1>}
                  <div>
                    <BoutonReception reservation={r} aujourdhui={d.aujourdhui} taille="small" />
                  </div>
                </div>
              )}

              {r.historique.length > 0 && (
                <div className={styles.section}>
                  <Caption1 className={styles.libelle}>Historique</Caption1>
                  <ol className={styles.historique}>
                    {r.historique.map((e) => (
                      <li key={`${e.statut}-${e.le}`} className={styles.evenement}>
                        <Body1>{e.note ?? libelleEvenement[e.statut]}</Body1>
                        <Caption1 className={styles.libelle}>{formaterHeure(e.le)}</Caption1>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </aside>
          </DialogContent>

          {actions && (
            <DialogActions fluid className={styles.pied}>
              <ActionsReservation reservationId={r.id} statut={r.statut} reference={r.reference} alignement="fin" />
            </DialogActions>
          )}
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
