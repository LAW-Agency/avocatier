import type { Metadata } from "next";
import { Geist, Outfit } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChromeSite from "@/components/ChromeSite";
import RevealObserver from "@/components/RevealObserver";

// Titres : Transcend (Paulo Goode) — serif en petites capitales, une seule graisse (Bold), pas d'italique
const transcend = localFont({
  src: "./fonts/Transcend.ttf",
  variable: "--font-heading-custom",
  weight: "700",
  style: "normal",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

// Texte : Outfit, police variable (graisses 100 à 900)
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

export const metadata: Metadata = {
  title: "CHEZ L'AVOCATIER",
  description: "Bord de mer, bungalows, piscine, nature, tranquillité et accueil de Joëlle & Stéphane.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Variables de police sur <html> : les variables du @theme Tailwind sont déclarées sur :root
    // data-scroll-behavior : Next garde les changements de page instantanés malgré le défilement doux
    <html lang="fr" data-scroll-behavior="smooth" className={`${transcend.variable} ${outfit.variable} ${geist.variable}`}>

      <head>
                
        {/* -- Icon --*/}
        <link rel="icon" href="/icon.jpeg" />

      </head>

      <body className="antialiased flex flex-col min-h-dvh">
        <ChromeSite header={<Header/>} footer={<Footer/>}>{children}</ChromeSite>
        <RevealObserver/>
      </body>
      
    </html>
  );
}