import Image from "next/image"
import ButtonLink from "@/components/ButtonLink"

const HERO_IMAGE = "/hero-home.jpeg"

export default function Hero (){

    return(
        // Plein écran : le header fixe et transparent passe par-dessus
        // isolate : la photo, le voile et le texte restent empilés dans la section
        <section className="relative isolate h-dvh min-h-[34rem] overflow-hidden">

            <Image
                src={HERO_IMAGE}
                alt="Coucher de soleil sur l'océan depuis le jardin de Chez L'Avocatier, entre cocotiers et hamac"
                fill
                preload
                sizes="100vw"
                className="object-cover -z-20"
            />

            {/* Voile sur toute la hauteur, qui disparaît vers la droite */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-black/40 md:via-black/10 to-transparent pointer-events-none" />

            {/* Contenu — animations CSS (pas de JS) : le titre s'affiche dès le chargement */}
            <div className="h-full w-full max-w-7xl mx-auto px-4 pt-24 flex items-center">

                <div className="max-w-2xl space-y-5 drop-shadow-lg">
                    <span className="block text-primary-light text-xs md:text-sm uppercase tracking-[0.25em] animate-fade-down motion-reduce:animate-none">
                        Vohilava · <span className="font-bold">Île Sainte-Marie · Madagascar</span>
                    </span>

                    <h1 className="font-heading text-primary-light text-3xl sm:text-4xl md:text-5xl lg:text-6xl animate-fade-up motion-reduce:animate-none">
                        CHEZ L’AVOCATIER
                    </h1>

                    <p className="text-primary-light text-base md:text-lg animate-fade-left [animation-delay:300ms] motion-reduce:animate-none">
                        Votre adresse confidentielle face à l’océan, à Sainte-Marie, Madagascar.
                    </p>

                    <div className="flex flex-col sm:flex-row w-full gap-3 pt-2 animate-fade-up [animation-delay:600ms] motion-reduce:animate-none">
                        <ButtonLink href="/reserver" className="w-full sm:w-auto">
                            Réserver votre séjour
                        </ButtonLink>
                        <ButtonLink href="/hotel" variant="outline-light" className="w-full sm:w-auto">
                            Découvrir l’hôtel
                        </ButtonLink>
                    </div>
                </div>
            </div>
        </section>
    )
}
