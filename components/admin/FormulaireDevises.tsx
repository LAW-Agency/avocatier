"use client"

import { startTransition, useActionState, useState, useTransition, type FormEvent } from "react"
import { AlertCircle, CheckCircle2, Info, RefreshCw, Save } from "lucide-react"
import { chargerTauxDuJour, enregistrerDevises, type EtatAction } from "@/app/admin/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CODES_DEVISES, DEVISE_REFERENCE, DEVISES, formaterMontant } from "@/lib/reservation/devises"
import { formaterHeure } from "@/lib/reservation/dates"
import { SOURCE_TAUX } from "@/lib/reservation/tauxDeChange"
import type { CodeDevise, ReglagesDevises } from "@/lib/reservation/types"

interface FormulaireDevisesProps {
  reglages: ReglagesDevises
  exemple: { nom: string; prixNuit: number } // hébergement dont le prix sert d'aperçu
}

function lire(texte: string): number | null {
  const n = Number(texte.replace(/\s/g, "").replace(",", "."))
  return texte.trim() === "" || !Number.isFinite(n) || n <= 0 ? null : n
}

// Devises proposées dans le pied de page de la vitrine, taux de conversion et devise par défaut
export default function FormulaireDevises({ reglages, exemple }: FormulaireDevisesProps) {
  const [etat, action, enCours] = useActionState<EtatAction, FormData>(enregistrerDevises, {})
  // Envoi sans `action={…}` : React réinitialiserait le formulaire après l'action réussie, et les listes
  // déroulantes (Select de Radix) reviendraient alors à leur valeur du premier affichage
  function envoyer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const donnees = new FormData(e.currentTarget)
    setTauxCharges(null)
    startTransition(() => action(donnees))
  }
  const [actives, setActives] = useState<CodeDevise[]>(reglages.actives)
  const [taux, setTaux] = useState(() =>
    Object.fromEntries(CODES_DEVISES.map((c) => [c, String(reglages.taux[c]).replace(".", ",")])) as Record<CodeDevise, string>,
  )
  const [parDefaut, setParDefaut] = useState<CodeDevise>(reglages.parDefaut)

  // Taux du jour : remplissent les champs, enregistrés seulement avec le bouton « Enregistrer les devises »
  const [chargementTaux, lancerChargement] = useTransition()
  const [tauxCharges, setTauxCharges] = useState<{ date: string } | { erreur: string } | null>(null)
  function chargerTaux() {
    lancerChargement(async () => {
      const resultat = await chargerTauxDuJour()
      if (!resultat.ok) return setTauxCharges({ erreur: resultat.erreur })
      setTaux(Object.fromEntries(CODES_DEVISES.map((c) => [c, String(resultat.taux[c]).replace(".", ",")])) as Record<CodeDevise, string>)
      setTauxCharges({ date: resultat.date })
    })
  }

  const estActive = (code: CodeDevise) => code === DEVISE_REFERENCE || actives.includes(code)
  function basculer(code: CodeDevise, active: boolean) {
    setActives(active ? [...actives, code] : actives.filter((c) => c !== code))
    // Devise par défaut retirée : retour à l'euro
    if (!active && parDefaut === code) setParDefaut(DEVISE_REFERENCE)
  }

  function apercu(code: CodeDevise): string {
    const t = code === DEVISE_REFERENCE ? 1 : lire(taux[code])
    return t === null ? "—" : formaterMontant(exemple.prixNuit, code, { ...reglages, taux: { ...reglages.taux, [code]: t } })
  }

  return (
    <form onSubmit={envoyer} className="flex flex-col gap-6">
      <div className="@container overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60">
              <TableHead className="pl-4">Devise</TableHead>
              <TableHead>Proposée</TableHead>
              <TableHead>Taux : 1 € =</TableHead>
              <TableHead className="hidden pr-4 text-right @lg:table-cell">{exemple.nom}, 1 nuit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CODES_DEVISES.map((code) => {
              const info = DEVISES[code]
              const reference = code === DEVISE_REFERENCE
              return (
                <TableRow key={code}>
                  <TableCell className="pl-4">
                    <span className="block font-medium text-foreground">
                      {info.nom} <span className="font-normal text-muted-foreground">({info.symbole})</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{info.region}</span>
                  </TableCell>
                  <TableCell>
                    <Switch
                      name={`active:${code}`}
                      checked={estActive(code)}
                      onCheckedChange={(active) => basculer(code, active)}
                      disabled={reference}
                      aria-label={`Proposer ${info.nom.toLowerCase()} aux visiteurs`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="relative w-32">
                      <Input
                        name={reference ? undefined : `taux:${code}`}
                        value={reference ? "1" : taux[code]}
                        onChange={(e) => setTaux({ ...taux, [code]: e.target.value })}
                        disabled={reference}
                        inputMode="decimal"
                        autoComplete="off"
                        aria-label={`Taux de conversion : 1 euro en ${info.nom.toLowerCase()}`}
                        className="pr-12 text-right tabular-nums"
                        required={!reference}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-sm text-muted-foreground">
                        {info.symbole}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden pr-4 text-right tabular-nums text-muted-foreground @lg:table-cell">{apercu(code)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Field className="max-w-sm">
        <FieldLabel htmlFor="devise-par-defaut">Devise par défaut de la vitrine</FieldLabel>
        <Select name="parDefaut" value={parDefaut} onValueChange={(v) => setParDefaut(v as CodeDevise)}>
          <SelectTrigger id="devise-par-defaut" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {CODES_DEVISES.filter(estActive).map((code) => (
                <SelectItem key={code} value={code}>
                  {DEVISES[code].nom} ({DEVISES[code].symbole})
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <FieldDescription>Affichée tant que le visiteur n’a pas choisi sa région dans le pied de page.</FieldDescription>
      </Field>

      <p className="text-sm text-muted-foreground">
        Les tarifs restent fixés en euros : les autres devises sont une conversion indicative, arrondie (l’ariary à 1 000 Ar
        près). Taux enregistrés le {formaterHeure(reglages.misAJourLe)}. Taux du jour fournis par{" "}
        <a href={SOURCE_TAUX.url} target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-foreground">
          {SOURCE_TAUX.nom}
        </a>
        .
      </p>

      {tauxCharges && "erreur" in tauxCharges && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{tauxCharges.erreur}</AlertDescription>
        </Alert>
      )}
      {tauxCharges && "date" in tauxCharges && !chargementTaux && (
        <Alert>
          <Info />
          <AlertDescription>
            Taux du {formaterHeure(tauxCharges.date)} reportés dans le tableau. Vérifiez-les, puis enregistrez pour les appliquer à
            la vitrine.
          </AlertDescription>
        </Alert>
      )}

      {etat.erreur && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{etat.erreur}</AlertDescription>
        </Alert>
      )}
      {etat.ok && !enCours && (
        <Alert>
          <CheckCircle2 />
          <AlertDescription>Devises enregistrées : la vitrine affiche déjà les nouveaux montants.</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={enCours || chargementTaux}>
          {enCours ? <Spinner data-icon="inline-start" /> : <Save data-icon="inline-start" />}
          Enregistrer les devises
        </Button>
        <Button type="button" variant="outline" onClick={chargerTaux} disabled={enCours || chargementTaux}>
          {chargementTaux ? <Spinner data-icon="inline-start" /> : <RefreshCw data-icon="inline-start" />}
          Récupérer les taux du jour
        </Button>
      </div>
    </form>
  )
}
