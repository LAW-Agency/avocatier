import { SqueletteListe } from "@/components/admin/Squelettes"

// Affiché pendant le chargement de la page (Suspense de Next), sous la barre latérale et la barre du haut
export default function Chargement() {
  return <SqueletteListe lignes={5} />
}
