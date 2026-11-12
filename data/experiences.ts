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

// Photo sans crédit connu (fournie par l'utilisateur)
export type PhotoLieu = Omit<PhotoLibre, "credit"> & { credit?: PhotoLibre["credit"] }

// Deux photos au-dessus du panorama, dans la grande case de la mosaïque (page Expériences)
// TODO client : provenance et droits à confirmer (fournies le 2026-11-11 ; le phare porte la signature « J. C. Clain »)
export const photosIle: [PhotoLieu, PhotoLieu] = [
  {
    src: "/images/island/cascade-foret.jpeg",
    alt: "Cascade qui dévale des rochers sombres au milieu de la forêt tropicale, sous un cocotier",
    position: "object-[center_70%]",
  },
  {
    src: "/images/island/phare.jpeg",
    alt: "Ancien phare métallique rouillé qui se dresse au-dessus de la végétation, sous un ciel bleu",
    position: "object-[center_25%]",
  },
]

// Lieux incontournables de l'île (cahier des charges : « Découvrir Sainte-Marie »).
// `image2` : seconde photo affichée à côté de la première dans la carte (page Expériences).
export const lieux: { nom: string; texte: string; image: PhotoLieu; image2?: PhotoLieu }[] = [
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
    texte: "Ambodifotatra, chef-lieu de l’île et son marché animé, le Cimetière des Pirates près de la baie des Forbans, ainsi que la première église catholique de Madagascar, construite en 1857.",
    // TODO client : source et droits de cette photo à confirmer (fournie sans crédit le 2026-11-12, remplace celle de Wikimedia)
    image: {
      src: "/images/island/cimetiere-pirates.jpeg",
      alt: "Stèles et tombes de pierre dans l'herbe, sous un palmier et des ravenalas, au cimetière des pirates",
      position: "object-[center_60%]",
    },
    // TODO client : source et droits de cette photo à confirmer (fournie sans crédit le 2026-11-11)
    image2: {
      src: "/images/island/eglise-ambodifotatra.jpg",
      alt: "L'église catholique d'Ambodifotatra, murs crème et toit rouge, au milieu des palmiers",
      position: "object-[78%_center]",
    },
  },
  {
    nom: "La forêt d’Ikalalao",
    texte: "Au centre de l’île, une forêt préservée à parcourir à pied, entre fougères arborescentes et orchidées.",
    image: {
      // TODO client : provenance et droits à confirmer (fournie le 2026-11-11 ; ancienne photo Wikimedia : foret.jpeg).
      // Ce sont des propithèques à diadème, absents de Sainte-Marie (forêts de l'est de la Grande Terre).
      src: "/images/island/foret-ikalalao.jpeg",
      alt: "Deux lémuriens au pelage noir, blanc et orangé accrochés aux branches dans la forêt tropicale",
      position: "object-[45%_center]",
    },
  },
  {
    nom: "La pointe nord",
    texte: "Ici la côte se fait rocheuse. À Ambodiatafana, des bassins naturels creusés dans la roche volcanique permettent de se baigner à l’abri des vagues.",
    image: {
      // TODO client : provenance et droits à confirmer (fournie le 2026-11-11 ; ancienne photo Wikimedia : rochers-nord.jpeg)
      src: "/images/island/cote-nord.jpeg",
      alt: "Plage de sable bordée de rochers sombres et de cocotiers, pirogue à balancier au bord d'un lagon turquoise",
      position: "object-[72%_center]",
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
