import Link from "next/link"
import type { ReactNode } from "react"
import { Bus, CalendarCheck2, CalendarDays, Inbox, MessageSquare } from "lucide-react"
import ActionsReservation from "@/components/admin/ActionsReservation"
import EnTetePage from "@/components/admin/EnTetePage"
import FicheReservation from "@/components/admin/FicheReservation"
import { estTermine } from "@/components/admin/statut"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { exigerHote } from "@/lib/auth/dal"
import { ajouterJours, aujourdhuiISO, formaterDate, formaterPlage, formaterPrix, nombreNuits, pluriel, tempsRestant } from "@/lib/reservation/dates"
import { donneesHotes, situationDuJour, type DonneesHotes } from "@/lib/reservation/hotes"
import type { ClientPublic, Reservation } from "@/lib/reservation/types"

// Tableau du jour : chiffres clés ; à gauche les demandes à traiter, à droite les mouvements du jour et de la semaine
export default async function AujourdhuiPage() {
  const hote = await exigerHote()
  const donnees = await donneesHotes()
  const aujourdhui = aujourdhuiISO()
  const { reservations } = donnees
  const { arrivees, departs, occupes, total } = situationDuJour(donnees, aujourdhui)

  const aTraiter = reservations
    .filter((r) => r.statut === "option")
    .sort((a, b) => (a.expireLe ?? "").localeCompare(b.expireLe ?? ""))
  const confirmees = reservations.filter((r) => r.statut === "confirmee")
  const surPlace = confirmees.filter((r) => r.arrivee < aujourdhui && r.depart > aujourdhui)
  const dans7Jours = ajouterJours(aujourdhui, 7)
  const semaine = confirmees
    .filter((r) => r.arrivee > aujourdhui && r.arrivee <= dans7Jours)
    .sort((a, b) => a.arrivee.localeCompare(b.arrivee))

  const tauxOccupation = total ? Math.round((occupes / total) * 100) : 0

  return (
    <>
      {/* La date du jour est déjà dans la barre du haut */}
      <EnTetePage
        titre={`Bonjour ${hote.prenom}`}
        description={
          aTraiter.length > 0
            ? `${pluriel(aTraiter.length, "demande attend", "demandes attendent")} votre réponse.`
            : "Aucune demande en attente."
        }
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/planning">
              <CalendarCheck2 data-icon="inline-start" />
              Planning
            </Link>
          </Button>
        }
      />

      {/* Chiffres du jour en un seul bandeau, cases séparées par des filets (gap-px sur fond de bordure) */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border ring-1 ring-foreground/10 xl:grid-cols-4">
        <Indicateur libelle="À traiter" valeur={aTraiter.length} note="En attente de réponse" />
        <Indicateur libelle="Arrivées" valeur={arrivees.length} note={semaine.length ? `${pluriel(semaine.length, "autre prévue", "autres prévues")} sous 7 jours` : "Aucune autre sous 7 jours"} />
        <Indicateur libelle="Départs" valeur={departs.length} note={surPlace.length ? pluriel(surPlace.length, "séjour en cours", "séjours en cours") : "Aucun séjour en cours"} />
        <Indicateur libelle="Occupation ce soir" valeur={`${occupes} sur ${total}`}>
          <Progress value={tauxOccupation} aria-label={`Taux d'occupation : ${tauxOccupation} %`} />
        </Indicateur>
      </dl>

      <div className="grid items-start gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Demandes à traiter</CardTitle>
            <CardDescription>Les dates sont bloquées 48 h : confirmez ou refusez avant l&apos;échéance.</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/reservations?statut=option">Toutes les demandes</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {aTraiter.length === 0 ? (
              <Empty className="border border-dashed">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Inbox />
                  </EmptyMedia>
                  <EmptyTitle>Rien à traiter</EmptyTitle>
                  <EmptyDescription>Les nouvelles demandes envoyées depuis le site apparaîtront ici.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ItemGroup className="gap-3">
                {aTraiter.map((r) => (
                  <Demande key={r.id} reservation={r} donnees={donnees} />
                ))}
              </ItemGroup>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          <Card>
            <CardHeader>
              {/* Pas de description : les onglets disent déjà ce que contient la carte */}
              <CardTitle>Aujourd&apos;hui</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="arrivees">
                {/* Onglets sans marge intérieure : le premier libellé s'aligne sur le titre de la carte ;
                    nombres en simple texte grisé (des pastilles feraient déborder la colonne étroite) */}
                <TabsList variant="line" className="w-full justify-start gap-4 px-0">
                  <TabsTrigger value="arrivees" className="flex-none px-0">
                    Arrivées <span className="text-muted-foreground tabular-nums">{arrivees.length}</span>
                  </TabsTrigger>
                  <TabsTrigger value="departs" className="flex-none px-0">
                    Départs <span className="text-muted-foreground tabular-nums">{departs.length}</span>
                  </TabsTrigger>
                  <TabsTrigger value="sur-place" className="flex-none px-0">
                    Sur place <span className="text-muted-foreground tabular-nums">{surPlace.length}</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="arrivees" className="pt-2">
                  <Sejours reservations={arrivees} donnees={donnees} vide="Aucune arrivée aujourd'hui." />
                </TabsContent>
                <TabsContent value="departs" className="pt-2">
                  <Sejours reservations={departs} donnees={donnees} vide="Aucun départ aujourd'hui." />
                </TabsContent>
                <TabsContent value="sur-place" className="pt-2">
                  <Sejours reservations={surPlace} donnees={donnees} vide="Aucun client sur place." />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cette semaine</CardTitle>
              <CardDescription>Arrivées des 7 prochains jours</CardDescription>
              <CardAction>
                <Badge variant="outline">{semaine.length}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Sejours reservations={semaine} donnees={donnees} vide="Aucune arrivée prévue cette semaine." avecDate />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

interface IndicateurProps {
  libelle: string
  valeur: ReactNode
  note?: string
  children?: ReactNode
}

function Indicateur({ libelle, valeur, note, children }: IndicateurProps) {
  return (
    <div className="flex flex-col gap-1 bg-card p-4">
      <dt className="text-sm text-muted-foreground">{libelle}</dt>
      <dd className="text-2xl font-semibold tabular-nums">{valeur}</dd>
      <dd className="mt-1 text-xs text-muted-foreground">{children ?? note}</dd>
    </div>
  )
}

function nomDe(client?: ClientPublic) {
  return client ? `${client.prenom} ${client.nom}`.trim() : "Client inconnu"
}

function initiales(client?: ClientPublic) {
  return client ? `${client.prenom[0] ?? ""}${client.nom[0] ?? ""}`.toUpperCase() : "?"
}

// Demande en option : l'essentiel pour décider sans ouvrir la fiche, et les actions
function Demande({ reservation: r, donnees }: { reservation: Reservation; donnees: DonneesHotes }) {
  const client = donnees.clientDe(r)
  const hebergement = donnees.hebergementDe(r)?.nom
  const restant = r.expireLe ? tempsRestant(r.expireLe) : null

  return (
    <Item variant="outline" role="listitem" className="items-start">
      <ItemMedia>
        <Avatar>
          <AvatarFallback>{initiales(client)}</AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="flex-wrap">
          {client ? (
            <Link href={`/admin/clients/${client.id}`} className="hover:underline">
              {nomDe(client)}
            </Link>
          ) : (
            nomDe(client)
          )}
          <Badge variant={restant ? "secondary" : "destructive"}>{restant ? `Expire dans ${restant}` : "Option échue"}</Badge>
        </ItemTitle>
        <ItemDescription className="line-clamp-none">
          {formaterPlage(r.arrivee, r.depart)}, {hebergement}
          <span className="block text-xs">
            {pluriel(nombreNuits(r.arrivee, r.depart), "nuit")}, {pluriel(r.adultes + r.enfants, "voyageur")}
            {client?.pays && `, ${client.pays}`}
          </span>
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <span className="font-semibold tabular-nums">{formaterPrix(r.montantTotal)}</span>
      </ItemActions>
      {(r.message || r.navette) && (
        <ItemFooter className="flex-col items-stretch gap-1.5 rounded-md bg-muted/60 px-3 py-2 text-sm">
          {r.navette && (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Bus className="size-3.5 shrink-0" aria-hidden="true" /> Navette aéroport demandée
            </span>
          )}
          {r.message && (
            <span className="flex gap-2">
              <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="line-clamp-2">« {r.message} »</span>
            </span>
          )}
        </ItemFooter>
      )}
      <ItemFooter className="flex-wrap">
        <ActionsReservation reservationId={r.id} statut={r.statut} reference={r.reference} taille="sm" />
        <FicheReservation reservation={r} client={client} hebergement={hebergement} termine={false} restant={restant} />
      </ItemFooter>
    </Item>
  )
}

interface SejoursProps {
  reservations: Reservation[]
  donnees: DonneesHotes
  vide: string
  avecDate?: boolean
}

// Liste courte de séjours : une ligne par client, détail en fenêtre modale
function Sejours({ reservations, donnees, vide, avecDate = false }: SejoursProps) {
  if (reservations.length === 0) {
    return (
      <p className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
        <CalendarDays className="size-4" aria-hidden="true" /> {vide}
      </p>
    )
  }

  const aujourdhui = aujourdhuiISO()
  return (
    <ItemGroup className="gap-0">
      {reservations.map((r) => {
        const client = donnees.clientDe(r)
        const hebergement = donnees.hebergementDe(r)?.nom
        return (
          <Item key={r.id} size="sm" role="listitem" className="-mx-3 w-auto">
            <ItemMedia>
              <Avatar size="sm">
                <AvatarFallback>{initiales(client)}</AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent className="min-w-0 gap-0">
              <ItemTitle className="w-full">
                <span className="truncate">{nomDe(client)}</span>
              </ItemTitle>
              <ItemDescription className="line-clamp-1 text-xs">
                {avecDate ? `${formaterDate(r.arrivee, { year: undefined })}, ` : ""}
                {hebergement}, {pluriel(nombreNuits(r.arrivee, r.depart), "nuit")}
                {r.navette && ", navette"}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <FicheReservation reservation={r} client={client} hebergement={hebergement} termine={estTermine(r, aujourdhui)} restant={null} />
            </ItemActions>
          </Item>
        )
      })}
    </ItemGroup>
  )
}
