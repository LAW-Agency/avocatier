"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { BedDouble, Bus, CalendarDays, Clock, Mail, MessageSquare, Phone, Users, type LucideIcon } from "lucide-react"
import ActionsReservation from "@/components/admin/ActionsReservation"
import { BadgeStatut, SOURCES } from "@/components/admin/statut"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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

function Ligne({ icone: Icone, children }: { icone: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <Icone className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

// Fenêtre modale : tout ce qu'il faut pour traiter une demande (client, séjour, message, historique, actions)
export default function FicheReservation({ reservation: r, client, hebergement, termine, restant, declencheur }: FicheReservationProps) {
  const nomClient = client ? `${client.prenom} ${client.nom}`.trim() : "Client inconnu"
  const nuits = nombreNuits(r.arrivee, r.depart)

  return (
    <Dialog>
      <DialogTrigger asChild>
        {declencheur ?? (
          <Button variant="ghost" size="sm">
            Détails
          </Button>
        )}
      </DialogTrigger>
      {/* En-tête et pied fixes, seul le contenu défile (un seul défilement : la page est bloquée derrière) */}
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="gap-3 border-b p-5 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <BadgeStatut reservation={r} termine={termine} />
            {restant && <span className="text-xs font-medium text-destructive">Option : encore {restant}</span>}
          </div>
          <DialogTitle className="text-lg">{formaterPlage(r.arrivee, r.depart)}</DialogTitle>
          <DialogDescription>
            {r.reference} · demande du {formaterHeure(r.creeLe)} via {SOURCES[r.source]}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-5 text-sm">
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Client</h3>
            <Ligne icone={Users}>
              {client ? (
                <Link href={`/admin/clients/${client.id}`} className="font-medium underline-offset-4 hover:underline">
                  {nomClient}
                </Link>
              ) : (
                <span className="font-medium">{nomClient}</span>
              )}
              {client?.pays && <span className="text-muted-foreground"> · {client.pays}</span>}
            </Ligne>
            {r.telephone && (
              <Ligne icone={Phone}>
                <a href={`tel:${r.telephone.replace(/\s/g, "")}`} className="underline-offset-4 hover:underline">
                  {r.telephone}
                </a>
              </Ligne>
            )}
            {client?.email && (
              <Ligne icone={Mail}>
                <a href={`mailto:${client.email}`} className="break-all underline-offset-4 hover:underline">
                  {client.email}
                </a>
              </Ligne>
            )}
          </section>

          <Separator />

          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Séjour</h3>
            <Ligne icone={BedDouble}>{hebergement ?? "Hébergement inconnu"}</Ligne>
            <Ligne icone={CalendarDays}>{pluriel(nuits, "nuit")}</Ligne>
            <Ligne icone={Users}>
              {pluriel(r.adultes, "adulte")}
              {r.enfants > 0 && ` et ${pluriel(r.enfants, "enfant")}`}
            </Ligne>
            {r.navette && <Ligne icone={Bus}>Navette aéroport demandée</Ligne>}
            {r.message && (
              <Ligne icone={MessageSquare}>
                <blockquote className="rounded-lg bg-muted px-3 py-2 text-foreground">« {r.message} »</blockquote>
              </Ligne>
            )}
            <div className="flex items-baseline justify-between rounded-lg border px-3 py-2">
              <span className="text-muted-foreground">Montant du séjour</span>
              <span className="text-base font-medium tabular-nums">{formaterPrix(r.montantTotal)}</span>
            </div>
          </section>

          {r.historique.length > 0 && (
            <>
              <Separator />
              <section className="flex flex-col gap-3">
                <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Historique</h3>
                <ol className="flex flex-col gap-3">
                  {r.historique.map((e) => (
                    <li key={`${e.statut}-${e.le}`}>
                      <Ligne icone={Clock}>
                        <span className="block">{e.note ?? libelleEvenement[e.statut]}</span>
                        <span className="text-xs text-muted-foreground">{formaterHeure(e.le)}</span>
                      </Ligne>
                    </li>
                  ))}
                </ol>
              </section>
            </>
          )}
        </div>

        {!termine && (r.statut === "option" || r.statut === "confirmee") && (
          <DialogFooter className="mx-0 mb-0 px-5 sm:justify-start">
            <ActionsReservation reservationId={r.id} statut={r.statut} reference={r.reference} />
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
