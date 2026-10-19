import type { Metadata } from "next"
import Link from "next/link"
import CadreCompte from "@/components/compte/CadreCompte"
import { FormulaireNouveauMotDePasse } from "@/components/compte/FormulairesCompte"
import { classesBouton } from "@/components/compte/styles"
import { cheminInterne } from "@/lib/auth/dal"
import { empreinteJeton } from "@/lib/auth/recuperation"
import { comptes } from "@/lib/reservation"

// Le jeton est dans l'adresse : ni indexation, ni transmission à un autre site par l'en-tête Referer
export const metadata: Metadata = {
  title: "Nouveau mot de passe | Chez L'Avocatier",
  robots: { index: false },
  referrer: "no-referrer",
}

export default async function NouveauMotDePassePage({
  searchParams,
}: {
  searchParams: Promise<{ [cle: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const jeton = typeof params.jeton === "string" ? params.jeton : ""
  const suite = cheminInterne(params.suite, "")
  // Simple lecture : le jeton n'est consommé qu'à l'enregistrement du nouveau mot de passe
  const client = jeton ? await comptes.clientDuJeton(empreinteJeton(jeton)) : null

  if (!client) {
    return (
      <CadreCompte titre="Lien expiré" intro="Ce lien a déjà servi ou n’est plus valable : il ne dure qu’une heure.">
        <Link href="/compte/mot-de-passe-oublie" className={classesBouton}>
          Recevoir un nouveau lien
        </Link>
      </CadreCompte>
    )
  }

  return (
    <CadreCompte titre="Nouveau mot de passe" intro={`Bonjour ${client.prenom}, choisissez le nouveau mot de passe de votre compte.`}>
      <FormulaireNouveauMotDePasse jeton={jeton} suite={suite || undefined} />
    </CadreCompte>
  )
}
