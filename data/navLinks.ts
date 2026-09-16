export type NavLink = {
  label: string
  href: string
  icon?: string
  submenu?: { label: string; href: string }[]
}

export const navLinks: NavLink[] = [
  { label: "Accueil", href: "/", icon: "" },
  {
    label: "L'hôtel",
    href: "/",
    icon: "",
    submenu: [
      { label: "Notre histoire", href: "/" },
      { label: "Le jardin & la nature", href: "/" },
      { label: "La plage privée", href: "/" },
      { label: "Piscine & espaces communs", href: "/" },
    ],
  },
  {
    label: "Hébergements",
    href: "/",
    icon: "",
    submenu: [
      { label: "Bungalows", href: "/" },
      { label: "Chambres", href: "/" },
      { label: "Galerie des hébergements", href: "/" },
    ],
  },
  {
    label: "Expériences",
    href: "/",
    icon: "",
    submenu: [
      { label: "Plage & baignade", href: "/" },
      { label: "Découverte de l'île", href: "/" },
      { label: "Activités", href: "/" },
      { label: "Excursions", href: "/" },
    ],
  },
  {
    label: "Restaurant & Bar",
    href: "/",
    icon: "",
    submenu: [
      { label: "Petit-déjeuner", href: "/" },
      { label: "Restaurant", href: "/" },
      { label: "Bar", href: "/" },
    ],
  },
  {
    label: "Galerie",
    href: "/",
    icon: "",
    submenu: [
      { label: "L'hôtel", href: "/" },
      { label: "Chambres", href: "/" },
      { label: "Piscine", href: "/" },
      { label: "Plage", href: "/" },
      { label: "Île Sainte-Marie", href: "/" },
    ],
  },
  {
    label: "Infos pratiques",
    href: "/",
    icon: "",
    submenu: [
      { label: "Localisation", href: "/" },
      { label: "Comment venir", href: "/" },
      { label: "Navette aéroport", href: "/" },
      { label: "FAQ", href: "/" },
    ],
  },
]