import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-[70vh] items-center justify-center overflow-hidden bg-[#f8f6f0] px-6 py-20 text-[#23382f]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-[#dce8d7] opacity-70 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-[#efe4d3] opacity-80 blur-3xl" />

      <section className="relative mx-auto w-full max-w-2xl text-center">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-[#788c68]">
          Chez L’Avocatier · Sainte-Marie
        </p>
        <div className="relative mx-auto mb-5 w-fit">
          <span aria-hidden="true" className="select-none text-[clamp(8rem,28vw,15rem)] font-medium leading-[0.78] tracking-[-0.05em] text-[#dce5d5]">
            404
          </span>
        </div>
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
          Cette page s’est envolée
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[#667269]">
          Le chemin que vous cherchez n’existe pas ou a changé. Revenez à l’accueil pour retrouver le soleil de Sainte-Marie.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[#314b3d] px-7 text-sm font-medium text-white transition-colors hover:bg-[#23382f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#788c68]"
        >
          Retour à l’accueil
        </Link>
      </section>
    </main>
  );
}
