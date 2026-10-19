import type { ReactNode } from "react"
import PanneauPhoto from "@/components/reservation/PanneauPhoto"

const PHOTO = "/images/hotel/jardin-bungalows.jpeg"

// Mise en page des pages de compte (connexion, récupération) : photo à gauche, formulaire dans un panneau blanc
export default function CadreCompte({ titre, intro, children }: { titre: string; intro: ReactNode; children: ReactNode }) {
  return (
    // Même conteneur que le header : la photo s'aligne sur le logo
    <div className="mx-auto max-w-7xl px-4 pt-4 pb-12 sm:px-6 lg:grid lg:grid-cols-[5fr_7fr] lg:gap-12 lg:pt-8 lg:pb-16 xl:gap-16">
      <PanneauPhoto images={[PHOTO]} active={PHOTO} className="h-64 sm:h-80">
        <p className="absolute inset-x-0 bottom-0 p-6 font-heading text-3xl leading-tight text-balance text-primary-light sm:p-8 sm:text-4xl lg:p-12 lg:text-5xl animate-fade-up motion-reduce:animate-none">
          Vos séjours Chez L&apos;Avocatier, au même endroit
        </p>
      </PanneauPhoto>

      {/* Colonne neutre (encre) : le vert de la marque ne reste qu'en accent (focus, survol du bouton) */}
      <div className="pt-8 lg:flex lg:items-center lg:pt-0">
        <div className="mx-auto w-full max-w-xl">
          <h1 className="text-center font-heading text-section text-balance text-forest">{titre}</h1>
          <p className="mt-4 mb-8 text-center text-body text-balance text-ink/70">{intro}</p>
          <div className="rounded-panel border border-ink/10 bg-primary-light p-5 sm:p-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
