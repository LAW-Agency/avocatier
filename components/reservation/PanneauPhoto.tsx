import Image from "next/image"
import type { ReactNode } from "react"

interface PanneauPhotoProps {
  images: string[] // toutes les photos possibles : gardées chargées pour un fondu sans attente
  active: string
  children?: ReactNode
  className?: string // hauteur du bandeau sur mobile
}

// Grande photo des pages de réservation : bandeau sur mobile ; sur grand écran, colonne alignée
// sur le contenu voisin (même haut, même bas), qui reste fixe sous le header quand le contenu défile.
// Changer `active` fait passer d'une photo à l'autre en fondu.
export default function PanneauPhoto({ images, active, children, className = "" }: PanneauPhotoProps) {
  return (
    // Cellule de grille étirée sur toute la hauteur du contenu : le cadre ne la dépasse jamais
    <div className="lg:self-stretch">
      <div
        // Fixe sous le header (5rem + 2rem d'air, comme le haut du contenu) ; en bas, s'arrête au niveau
        // de la barre d'action flottante (1.25rem du bord) ; jamais plus haut que le contenu voisin
        className={`relative isolate overflow-hidden rounded-panel bg-forest lg:sticky lg:top-28 lg:h-[min(calc(100dvh-8.25rem),100%)] lg:min-h-[28rem] ${className}`}
      >
        {/* Conteneur en absolute : next/image (fill) refuse un parent en position sticky */}
        <div className="absolute inset-0 -z-20 animate-photo-entree motion-reduce:animate-none">
          {images.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt=""
              fill
              preload={i === 0}
              sizes="(min-width: 1024px) 42vw, 100vw"
              className={`object-cover transition-[opacity,transform] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                src === active ? "scale-100 opacity-100" : "scale-[1.06] opacity-0"
              }`}
            />
          ))}
        </div>
        {/* Voile vert nuit, plus dense en bas où le texte est posé */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-forest/30" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-forest via-forest/60 to-transparent" />
        {children}
      </div>
    </div>
  )
}
