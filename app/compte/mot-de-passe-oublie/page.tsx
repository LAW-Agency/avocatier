import type { Metadata } from "next"
import CadreCompte from "@/components/compte/CadreCompte"
import { FormulaireRecuperation } from "@/components/compte/FormulairesCompte"
import { cheminInterne } from "@/lib/auth/dal"

export const metadata: Metadata = {
  title: "Mot de passe oublié | Chez L'Avocatier",
  robots: { index: false },
}

export default async function MotDePasseOubliePage({
  searchParams,
}: {
  searchParams: Promise<{ [cle: string]: string | string[] | undefined }>
}) {
  // Page où revenir une fois le mot de passe changé (porté par le lien de l'e-mail)
  const suite = cheminInterne((await searchParams).suite, "")

  return (
    <CadreCompte
      titre="Mot de passe oublié"
      intro="Indiquez l’adresse e-mail de votre compte : nous vous envoyons un lien pour choisir un nouveau mot de passe."
    >
      <FormulaireRecuperation suite={suite || undefined} />
    </CadreCompte>
  )
}
