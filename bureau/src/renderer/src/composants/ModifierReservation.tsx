import {
  Body1,
  Button,
  Caption1,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Dropdown,
  Field,
  Input,
  Link,
  MessageBar,
  MessageBarBody,
  Option,
  SpinButton,
  Spinner,
  Switch,
  Text,
  Textarea,
} from "@fluentui/react-components"
import { EditRegular, SaveRegular } from "@fluentui/react-icons"
import { useState, type FormEvent } from "react"
import { changementsReservation } from "@partage/controles"
import { ajouterJours, nombreNuits, pluriel } from "@partage/dates"
import { calculerDevis, deplierSaisons } from "@partage/regles"
import type { Reservation } from "@partage/types"
import { chambresPrises, premiereChambre, pretePour, useDonneesChargees, useLectureSeule } from "../donnees"
import { useAnnoncer } from "../toasts"
import ChampDate from "./ChampDate"
import ChoixChambre, { CHAMBRE_AUTO } from "./ChoixChambre"
import { useFormulairesStyles } from "./useFormulairesStyles.styles"
import { usePrix } from "../montants"

const lireMontant = (texte: string) => Number(texte.replace(/\s/g, "").replace(",", "."))

// Modifier une demande ou un séjour confirmé : dates (l'arrivée est figée une fois le client arrivé), hébergement,
// chambre, voyageurs, navette et montant. Ce qui change est résumé avant d'enregistrer ; le client peut être prévenu par
// e-mail, avec un mot des hôtes.
export default function ModifierReservation({ reservation }: { reservation: Reservation }) {
  const lectureSeule = useLectureSeule()
  const [ouverte, setOuverte] = useState(false)
  return (
    <Dialog open={ouverte} onOpenChange={(_e, data) => setOuverte(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button icon={<EditRegular />} disabled={lectureSeule}>
          Modifier
        </Button>
      </DialogTrigger>
      {/* Surface démontée à la fermeture : le formulaire repart de la réservation à jour à chaque ouverture */}
      <Formulaire r={reservation} onFin={() => setOuverte(false)} />
    </Dialog>
  )
}

function Formulaire({ r, onFin }: { r: Reservation; onFin: () => void }) {
  const lectureSeule = useLectureSeule()
  const formaterPrix = usePrix()
  const styles = useFormulairesStyles()
  const { d, executer, clientDe } = useDonneesChargees()
  const { annoncer } = useAnnoncer()
  const client = clientDe(r)
  const [hebergementId, setHebergementId] = useState(r.hebergementId)
  const [chambreId, setChambreId] = useState(r.chambreId)
  const [arrivee, setArrivee] = useState(r.arrivee)
  const [depart, setDepart] = useState(r.depart)
  const [adultes, setAdultes] = useState(r.adultes)
  const [enfants, setEnfants] = useState(r.enfants)
  const [navette, setNavette] = useState(r.navette)
  const [montant, setMontant] = useState(String(r.montantTotal))
  const [prevenir, setPrevenir] = useState(Boolean(client?.email))
  const [mot, setMot] = useState("")
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const arriveeFigee = Boolean(r.arriveeLe)
  const nuits = depart > arrivee ? nombreNuits(arrivee, depart) : 0
  const annee = Number(d.aujourdhui.slice(0, 4))
  const hebergement = d.hebergements.find((h) => h.id === hebergementId)
  const tarif = hebergement && nuits ? calculerDevis(hebergement, arrivee, depart, deplierSaisons(d.saisons, [annee - 1, annee, annee + 1, annee + 2])).total : null

  // Chambres prises aux nouvelles dates, sans compter cette réservation elle-même
  const prises = chambresPrises(d, arrivee, depart, { sauf: r.id, source: r.source })
  const libresDans = (id: string) => d.chambres.filter((c) => c.hebergementId === id && c.active && !prises.has(c.id) && pretePour(c, arrivee, d.aujourdhui, r.chambreId)).length
  // Chambre annoncée dans le résumé : la choisie, sinon la première libre de la catégorie (attribuée par le serveur)
  const chambreVisee =
    chambreId !== CHAMBRE_AUTO
      ? chambreId
      : (premiereChambre(d, hebergementId, prises, arrivee, r.chambreId)?.id ?? r.chambreId)

  const valeurMontant = lireMontant(montant)
  const montantValide = montant.trim() !== "" && Number.isInteger(valeurMontant) && valeurMontant >= 0
  const nomHebergement = (id: string) => d.hebergements.find((h) => h.id === id)?.nom ?? id
  const numeroChambre = (id: string) => d.chambres.find((c) => c.id === id)?.numero ?? "?"
  const changements =
    nuits && montantValide
      ? changementsReservation(
          r,
          { hebergementId, chambreId: chambreVisee, arrivee, depart, adultes, enfants, navette, montantTotal: valeurMontant },
          nomHebergement,
          numeroChambre,
        )
      : []

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    setErreur(null)
    const resultat = await executer<{ changements: string[] }>("PATCH", `/api/hotes/reservations/${encodeURIComponent(r.id)}`, {
      modification: { hebergementId, chambreId: chambreId === CHAMBRE_AUTO ? null : chambreId, arrivee, depart, adultes, enfants, navette, montantTotal: valeurMontant },
      prevenir: prevenir && Boolean(client?.email),
      mot,
    })
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    annoncer({
      titre: `Réservation ${r.reference} modifiée`,
      texte: prevenir && client?.email ? `${client.prenom || "Le client"} est prévenu par e-mail.` : resultat.donnees.changements.join(" · "),
      intent: "success",
    })
    onFin()
  }

  return (
    <DialogSurface className={styles.surface}>
      <form onSubmit={envoyer}>
        <DialogBody>
          <DialogTitle>Modifier la réservation {r.reference}</DialogTitle>
          <DialogContent className={styles.corps}>
            <div className={styles.grille}>
              <Field label="Arrivée" required hint={arriveeFigee ? "Le client est arrivé : la date d'arrivée ne change plus." : undefined}>
                <ChampDate
                  className={styles.champ}
                  valeur={arrivee}
                  disabled={arriveeFigee}
                  onChange={(v) => {
                    setArrivee(v)
                    if (v && depart <= v) setDepart(ajouterJours(v, 1))
                  }}
                  min={arrivee < d.aujourdhui ? arrivee : ajouterJours(d.aujourdhui, -1)}
                />
              </Field>
              <Field label="Départ" required>
                {/* Lendemain de l'arrivée, et jamais avant aujourd'hui (séjour en cours : prolongation) */}
                <ChampDate className={styles.champ} valeur={depart} onChange={setDepart} min={ajouterJours(arrivee, 1) > d.aujourdhui ? ajouterJours(arrivee, 1) : d.aujourdhui} />
              </Field>
              <Field label="Hébergement" required className={styles.pleine}>
                <Dropdown
                  className={styles.champ}
                  value={hebergement ? `${hebergement.nom} · ${hebergement.capaciteMax} pers.` : ""}
                  selectedOptions={[hebergementId]}
                  onOptionSelect={(_e, data) => {
                    const id = data.optionValue ?? r.hebergementId
                    setHebergementId(id)
                    // Retour à la catégorie d'origine : sa chambre ; autre catégorie : la première libre
                    setChambreId(id === r.hebergementId ? r.chambreId : CHAMBRE_AUTO)
                  }}
                >
                  {d.hebergements.map((h) => {
                    const libres = libresDans(h.id)
                    return (
                      <Option key={h.id} value={h.id} text={`${h.nom} · ${h.capaciteMax} pers.`} disabled={nuits > 0 && libres === 0}>
                        {h.nom} · {h.capaciteMax} pers.{nuits > 0 && (libres === 0 ? " · complet à ces dates" : ` · ${libres} libre${libres > 1 ? "s" : ""}`)}
                      </Option>
                    )
                  })}
                </Dropdown>
              </Field>
              <Field label="Chambre" className={styles.pleine}>
                <ChoixChambre className={styles.champ} hebergementId={hebergementId} valeur={chambreId} onChange={setChambreId} prises={prises} arrivee={arrivee} garder={r.chambreId} />
              </Field>
              <Field label="Adultes" required>
                <SpinButton value={adultes} min={1} max={10} onChange={(_e, data) => setAdultes(data.value ?? (Number(data.displayValue) || 1))} />
              </Field>
              <Field label="Enfants">
                <SpinButton value={enfants} min={0} max={10} onChange={(_e, data) => setEnfants(data.value ?? (Number(data.displayValue) || 0))} />
              </Field>
              <Switch className={styles.pleine} label="Navette depuis l'aéroport" checked={navette} onChange={(_e, data) => setNavette(data.checked)} />
            </div>

            <div className={styles.encart}>
              <div className={styles.ligneEncart}>
                <div>
                  <Text weight="semibold" block>
                    Montant du séjour
                  </Text>
                  <Caption1 className={styles.secondaire}>
                    {tarif !== null ? (
                      <>
                        {pluriel(nuits, "nuit")} · tarif pour ces dates {formaterPrix(tarif)}
                        {tarif !== valeurMontant && (
                          <>
                            {" · "}
                            <Link as="button" type="button" onClick={() => setMontant(String(tarif))}>
                              Appliquer le tarif
                            </Link>
                          </>
                        )}
                      </>
                    ) : (
                      "Choisissez des dates valides"
                    )}
                  </Caption1>
                </div>
                <Input
                  input={{ className: styles.nombre, inputMode: "numeric" }}
                  contentAfter="€"
                  value={montant}
                  onChange={(_e, data) => setMontant(data.value)}
                  aria-label="Montant du séjour (remise comprise)"
                />
              </div>
            </div>

            <div className={styles.encart}>
              <Text weight="semibold">Ce qui change</Text>
              {changements.length ? (
                <ul className={styles.changements}>
                  {changements.map((c) => (
                    <li key={c}>
                      <Body1>{c}</Body1>
                    </li>
                  ))}
                </ul>
              ) : (
                <Caption1 className={styles.secondaire}>Rien pour l&apos;instant.</Caption1>
              )}
            </div>

            <Switch
              label={client?.email ? `Prévenir ${client.prenom || "le client"} par e-mail (${client.email})` : "Prévenir le client par e-mail (aucune adresse sur sa fiche)"}
              checked={prevenir && Boolean(client?.email)}
              disabled={!client?.email}
              onChange={(_e, data) => setPrevenir(data.checked)}
            />
            {prevenir && client?.email && (
              <Field label="Mot pour le client" hint="Facultatif : ajouté à l'e-mail, au-dessus du récapitulatif.">
                <Textarea value={mot} onChange={(_e, data) => setMot(data.value)} resize="vertical" maxLength={2000} placeholder="Comme convenu au téléphone, nous avons décalé votre arrivée…" />
              </Field>
            )}

            {erreur && (
              <MessageBar intent="error">
                <MessageBarBody>{erreur}</MessageBarBody>
              </MessageBar>
            )}
          </DialogContent>
          <DialogActions fluid className={styles.pied}>
            <Button onClick={onFin}>Annuler</Button>
            <Button
              type="submit"
              appearance="primary"
              disabled={enCours || lectureSeule || !nuits || !montantValide || changements.length === 0}
              icon={enCours ? <Spinner size="tiny" /> : <SaveRegular />}
            >
              Enregistrer les modifications
            </Button>
          </DialogActions>
        </DialogBody>
      </form>
    </DialogSurface>
  )
}
