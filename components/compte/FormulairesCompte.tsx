"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useActionState, useState } from "react"
import {
  choisirNouveauMotDePasse,
  connexion,
  demanderReinitialisation,
  inscription,
  type EtatFormulaire,
  type EtatRecuperation,
} from "@/app/compte/actions"
import { ContenuEnCours } from "@/components/Chargement"
import Champ from "@/components/Champ"
import { classesBouton as bouton, classesLien } from "./styles"

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
  // Après récupération du compte, retour à `suite` ou à la page courante (parcours de réservation et sa sélection)
  const chemin = usePathname()
  const recherche = useSearchParams().toString()
  const retour = suite ?? `${chemin}${recherche ? `?${recherche}` : ""}`
  return (
    <form action={action} className="space-y-5">
      {suite && <input type="hidden" name="suite" value={suite} />}
      <Champ label="E-mail" name="email" id="connexion-email" type="email" autoComplete="email" required defaultValue={etat.valeurs?.email} />
      <div className="space-y-2">
        <Champ label="Mot de passe" name="motDePasse" id="connexion-mot-de-passe" type="password" autoComplete="current-password" required />
        <p className="text-right">
          <Link href={`/compte/mot-de-passe-oublie?suite=${encodeURIComponent(retour)}`} className={classesLien}>
            Mot de passe oublié ?
          </Link>
        </p>
      </div>
      <Erreur message={etat.erreur} />
      <button type="submit" disabled={enCours} className={bouton}>
        <ContenuEnCours enCours={enCours}>{enCours ? "Connexion…" : "Se connecter"}</ContenuEnCours>
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
        <ContenuEnCours enCours={enCours}>{enCours ? "Création du compte…" : "Créer mon compte"}</ContenuEnCours>
      </button>
    </form>
  )
}

// Demande du lien : même confirmation que l'adresse ait un compte ou non
export function FormulaireRecuperation({ suite }: { suite?: string }) {
  const [etat, action, enCours] = useActionState<EtatRecuperation, FormData>(demanderReinitialisation, {})
  const retourConnexion = `/compte/connexion${suite ? `?suite=${encodeURIComponent(suite)}` : ""}`

  if (etat.envoye) {
    return (
      <div role="status" className="space-y-5 text-body text-ink">
        <p className="font-heading text-xl text-forest">Vérifiez votre boîte de réception</p>
        <p className="text-pretty">
          Si un compte existe pour <span className="font-medium">{etat.envoye}</span>, un e-mail vient de partir avec un lien pour
          choisir un nouveau mot de passe. Il est valable une heure.
        </p>
        <p className="text-sm text-ink/70">Rien reçu d’ici quelques minutes ? Regardez dans les indésirables, ou vérifiez l’adresse.</p>
        <Link href={retourConnexion} className={classesLien}>
          Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-5">
      {suite && <input type="hidden" name="suite" value={suite} />}
      <Champ label="E-mail" name="email" id="recuperation-email" type="email" autoComplete="email" required />
      <Erreur message={etat.erreur} />
      <button type="submit" disabled={enCours} className={bouton}>
        <ContenuEnCours enCours={enCours}>{enCours ? "Envoi…" : "Recevoir le lien"}</ContenuEnCours>
      </button>
      <p className="text-center">
        <Link href={retourConnexion} className={classesLien}>
          Retour à la connexion
        </Link>
      </p>
    </form>
  )
}

export function FormulaireNouveauMotDePasse({ jeton, suite }: { jeton: string; suite?: string }) {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(choisirNouveauMotDePasse, {})
  if (etat.motDePasseHote) {
    return (
      <div role="status" className="space-y-5 text-body text-ink">
        <p className="font-heading text-xl text-forest">Mot de passe modifié</p>
        <p className="text-pretty">Reconnectez-vous au logiciel Chez L’Avocatier avec votre nouveau mot de passe.</p>
      </div>
    )
  }
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="jeton" value={jeton} />
      {suite && <input type="hidden" name="suite" value={suite} />}
      <Champ
        label="Nouveau mot de passe"
        name="motDePasse"
        id="nouveau-mot-de-passe"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        aide="8 caractères minimum."
      />
      <Champ label="Confirmer le mot de passe" name="confirmation" id="confirmation-mot-de-passe" type="password" autoComplete="new-password" required />
      <Erreur message={etat.erreur} />
      {etat.lienExpire && (
        <Link href="/compte/mot-de-passe-oublie" className={classesLien}>
          Recevoir un nouveau lien
        </Link>
      )}
      <button type="submit" disabled={enCours} className={bouton}>
        <ContenuEnCours enCours={enCours}>{enCours ? "Enregistrement…" : "Enregistrer et me connecter"}</ContenuEnCours>
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
