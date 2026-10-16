import type { ReactNode } from "react"

interface EnTetePageProps {
  titre: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

// Titre de page de l'espace hôtes : description dessous, actions à droite
export default function EnTetePage({ titre, description, actions }: EnTetePageProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-2xl leading-tight font-semibold tracking-tight text-foreground md:text-3xl">{titre}</h1>
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
