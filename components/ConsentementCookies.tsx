"use client"

import { useEffect, useState } from "react"

const CLE_CONSENTEMENT = "avocatier-consentement-cookies"

type ChoixCookies = "accepte" | "refuse"

function lireChoix(): ChoixCookies | null {
  try {
    const choix = localStorage.getItem(CLE_CONSENTEMENT)
    return choix === "accepte" || choix === "refuse" ? choix : null
  } catch {
    return null
  }
}

export default function ConsentementCookies() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(lireChoix() === null)
  }, [])

  function choisir(choix: ChoixCookies) {
    try {
      localStorage.setItem(CLE_CONSENTEMENT, choix)
    } catch {
      // Le bandeau peut être fermé même si le navigateur bloque le stockage local.
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <aside
      aria-labelledby="titre-consentement-cookies"
      aria-describedby="texte-consentement-cookies"
      className="animate-cookie-dialog fixed bottom-4 right-4 z-[100] w-[min(25rem,calc(100vw-2rem))] rounded-2xl border border-[#d9dfd5] bg-[#fffefa] p-5 text-[#23382f] shadow-[0_18px_60px_rgba(20,35,27,0.24)] sm:bottom-6 sm:right-6 sm:p-6"
      role="dialog"
      aria-modal="false"
    >
      <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#788c68]">
        Votre confidentialité
      </p>
      <h2 id="titre-consentement-cookies" className="text-xl font-medium tracking-tight">
        Vos préférences cookies
      </h2>
      <p id="texte-consentement-cookies" className="mt-2 text-sm leading-6 text-[#667269]">
        Les cookies nécessaires assurent le fonctionnement du site. Acceptez ou refusez ceux de mesure d’audience.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => choisir("accepte")}
          className="inline-flex min-h-10 flex-1 items-center justify-center rounded-button border border-primary-dark bg-primary-dark px-4 text-sm font-medium text-text-light transition-colors hover:bg-primary-dark/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
        >
          Accepter
        </button>
        <button
          type="button"
          onClick={() => choisir("refuse")}
          className="inline-flex min-h-10 flex-1 items-center justify-center rounded-button border border-primary-dark bg-transparent px-4 text-sm font-medium text-text-dark transition-colors hover:bg-primary-dark hover:text-text-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
        >
          Refuser
        </button>
      </div>
    </aside>
  )
}
