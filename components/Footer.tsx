'use client'
import Link from "next/link"
import Image from "next/image"
import { MapPin } from "lucide-react"

export default function Footer(){

    return(
        <footer className=" bg-primary-dark text-primary-light py-5">
            <div className="max-w-7xl mx-auto px-4 space-y-7 md:space-y-0 md:grid grid-cols-3 lg:flex items-center justify-between  gap-6">

                <div className="grid grid-cols-2 lg:flex items-center justify-between  gap-6 md:bloc">
                    {/* LOGO à gauche */}
                    <Link href="/" className="flex items-center shrink-0">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={90}
                        height={60}
                        className="object-contain"
                        priority
                    />
                    </Link>

                    {/* BOUTON RÉSERVER — milieu sur mobile */}
                    <div className="flex justify-center lg:hidden w-full px-4">
                    <Link
                        href="/reservation"
                        className="inline-flex items-center justify-center bg-primary-light text-primary-dark px-6 py-2.5 rounded-button text-sm font-medium w-[90%]"
                    >
                        Réserver
                    </Link>
                    </div>
                </div>

                {/* Localisation d'avocatier */}
                <div className="gap-5 pl-5 md:pl-0">
                    <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-1 shrink-0" />
                        <span>
                            <p> <span className="font-bold">Vohilava</span> 515 île Saint-Marie, <br /> Madagascar</p>
                            <p className="pt-2">À 3km de l'aeroport de Saint-Marie</p>
                        </span>
                    </div>
                    
                </div>

                {/* Lien */}
                <div className="flex items-center pl-10 md:pl-0 divide-x divide-primary-light">
                <Link href="/" className="px-2 first:pl-0">Contact</Link>
                <Link href="/" className="px-2">Infos pratiques</Link>
                <Link href="/" className="px-2 last:pr-0">Mentions légales</Link>
                </div>
            </div>
        </footer>
    )
}