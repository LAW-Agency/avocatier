interface SectionTitleProps {
  title: string
  center?: boolean
  light?: boolean   // sur fond sombre (vert nuit, photo)
}

// Titre de section : pas de sur-titre, le titre porte seul la section
export default function SectionTitle({ title, center = false, light = false }: SectionTitleProps) {
  return (
    <h2
      className={`font-heading text-section text-balance ${light ? "text-primary-light" : "text-text-dark"} ${center ? "text-center" : ""}`}
    >
      {title}
    </h2>
  )
}
