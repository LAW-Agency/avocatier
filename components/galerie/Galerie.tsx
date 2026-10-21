'use client'
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react"
import { categories, photos, type CategorieGalerie } from "@/data/galerie"

export type Filtre = CategorieGalerie | "tout"

const SEUIL_BALAYAGE = 50 // px : glissement horizontal qui change de photo sur écran tactile

// Galerie filtrable en mosaïque (colonnes CSS : chaque photo garde son format),
// ouverture en plein écran dans un <dialog> modal (focus piégé et Échap gérés par le navigateur)
export default function Galerie({ filtreInitial }: { filtreInitial: Filtre }) {
  const [filtre, setFiltre] = useState<Filtre>(filtreInitial)
  const [ouverte, setOuverte] = useState<number | null>(null) // index dans la liste filtrée
  const dialogRef = useRef<HTMLDialogElement>(null)
  const departBalayage = useRef<number | null>(null)
  const bandeauRef = useRef<HTMLUListElement>(null)

  const visibles = filtre === "tout" ? photos : photos.filter((p) => p.categorie === filtre)
  const photo = ouverte !== null ? visibles[ouverte] : null

  const choisirFiltre = (f: Filtre) => {
    setFiltre(f)
    // Adresse partageable, sans nouvelle entrée dans l'historique
    const url = f === "tout" ? "/galerie" : `/galerie?categorie=${f}`
    window.history.replaceState(null, "", url)
  }

  const suivante = (pas: number) =>
    setOuverte((i) => (i === null ? i : (i + pas + visibles.length) % visibles.length))

  // Plein écran : ouverture du dialog et page bloquée derrière
  useEffect(() => {
    const dialog = dialogRef.current
    if (ouverte === null || !dialog) return
    if (!dialog.open) dialog.showModal()
    const root = document.documentElement
    root.style.overflow = "hidden"
    return () => {
      root.style.overflow = ""
    }
  }, [ouverte])

  // Vignette de la photo affichée ramenée au centre du bandeau (défilement horizontal seul)
  useEffect(() => {
    const bandeau = bandeauRef.current
    const vignette = ouverte !== null ? (bandeau?.children[ouverte] as HTMLElement | undefined) : undefined
    if (!bandeau || !vignette) return
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    bandeau.scrollTo({
      left: vignette.offsetLeft - (bandeau.clientWidth - vignette.clientWidth) / 2,
      behavior: reduit ? "auto" : "smooth",
    })
  }, [ouverte])

  const fermer = () => dialogRef.current?.close() // déclenche onClose

  const surTouche = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") suivante(1)
    if (e.key === "ArrowLeft") suivante(-1)
  }

  const debutBalayage = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") departBalayage.current = e.clientX
  }
  const finBalayage = (e: PointerEvent) => {
    if (departBalayage.current === null) return
    const ecart = e.clientX - departBalayage.current
    departBalayage.current = null
    if (Math.abs(ecart) > SEUIL_BALAYAGE) suivante(ecart < 0 ? 1 : -1)
  }

  const onglets: { id: Filtre; label: string; nombre: number }[] = [
    { id: "tout", label: "Tout", nombre: photos.length },
    ...categories.map((c) => ({ ...c, nombre: photos.filter((p) => p.categorie === c.id).length })),
  ]

  return (
    <>
      {/* FILTRES — collés sous le header pendant le défilement */}
      <nav
        aria-label="Catégories de photos"
        className="sticky top-16 lg:top-20 z-40 border-b border-primary-dark/10 bg-background/95 backdrop-blur-sm"
      >
        <ul className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto py-3 [scrollbar-width:none]">
          {onglets.map(({ id, label, nombre }) => {
            const actif = filtre === id
            return (
              <li key={id} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={actif}
                  onClick={() => choisirFiltre(id)}
                  className={`rounded-button px-3.5 py-2 font-heading text-sm tracking-wide uppercase transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark ${
                    actif ? "bg-primary-dark text-text-light" : "text-text-dark hover:bg-primary-dark/10"
                  }`}
                >
                  {label}
                  <span className={`ml-1.5 tabular-nums ${actif ? "text-text-light/80" : ""}`}>{nombre}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* MOSAÏQUE — clé = filtre : les photos réapparaissent en cascade à chaque changement */}
      <section aria-live="polite" className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <p className="sr-only">{visibles.length} photos</p>
        <ul key={filtre} className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
          {visibles.map((p, i) => (
            <li
              key={p.src}
              style={{ animationDelay: `${Math.min(i * 50, 500)}ms` } as CSSProperties}
              className="mb-3 md:mb-4 break-inside-avoid animate-fade-up motion-reduce:animate-none"
            >
              <button
                type="button"
                onClick={() => setOuverte(i)}
                className="group relative block w-full overflow-hidden rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark"
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  width={p.largeur}
                  height={p.hauteur}
                  // Premières photos visibles dès l'arrivée : chargées tout de suite (LCP)
                  loading={i < 4 ? "eager" : undefined}
                  sizes="(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  className="h-auto w-full"
                />
                {/* Légende au survol (pas de zoom : choix de direction artistique) */}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest/80 to-transparent px-4 pt-12 pb-3 text-left font-heading text-sm md:text-base text-primary-light opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                  {p.legende}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* PLEIN ÉCRAN — voile sombre neutre et flouté (la page reste devinée derrière),
          bandeau de vignettes en bas pour sauter d'une photo à l'autre */}
      <dialog
        ref={dialogRef}
        aria-label="Photo en plein écran"
        onClose={() => setOuverte(null)}
        onKeyDown={surTouche}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-primary-light backdrop:bg-[#0a0d0c]/85 backdrop:backdrop-blur-md open:flex open:flex-col"
      >
        {photo && ouverte !== null && (
          <>
            <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
              <p className="text-sm tabular-nums text-primary-light/80">
                {ouverte + 1} / {visibles.length}
              </p>
              <button
                type="button"
                onClick={fermer}
                aria-label="Fermer"
                className="rounded-full p-2 transition-colors duration-300 hover:bg-primary-light/10 focus-visible:outline-2 focus-visible:outline-sand"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            <div
              className="relative min-h-0 flex-1 touch-pan-y"
              onPointerDown={debutBalayage}
              onPointerUp={finBalayage}
              onPointerCancel={() => (departBalayage.current = null)}
            >
              <div className="absolute inset-0 md:inset-x-24">
                <Image
                  key={photo.src}
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="100vw"
                  className="object-contain drop-shadow-2xl animate-valeur motion-reduce:animate-none"
                />
              </div>
              {visibles.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => suivante(-1)}
                    aria-label="Photo précédente"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-primary-light/10 p-2 backdrop-blur-sm transition-colors duration-300 hover:bg-primary-light/20 focus-visible:outline-2 focus-visible:outline-sand md:left-6 md:p-3"
                  >
                    <ChevronLeft className="w-6 h-6" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => suivante(1)}
                    aria-label="Photo suivante"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary-light/10 p-2 backdrop-blur-sm transition-colors duration-300 hover:bg-primary-light/20 focus-visible:outline-2 focus-visible:outline-sand md:right-6 md:p-3"
                  >
                    <ChevronRight className="w-6 h-6" aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            <p className="px-4 pt-4 pb-1.5 text-center font-heading text-base md:text-lg">{photo.legende}</p>

            {/* VIGNETTES — la photo affichée est mise en avant et gardée au centre du bandeau.
                Marge haute : le défilement horizontal rogne aussi le cadre de la vignette active */}
            {visibles.length > 1 && (
              <ul
                ref={bandeauRef}
                aria-label="Toutes les photos"
                className="relative flex gap-2 overflow-x-auto px-4 pt-1.5 pb-4 md:px-6 md:pb-6 [scrollbar-width:none]"
              >
                {visibles.map((p, i) => {
                  const active = i === ouverte
                  return (
                    <li key={p.src} className="shrink-0 first:ml-auto last:mr-auto">
                      <button
                        type="button"
                        onClick={() => setOuverte(i)}
                        aria-label={p.legende}
                        aria-current={active ? "true" : undefined}
                        className={`relative block h-14 w-14 overflow-hidden rounded-[0.5rem] transition duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand md:h-16 md:w-20 ${
                          active ? "opacity-100 ring-2 ring-primary-light" : "opacity-40 hover:opacity-80"
                        }`}
                      >
                        <Image src={p.src} alt="" fill sizes="80px" className="object-cover" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}
      </dialog>
    </>
  )
}
