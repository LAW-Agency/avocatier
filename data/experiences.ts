import { Bike, Fish, Sailboat, Shell, Waves, type LucideIcon } from "lucide-react"

// Photos libres de Wikimedia Commons (le client n'a pas d'images de l'île hors de Vohilava) :
// les licences CC BY / CC BY-SA imposent de citer l'auteur et la licence. TODO : plus affichés sur /experiences
// depuis le 2026-11-10 (encore sur l'accueil) — à remettre ailleurs (page de crédits, pied de page…)
export interface PhotoLibre {
  src: string
  alt: string
  position?: string // cadrage, ex. "object-[center_40%]"
  credit: { auteur: string; licence: string; source: string; licenceUrl?: string }
}

export const panoramaIle: PhotoLibre = {
  src: "/images/island/baie-la-crique.jpeg",
  alt: "Une baie de Sainte-Marie vue des hauteurs : forêt, plage de sable et îlots rocheux dans le lagon",
  position: "object-[center_60%]",
  credit: {
    auteur: "M worm",
    licence: "domaine public",
    source: "https://commons.wikimedia.org/wiki/File:Beache_of_La_Crique_Sainte_Marie.jpg",
  },
}

// Lieux incontournables de l'île (cahier des charges : « Découvrir Sainte-Marie »)
export const lieux: { nom: string; texte: string; image: PhotoLibre }[] = [
  {
    nom: "L’île aux Nattes",
    texte: "Au sud de Sainte-Marie, à quelques minutes de pirogue : sable blanc, eau turquoise, pas une voiture.",
    image: {
      src: "/images/island/plage-ile-aux-nattes.jpeg",
      alt: "Plage de sable blanc bordée de cocotiers sur l'île aux Nattes",
      credit: {
        auteur: "Anai171",
        licence: "CC BY-SA 4.0",
        source: "https://commons.wikimedia.org/wiki/File:Plage_de_l%27ile_aux_Nattes,_Sainte-Marie,_Madagascar.jpg",
        licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
      },
    },
  },
  {
    nom: "Ambodifotatra",
    texte: "Le chef-lieu de l’île, son marché animé, sa vieille église et, tout près, le cimetière des pirates face à la baie.",
    image: {
      src: "/images/island/cimetiere-pirates.jpeg",
      alt: "Vieilles tombes en pierre parmi les ravenalas au cimetière des pirates",
      credit: {
        auteur: "Lemurbaby",
        licence: "CC BY-SA 3.0",
        source: "https://commons.wikimedia.org/wiki/File:Sainte_marie_Madagascar_pirate_cemetery_2.JPG",
        licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr",
      },
    },
  },
  {
    nom: "La forêt d’Ikalalao",
    texte: "Au centre de l’île, une forêt préservée à parcourir à pied, entre fougères arborescentes et orchidées.",
    image: {
      src: "/images/island/foret.jpeg",
      alt: "Sous-bois de forêt tropicale humide sur l'île Sainte-Marie",
      credit: {
        auteur: "Frank Vassen",
        licence: "CC BY 2.0",
        source: "https://commons.wikimedia.org/wiki/File:Rainforest_remnant_on_Ile_Sainte_Marie,_Madagascar_(4026758529).jpg",
        licenceUrl: "https://creativecommons.org/licenses/by/2.0/deed.fr",
      },
    },
  },
  {
    // Pas de photo libre d'Ambodiatafana : le lieu est présenté avec la côte nord, que montre la photo
    nom: "La pointe nord",
    texte: "Ici la côte se fait rocheuse. À Ambodiatafana, des bassins naturels creusés dans la roche volcanique permettent de se baigner à l’abri des vagues.",
    image: {
      src: "/images/island/rochers-nord.jpeg",
      alt: "Rochers sombres et eau turquoise à Coco Bay, au nord de Sainte-Marie",
      credit: {
        auteur: "Anai171",
        licence: "CC BY-SA 4.0",
        source: "https://commons.wikimedia.org/wiki/File:Vue_sur_la_mer_depuis_les_rochers_de_Coco_Bay,_au_nord_de_Sainte-Marie,_Madagascar.jpg",
        licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
      },
    },
  },
]

// Excursions et activités nautiques
// TODO client : préciser lesquelles l'hôtel organise ou recommande (prestataires, tarifs, saison)
export const activites: { nom: string; periode?: string; texte: string; icon: LucideIcon }[] = [
  {
    nom: "Observation des baleines",
    periode: "Juillet à septembre",
    texte: "Partez en mer à la rencontre des majestueuses baleines à bosse et de leurs baleineaux. Un spectacle naturel exceptionnel !",
    icon: Waves,
  },
  {
    nom: "Plongée et snorkeling",
    texte: "Explorez les fonds marins, les récifs coralliens et leurs poissons tropicaux. Masque et tuba ou plongée, à vous de choisir !",
    icon: Shell,
  },
  {
    nom: "Balade en pirogue",
    texte: "Embarquez à bord d’une pirogue traditionnelle pour découvrir les eaux turquoise du lagon et rejoindre la magnifique île aux Nattes.",
    icon: Sailboat,
  },
  {
    nom: "Pêche traditionnelle",
    texte: "Partagez un moment authentique avec les pêcheurs du village ou tentez une sortie de pêche au large.",
    icon: Fish,
  },
  {
    nom: "Tour de l’île",
    texte: "Partez à la découverte des villages, des plages sauvages et des paysages magnifiques de Sainte-Marie, à votre rythme et selon vos envies.",
    icon: Bike,
  },
]
