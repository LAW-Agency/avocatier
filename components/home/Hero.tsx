import Image from "next/image"
import { Star } from "lucide-react"
import ButtonLink from "@/components/ButtonLink"
import { googleRating } from "@/data/testimonials"

const HERO_IMAGE = "/hero-home.jpeg"

export default function Hero (){

    return(
        // Plein écran : le header fixe et transparent passe par-dessus
        // isolate : la photo, les voiles et le texte restent empilés dans la section
        <section className="relative isolate flex h-dvh min-h-[38rem] items-center justify-center overflow-hidden bg-forest">

            {/* Conteneur séparé : l'apparition de la photo ne remplace pas son zoom au défilement */}
            <div className="absolute inset-0 -z-20 animate-photo-entree motion-reduce:animate-none">
                <Image
                    src={HERO_IMAGE}
                    alt="Coucher de soleil sur l'océan depuis le jardin de Chez L'Avocatier, entre cocotiers et hamac"
                    fill
                    preload
                    sizes="100vw"
                    className="object-cover animate-hero-zoom"
                />
            </div>

            {/* Voiles vert nuit : teinte générale, assombrissement derrière le texte centré, fondu en bas */}
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-forest/35" />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_65%_55%_at_50%_52%,rgb(13_43_33/0.6),transparent_75%)]" />
            {/* Fondu jusqu'au vert plein : raccord sans couture avec la bande des atouts juste en dessous */}
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-56 -z-10 bg-gradient-to-t from-forest via-forest/55 to-transparent" />

            {/* Contenu centré — s'efface en remontant quand on fait défiler la page */}
            <div className="flex w-full max-w-7xl flex-col items-center px-4 pt-24 pb-16 text-center animate-hero-exit">

                {/* Le moment fort : logo typographique géant qui se fond dans la photo */}
                <h1 className="w-full animate-reveal motion-reduce:animate-none">
                    <Image
                        src="/logo-texte-blanc.svg"
                        alt="Chez L'Avocatier"
                        width={2036}
                        height={530}
                        preload
                        /* Largeur limitée aussi par la hauteur d'écran (portables peu hauts) */
                        className="mx-auto h-auto w-[min(92vw,68rem,125svh)] [mask-image:linear-gradient(to_bottom,#000_30%,rgb(0_0_0/0.2)_100%)]"
                    />
                </h1>

                {/* Le reste apparaît d'un seul bloc, juste après le logo */}
                <div className="mt-6 md:mt-8 [@media(max-height:720px)]:mt-4 flex flex-col items-center gap-5 [@media(max-height:720px)]:gap-3 animate-fade-up [animation-delay:600ms] motion-reduce:animate-none">
                    <p className="flex items-center gap-2 text-sm text-primary-light/90">
                        <span className="flex gap-0.5 text-sand" aria-hidden="true">
                            {Array.from({ length: googleRating.outOf }, (_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-current" />
                            ))}
                        </span>
                        <span aria-hidden="true">{googleRating.score} sur {googleRating.source}</span>
                        <span className="sr-only">Noté {googleRating.score} sur {googleRating.outOf} sur {googleRating.source}</span>
                    </p>

                    <p className="font-heading text-2xl sm:text-3xl md:text-4xl leading-tight text-balance text-primary-light">
                        Votre adresse confidentielle face à l’océan
                    </p>

                    <p className="max-w-xl text-base md:text-lg leading-relaxed text-balance text-primary-light/85">
                        Bungalows dans un jardin tropical, plage privée et piscine sur l’île Sainte-Marie, avec l’accueil chaleureux de Joëlle et Stéphane.
                    </p>

                    <div className="flex w-full flex-col sm:w-auto sm:flex-row gap-3 pt-2">
                        <ButtonLink href="/reserver" className="w-full sm:w-auto">
                            Réserver votre séjour
                        </ButtonLink>
                        <ButtonLink href="/hotel" variant="outline-light" className="w-full sm:w-auto">
                            Découvrir l’hôtel
                        </ButtonLink>
                    </div>
                </div>
            </div>

            {/* Localisation — « petit élément sous le hero » du cahier des charges */}
            {/* Conteneur séparé : l'effacement au défilement ne remplace pas l'apparition du texte */}
            <div className="absolute inset-x-0 bottom-6 px-4 animate-hero-exit">
                <p className="text-center font-heading text-sm md:text-base tracking-wide text-primary-light/80 animate-fade-up [animation-delay:900ms] motion-reduce:animate-none">
                    Vohilava · Île Sainte-Marie · Madagascar
                </p>
            </div>
        </section>
    )
}
