import { Bike, Fish, Sailboat, Shell, Waves, type LucideIcon } from "lucide-react"

// Une journée sur place : « vendre ce que l'on ressent » (cahier des charges, page Expériences)
export const journee: { moment: string; titre: string; texte: string; image: { src: string; alt: string } }[] = [
  {
    moment: "Le matin",
    titre: "Une baignade, puis le petit-déjeuner",
    texte: "Quelques brasses dans une mer calme, puis fruits tropicaux, viennoiseries et jus frais, sans regarder l’heure.",
    image: { src: "/images/restaurant/petit-dejeuner.jpeg", alt: "Plateau du petit-déjeuner : fruits, viennoiseries, confitures et jus de fruits" },
  },
  {
    moment: "Midi",
    titre: "La piscine au cœur du jardin",
    texte: "Quand le soleil est haut, on file à la piscine, entre les massifs tropicaux, avant un déjeuner sans se presser.",
    image: { src: "/images/pool/piscine-escalier.jpeg", alt: "Les marches en pierre de la piscine, eau turquoise et végétation" },
  },
  {
    moment: "L’après-midi",
    titre: "Une sieste sous les cocotiers",
    texte: "Un hamac, un livre, le bruit des vagues. Ici, ne rien faire est une activité à part entière.",
    image: { src: "/hero-home.jpeg", alt: "Le jardin face à l'océan au coucher du soleil, cocotiers et paillote" },
  },
  {
    moment: "Le soir",
    titre: "Le soleil se couche sur l’océan",
    texte: "Un verre à la main, on regarde le ciel s’embraser. Puis la table est mise, face à la mer.",
    image: { src: "/images/restaurant/paillote-crepuscule.jpeg", alt: "L'océan au crépuscule, vu depuis l'abri d'une paillote" },
  },
]

// Lieux incontournables de l'île (cahier des charges : « Découvrir Sainte-Marie »)
export const lieux: { nom: string; texte: string }[] = [
  {
    nom: "L’île aux Nattes",
    texte: "Au sud de Sainte-Marie, à quelques minutes de pirogue : sable blanc, eau turquoise, pas une voiture.",
  },
  {
    nom: "Ambodifotatra",
    texte: "Le chef-lieu de l’île, son marché animé, sa vieille église et, tout près, le cimetière des pirates face à la baie.",
  },
  {
    nom: "La piscine naturelle d’Ambodiatafana",
    texte: "À la pointe nord-est, des bassins creusés dans la roche volcanique où l’on se baigne à l’abri des vagues.",
  },
  {
    nom: "La forêt d’Ikalalao",
    texte: "Au centre de l’île, une forêt préservée à parcourir à pied, entre fougères arborescentes et orchidées.",
  },
]

// Excursions et activités nautiques
// TODO client : préciser lesquelles l'hôtel organise ou recommande (prestataires, tarifs, saison)
export const activites: { nom: string; texte: string; icon: LucideIcon }[] = [
  {
    nom: "Observation des baleines",
    texte: "De juillet à septembre, sortie en mer à la rencontre des baleines à bosse et de leurs baleineaux.",
    icon: Waves,
  },
  {
    nom: "Plongée et snorkeling",
    texte: "Récifs coralliens, tortues et poissons tropicaux, à explorer avec un masque ou en plongée encadrée.",
    icon: Shell,
  },
  {
    nom: "Balade en pirogue",
    texte: "Glisser sur le lagon à bord d’une pirogue traditionnelle, jusqu’à l’île aux Nattes ou le long de la côte.",
    icon: Sailboat,
  },
  {
    nom: "Pêche",
    texte: "Partir au petit matin avec les pêcheurs du village, ou tenter sa chance au large.",
    icon: Fish,
  },
  {
    nom: "Tour de l’île",
    texte: "À vélo, à scooter ou en voiture avec chauffeur : villages, plages désertes et points de vue sur la côte est.",
    icon: Bike,
  },
]
