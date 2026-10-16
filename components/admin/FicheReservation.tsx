"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { Mail, Phone, XIcon } from "lucide-react"
import ActionsReservation from "@/components/admin/ActionsReservation"
import { BadgeStatut, SOURCES } from "@/components/admin/statut"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { formaterHeure, formaterPlage, formaterPrix, nombreNuits, pluriel } from "@/lib/reservation/dates"
import { libelleEvenement } from "@/lib/reservation/statuts"
import type { ClientPublic, Reservation } from "@/lib/reservation/types"

interface FicheReservationProps {
  reservation: Reservation
  client?: ClientPublic
  hebergement?: string
  termine: boolean
  restant: string | null // temps restant de l'option, calculé côté serveur
  declencheur?: ReactNode // bouton par défaut : « Détails »
}

// Un seul style de libellé dans toute la fiche (petit, grisé, casse normale)
const libelle = "text-xs text-muted-foreground"

function Fait({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className={libelle}>{titre}</dt>
      <dd>{children}</dd>
    </div>
  )
}

// Fenêtre modale : tout ce qu'il faut pour traiter une demande. À gauche ce qu'on accepte ou refuse (le séjour,
// le message) ; à droite, en panneau, qui joindre et ce qui s'est passé. Une seule colonne sur téléphone.
export default function FicheReservation({ reservation: r, client, hebergement, termine, restant, declencheur }: FicheReservationProps) {
  const nomClient = client ? `${client.prenom} ${client.nom}`.trim() : "Client inconnu"
  const actions = !termine && (r.statut === "option" || r.statut === "confirmee")

  return (
    <Dialog>
      <DialogTrigger asChild>
        {declencheur ?? (
          <Button variant="ghost" size="sm">
            Détails
          </Button>
        )}
      </DialogTrigger>
      {/* En-tête et pied fixes, seul le contenu défile si l'écran est trop bas */}
      <DialogContent showCloseButton={false} className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        {/* Bouton de fermeture calé sur la marge de 20 px (p-5) : icône au bord du contenu, centrée sur la ligne du statut */}
        <DialogClose asChild>
          <Button variant="ghost" size="icon-sm" className="absolute top-4 right-3.5">
            <XIcon />
            <span className="sr-only">Fermer</span>
          </Button>
        </DialogClose>
        <DialogHeader className="gap-2 border-b p-5 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <BadgeStatut reservation={r} termine={termine} />
            {restant && <span className="text-xs font-medium text-destructive">Expire dans {restant}</span>}
          </div>
          <DialogTitle className="text-lg">{formaterPlage(r.arrivee, r.depart)}</DialogTitle>
          <DialogDescription>
            Demande {r.reference}, reçue le {formaterHeure(r.creeLe)} {SOURCES[r.source]}
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 overflow-y-auto text-sm md:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="flex flex-col gap-5 p-5">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Fait titre="Hébergement">{hebergement ?? "Inconnu"}</Fait>
              <Fait titre="Voyageurs">
                {pluriel(r.adultes, "adulte")}
                {r.enfants > 0 && `, ${pluriel(r.enfants, "enfant")}`}
              </Fait>
              <Fait titre="Durée">{pluriel(nombreNuits(r.arrivee, r.depart), "nuit")}</Fait>
              <Fait titre="Montant">
                <span className="font-medium tabular-nums">{formaterPrix(r.montantTotal)}</span>
              </Fait>
              {r.navette && <Fait titre="Navette aéroport">Demandée</Fait>}
            </dl>

            {r.message && (
              <figure className="flex flex-col gap-1">
                <figcaption className={libelle}>Message du client</figcaption>
                <blockquote className="border-l-2 pl-3 text-pretty">{r.message}</blockquote>
              </figure>
            )}
          </div>

          <aside className="flex flex-col gap-5 border-t bg-muted/40 p-5 md:border-t-0 md:border-l">
            <section className="flex flex-col gap-1">
              <h3 className={libelle}>Client</h3>
              {/* div et non p : le style de base des paragraphes de la vitrine imposerait sa taille */}
              <div>
                {client ? (
                  <Link href={`/admin/clients/${client.id}`} className="font-medium underline-offset-4 hover:underline">
                    {nomClient}
                  </Link>
                ) : (
                  <span className="font-medium">{nomClient}</span>
                )}
                {client?.pays && <span className="text-muted-foreground">, {client.pays}</span>}
              </div>
              <div className="flex flex-col gap-1 text-muted-foreground">
                {r.telephone && (
                  <a href={`tel:${r.telephone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                    <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                    {r.telephone}
                  </a>
                )}
                {client?.email && (
                  <a href={`mailto:${client.email}`} className="inline-flex min-w-0 items-center gap-1.5 hover:text-foreground">
                    <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{client.email}</span>
                  </a>
                )}
              </div>
            </section>

            {r.historique.length > 0 && (
              <section className="flex flex-col gap-1">
                <h3 className={libelle}>Historique</h3>
                <ol className="flex flex-col gap-2">
                  {r.historique.map((e) => (
                    <li key={`${e.statut}-${e.le}`} className="flex flex-col">
                      <span>{e.note ?? libelleEvenement[e.statut]}</span>
                      <time dateTime={e.le} className="text-xs text-muted-foreground tabular-nums">
                        {formaterHeure(e.le)}
                      </time>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </aside>
        </div>

        {actions && (
          <DialogFooter className="mx-0 mb-0 px-5">
            <ActionsReservation reservationId={r.id} statut={r.statut} reference={r.reference} alignement="fin" />
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
