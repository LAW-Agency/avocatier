import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CalendarPlus, Globe, Mail, Phone } from "lucide-react"
import EnTetePage from "@/components/admin/EnTetePage"
import TableReservations from "@/components/admin/TableReservations"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { exigerHote } from "@/lib/auth/dal"
import { aujourdhuiISO, formaterHeure, formaterPrix, nombreNuits } from "@/lib/reservation/dates"
import { donneesHotes } from "@/lib/reservation/hotes"

// Fiche d'un client : coordonnées et chiffres, puis ses séjours à venir et passés
export default async function FicheClientPage({ params }: { params: Promise<{ id: string }> }) {
  await exigerHote()
  const [{ id }, donnees] = await Promise.all([params, donneesHotes()])
  const client = donnees.clients.find((c) => c.id === id)
  if (!client) notFound()

  const aujourdhui = aujourdhuiISO()
  const sejours = donnees.reservations.filter((r) => r.clientId === client.id)
  const aVenir = sejours
    .filter((r) => (r.statut === "option" || r.statut === "confirmee") && r.depart > aujourdhui)
    .sort((a, b) => a.arrivee.localeCompare(b.arrivee))
  const autres = sejours.filter((r) => !aVenir.includes(r)).sort((a, b) => b.arrivee.localeCompare(a.arrivee))
  const confirmes = sejours.filter((r) => r.statut === "confirmee")
  const chiffres = [
    { libelle: "Réservations", valeur: String(sejours.length) },
    { libelle: "Nuits confirmées", valeur: String(confirmes.reduce((t, r) => t + nombreNuits(r.arrivee, r.depart), 0)) },
    { libelle: "Montant confirmé", valeur: formaterPrix(confirmes.reduce((t, r) => t + r.montantTotal, 0)) },
  ]

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="-ml-2 self-start">
        <Link href="/admin/clients">
          <ArrowLeft data-icon="inline-start" />
          Tous les clients
        </Link>
      </Button>

      <EnTetePage
        titre={
          <span className="flex items-center gap-4">
            <Avatar size="lg" className="font-sans">
              <AvatarFallback>{`${client.prenom[0] ?? ""}${client.nom[0] ?? ""}`.toUpperCase()}</AvatarFallback>
            </Avatar>
            {client.prenom} {client.nom}
          </span>
        }
        description={`Compte créé le ${formaterHeure(client.creeLe)}`}
        actions={
          <>
            {client.telephone && (
              <Button variant="outline" asChild>
                <a href={`tel:${client.telephone.replace(/\s/g, "")}`}>
                  <Phone data-icon="inline-start" />
                  Appeler
                </a>
              </Button>
            )}
            <Button asChild>
              <a href={`mailto:${client.email}`}>
                <Mail data-icon="inline-start" />
                Écrire
              </a>
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.4fr)]">
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-3">
              <dt className="sr-only">E-mail</dt>
              <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <dd className="truncate">{client.email}</dd>
            </div>
            <div className="flex items-center gap-3">
              <dt className="sr-only">Téléphone</dt>
              <Phone className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <dd>{client.telephone || "Non renseigné"}</dd>
            </div>
            <div className="flex items-center gap-3">
              <dt className="sr-only">Pays</dt>
              <Globe className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <dd>{client.pays || "Pays non renseigné"}</dd>
            </div>
          </dl>
          <Separator orientation="vertical" className="hidden md:block" />
          <dl className="grid grid-cols-3 gap-4">
            {chiffres.map((c) => (
              <div key={c.libelle} className="flex flex-col gap-1">
                <dt className="text-xs text-muted-foreground">{c.libelle}</dt>
                <dd className="text-xl font-semibold tabular-nums">{c.valeur}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Séjours à venir</h2>
        <TableReservations
          reservations={aVenir}
          donnees={donnees}
          avecClient={false}
          vide={{
            titre: "Aucun séjour à venir",
            texte: "Ce client n'a pas de demande ni de réservation en cours.",
            action: (
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/planning">
                  <CalendarPlus data-icon="inline-start" />
                  Voir le planning
                </Link>
              </Button>
            ),
          }}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Historique</h2>
        <TableReservations
          reservations={autres}
          donnees={donnees}
          avecClient={false}
          vide={{ titre: "Aucun séjour passé", texte: "Les séjours terminés, annulés ou refusés apparaîtront ici." }}
        />
      </section>
    </>
  )
}
