import { Button, Input, Tooltip, type InputProps } from "@fluentui/react-components"
import { ArrowSyncRegular, EyeOffRegular, EyeRegular } from "@fluentui/react-icons"
import { forwardRef, useState } from "react"

// Mot de passe provisoire lisible : sans caractères ambigus (0/O, 1/l/I)
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
export function motDePasseAleatoire(longueur = 12): string {
  const valeurs = crypto.getRandomValues(new Uint32Array(longueur))
  return Array.from(valeurs, (v) => ALPHABET[v % ALPHABET.length]).join("")
}

export type ChampMotDePasseProps = Omit<InputProps, "type" | "contentAfter" | "onChange"> & {
  valeur: string
  onValeur: (valeur: string) => void
  generer?: boolean // bouton « Générer » (mot de passe provisoire d'un nouvel utilisateur)
}

// Champ de mot de passe avec affichage / masquage, et génération facultative
export const ChampMotDePasse = forwardRef<HTMLInputElement, ChampMotDePasseProps>(({ valeur, onValeur, generer = false, ...props }, ref) => {
  const [visible, setVisible] = useState(generer)
  return (
    <Input
      ref={ref}
      {...props}
      type={visible ? "text" : "password"}
      value={valeur}
      onChange={(_e, d) => onValeur(d.value)}
      contentAfter={
        <>
          {generer && (
            <Tooltip content="Générer un mot de passe" relationship="label">
              <Button
                appearance="transparent"
                size="small"
                icon={<ArrowSyncRegular />}
                onClick={() => {
                  onValeur(motDePasseAleatoire())
                  setVisible(true)
                }}
              />
            </Tooltip>
          )}
          <Tooltip content={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"} relationship="label">
            <Button appearance="transparent" size="small" icon={visible ? <EyeOffRegular /> : <EyeRegular />} aria-pressed={visible} onClick={() => setVisible(!visible)} />
          </Tooltip>
        </>
      }
    />
  )
})
ChampMotDePasse.displayName = "ChampMotDePasse"
