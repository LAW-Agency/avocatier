export type SocialNetwork = "facebook" | "instagram" | "tripadvisor"

// Coordonnées de l'établissement (footer, et plus tard page contact)
// Toujours le nom complet : la « Villa l'Avocatier » voisine est un autre établissement
export const contact = {
  name: "Chez L’Avocatier",
  address: {
    locality: "Vohilava",
    postalCode: "515",
    island: "Île Sainte-Marie",
    country: "Madagascar",
  },
  airport: "À 3 km de l’aéroport de Sainte-Marie",

  // TODO client : téléphone et e-mail absents du cahier des charges — valeurs provisoires à remplacer.
  // Une valeur vide masque la ligne dans le footer.
  phone: "+261 00 00 000 00",
  email: "contact@example.com",
}

// TODO client : liens provisoires vers les pages d'accueil des réseaux — à remplacer par les pages de l'hôtel.
// Retirer une entrée masque son icône dans le footer.
export const socials: { network: SocialNetwork; label: string; href: string }[] = [
  { network: "facebook", label: "Facebook", href: "https://www.facebook.com/" },
  { network: "instagram", label: "Instagram", href: "https://www.instagram.com/" },
  { network: "tripadvisor", label: "Tripadvisor", href: "https://www.tripadvisor.fr/" },
]
