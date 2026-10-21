import { DatePicker, defaultDatePickerStrings, type CalendarStrings, type DatePickerProps } from "@fluentui/react-datepicker-compat"
import type { DateISO } from "@partage/types"

// Lundi (DayOfWeek.Monday, énumération non exportée par le paquet)
const LUNDI = 1 as NonNullable<DatePickerProps["firstDayOfWeek"]>

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]

// Calendrier Fluent en français, semaine commençant le lundi
const TEXTES: CalendarStrings = {
  ...defaultDatePickerStrings,
  months: MOIS,
  shortMonths: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  days: JOURS,
  shortDays: ["D", "L", "M", "M", "J", "V", "S"],
  goToToday: "Aujourd'hui",
  prevMonthAriaLabel: "Mois précédent",
  nextMonthAriaLabel: "Mois suivant",
  prevYearAriaLabel: "Année précédente",
  nextYearAriaLabel: "Année suivante",
  closeButtonAriaLabel: "Fermer le calendrier",
}

// Dates du calendrier (heure locale) ↔ « AAAA-MM-JJ »
const versISO = (date: Date): DateISO =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
const depuisISO = (iso: DateISO) => {
  const [a, m, j] = iso.split("-").map(Number)
  return new Date(a, m - 1, j)
}

interface ChampDateProps {
  valeur: DateISO | ""
  onChange: (valeur: DateISO | "") => void
  min?: DateISO
  id?: string
  className?: string
}

export default function ChampDate({ valeur, onChange, min, id, className }: ChampDateProps) {
  return (
    <DatePicker
      id={id}
      className={className}
      value={valeur ? depuisISO(valeur) : null}
      onSelectDate={(date) => onChange(date ? versISO(date) : "")}
      minDate={min ? depuisISO(min) : undefined}
      firstDayOfWeek={LUNDI}
      strings={TEXTES}
      formatDate={(date) => (date ? `${date.getDate()} ${MOIS[date.getMonth()]} ${date.getFullYear()}` : "")}
      placeholder="Choisir une date"
      showMonthPickerAsOverlay
    />
  )
}
