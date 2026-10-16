import EnTetePage from "@/components/admin/EnTetePage"
import FormulaireDevises from "@/components/admin/FormulaireDevises"
import FormulaireTarifs from "@/components/admin/FormulaireTarifs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { exigerHote } from "@/lib/auth/dal"
import { moteur } from "@/lib/reservation"

// Tarifs : prix de base des hébergements, règles des saisons, devises proposées sur la vitrine
export default async function TarifsPage() {
  await exigerHote()
  const [hebergements, saisons, devises] = await Promise.all([
    moteur.listerHebergements(),
    moteur.listerReglesSaisons(),
    moteur.reglagesDevises(),
  ])

  return (
    <>
      <EnTetePage
        titre="Tarifs"
        description="Prix par nuit, saisons et devises affichées aux visiteurs du site."
      />

      <Card>
        <CardHeader>
          <CardTitle>Prix par nuit</CardTitle>
          <CardDescription>
            Prix de base en euros, appliqué en saison normale. Le site calcule le total de chaque séjour nuit par nuit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormulaireTarifs
            hebergements={hebergements.map(({ id, nom, type, capaciteMax, prixNuit }) => ({ id, nom, type, capaciteMax, prixNuit }))}
            saisons={saisons}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Devises de la vitrine</CardTitle>
          <CardDescription>
            Les visiteurs choisissent leur région dans le pied de page du site ; les prix s’affichent alors dans leur devise.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hebergements[0] && <FormulaireDevises reglages={devises} exemple={hebergements[0]} />}
        </CardContent>
      </Card>
    </>
  )
}
