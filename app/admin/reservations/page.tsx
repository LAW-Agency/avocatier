import Link from "next/link"
import EnTetePage from "@/components/admin/EnTetePage"
import TableReservations from "@/components/admin/TableReservations"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { exigerHote } from "@/lib/auth/dal"
import { donneesHotes } from "@/lib/reservation/hotes"
import type { StatutReservation } from "@/lib/reservation/types"

const FILTRES: { statut: StatutReservation | null; label: string }[] = [
  { statut: null, label: "Toutes" },
  { statut: "option", label: "À traiter" },
  { statut: "confirmee", label: "Confirmées" },
  { statut: "annulee", label: "Annulées" },
  { statut: "refusee", label: "Refusées" },
  { statut: "expiree", label: "Expirées" },
]

// Toutes les demandes et réservations, filtrables par statut (?statut=option…)
export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [cle: string]: string | string[] | undefined }>
}) {
  await exigerHote()
  const [params, donnees] = await Promise.all([searchParams, donneesHotes()])
  const filtre = FILTRES.find((f) => f.statut === params.statut)?.statut ?? null

  // À traiter d'abord (option la plus proche de l'échéance), puis par date d'arrivée, la plus récente en haut
  const liste = donnees.reservations
    .filter((r) => !filtre || r.statut === filtre)
    .sort((a, b) => {
      if (a.statut === "option" && b.statut !== "option") return -1
      if (b.statut === "option" && a.statut !== "option") return 1
      if (a.statut === "option") return (a.expireLe ?? "").localeCompare(b.expireLe ?? "")
      return b.arrivee.localeCompare(a.arrivee)
    })

  return (
    <>
      <EnTetePage
        titre="Réservations"
        description="Demandes reçues sur le site et séjours confirmés. Une demande bloque les dates 48 h en attendant votre réponse."
      />

      <div className="flex flex-col gap-4">
        <nav aria-label="Filtrer par statut" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
          <ul className="flex w-max gap-1 rounded-lg bg-muted p-1">
            {FILTRES.map((f) => {
              const nombre = donnees.reservations.filter((r) => !f.statut || r.statut === f.statut).length
              const actif = f.statut === filtre
              return (
                <li key={f.label}>
                  <Button variant={actif ? "outline" : "ghost"} size="sm" asChild>
                    <Link
                      href={f.statut ? `/admin/reservations?statut=${f.statut}` : "/admin/reservations"}
                      aria-current={actif ? "page" : undefined}
                    >
                      {f.label}
                      <Badge variant={actif ? "default" : "outline"} className="tabular-nums">
                        {nombre}
                      </Badge>
                    </Link>
                  </Button>
                </li>
              )
            })}
          </ul>
        </nav>

        <TableReservations
          reservations={liste}
          donnees={donnees}
          vide={{
            titre: "Aucune réservation",
            texte: filtre ? "Aucune réservation avec ce statut pour l'instant." : "Les demandes envoyées depuis le site apparaîtront ici.",
          }}
        />
      </div>
    </>
  )
}
