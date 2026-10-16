import Link from "next/link"
import { CalendarClock, ChevronLeft, ChevronRight, LockOpen } from "lucide-react"
import { supprimerBlocage } from "@/app/admin/actions"
import EnTetePage from "@/components/admin/EnTetePage"
import FormulaireBlocage from "@/components/admin/FormulaireBlocage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { exigerHote } from "@/lib/auth/dal"
import { ajouterJours, aujourdhuiISO, estDateISO, formaterDate, formaterPlage, nombreNuits, pluriel, versDate } from "@/lib/reservation/dates"
import { donneesHotes } from "@/lib/reservation/hotes"
import { libelleStatutHote } from "@/lib/reservation/statuts"
import type { DateISO } from "@/lib/reservation/types"

const JOURS_AFFICHES = 28

type Barre = { debut: DateISO; fin: DateISO; libelle: string; detail: string; genre: "option" | "confirmee" | "blocage"; lien?: string }

const classesBarre: Record<Barre["genre"], string> = {
  confirmee: "bg-primary text-primary-foreground",
  option: "bg-chart-2 text-secondary-foreground ring-1 ring-inset ring-secondary-foreground/20",
  // Hachures : dates fermées sans réservation du site
  blocage:
    "bg-[repeating-linear-gradient(135deg,var(--muted)_0_6px,var(--border)_6px_12px)] text-muted-foreground ring-1 ring-inset ring-border",
}

const estWeekEnd = (jour: DateISO) => [0, 6].includes(versDate(jour).getUTCDay())

