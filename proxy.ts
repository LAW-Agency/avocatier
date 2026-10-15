import { NextResponse, type NextRequest } from "next/server"
import { COOKIE_SESSION, verifierJeton } from "@/lib/auth/session"

// Visiteur sans session valide sur une page réservée aux comptes : redirection vers la connexion avant tout
// rendu. Sans cela, le routeur affichait d'abord /compte (page vide, header transparent du hero), puis la
// connexion : la page semblait se charger deux fois. Vérification optimiste : chaque page revérifie la session
// (clientConnecte / exigerHote) et le rôle hôte reste contrôlé dans /admin.
export function proxy(request: NextRequest) {
  if (verifierJeton(request.cookies.get(COOKIE_SESSION)?.value)) return NextResponse.next()

  const connexion = new URL("/compte/connexion", request.url)
  connexion.searchParams.set("suite", request.nextUrl.pathname)
  return NextResponse.redirect(connexion)
}

export const config = {
  matcher: ["/compte", "/admin/:path*"],
}
