// Classes partagées des formulaires de compte. Module sans "use client" : une constante exportée par un module
// client arriverait dans une page serveur sous forme de référence, pas de texte.

// Encre sombre plutôt que vert plein : le bouton vert reste réservé à la réservation ; le vert revient au survol
export const classesBouton =
  "inline-flex w-full items-center justify-center gap-2 rounded-button bg-ink px-6 py-3.5 text-sm font-medium tracking-wide text-text-light transition-colors hover:bg-primary-dark disabled:cursor-wait disabled:opacity-70"

export const classesLien =
  "text-sm text-ink/70 underline decoration-ink/30 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark"
