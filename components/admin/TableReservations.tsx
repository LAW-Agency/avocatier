import Link from "next/link"
import type { ReactNode } from "react"
import { CalendarX2 } from "lucide-react"
import FicheReservation from "@/components/admin/FicheReservation"
import { BadgeStatut, estTermine } from "@/components/admin/statut"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { aujourdhuiISO, formaterPlage, formaterPrix, nombreNuits, pluriel, tempsRestant } from "@/lib/reservation/dates"
import type { DonneesHotes } from "@/lib/reservation/hotes"
import type { Reservation } from "@/lib/reservation/types"

interface TableReservationsProps {
  reservations: Reservation[]
  donnees: DonneesHotes
  vide: { titre: string; texte: string; action?: ReactNode }
  avecClient?: boolean // masqué sur la fiche du client, où il est déjà affiché
}

// Liste dense des réservations : une ligne par séjour, détail et actions dans une fenêtre modale
export default function TableReservations({ reservations, donnees, vide, avecClient = true }: TableReservationsProps) {
  if (reservations.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarX2 />
          </EmptyMedia>
          <EmptyTitle>{vide.titre}</EmptyTitle>
          <EmptyDescription>{vide.texte}</EmptyDescription>
        </EmptyHeader>
        {vide.action}
      </Empty>
    )
  }

  const aujourdhui = aujourdhuiISO()

  return (
    <div className="@container overflow-hidden rounded-xl border bg-card">
      {/* Largeurs fixes : deux tableaux empilés (fiche client) gardent les mêmes colonnes ; « Séjour » prend le reste */}
      <Table className="table-fixed">
        {/* Colonnes secondaires selon la largeur du tableau (requêtes de conteneur, la barre latérale réduit la place) :
            leur contenu passe sous les dates quand elles sont masquées */}
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
            <TableHead className="pl-4">Séjour</TableHead>
            {avecClient && <TableHead className="hidden w-40 @2xl:table-cell">Client</TableHead>}
            <TableHead className="hidden w-40 @4xl:table-cell">Hébergement</TableHead>
            <TableHead className="hidden w-24 text-right @lg:table-cell">Montant</TableHead>
            <TableHead className="hidden w-36 @lg:table-cell">Statut</TableHead>
            <TableHead className="w-28 pr-4 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((r) => {
            const client = donnees.clientDe(r)
            const nomClient = client ? `${client.prenom} ${client.nom}`.trim() : "Client inconnu"
            const hebergement = donnees.hebergementDe(r)?.nom
            const termine = estTermine(r, aujourdhui)
            const restant = r.statut === "option" && r.expireLe ? tempsRestant(r.expireLe) : null
            return (
              <TableRow key={r.id}>
                <TableCell className="pl-4 whitespace-normal">
                  <div className="flex min-w-36 flex-col gap-0.5">
                    <span className="font-medium">{formaterPlage(r.arrivee, r.depart)}</span>
                    {avecClient && <span className="@2xl:hidden">{nomClient}</span>}
                    <span className="text-xs text-muted-foreground">
                      {/* Référence dans la fiche ; ici seulement ce qui sert à reconnaître le séjour */}
                      <span className="@4xl:hidden">{hebergement}, </span>
                      {pluriel(nombreNuits(r.arrivee, r.depart), "nuit")}, {pluriel(r.adultes + r.enfants, "voyageur")}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 @lg:hidden">
                      <BadgeStatut reservation={r} termine={termine} />
                      <span className="text-xs tabular-nums">{formaterPrix(r.montantTotal)}</span>
                    </span>
                  </div>
                </TableCell>
                {avecClient && (
                  <TableCell className="hidden truncate @2xl:table-cell">
                    {client ? (
                      <Link href={`/admin/clients/${client.id}`} className="font-medium underline-offset-4 hover:underline">
                        {nomClient}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">{nomClient}</span>
                    )}
                    {client?.pays && <span className="block text-xs text-muted-foreground">{client.pays}</span>}
                  </TableCell>
                )}
                <TableCell className="hidden truncate @4xl:table-cell">{hebergement}</TableCell>
                <TableCell className="hidden text-right tabular-nums @lg:table-cell">{formaterPrix(r.montantTotal)}</TableCell>
                <TableCell className="hidden @lg:table-cell">
                  <div className="flex flex-col items-start gap-1">
                    <BadgeStatut reservation={r} termine={termine} />
                    {restant && <span className="text-xs text-destructive">Expire dans {restant}</span>}
                  </div>
                </TableCell>
                <TableCell className="pr-4 text-right">
                  {/* Demande en option : la fiche s'ouvre avec Confirmer / Refuser en pied de panneau */}
                  <FicheReservation
                    reservation={r}
                    client={client}
                    hebergement={hebergement}
                    termine={termine}
                    restant={restant}
                    declencheur={
                      r.statut === "option" ? (
                        <Button size="sm">Traiter</Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
