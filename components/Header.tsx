'use client'
import Link from "next/link"
import Image from "next/image"
import { ChevronDown, Menu, X } from "lucide-react"
import { useState } from "react"
import { navLinks } from "@/data/navLinks"

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <header className="w-full bg-background border-b border-primary-dark/10">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:flex items-center justify-between h-22 gap-6">

        {/* LOGO à gauche */}
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/logo.png"
            alt="Logo"
            width={90}
            height={60}
            className="object-contain"
            priority
          />
        </Link>

        

        {/* NAVIGATION desktop */}
        <nav className="hidden lg:flex items-center gap-6 ml-auto">
          {navLinks.map((link) => (
            <div key={link.label} className="relative group">
              <Link
                href={link.href}
                className="flex items-center gap-1 text-l font-medium text-text-dark hover:text-primary-accent transition-colors py-2"
              >
                {link.label}
                {link.submenu && (
                  <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                )}
              </Link>

              {/* SOUS-MENU */}
              {link.submenu && (
                <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-primary-light rounded-card shadow-lg py-2 min-w-[220px] border border-primary-dark/10">
                    {link.submenu.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className="block px-4 py-2 text-sm text-text-dark hover:bg-background hover:text-primary-dark transition-colors"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* BOUTON RÉSERVER à droite */}
        <div className="flex items-center justify-end gap-3 shrink-0">
          <Link
            href="/reservation"
            className="hidden sm:inline-flex items-center justify-center bg-primary-dark text-text-light px-5 py-2.5 rounded-button text-sm font-medium hover:bg-primary-dark/90 transition-colors"
          >
            Réserver
          </Link>

          {/* BOUTON MENU mobile */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-primary-dark"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* MENU MOBILE OVERLAY*/}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
        />
      )}

      {/* PANEL MOBILE */}
      <div
        className={`lg:hidden fixed top-0 right-0 h-screen w-[80%] max-w-[320px] bg-background z-50 shadow-xl transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header du panel */}
        <div className="flex items-center justify-between px-4 h-20 border-b border-primary-dark/10">
          <span className="font-heading text-lg text-text-dark">Menu</span>
          <button onClick={() => setMobileOpen(false)} aria-label="Fermer">
            <X className="w-6 h-6 text-primary-dark" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <nav className="flex flex-col gap-2 px-4 py-4 overflow-y-auto h-[calc(100vh-5rem)] items-start">
          {navLinks.map((link) => (
            <div key={link.label} className="w-full">
              <button
                onClick={() => link.submenu && toggleMenu(link.label)}
                className="flex items-center justify-start gap-2 w-full py-2 text-text-dark font-medium text-left"
              >
                <span>{link.label}</span>
                {link.submenu && (
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${openMenus[link.label] ? "rotate-180" : ""}`}
                  />
                )}
              </button>

              {link.submenu && openMenus[link.label] && (
                <div className="flex flex-col items-start gap-1 pb-2 pl-6">
                  {link.submenu.map((sub) => (
                    <Link
                      key={sub.label}
                      href={sub.href}
                      className="py-1 text-sm text-text-dark/80 text-left"
                      onClick={() => setMobileOpen(false)}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>


    </header>
  )
}