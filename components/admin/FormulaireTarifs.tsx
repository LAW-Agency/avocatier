"use client"

import { startTransition, useActionState, useState, type ComponentProps, type FormEvent } from "react"
import { AlertCircle, AlertTriangle, CheckCircle2, Plus, Save, Trash2 } from "lucide-react"
import { enregistrerTarifs, type EtatAction } from "@/app/admin/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formaterPrix, nombreNuits } from "@/lib/reservation/dates"
import { chevauchementSaisons, estJourAnnee } from "@/lib/reservation/regles"
import type { RegleSaison } from "@/lib/reservation/types"

interface FormulaireTarifsProps {
  hebergements: { id: string; nom: string; type: string; capaciteMax: number; prixNuit: number }[]
  saisons: RegleSaison[]
}

// Saison en cours de saisie : textes bruts des champs, `cle` stable pour React
type LigneSaison = {
  cle: number
  nom: string
  debutJour: string
  debutMois: string
  finJour: string
  finMois: string
  majoration: string
  sejourMin: string
}

const SAISONS_MAX = 12
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
const INITIALES_MOIS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]
// Une couleur par saison, reprise sur la frise et sur sa carte (palette du thème de l'admin)
const COULEURS = ["bg-chart-1", "bg-chart-5", "bg-chart-4", "bg-chart-2", "bg-chart-3"]

// Montant saisi (virgule acceptée), ou null tant qu'il n'est pas lisible
function lire(texte: string): number | null {
  const n = Number(texte.replace(/\s/g, "").replace(",", "."))
  return texte.trim() === "" || !Number.isFinite(n) ? null : n
}

// « MM-JJ » envoyé au serveur ; chaîne incomplète tant que le jour ou le mois manque (refusée par le serveur)
function jourAnnee(jour: string, mois: string): string {
  return `${mois}-${jour.trim().padStart(2, "0")}`
}

function versLigne(s: RegleSaison, cle: number): LigneSaison {
  const [debutMois, debutJour] = s.debut.split("-")
  const [finMois, finJour] = s.fin.split("-")
  return {
    cle,
    nom: s.nom,
    debutJour: String(Number(debutJour)),
    debutMois,
    finJour: String(Number(finJour)),
    finMois,
    majoration: String(Math.round((s.coefficient - 1) * 100)),
    sejourMin: String(s.sejourMin),
  }
}

// Saison complète et lisible, sinon null (aperçus et frise l'ignorent)
function versRegle(l: LigneSaison): RegleSaison | null {
  const debut = jourAnnee(l.debutJour, l.debutMois)
  const fin = jourAnnee(l.finJour, l.finMois)
  const majoration = lire(l.majoration)
  if (!l.nom.trim() || !estJourAnnee(debut) || !estJourAnnee(fin) || majoration === null) return null
  return { nom: l.nom.trim(), debut, fin, coefficient: 1 + majoration / 100, sejourMin: lire(l.sejourMin) ?? 1 }
}

const libelleJour = (mmjj: string) => {
  const [mois, jour] = mmjj.split("-").map(Number)
  return `${jour === 1 ? "1er" : jour} ${MOIS[mois - 1]}`
}

// Rang du jour dans une année de 365 jours (0 = 1er janvier)
const rang = (mmjj: string) => nombreNuits("2025-01-01", `2025-${mmjj}`)

// Champ numérique avec son unité à droite (€, %, nuits)
function ChampUnite({ unite, className = "w-28", ...props }: ComponentProps<typeof Input> & { unite: string }) {
  return (
    <div className={`relative ${className}`}>
      <Input inputMode="decimal" autoComplete="off" className="pr-12 text-right tabular-nums" {...props} />
      <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-sm text-muted-foreground">{unite}</span>
    </div>
  )
}

