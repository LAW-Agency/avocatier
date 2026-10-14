import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
    <html lang="fr" className={`${transcend.variable} ${outfit.variable}`}>

      <head>
                
        {/* -- Icon --*/}
        <link rel="icon" href="/icon.jpeg" />

      </head>

      <body className="antialiased flex flex-col min-h-dvh">
        <Header/>
        <main className="flex-1">{children}</main>
        <Footer/>
      </body>
      
    </html>
  );
}