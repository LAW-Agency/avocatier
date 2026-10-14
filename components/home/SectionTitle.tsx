interface SectionTitleProps {
  eyebrow: string
  title: string
  center?: boolean
}

export default function SectionTitle({ eyebrow, title, center = false }: SectionTitleProps) {
  return (
    <div className={`space-y-3 ${center ? "text-center" : ""}`}>
      <span className="block text-xs md:text-sm uppercase tracking-[0.25em] text-primary-accent">
        {eyebrow}
      </span>
      <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl leading-tight text-balance text-text-dark">
        {title}
      </h2>
    </div>
  )
}
