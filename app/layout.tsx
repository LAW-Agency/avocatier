import type { Metadata } from "next";
import { Geist, Outfit } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChromeSite from "@/components/ChromeSite";
import RevealObserver from "@/components/RevealObserver";
import { FournisseurDevise } from "@/components/Devise";
import { moteur } from "@/lib/reservation";

// Vitrine : Outfit partout (titres et texte), police variable (graisses 100 à 900)
const outfit = Outfit({
  variable: "--font-sans-custom",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

// Espace hôtes (/admin) uniquement : Geist. Variable posée sur <html> pour atteindre aussi les fenêtres
// shadcn rendues en portail dans <body> ; pas de préchargement, le fichier n'est téléchargé que sur /admin
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
});

// Valeurs par défaut des pages sans métadonnées propres ; chaque page de la vitrine a son titre complet
// (pas de title.template : il doublerait le suffixe des titres de /compte et /admin)
export const metadata: Metadata = {
  title: "Chez L'Avocatier · Hôtel face à l'océan à Sainte-Marie, Madagascar",
  description:
    "Bungalows en bord de mer à Vohilava, île Sainte-Marie : plage privée, piscine, jardin tropical, restaurant et l'accueil de Joëlle et Stéphane.",
  openGraph: {
    siteName: "Chez L'Avocatier",
    locale: "fr_FR",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Devises de la vitrine (réglées dans /admin/tarifs) : toute modification revalide le layout
  const devises = await moteur.reglagesDevises();

  return (
    // Variables de police sur <html> : les variables du @theme Tailwind sont déclarées sur :root
    // data-scroll-behavior : Next garde les changements de page instantanés malgré le défilement doux
    <html lang="fr" data-scroll-behavior="smooth" className={`${outfit.variable} ${geist.variable}`}>

      <head>
                
        {/* -- Icon --*/}
        <link rel="icon" href="/icon.png" type="image/png" />

      </head>

      <body className="antialiased flex flex-col min-h-dvh">
        <FournisseurDevise reglages={devises}>
          <ChromeSite header={<Header/>} footer={<Footer/>}>{children}</ChromeSite>
        </FournisseurDevise>
        <RevealObserver/>
      </body>
      
    </html>
  );
}