// Planning : une ligne par hébergement, une colonne par nuit ; réservations et blocages en barres
export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ [cle: string]: string | string[] | undefined }>
}) {
  await exigerHote()
  const [params, donnees] = await Promise.all([searchParams, donneesHotes()])
  const aujourdhui = aujourdhuiISO()
  const debut = estDateISO(params.debut) ? params.debut : aujourdhui
  const jours = Array.from({ length: JOURS_AFFICHES }, (_, i) => ajouterJours(debut, i))
  // Colonne des hébergements plus étroite sur téléphone (--col-hebergement, voir le conteneur) ;
  // nuits d'au moins 1,75rem : les 4 semaines tiennent sans défilement dès 960 px de large (barre latérale ouverte, écran de 1280 px)
  const colonnes = `var(--col-hebergement) repeat(${JOURS_AFFICHES}, minmax(1.75rem, 1fr))`

  function barresDe(hebergementId: string): Barre[] {
    const reservations = donnees.reservations
      .filter((r) => r.hebergementId === hebergementId && (r.statut === "option" || r.statut === "confirmee"))
      .map((r): Barre => {
        const client = donnees.clientDe(r)
        const nom = client ? `${client.prenom} ${client.nom}`.trim() : r.reference
        return {
          debut: r.arrivee,
          fin: r.depart,
          libelle: nom,
          detail: `${nom}, ${formaterPlage(r.arrivee, r.depart)}, ${libelleStatutHote[r.statut]}`,
          genre: r.statut === "option" ? "option" : "confirmee",
          lien: client ? `/admin/clients/${client.id}` : undefined,
        }
      })
    const blocages = donnees.blocages
      .filter((b) => b.hebergementId === hebergementId)
      .map((b): Barre => ({ debut: b.debut, fin: b.fin, libelle: b.raison || "Bloqué", detail: `${b.raison || "Dates bloquées"}, ${formaterPlage(b.debut, b.fin)}`, genre: "blocage" }))
    return [...reservations, ...blocages]
  }

  const blocagesAVenir = donnees.blocages
    .filter((b) => b.fin > aujourdhui)
    .sort((a, b) => a.debut.localeCompare(b.debut))

  return (
    <>
      <EnTetePage
        titre="Planning"
        description={formaterPlage(debut, ajouterJours(debut, JOURS_AFFICHES - 1))}
        actions={
          <>
            <Button variant="outline" size="icon" asChild>
              <Link href={`/admin/planning?debut=${ajouterJours(debut, -JOURS_AFFICHES)}`} aria-label="4 semaines avant">
                <ChevronLeft />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/planning">Aujourd&apos;hui</Link>
            </Button>
            <Button variant="outline" size="icon" asChild>
              <Link href={`/admin/planning?debut=${ajouterJours(debut, JOURS_AFFICHES)}`} aria-label="4 semaines après">
                <ChevronRight />
              </Link>
            </Button>
          </>
        }
      />

      {/* isolate : les colonnes collantes (z-20) restent sous la barre du haut au défilement */}
      <Card className="isolate gap-0 py-0">
        <div className="overflow-x-auto">
          {/* Largeur minimale = colonne des hébergements + 28 nuits × 1,75rem */}
          <div className="min-w-[56.5rem] [--col-hebergement:7.5rem] sm:min-w-[59rem] sm:[--col-hebergement:10rem]">
            {/* En-tête : une colonne par nuit, week-ends teintés, aujourd'hui marqué */}
            <div className="grid border-b bg-muted/50" style={{ gridTemplateColumns: colonnes }}>
              <div className="sticky left-0 z-20 flex items-end bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">Hébergement</div>
              {jours.map((j) => (
                <div key={j} className={`border-l py-2 text-center text-xs ${estWeekEnd(j) ? "bg-muted" : ""}`}>
                  <span className="block text-muted-foreground">
                    {formaterDate(j, { weekday: "short", day: undefined, month: undefined, year: undefined }).slice(0, 2)}
                  </span>
                  <span
                    className={`mx-auto mt-0.5 flex size-6 items-center justify-center rounded-full text-sm tabular-nums ${
                      j === aujourdhui ? "bg-primary font-semibold text-primary-foreground" : "font-medium"
                    }`}
                  >
                    {Number(j.slice(8))}
                  </span>
                </div>
              ))}
            </div>

            {donnees.hebergements.map((h) => (
              <div key={h.id} className="grid border-b last:border-b-0" style={{ gridTemplateColumns: colonnes }}>
                <div className="sticky left-0 z-20 flex items-center bg-card px-4 text-sm font-medium" style={{ gridRow: 1 }}>
                  <span className="truncate">{h.nom}</span>
                </div>
                {jours.map((j, i) => (
                  <div
                    key={j}
                    aria-hidden="true"
                    style={{ gridColumn: i + 2, gridRow: 1 }}
                    className={`h-14 border-l ${estWeekEnd(j) ? "bg-muted/60" : ""} ${j === aujourdhui ? "bg-accent" : ""}`}
                  />
                ))}
                {barresDe(h.id).map((b) => {
                  // Barre limitée à la fenêtre affichée ; une case par nuit occupée [début, fin[
                  const debutCol = Math.max(0, nombreNuits(debut, b.debut))
                  const finCol = Math.min(JOURS_AFFICHES, nombreNuits(debut, b.fin))
                  if (finCol <= debutCol) return null
                  const classes = `z-10 mx-0.5 my-2.5 flex items-center overflow-hidden rounded-md px-2.5 text-xs font-medium whitespace-nowrap ${classesBarre[b.genre]}`
                  const style = { gridColumn: `${debutCol + 2} / ${finCol + 2}`, gridRow: 1 }
                  return b.lien ? (
                    <Link key={b.detail} href={b.lien} title={b.detail} style={style} className={`${classes} transition-opacity hover:opacity-85`}>
                      <span className="truncate">{b.libelle}</span>
                    </Link>
                  ) : (
                    <div key={b.detail} title={b.detail} style={style} className={classes}>
                      <span className="truncate">{b.libelle}</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 border-t px-4 py-3 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className={`h-3 w-6 rounded-sm ${classesBarre.confirmee}`} /> Confirmée
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className={`h-3 w-6 rounded-sm ${classesBarre.option}`} /> Demande à traiter
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className={`h-3 w-6 rounded-sm ${classesBarre.blocage}`} /> Dates bloquées
          </li>
        </ul>
      </Card>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Bloquer des dates</CardTitle>
            <CardDescription>
              Réservation reçue par téléphone, WhatsApp ou Booking.com, travaux ou fermeture : ces nuits ne seront plus proposées sur le site.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormulaireBlocage hebergements={donnees.hebergements.map(({ id, nom }) => ({ id, nom }))} aujourdhui={aujourdhui} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dates bloquées à venir</CardTitle>
            <CardDescription>{pluriel(blocagesAVenir.length, "période fermée", "périodes fermées")} à la réservation en ligne</CardDescription>
          </CardHeader>
          <CardContent>
            {blocagesAVenir.length === 0 ? (
              <Empty className="border border-dashed">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CalendarClock />
                  </EmptyMedia>
                  <EmptyTitle>Aucune date bloquée</EmptyTitle>
                  <EmptyDescription>Tous les hébergements sont ouverts à la réservation en ligne.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              // Première et dernière colonnes sans marge extérieure : le tableau s'aligne sur le titre de la carte
              <div className="@container">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-0">Hébergement</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead className="hidden @lg:table-cell">Raison</TableHead>
                      <TableHead className="pr-0 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blocagesAVenir.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="pl-0 font-medium whitespace-normal">{donnees.hebergements.find((h) => h.id === b.hebergementId)?.nom}</TableCell>
                        <TableCell className="whitespace-normal">
                          {formaterPlage(b.debut, b.fin)}
                          <span className="block text-xs text-muted-foreground">{pluriel(nombreNuits(b.debut, b.fin), "nuit")}</span>
                        </TableCell>
                        <TableCell className="hidden max-w-48 truncate text-muted-foreground @lg:table-cell">{b.raison || "—"}</TableCell>
                        <TableCell className="pr-0 text-right">
                          <form action={supprimerBlocage}>
                            <input type="hidden" name="blocageId" value={b.id} />
                            <Button type="submit" variant="ghost" size="sm" aria-label="Libérer ces dates">
                              <LockOpen data-icon="inline-start" />
                              <span className="hidden @md:inline">Libérer</span>
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
