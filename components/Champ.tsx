import type { InputHTMLAttributes } from "react"

// Classes communes des champs de formulaire (aussi utilisées par les <textarea>)
export const classesChamp =
  "w-full rounded-input border border-ink/15 bg-primary-light px-4 py-3 text-base text-ink placeholder:text-ink/40 transition-colors hover:border-ink/30 focus:border-primary-dark focus:outline-3 focus:outline-offset-0 focus:outline-primary-dark/15"

interface ChampProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  aide?: string
}

// Champ de saisie avec son libellé (et une aide facultative sous le champ).
// `id` à préciser quand deux formulaires de la même page ont un champ du même nom.
export default function Champ({ label, name, id = name, aide, className = "", ...props }: ChampProps) {
  const idAide = aide ? `${id}-aide` : undefined
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input id={id} name={name} aria-describedby={idAide} className={classesChamp} {...props} />
      {aide && (
        <p id={idAide} className="text-sm text-ink/70">
          {aide}
        </p>
      )}
    </div>
  )
}
