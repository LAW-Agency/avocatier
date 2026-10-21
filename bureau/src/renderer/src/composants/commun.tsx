import { Badge, Body1, Subtitle2, Title2, mergeClasses, type BadgeProps } from "@fluentui/react-components"
import {
  CheckmarkRegular,
  ClockRegular,
  DismissCircleRegular,
  DoorArrowLeftRegular,
  DoorArrowRightRegular,
  FlagRegular,
  ProhibitedRegular,
  TimerOffRegular,
  type FluentIcon,
} from "@fluentui/react-icons"
import { forwardRef, type HTMLAttributes, type ReactNode } from "react"
import { libelleStatutHote } from "@partage/statuts"
import type { Reservation } from "@partage/types"
import { useCarteStyles, useEnTeteStyles, useVideStyles } from "./useCommunStyles.styles"

export type EnTeteProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & { titre: ReactNode; description?: ReactNode; actions?: ReactNode }

// Titre de l'écran, avec sa description et ses actions à droite
export const EnTete = forwardRef<HTMLDivElement, EnTeteProps>(({ titre, description, actions, className, ...props }, ref) => {
  const styles = useEnTeteStyles()
  return (
    <div ref={ref} {...props} className={mergeClasses(styles.root, className)}>
      <div className={styles.texte}>
        <Title2 as="h1" className={styles.titre}>
          {titre}
        </Title2>
        {description && <Body1 className={styles.description}>{description}</Body1>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  )
})
EnTete.displayName = "EnTete"

export type CarteProps = Omit<HTMLAttributes<HTMLElement>, "title"> & { titre?: ReactNode; description?: ReactNode; action?: ReactNode }

// Surface d'un bloc d'écran, titre et action facultatifs
export const Carte = forwardRef<HTMLElement, CarteProps>(({ titre, description, action, children, className, ...props }, ref) => {
  const styles = useCarteStyles()
  return (
    <section ref={ref} {...props} className={mergeClasses(styles.root, className)}>
      {(titre || action) && (
        <div className={styles.entete}>
          <div className={styles.texte}>
            {titre && (
              <Subtitle2 as="h2" className={styles.titre}>
                {titre}
              </Subtitle2>
            )}
            {description && <Body1 className={styles.description}>{description}</Body1>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
})
Carte.displayName = "Carte"

export type VideProps = HTMLAttributes<HTMLDivElement> & { Icone: FluentIcon; titre: string; texte: string; action?: ReactNode }

// État vide : icône, titre, explication et action éventuelle
export const Vide = forwardRef<HTMLDivElement, VideProps>(({ Icone, titre, texte, action, className, ...props }, ref) => {
  const styles = useVideStyles()
  return (
    <div ref={ref} {...props} className={mergeClasses(styles.root, className)}>
      <Icone className={styles.icone} />
      <Subtitle2 className={styles.titre}>{titre}</Subtitle2>
      <Body1>{texte}</Body1>
      {action}
    </div>
  )
})
Vide.displayName = "Vide"

type CleStatut = Reservation["statut"] | "termine" | "surPlace" | "parti"

const STYLES_STATUT: Record<CleStatut, { couleur: BadgeProps["color"]; Icone: FluentIcon; libelle?: string }> = {
  option: { couleur: "warning", Icone: ClockRegular },
  confirmee: { couleur: "success", Icone: CheckmarkRegular },
  refusee: { couleur: "danger", Icone: ProhibitedRegular },
  annulee: { couleur: "subtle", Icone: DismissCircleRegular },
  expiree: { couleur: "subtle", Icone: TimerOffRegular },
  termine: { couleur: "informative", Icone: FlagRegular, libelle: "Séjour terminé" },
  surPlace: { couleur: "brand", Icone: DoorArrowRightRegular, libelle: "Sur place" },
  parti: { couleur: "informative", Icone: DoorArrowLeftRegular, libelle: "Parti" },
}

// Pastille de statut : « À traiter », « Confirmée »…, et pour un séjour confirmé, l'état à la réception
export function BadgeStatut({ reservation, termine = false }: { reservation: Reservation; termine?: boolean }) {
  const cle: CleStatut =
    reservation.statut === "confirmee" && reservation.departLe
      ? "parti"
      : reservation.statut === "confirmee" && reservation.arriveeLe
        ? "surPlace"
        : termine
          ? "termine"
          : reservation.statut
  const { couleur, Icone, libelle } = STYLES_STATUT[cle]
  return (
    <Badge appearance="tint" color={couleur} icon={<Icone />} shape="rounded">
      {libelle ?? libelleStatutHote[reservation.statut]}
    </Badge>
  )
}
