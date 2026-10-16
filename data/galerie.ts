// Galerie (cahier des charges) : catégories filtrables, ouverture en plein écran.
// Photos du client uniquement. Pas de catégorie « Sainte-Marie » du cahier des charges : une seule photo de l’île
// (retirée à la demande, 2026-10-16) ; à rétablir si le client fournit d’autres photos (baleines, île aux Nattes, villages).

export type CategorieGalerie = "hotel" | "chambres" | "piscine" | "plage" | "jardin" | "restaurant"

export const categories: { id: CategorieGalerie; label: string }[] = [
  { id: "hotel", label: "L’hôtel" },
  { id: "chambres", label: "Chambres" },
  { id: "piscine", label: "Piscine" },
  { id: "plage", label: "Plage" },
  { id: "jardin", label: "Jardin" },
  { id: "restaurant", label: "Restaurant" },
]

export type PhotoGalerie = {
  src: string
  alt: string
  legende: string
  largeur: number
  hauteur: number
  categorie: CategorieGalerie // une seule : une photo n’apparaît jamais dans deux catégories
}

// Ordre de « Tout » : les catégories alternent pour garder du rythme.
// Une seule prise par scène : plage-pirogues, jardin-table-plage et jardin-ombres, quasi identiques
// à lagon-pirogues, table-ocean-coucher-soleil et jardin-bungalows, restent hors de la galerie.
export const photos: PhotoGalerie[] = [
  { src: "/hero-home.jpeg", alt: "Le jardin face à l'océan au coucher du soleil, cocotiers et paillote", legende: "Le coucher de soleil depuis le jardin", largeur: 1535, hauteur: 1024, categorie: "jardin" },
  { src: "/images/rooms/bungalow-ocean.jpeg", alt: "Bungalow aux murs vert profond, lit à baldaquin et suspensions tressées", legende: "Bungalow Océan", largeur: 1200, hauteur: 1600, categorie: "chambres" },
  { src: "/images/pool/piscine-bungalows.jpeg", alt: "La piscine bordée de pierres, face aux bungalows", legende: "La piscine, entre les bungalows", largeur: 1600, hauteur: 1200, categorie: "piscine" },
  { src: "/images/beach/plage-cocotier.jpeg", alt: "Cocotier penché au-dessus de la plage et de l'océan", legende: "Le cocotier de la plage", largeur: 1200, hauteur: 1600, categorie: "plage" },
  { src: "/images/restaurant/table-ocean-coucher-soleil.jpeg", alt: "Table et paillote dans le jardin, face à l'océan au coucher du soleil", legende: "Une table face à l’océan", largeur: 1200, hauteur: 1600, categorie: "restaurant" },
  { src: "/images/hotel/panneau.jpeg", alt: "Le panneau jaune peint de Chez L'Avocatier au bord de la route", legende: "Le panneau, au bord de la route", largeur: 2048, hauteur: 1152, categorie: "hotel" },
  { src: "/images/rooms/sdb-jungle.jpeg", alt: "Salle d'eau à double vasque, murs peints d'une fresque de jungle", legende: "Salle d’eau peinte d’une fresque", largeur: 1600, hauteur: 1200, categorie: "chambres" },
  { src: "/images/island/lagon-pirogues.jpeg", alt: "Pirogues sur le lagon de Sainte-Marie au coucher du soleil", legende: "Pirogues sur le lagon", largeur: 1200, hauteur: 1600, categorie: "plage" },
  { src: "/images/hotel/jardin-bungalows.jpeg", alt: "Le jardin tropical et les bungalows en fin de journée", legende: "Le jardin et les bungalows", largeur: 1600, hauteur: 1200, categorie: "jardin" },
  { src: "/images/restaurant/poisson-grille.jpeg", alt: "Poisson grillé entier et poêlée de légumes", legende: "Poisson grillé et légumes du jour", largeur: 1200, hauteur: 1600, categorie: "restaurant" },
  { src: "/images/pool/piscine-escalier.jpeg", alt: "Les marches en pierre de la piscine, eau turquoise et végétation", legende: "Les marches de la piscine", largeur: 1200, hauteur: 1600, categorie: "piscine" },
  { src: "/images/rooms/bungalow-jardin.jpeg", alt: "Bungalow aux murs violine, lit double et lit simple sous les moustiquaires", legende: "Bungalow Jardin", largeur: 1200, hauteur: 1600, categorie: "chambres" },
  { src: "/images/hotel/salon.jpeg", alt: "Le salon : canapés en bois, table basse et escalier habillé de branches blanches", legende: "Le salon", largeur: 1600, hauteur: 1200, categorie: "hotel" },
  { src: "/images/beach/ocean-crepuscule.jpeg", alt: "L'océan au crépuscule, silhouette d'un palmier", legende: "L’océan au crépuscule", largeur: 1536, hauteur: 2048, categorie: "plage" },
  { src: "/images/restaurant/petit-dejeuner.jpeg", alt: "Plateau du petit-déjeuner : fruits, viennoiseries, confitures et jus de fruits", legende: "Le petit-déjeuner", largeur: 1005, hauteur: 1600, categorie: "restaurant" },
  { src: "/images/hotel/jardin.jpeg", alt: "La pelouse du jardin tropical et la piscine sous un ciel de nuages", legende: "La pelouse et la piscine", largeur: 1200, hauteur: 1600, categorie: "jardin" },
  { src: "/images/rooms/chambre-verte.jpeg", alt: "Chambre aux murs vert forêt, lit à baldaquin et fleurs sur les draps", legende: "Chambre Verte", largeur: 1200, hauteur: 1600, categorie: "chambres" },
  { src: "/images/hotel/allee-baobabs.jpeg", alt: "Allée dont le mur est peint d'une fresque de baobabs", legende: "L’allée des baobabs", largeur: 1600, hauteur: 1200, categorie: "hotel" },
  { src: "/images/restaurant/glace-vanille.jpeg", alt: "Coupe de glace à la vanille", legende: "Glace à la vanille", largeur: 1200, hauteur: 1600, categorie: "restaurant" },
  { src: "/images/hotel/coucher-soleil-piscine.jpeg", alt: "La piscine et le bar au soleil couchant, cocotiers en contre-jour", legende: "La piscine au soleil couchant", largeur: 1600, hauteur: 1200, categorie: "piscine" },
  { src: "/images/rooms/chambre-ocre.jpeg", alt: "Chambre aux murs ocre, grand lit à baldaquin et étoile de mer au mur", legende: "Chambre Ocre", largeur: 1080, hauteur: 1350, categorie: "chambres" },
  { src: "/images/rooms/bungalow-famille.jpeg", alt: "Grand bungalow sous une haute charpente blanche, lit à baldaquin", legende: "Bungalow Famille", largeur: 1200, hauteur: 1600, categorie: "chambres" },
  { src: "/images/restaurant/paillote-crepuscule.jpeg", alt: "L'océan au crépuscule, vu depuis l'abri d'une paillote", legende: "Sous la paillote, au crépuscule", largeur: 1200, hauteur: 1600, categorie: "plage" },
  { src: "/images/rooms/sdb-paysage.jpeg", alt: "Salle d'eau peinte d'un paysage de collines, vasque blanche", legende: "Salle d’eau, fresque de collines", largeur: 1200, hauteur: 1600, categorie: "chambres" },
  { src: "/images/restaurant/poulet-riz.jpeg", alt: "Cuisse de poulet grillée et timbale de riz", legende: "Poulet grillé et son riz", largeur: 1200, hauteur: 1600, categorie: "restaurant" },
  { src: "/images/rooms/sdb-bambous.jpeg", alt: "Salle d'eau à double vasque, fresque de bambous", legende: "Salle d’eau, fresque de bambous", largeur: 1600, hauteur: 1200, categorie: "chambres" },
  { src: "/images/restaurant/tiramisu.jpeg", alt: "Part de tiramisu saupoudrée de cacao", legende: "Tiramisu", largeur: 1200, hauteur: 1600, categorie: "restaurant" },
  { src: "/images/rooms/chambre-ocre-2.jpeg", alt: "Chambre au parquet sombre, décor de branches blanches", legende: "Chambre Ocre, en fin de journée", largeur: 1600, hauteur: 1200, categorie: "chambres" },
]
