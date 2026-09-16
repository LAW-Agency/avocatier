'use client'

import AnimateOnScroll from "@/components/AnimateOnScroll"
import Link from "next/link"
import Image from "next/image"

const HERO_IMAGE = "/hero-home.jpeg"

export default function Hero (){

    return(
        <section className="relative h-[calc(100dvh-5.5rem)] overflow-hidden">

            <Image
                src={HERO_IMAGE}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover -z-20"
            />

            {/* Voile sur toute la hauteur, qui disparaît vers la droite */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent pointer-events-none z-10" />

            {/* Contenu */}
            <div className="relative z-20 h-full w-full max-w-7xl mx-auto px-4 flex items-center">

                <div className="relative z-20 max-w-xl space-y-4 drop-shadow-lg">
                    <span className="text-primary-light text-sm">
                        VOHILAVA · <span>Î</span><span className="text-primary-dark font-bold">LE SAINTE-MARIE · MADAGASCAR</span>
                    </span>

                    <AnimateOnScroll animation="fade-up">
                        <h1 className="font-heading text-primary-light text-3xl md:text-5xl lg:text-6xl">CHEZ L'AVOCATIER</h1>
                    </AnimateOnScroll>

                    <AnimateOnScroll animation="fade-left" delay={200}>
                        <p className="text-primary-light text-sm md:text-base">Votre adresse confidentielle face à l'océan, à Sainte-Marie, Madagascar.</p>
                    </AnimateOnScroll>

                    <AnimateOnScroll animation="fade-up">
                        <div className="flex flex-col sm:flex-row w-full gap-3 pt-2">
                            <Link
                                href="/reservation"
                                className="inline-flex items-center justify-center bg-primary-dark text-primary-light border border-primary-light px-6 py-2.5 rounded-button text-sm font-medium w-full sm:w-auto"
                            >
                                Réserver votre séjour
                            </Link>
                            <Link
                                href="/reservation"
                                className="inline-flex items-center justify-center text-primary-light border border-primary-light px-6 py-2.5 rounded-button text-sm font-medium w-full sm:w-auto"
                            >
                                Découvrir l'hôtel
                            </Link>
                        </div>
                    </AnimateOnScroll>
                </div>
            </div>
        </section>
    )
}