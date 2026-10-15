import Link from "next/link"
import { ChevronRight, Users } from "lucide-react"
import EnTetePage from "@/components/admin/EnTetePage"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { exigerHote } from "@/lib/auth/dal"
import { aujourdhuiISO, formaterPlage, pluriel } from "@/lib/reservation/dates"
import { donneesHotes } from "@/lib/reservation/hotes"

// Clients ayant un compte sur le site, avec leur prochain séjour
export default async function ClientsPage() {
  await exigerHote()
  const donnees = await donneesHotes()
  const aujourdhui = aujourdhuiISO()

  const lignes = donnees.clients
    .map((c) => {
      const sejours = donnees.reservations.filter((r) => r.clientId === c.id)
      const prochain = sejours
        .filter((r) => (r.statut === "option" || r.statut === "confirmee") && r.depart > aujourdhui)
        .sort((a, b) => a.arrivee.localeCompare(b.arrivee))[0]
      return { client: c, sejours: sejours.length, prochain }
    })
    .sort((a, b) => (a.prochain?.arrivee ?? "9999").localeCompare(b.prochain?.arrivee ?? "9999"))

  return (
    <>
      <EnTetePage titre="Clients" description={`${pluriel(lignes.length, "compte client", "comptes clients")} sur le site`} />

      {lignes.length === 0 ? (
        <Empty className="border border-dashed bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>Aucun client pour l&apos;instant</EmptyTitle>
            <EmptyDescription>Les comptes créés sur le site apparaîtront ici.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="@container overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="pl-4">Client</TableHead>
                <TableHead className="hidden @2xl:table-cell">Contact</TableHead>
                <TableHead className="hidden text-center @lg:table-cell">Réservations</TableHead>
                <TableHead className="hidden @3xl:table-cell">Prochain séjour</TableHead>
                <TableHead className="pr-4">
                  <span className="sr-only">Fiche</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lignes.map(({ client, sejours, prochain }) => (
                <TableRow key={client.id} className="relative">
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{`${client.prenom[0] ?? ""}${client.nom[0] ?? ""}`.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        {/* Lien étendu à toute la ligne (after:absolute) */}
                        <Link href={`/admin/clients/${client.id}`} className="block font-medium after:absolute after:inset-0">
                          {client.prenom} {client.nom}
                        </Link>
                        <span className="block text-xs text-muted-foreground">{client.pays || "Pays non renseigné"}</span>
                        {/* Tableau étroit : prochain séjour sous le nom */}
                        {prochain && (
                          <span className="block text-xs text-muted-foreground @3xl:hidden">Prochain séjour : {formaterPlage(prochain.arrivee, prochain.depart)}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden @2xl:table-cell">
                    <span className="block">{client.email}</span>
                    <span className="text-xs text-muted-foreground">{client.telephone}</span>
                  </TableCell>
                  <TableCell className="hidden text-center @lg:table-cell">
                    <Badge variant="outline" className="tabular-nums">
                      {sejours}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden @3xl:table-cell">
                    {prochain ? formaterPlage(prochain.arrivee, prochain.depart) : <span className="text-muted-foreground">Aucun séjour à venir</span>}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <ChevronRight className="ml-auto size-4 text-muted-foreground" aria-hidden="true" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
