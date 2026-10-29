import type { BilanSession, CodeDevise, Ticket } from "./types"

// Règles pures de la caisse Restaurant et Bar, partagées entre le serveur (clôture enregistrée) et le logiciel
// des hôtes (bilan affiché avant de clôturer). Montants en ariary, sauf les espèces reçues dans une autre devise.

const deuxDecimales = (n: number) => Math.round(n * 100) / 100

// Bilan d'une session : ventes, encaissements par mode et par devise, espèces attendues dans le tiroir (fond de
// caisse + espèces reçues − monnaie rendue en ariary) et, à la clôture, écarts avec les espèces comptées.
// Un ticket annulé ne compte plus : son argent a été rendu au client
export function bilanSession(fondCaisse: number, tickets: Ticket[], comptees?: Partial<Record<CodeDevise, number>>): BilanSession {
  const valides = tickets.filter((t) => t.statut !== "annule")
  const annules = tickets.filter((t) => t.statut === "annule")
  const payes = valides.filter((t) => t.statut === "paye")

  const parMode = new Map<string, BilanSession["parMode"][number]>()
  const attendues: Partial<Record<CodeDevise, number>> = { MGA: fondCaisse }
  for (const r of payes.flatMap((t) => t.reglements)) {
    const cle = `${r.mode}-${r.devise}`
    const ligne = parMode.get(cle) ?? { mode: r.mode, devise: r.devise, montant: 0, contreValeur: 0, nombre: 0 }
    ligne.montant = deuxDecimales(ligne.montant + r.montant)
    ligne.contreValeur += r.contreValeur - r.rendu
    ligne.nombre += 1
    parMode.set(cle, ligne)
    if (r.mode === "especes") {
      attendues[r.devise] = deuxDecimales((attendues[r.devise] ?? 0) + r.montant)
      attendues.MGA = (attendues.MGA ?? 0) - r.rendu
    }
  }

  const bilan: BilanSession = {
    tickets: valides.length,
    ventes: valides.reduce((s, t) => s + t.total, 0),
    encaisse: payes.reduce((s, t) => s + t.total, 0),
    surChambres: valides.filter((t) => t.statut === "chambre").reduce((s, t) => s + t.total, 0),
    annules: annules.length,
    montantAnnule: annules.reduce((s, t) => s + t.total, 0),
    parMode: [...parMode.values()].sort((a, b) => b.contreValeur - a.contreValeur),
    attendues,
  }
  if (!comptees) return bilan
  const devises = [...new Set([...Object.keys(attendues), ...Object.keys(comptees)])] as CodeDevise[]
  return {
    ...bilan,
    comptees,
    ecarts: Object.fromEntries(devises.map((d) => [d, deuxDecimales((comptees[d] ?? 0) - (attendues[d] ?? 0))])),
  }
}

// Écart non nul dans au moins une devise : la clôture demande une explication
export const aUnEcart = (bilan: Pick<BilanSession, "ecarts">) => Object.values(bilan.ecarts ?? {}).some((e) => e !== 0)