// Jour (champ) + mois (liste) d'une borne de saison, sans année
function ChampJourMois({
  id,
  label,
  jour,
  mois,
  onJour,
  onMois,
}: {
  id: string
  label: string
  jour: string
  mois: string
  onJour: (jour: string) => void
  onMois: (mois: string) => void
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex gap-2">
        <Input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Jour"
          aria-label={`${label} : jour`}
          className="w-16 text-right tabular-nums"
          value={jour}
          onChange={(e) => onJour(e.target.value)}
          required
        />
        <Select value={mois} onValueChange={onMois}>
          <SelectTrigger className="min-w-0 flex-1" aria-label={`${label} : mois`}>
            <SelectValue placeholder="Mois" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {MOIS.map((nom, i) => (
                <SelectItem key={nom} value={String(i + 1).padStart(2, "0")}>
                  {nom}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </Field>
  )
}

// L'année en une barre : chaque saison y occupe sa plage, le reste est la saison normale
function FriseAnnee({ saisons }: { saisons: { regle: RegleSaison; couleur: string }[] }) {
  const segments = saisons.flatMap(({ regle, couleur }) => {
    const debut = rang(regle.debut)
    const fin = rang(regle.fin) + 1
    const plages = debut < fin ? [[debut, fin]] : [[debut, 365], [0, fin]] // passe le 31 décembre
    return plages.map(([de, a]) => ({ cle: `${regle.nom}-${de}`, nom: regle.nom, couleur, de, a }))
  })

  return (
    <div aria-hidden className="flex flex-col gap-1.5">
      <div className="relative h-6 overflow-hidden rounded-md bg-muted">
        {segments.map((s) => (
          <div
            key={s.cle}
            title={s.nom}
            className={`absolute inset-y-0 ${s.couleur}`}
            style={{ left: `${(s.de / 365) * 100}%`, width: `${((s.a - s.de) / 365) * 100}%` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-12 text-center text-xs text-muted-foreground">
        {INITIALES_MOIS.map((initiale, i) => (
          <span key={i}>{initiale}</span>
        ))}
      </div>
    </div>
  )
}

// Prix de base des hébergements et saisons (plages de dates, majoration, séjour minimum) ;
// aperçu des prix de saison pendant la saisie
export default function FormulaireTarifs({ hebergements, saisons }: FormulaireTarifsProps) {
  const [etat, action, enCours] = useActionState<EtatAction, FormData>(enregistrerTarifs, {})
  // Envoi sans `action={…}` : React réinitialiserait le formulaire après l'action réussie, et les listes
  // déroulantes (Select de Radix) reviendraient alors à leur valeur du premier affichage
  function envoyer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const donnees = new FormData(e.currentTarget)
    startTransition(() => action(donnees))
  }
  const [prix, setPrix] = useState(() => Object.fromEntries(hebergements.map((h) => [h.id, String(h.prixNuit)])))
  // Champs contrôlés : React vide les champs libres d'un formulaire après l'action, même en cas d'erreur
  const [lignes, setLignes] = useState(() => saisons.map(versLigne))
  const [prochaineCle, setProchaineCle] = useState(saisons.length)

  const modifier = (cle: number, champs: Partial<LigneSaison>) =>
    setLignes(lignes.map((l) => (l.cle === cle ? { ...l, ...champs } : l)))

  function ajouter() {
    setLignes([...lignes, { cle: prochaineCle, nom: "", debutJour: "", debutMois: "", finJour: "", finMois: "", majoration: "", sejourMin: "1" }])
    setProchaineCle(prochaineCle + 1)
  }

  const couleur = (i: number) => COULEURS[i % COULEURS.length]
  const completes = lignes.flatMap((l, i) => {
    const regle = versRegle(l)
    return regle ? [{ cle: l.cle, regle, couleur: couleur(i) }] : []
  })
  const chevauchement = chevauchementSaisons(completes.map((s) => s.regle))

  // Même arrondi que le devis (calculerDevis)
  function prixDeSaison(id: string, regle: RegleSaison): string {
    const base = lire(prix[id] ?? "")
    return base === null ? "—" : formaterPrix(Math.round(base * regle.coefficient))
  }

  return (
    <form onSubmit={envoyer} className="flex flex-col gap-8">
      <div className="@container overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60">
              <TableHead className="pl-4">Hébergement</TableHead>
              <TableHead>Prix de base / nuit</TableHead>
              {completes.map((s) => (
                <TableHead key={s.cle} className="hidden text-right @xl:table-cell last:pr-4">
                  {s.regle.nom}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {hebergements.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="pl-4">
                  <label htmlFor={`prix-${h.id}`} className="block font-medium text-foreground">
                    {h.nom}
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {h.type === "bungalow" ? "Bungalow" : "Chambre"}, {h.capaciteMax} pers.
                  </span>
                </TableCell>
                <TableCell>
                  <ChampUnite
                    id={`prix-${h.id}`}
                    name={`prix:${h.id}`}
                    unite="€"
                    inputMode="numeric"
                    value={prix[h.id]}
                    onChange={(e) => setPrix({ ...prix, [h.id]: e.target.value })}
                    required
                  />
                </TableCell>
                {completes.map((s) => (
                  <TableCell key={s.cle} className="hidden text-right tabular-nums text-muted-foreground @xl:table-cell last:pr-4">
                    {prixDeSaison(h.id, s.regle)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-medium text-foreground">Saisons</h3>
          <p className="text-sm text-muted-foreground">
            Chaque saison revient tous les ans aux mêmes dates. Sa majoration s’applique à tous les hébergements, pour
            chaque nuit passée dans la saison ; son séjour minimum, aux arrivées pendant la saison.
          </p>
        </div>

        <FriseAnnee saisons={completes} />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-xl border border-dashed p-4">
            {/* Même ligne de titre que les cartes de saison (taille et pastille du libellé « Nom de la saison ») */}
            <p className="flex items-center gap-2 text-sm leading-snug font-medium text-foreground">
              <span aria-hidden className="size-2.5 rounded-full bg-muted-foreground/30" />
              Saison normale
            </p>
            <p className="text-sm text-muted-foreground">
              Toutes les nuits hors des saisons ci-dessous : prix de base, sans majoration, une nuit minimum.
            </p>
          </div>

          {lignes.map((l, i) => {
            const regle = versRegle(l)
            const id = `saison-${l.cle}`
            return (
              // Deux colonnes dès que la carte le permet : « Majoration » sous « Du », « Séjour minimum » sous « Au »
              <fieldset key={l.cle} className="@container flex flex-col gap-4 rounded-xl border p-4">
                <legend className="sr-only">{l.nom || `Saison ${i + 1}`}</legend>
                <input type="hidden" name="saison.debut" value={jourAnnee(l.debutJour, l.debutMois)} />
                <input type="hidden" name="saison.fin" value={jourAnnee(l.finJour, l.finMois)} />

                <div className="flex items-end gap-2">
                  <Field className="flex-1">
                    <FieldLabel htmlFor={`${id}-nom`} className="flex items-center gap-2">
                      <span aria-hidden className={`size-2.5 rounded-full ${couleur(i)}`} />
                      Nom de la saison
                    </FieldLabel>
                    <Input
                      id={`${id}-nom`}
                      name="saison.nom"
                      placeholder="Vacances, Noël…"
                      maxLength={40}
                      autoComplete="off"
                      value={l.nom}
                      onChange={(e) => modifier(l.cle, { nom: e.target.value })}
                      required
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Supprimer la saison ${l.nom}`.trim()}
                    onClick={() => setLignes(lignes.filter((autre) => autre.cle !== l.cle))}
                  >
                    <Trash2 />
                  </Button>
                </div>

                <div className="grid gap-4 @sm:grid-cols-2">
                  <ChampJourMois
                    id={`${id}-debut`}
                    label="Du"
                    jour={l.debutJour}
                    mois={l.debutMois}
                    onJour={(debutJour) => modifier(l.cle, { debutJour })}
                    onMois={(debutMois) => modifier(l.cle, { debutMois })}
                  />
                  <ChampJourMois
                    id={`${id}-fin`}
                    label="Au (dernière nuit)"
                    jour={l.finJour}
                    mois={l.finMois}
                    onJour={(finJour) => modifier(l.cle, { finJour })}
                    onMois={(finMois) => modifier(l.cle, { finMois })}
                  />
                </div>

                <div className="grid gap-4 @sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor={`${id}-majoration`}>Majoration</FieldLabel>
                    <ChampUnite
                      id={`${id}-majoration`}
                      className="w-full"
                      name="saison.majoration"
                      unite="%"
                      value={l.majoration}
                      onChange={(e) => modifier(l.cle, { majoration: e.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`${id}-sejour-min`}>Séjour minimum</FieldLabel>
                    <ChampUnite
                      id={`${id}-sejour-min`}
                      className="w-full"
                      name="saison.sejourMin"
                      unite="nuits"
                      inputMode="numeric"
                      value={l.sejourMin}
                      onChange={(e) => modifier(l.cle, { sejourMin: e.target.value })}
                      required
                    />
                  </Field>
                </div>

                {regle && (
                  <p className="text-sm text-muted-foreground">
                    Du {libelleJour(regle.debut)} au {libelleJour(regle.fin)} inclus, chaque année
                  </p>
                )}
              </fieldset>
            )
          })}

          {lignes.length < SAISONS_MAX && (
            <Button
              type="button"
              variant="outline"
              onClick={ajouter}
              className="h-auto min-h-24 border-dashed text-muted-foreground"
            >
              <Plus data-icon="inline-start" />
              Ajouter une saison
            </Button>
          )}
        </div>

        <FieldDescription>
          Une majoration négative accorde une remise (ex. −10 % en basse saison). Deux saisons ne peuvent pas se
          partager une même nuit.
        </FieldDescription>
      </div>

      {chevauchement && (
        <Alert>
          <AlertTriangle />
          <AlertDescription>
            « {chevauchement[0]} » et « {chevauchement[1]} » se chevauchent : ajustez leurs dates avant d’enregistrer.
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
          <AlertDescription>
            Tarifs enregistrés : ils s’appliquent aux nouvelles demandes. Les réservations déjà reçues gardent leur montant.
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={enCours} className="self-start">
        {enCours ? <Spinner data-icon="inline-start" /> : <Save data-icon="inline-start" />}
        Enregistrer les tarifs
      </Button>
    </form>
  )
}
