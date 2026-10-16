import Link from "next/link"
import Image from "next/image"
import { Mail, Phone } from "lucide-react"
import type { CSSProperties, ReactNode } from "react"
import SelecteurDevise from "@/components/SelecteurDevise"
import { contact, socials, type SocialNetwork } from "@/data/contact"

// Pages principales (routes du cahier des charges)
const footerLinks = [
  { label: "L'hôtel", href: "/hotel" },
  { label: "Hébergements", href: "/hebergements" },
  { label: "Expériences", href: "/experiences" },
  { label: "Restaurant & Bar", href: "/restaurant" },
  { label: "Galerie", href: "/galerie" },
  { label: "Infos pratiques", href: "/infos-pratiques" },
]

// Pages légales : hors arborescence du cahier des charges, à créer
const legalLinks = [
  { label: "Contact", href: "/contact" },
  { label: "Mentions légales", href: "/mentions-legales" },
]

// Icônes des réseaux (lucide-react n'a plus d'icônes de marques) — même grille 24 px et trait que lucide
const socialIcons: Record<SocialNetwork, ReactNode> = {
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  instagram: (
    <>
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  // Chouette simplifiée : deux yeux, la tête et le bec
  tripadvisor: (
    <>
      <circle cx="7" cy="14" r="4" />
      <circle cx="17" cy="14" r="4" />
      <path d="M7 14h.01M17 14h.01" />
      <path d="M2.5 10C5.4 7.7 8.6 6.5 12 6.5s6.6 1.2 9.5 3.5" />
      <path d="m11 17.2 1 2 1-2" />
    </>
  ),
}

const linkStyle = "text-[0.95rem] text-primary-light/75 transition-colors duration-300 hover:text-sand"
const headingStyle = "font-heading text-xl text-primary-light"
const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties

export default function Footer() {
  const { address } = contact

  return (
    <footer className="bg-forest text-primary-light">
      <div className="max-w-7xl mx-auto px-4">

        {/* Marque | navigation | coordonnées — une colonne sur mobile */}
        <div className="grid gap-12 pt-16 pb-14 md:grid-cols-12 md:gap-x-6 md:pt-20 md:pb-16">

          {/* MARQUE : logo, présentation, réseaux */}
          <div data-reveal className="md:col-span-5 space-y-6">
            <Link href="/" aria-label="Chez L'Avocatier — accueil" className="inline-block">
              <Image src="/logo-texte-blanc.svg" alt="" width={1998} height={421} className="h-9 md:h-10 w-auto" />
            </Link>

            <p className="max-w-sm text-pretty text-[0.95rem] leading-relaxed text-primary-light/75">
              Hôtel et bungalows face à l’océan à Vohilava, sur l’île Sainte-Marie. Une adresse confidentielle
              tenue par Joëlle &amp; Stéphane.
            </p>

            {socials.length > 0 && (
              <ul className="flex items-center gap-3">
                {socials.map((s) => (
                  <li key={s.network}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${contact.name} sur ${s.label}`}
                      className="grid place-items-center w-10 h-10 rounded-full ring-1 ring-primary-light/40 transition-colors duration-300 hover:bg-primary-light hover:text-forest hover:ring-primary-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className="w-[18px] h-[18px]"
                      >
                        {socialIcons[s.network]}
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* NAVIGATION — deux colonnes sur mobile */}
          <nav data-reveal style={delay(120)} aria-labelledby="footer-nav" className="md:col-span-3 md:col-start-7">
            <h2 id="footer-nav" className={headingStyle}>Découvrir</h2>
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3.5 md:grid-cols-1">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkStyle}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* COORDONNÉES */}
          <div data-reveal style={delay(240)} className="md:col-span-3 md:col-start-10 space-y-10">
            {(contact.phone || contact.email) && (
              <div>
                <h2 className={headingStyle}>Contact</h2>
                <ul className="mt-5 space-y-3">
                  {contact.phone && (
                    <li>
                      <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className={`inline-flex items-center gap-3 ${linkStyle}`}>
                        <Phone className="w-4 h-4 shrink-0 stroke-[1.5]" aria-hidden="true" />
                        {contact.phone}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div>
              <h2 className={headingStyle}>Adresse</h2>
              <address className="mt-5 not-italic text-[0.95rem] leading-relaxed text-primary-light/75">
                {contact.name}
                <br />
                {address.locality}, {address.postalCode} {address.island}, {address.country}
                <br />
                <span className="block mt-2">{contact.airport}</span>
              </address>
            </div>
          </div>
        </div>

        {/* BANDEAU BAS : copyright | devise et liens légaux */}
        <div className="flex flex-col-reverse gap-3 border-t border-primary-light/15 pt-6 pr-16 md:pr-20 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-sm text-primary-light/65 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">© {new Date().getFullYear()} {contact.name}. Tous droits réservés.</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <SelecteurDevise />
            <ul className="flex items-center divide-x divide-primary-light/30">
              {legalLinks.map((link) => (
                <li key={link.href} className="px-3 first:pl-0 last:pr-0">
                  <Link href={link.href} className="transition-colors duration-300 hover:text-sand">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
