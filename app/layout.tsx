import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const playfair = Playfair_Display({
  variable: "--font-heading-custom",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const lato = Lato({
  variable: "--font-sans-custom",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "700"],
  style: ["normal", "italic"],
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
    <html lang="fr">

      <head>
                
        {/* -- Icon --*/}
        <link rel="icon" href="/icon.jpeg" />

      </head>

      <body className={`${playfair.variable} ${lato.variable} antialiased flex flex-col min-h-dvh`}>
        <Header/>
        <main className="flex-1">{children}</main>
        <Footer/>
      </body>
      
    </html>
  );
}