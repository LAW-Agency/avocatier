"use client"

import { useActionState } from "react"
import { AlertCircle, CalendarX2, CheckCircle2 } from "lucide-react"
import { ajouterBlocage, type EtatAction } from "@/app/admin/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

interface FormulaireBlocageProps {
  hebergements: { id: string; nom: string }[]
  aujourdhui: string
}

// Fermer des dates sans réservation du site : travaux, réservation par téléphone ou Booking, privatisation…
export default function FormulaireBlocage({ hebergements, aujourdhui }: FormulaireBlocageProps) {
  const [etat, action, enCours] = useActionState<EtatAction, FormData>(ajouterBlocage, {})

  return (
    <form action={action} className="flex flex-col gap-4">
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="blocage-hebergement">Hébergement</FieldLabel>
          <Select name="hebergementId" defaultValue={hebergements[0]?.id} required>
            <SelectTrigger id="blocage-hebergement" className="w-full">
              <SelectValue placeholder="Choisir un hébergement" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {hebergements.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.nom}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="blocage-debut">Première nuit</FieldLabel>
          <Input id="blocage-debut" name="debut" type="date" min={aujourdhui} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="blocage-fin">Jour de libération</FieldLabel>
          <Input id="blocage-fin" name="fin" type="date" min={aujourdhui} required />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="blocage-raison">Raison</FieldLabel>
          <Input id="blocage-raison" name="raison" maxLength={120} placeholder="Travaux, réservation Booking…" />
        </Field>
      </FieldGroup>

      {etat.erreur && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{etat.erreur}</AlertDescription>
        </Alert>
      )}
      {etat.ok && !enCours && (
        <Alert>
          <CheckCircle2 />
          <AlertDescription>Dates bloquées : elles ne sont plus réservables sur le site.</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={enCours} className="self-start">
        {enCours ? <Spinner data-icon="inline-start" /> : <CalendarX2 data-icon="inline-start" />}
        Bloquer ces dates
      </Button>
    </form>
  )
}
