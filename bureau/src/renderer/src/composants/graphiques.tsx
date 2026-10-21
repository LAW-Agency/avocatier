import { Badge, Caption1, ProgressBar, Text, mergeClasses } from "@fluentui/react-components"
import { ArrowDownRegular, ArrowUpRegular, type FluentIcon } from "@fluentui/react-icons"
import { forwardRef, type HTMLAttributes, type ReactNode } from "react"
import { pourcent } from "../statistiques"
import { useHistogrammeStyles, useIndicateurStyles, useRepartitionStyles } from "./useGraphiquesStyles.styles"

// Évolution par rapport à la période précédente, en pourcentage (vert si ça monte, sauf `inverse`)
export function Evolution({ valeur, inverse = false }: { valeur: number | null; inverse?: boolean }) {
  if (valeur === null) return null
  if (Math.abs(valeur) < 0.005) return <Badge appearance="tint" color="informative" shape="rounded">Stable</Badge>
  const hausse = valeur > 0
  return (
    <Badge appearance="tint" color={hausse !== inverse ? "success" : "danger"} shape="rounded" icon={hausse ? <ArrowUpRegular /> : <ArrowDownRegular />}>
      {`${hausse ? "+" : ""}${pourcent(valeur)}`}
    </Badge>
  )
}

export type IndicateurProps = HTMLAttributes<HTMLDivElement> & {
  libelle: string
  valeur: ReactNode
  Icone?: FluentIcon
  evolution?: number | null // undefined : pas de badge
  inverse?: boolean
  note?: ReactNode
}

// Tuile d'un chiffre clé : libellé, valeur, évolution en % et note
export const Indicateur = forwardRef<HTMLDivElement, IndicateurProps>(({ libelle, valeur, Icone, evolution, inverse, note, children, className, ...props }, ref) => {
  const styles = useIndicateurStyles()
  return (
    <div ref={ref} {...props} className={mergeClasses(styles.root, className)}>
      <div className={styles.entete}>
        {Icone && <Icone className={styles.icone} />}
        <Caption1>{libelle}</Caption1>
      </div>
      <span className={styles.valeur}>{valeur}</span>
      {children}
      {((evolution !== undefined && evolution !== null) || note) && (
        <div className={styles.pied}>
          {evolution !== undefined && evolution !== null && <Evolution valeur={evolution} inverse={inverse} />}
          {note && <Caption1>{note}</Caption1>}
        </div>
      )}
    </div>
  )
})
Indicateur.displayName = "Indicateur"

export type Barre = { cle: string; libelle: string; valeur: number; secondaire?: number; etiquette?: string; actuelle?: boolean }

export type HistogrammeProps = HTMLAttributes<HTMLDivElement> & {
  barres: Barre[]
  formater: (valeur: number) => string
  legende?: { principale: string; secondaire?: string }
  hauteur?: number
}

// Histogramme en SVG, aux couleurs du thème : une barre par mois (et une seconde, plus claire, à comparer)
export const Histogramme = forwardRef<HTMLDivElement, HistogrammeProps>(({ barres, formater, legende, hauteur = 220, className, ...props }, ref) => {
  const styles = useHistogrammeStyles()
  const largeur = 720
  const marge = { haut: 20, bas: 24, gauche: 8 }
  const zone = hauteur - marge.haut - marge.bas
  const max = Math.max(1, ...barres.flatMap((b) => [b.valeur, b.secondaire ?? 0]))
  const pas = (largeur - marge.gauche) / Math.max(1, barres.length)
  const double = barres.some((b) => b.secondaire !== undefined)
  const epaisseur = Math.min(40, pas * (double ? 0.34 : 0.56))
  const y = (v: number) => marge.haut + zone - (v / max) * zone

  return (
    <div ref={ref} {...props} className={mergeClasses(styles.root, className)}>
      <svg viewBox={`0 0 ${largeur} ${hauteur}`} className={styles.graphique} role="img" aria-label={legende?.principale}>
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1={marge.gauche} x2={largeur} y1={y(max * t)} y2={y(max * t)} className={styles.grille} strokeDasharray="3 4" />
        ))}
        <line x1={marge.gauche} x2={largeur} y1={y(0)} y2={y(0)} className={styles.grille} />
        {barres.map((b, i) => {
          const centre = marge.gauche + pas * i + pas / 2
          const x = double ? centre - epaisseur - 1 : centre - epaisseur / 2
          return (
            <g key={b.cle}>
              <title>{`${b.libelle} : ${formater(b.valeur)}${b.secondaire !== undefined ? ` / ${formater(b.secondaire)}` : ""}`}</title>
              <rect x={x} y={y(b.valeur)} width={epaisseur} height={Math.max(0, y(0) - y(b.valeur))} rx={3} className={mergeClasses(styles.barre, b.actuelle && styles.barreActuelle)} />
              {b.secondaire !== undefined && (
                <rect x={centre + 1} y={y(b.secondaire)} width={epaisseur} height={Math.max(0, y(0) - y(b.secondaire))} rx={3} className={styles.barreSecondaire} />
              )}
              {b.valeur > 0 && (
                <text x={double ? x + epaisseur / 2 : centre} y={y(b.valeur) - 5} textAnchor="middle" className={styles.valeur}>
                  {b.etiquette ?? formater(b.valeur)}
                </text>
              )}
              <text x={centre} y={hauteur - 6} textAnchor="middle" className={styles.axe}>
                {b.libelle}
              </text>
            </g>
          )
        })}
      </svg>
      {legende && (
        <div className={styles.legende}>
          <Caption1>
            <span className={mergeClasses(styles.pastille, styles.pastillePrincipale)} />
            {legende.principale}
          </Caption1>
          {legende.secondaire && (
            <Caption1>
              <span className={mergeClasses(styles.pastille, styles.pastilleSecondaire)} />
              {legende.secondaire}
            </Caption1>
          )}
        </div>
      )}
    </div>
  )
})
Histogramme.displayName = "Histogramme"

// Liste de parts en % avec une barre de progression chacune (sources, modes de paiement, chambres)
export function Repartition({ lignes }: { lignes: { cle: string; libelle: ReactNode; part: number; detail?: string }[] }) {
  const styles = useRepartitionStyles()
  return (
    <ul className={styles.root}>
      {lignes.map((l) => (
        <li key={l.cle} className={styles.ligne}>
          <Text>{l.libelle}</Text>
          <Text className={styles.part}>
            {pourcent(l.part)}
            {l.detail && ` · ${l.detail}`}
          </Text>
          <ProgressBar className={styles.barre} value={l.part} thickness="large" />
        </li>
      ))}
    </ul>
  )
}
