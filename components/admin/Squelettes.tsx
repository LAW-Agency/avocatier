import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Squelettes de chargement de l'espace hôtes (fichiers loading.tsx) : mêmes blocs que les pages,
// pour que rien ne saute quand les données arrivent. La barre latérale et la barre du haut restent affichées.

export function SqueletteEnTete({ avecActions = false }: { avecActions?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4" aria-hidden="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      {avecActions && <Skeleton className="h-8 w-28" />}
    </div>
  )
}

function SqueletteLigne() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <Skeleton className="h-7 w-20 shrink-0" />
    </div>
  )
}

// Annonce unique aux lecteurs d'écran ; les blocs gris sont masqués (aria-hidden)
function Annonce() {
  return (
    <p role="status" className="sr-only">
      Chargement…
    </p>
  )
}

export function SqueletteTableauDeBord() {
  return (
    <>
      <Annonce />
      <SqueletteEnTete avecActions />
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i}>
            <CardHeader className="gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-12" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-32 max-w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-3" aria-hidden="true">
        <Card className="xl:col-span-2">
          <CardHeader className="gap-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-lg border p-3">
                <SqueletteLigne />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          {Array.from({ length: 2 }, (_, i) => (
            <Card key={i}>
              <CardHeader className="gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <SqueletteLigne />
                <SqueletteLigne />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}

export function SqueletteTableau({ lignes = 6 }: { lignes?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card" aria-hidden="true">
      <div className="flex gap-6 border-b bg-muted/60 px-4 py-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16 max-sm:hidden" />
        <Skeleton className="h-4 w-24 max-md:hidden" />
      </div>
      <div className="flex flex-col divide-y px-4">
        {Array.from({ length: lignes }, (_, i) => (
          <SqueletteLigne key={i} />
        ))}
      </div>
    </div>
  )
}

export function SqueletteListe({ avecFiltres = false, lignes = 6 }: { avecFiltres?: boolean; lignes?: number }) {
  return (
    <>
      <Annonce />
      <SqueletteEnTete />
      <div className="flex flex-col gap-4">
        {avecFiltres && <Skeleton className="h-9 w-full max-w-xl" aria-hidden="true" />}
        <SqueletteTableau lignes={lignes} />
      </div>
    </>
  )
}

export function SquelettePlanning() {
  return (
    <>
      <Annonce />
      <SqueletteEnTete avecActions />
      <Card className="gap-0 py-0" aria-hidden="true">
        <Skeleton className="h-14 rounded-none" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-t px-4 py-4">
            <Skeleton className="h-4 w-28 shrink-0" />
            <Skeleton className="h-6 flex-1" style={{ marginLeft: `${(i * 13) % 40}%`, marginRight: `${(i * 17) % 30}%` }} />
          </div>
        ))}
      </Card>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" aria-hidden="true">
        <Card>
          <CardHeader className="gap-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
            <Skeleton className="h-8 w-36" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="gap-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <SqueletteLigne />
            <SqueletteLigne />
            <SqueletteLigne />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export function SqueletteFicheClient() {
  return (
    <>
      <Annonce />
      <Skeleton className="h-6 w-32" aria-hidden="true" />
      <div className="flex flex-wrap items-center justify-between gap-4" aria-hidden="true">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <Card aria-hidden="true">
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-14" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-4" aria-hidden="true">
        <Skeleton className="h-6 w-40" />
        <SqueletteTableau lignes={2} />
      </div>
    </>
  )
}
