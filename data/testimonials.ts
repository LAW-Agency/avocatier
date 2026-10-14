export type Testimonial = {
  quote: string
  author?: string
  source?: string   // plateforme d'origine de l'avis
}

// Témoignage existant cité dans le cahier des charges (avis Tripadvisor).
// TODO client : confirmer les avis à mettre en avant et en ajouter d'autres.
export const testimonials: Testimonial[] = [
  { quote: "Excellent accueil de Joëlle et Stéphane…", source: "Tripadvisor" },
]

// Note présentée comme élément secondaire (peu d'avis pour l'instant)
export const rating = { score: "10/10", label: "Excellent emplacement" }
