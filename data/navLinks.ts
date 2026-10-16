export type NavLink = {
  label: string
  href: string
  submenu?: { label: string; href: string }[]
}

// Menu resserré : sous-menus seulement
// quand ils apportent quelque chose, sans entrée répétée d'un menu à l'autre
// (plage et piscine dans L'hôtel, photos dans Galerie)
export const navLinks: NavLink[] = [
  { label: "Accueil", href: "/" },
  {
    label: "L'hôtel",
    href: "/hotel",
    submenu: [
      { label: "Notre histoire", href: "/hotel#histoire" },
      { label: "Jardin, plage & piscine", href: "/hotel#jardin" },
    ],
  },
  {
    label: "Hébergements",
    href: "/hebergements",
    submenu: [
      { label: "Bungalows", href: "/hebergements#bungalows" },
      { label: "Chambres", href: "/hebergements#chambres" },
    ],
  },
  {
    label: "Expériences",
    href: "/experiences",
    submenu: [
      { label: "Découverte de l'île", href: "/experiences#sainte-marie" },
      { label: "Activités & excursions", href: "/experiences#excursions" },
    ],
  },
  { label: "Restaurant & Bar", href: "/restaurant" },
  { label: "Galerie", href: "/galerie" },
  // Infos pratiques (localisation, comment venir, navette, FAQ) : à ajouter avec sa page
]
