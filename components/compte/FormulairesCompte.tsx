"use client"

import { useActionState, useState } from "react"
import { connexion, inscription, type EtatFormulaire } from "@/app/compte/actions"
import Champ from "@/components/Champ"

// Encre sombre plutôt que vert plein : le bouton vert reste réservé à la réservation ; le vert revient au survol
const bouton =
  "inline-flex w-full items-center justify-center rounded-button bg-ink px-6 py-3.5 text-sm font-medium tracking-wide text-text-light transition-colors hover:bg-primary-dark disabled:cursor-wait disabled:opacity-70"

function Erreur({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-card border-l-2 border-primary-accent bg-primary-accent/5 px-4 py-3 text-sm text-primary-accent">
      {message}
    </p>
  )
}

// `suite` : chemin où aller après succès. Absent dans le parcours de réservation, qui se met à jour sur place.
export function FormulaireConnexion({ suite }: { suite?: string }) {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(connexion, {})
  return (
    <form action={action} className="space-y-5">
      {suite && <input type="hidden" name="suite" value={suite} />}
      <Champ label="E-mail" name="email" id="connexion-email" type="email" autoComplete="email" required defaultValue={etat.valeurs?.email} />
      <Champ label="Mot de passe" name="motDePasse" id="connexion-mot-de-passe" type="password" autoComplete="current-password" required />
      <Erreur message={etat.erreur} />
      <button type="submit" disabled={enCours} className={bouton}>
        {enCours ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  )
}

export function FormulaireInscription({ suite }: { suite?: string }) {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(inscription, {})
  const v = etat.valeurs ?? {}
  return (
    <form action={action} className="space-y-5">
      {suite && <input type="hidden" name="suite" value={suite} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Champ label="Prénom" name="prenom" autoComplete="given-name" required defaultValue={v.prenom} />
        <Champ label="Nom" name="nom" autoComplete="family-name" required defaultValue={v.nom} />
      </div>
      <Champ label="E-mail" name="email" id="inscription-email" type="email" autoComplete="email" required defaultValue={v.email} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Champ label="Téléphone / WhatsApp" name="telephone" type="tel" autoComplete="tel" required defaultValue={v.telephone} />
        <Champ label="Pays" name="pays" autoComplete="country-name" defaultValue={v.pays} />
      </div>
      <Champ
        label="Mot de passe"
        name="motDePasse"
        id="inscription-mot-de-passe"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        aide="8 caractères minimum."
      />
      <Erreur message={etat.erreur} />
      <button type="submit" disabled={enCours} className={bouton}>
        {enCours ? "Création du compte…" : "Créer mon compte"}
      </button>
    </form>
  )
}

type Onglet = "connexion" | "inscription"

// Les deux formulaires derrière un sélecteur à deux positions : la pastille blanche coulisse, le formulaire glisse du même côté
export function BlocCompte({ suite, ongletInitial = "connexion" }: { suite?: string; ongletInitial?: Onglet }) {
  const [onglet, setOnglet] = useState<{ id: Onglet; change: boolean }>({ id: ongletInitial, change: false })
  const onglets = [
    { id: "connexion", label: "Se connecter" },
    { id: "inscription", label: "Créer un compte" },
  ] as const
  const glisse = !onglet.change
    ? ""
    : onglet.id === "inscription"
      ? "animate-glisse-avant motion-reduce:animate-none"
      : "animate-glisse-arriere motion-reduce:animate-none"

  return (
    <div className="space-y-8">
      <div role="tablist" aria-label="Connexion ou création de compte" className="relative isolate grid grid-cols-2 rounded-full bg-ink/[0.06] p-1">
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-1 -z-10 w-[calc(50%-0.25rem)] rounded-full bg-primary-light shadow-[0_1px_3px_rgb(28_38_34/0.12)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ transform: onglet.id === "inscription" ? "translateX(100%)" : "none" }}
        />
        {onglets.map((o) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            id={`onglet-${o.id}`}
            aria-selected={onglet.id === o.id}
            aria-controls={`panneau-${o.id}`}
            onClick={() => setOnglet({ id: o.id, change: true })}
            className={`rounded-full px-3 py-2.5 text-sm tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark ${
              onglet.id === o.id ? "font-medium text-ink" : "text-ink/70 hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div key={onglet.id} role="tabpanel" id={`panneau-${onglet.id}`} aria-labelledby={`onglet-${onglet.id}`} className={glisse}>
        {onglet.id === "connexion" ? <FormulaireConnexion suite={suite} /> : <FormulaireInscription suite={suite} />}
      </div>
    </div>
  )
}
