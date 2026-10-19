import type { Metadata } from "next"
import { redirect } from "next/navigation"
import CadreCompte from "@/components/compte/CadreCompte"
import { BlocCompte } from "@/components/compte/FormulairesCompte"
import { cheminInterne, clientConnecte } from "@/lib/auth/dal"

export const metadata: Metadata = {
  title: "Connexion | Chez L'Avocatier",
}

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ [cle: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const suite = cheminInterne(params.suite)
  if (await clientConnecte()) redirect(suite)

  return (
    <CadreCompte
      titre="Mon compte"
      intro="Connectez-vous pour finaliser une réservation, suivre vos demandes et retrouver vos séjours passés."
    >
      <BlocCompte suite={suite} ongletInitial={params.onglet === "inscription" ? "inscription" : "connexion"} />
    </CadreCompte>
  )
}
