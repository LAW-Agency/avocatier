// Grain très léger posé sur les fonds sable (style « Nature Distilled ») : texture de papier, pas de motif visible.
// Bruit SVG en data URI, aucune image à charger. Le parent doit être en `relative isolate`.
const BRUIT =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")"

export default function Grain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] mix-blend-multiply"
      style={{ backgroundImage: BRUIT }}
    />
  )
}

// Fond sable des sections chaudes. Le vert #007f5f n'y atteint pas 4,5:1 : texte courant en encre,
// liens en bordeaux, le vert réservé aux grands titres (3:1 suffit au-delà de 24 px).
export const FOND_SABLE = "relative isolate bg-sand/30"
