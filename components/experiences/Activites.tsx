import type { CSSProperties } from "react"
import SectionTitle from "@/components/home/SectionTitle"
import Grain, { FOND_SABLE } from "@/components/home/Grain"
import { activites } from "@/data/experiences"

// Excursions et activités en cartes sur fond sable (pas de photos du client pour ces sorties).
// Sur le sable, texte courant en encre et période en bordeaux : le vert n'y atteint pas 4,5:1.
export default function Activites() {
  return (
    <section id="excursions" className={`${FOND_SABLE} py-section`}>
      <Grain />
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-6 md:grid-cols-12 lg:gap-14">
          <div data-reveal className="space-y-4 md:col-span-7">
            <SectionTitle title="Excursions et activités" />
            <p className="font-heading text-lg text-balance text-primary-accent md:text-xl">Vivez Sainte-Marie pleinement !</p>
          </div>
          <p
            data-reveal
            style={{ "--reveal-delay": "150ms" } as CSSProperties}
            className="text-body text-ink md:col-span-5 md:self-end lg:col-span-4 lg:col-start-9"
          >
            Baleines, plongée, balades en pirogue, pêche ou découverte de l’île… Sainte-Marie regorge d’expériences à
            vivre !
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-16 lg:grid-cols-6 lg:gap-5">
          {activites.map(({ nom, periode, texte, icon: Icon }, i) => (
            <li
              key={nom}
              data-reveal
              style={{ "--reveal-delay": `${i * 100}ms` } as CSSProperties}
              // Deux cartes larges puis trois : la rangée du haut met en avant baleines et plongée
              className={`flex flex-col rounded-panel bg-background/85 p-6 shadow-[0_8px_32px_rgb(13_43_33/0.06)] ${
                i < 2 ? "lg:col-span-3" : "lg:col-span-2"
              } ${i === activites.length - 1 ? "sm:col-span-2 lg:col-span-2" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-dark/10 text-text-dark">
                  <Icon aria-hidden="true" className="h-6 w-6 stroke-[1.25]" />
                </span>
                {periode && (
                  <span className="rounded-full border border-primary-accent/30 px-3 py-1 text-xs font-medium tracking-wide text-primary-accent">
                    {periode}
                  </span>
                )}
              </div>
              <h3 className="mt-6 font-heading text-xl leading-tight text-text-dark md:text-2xl">{nom}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink">{texte}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
