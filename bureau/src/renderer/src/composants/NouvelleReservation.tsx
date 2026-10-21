import {
  Button,
  Caption1,
  Combobox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Divider,
  Dropdown,
  Field,
  Input,
  Link,
  MessageBar,
  MessageBarBody,
  Option,
  OptionGroup,
  SpinButton,
  Spinner,
  Switch,
  Text,
  Textarea,
} from "@fluentui/react-components"
import { CalendarCheckmarkRegular, PersonAddRegular } from "@fluentui/react-icons"
import { useState, type FormEvent } from "react"
import { ajouterJours, chevauche, formaterPrix, nombreNuits, pluriel } from "@partage/dates"
import { calculerDevis, deplierSaisons } from "@partage/regles"
import type { ReservationDirecte } from "@partage/types"
import { nomDe, useDonneesChargees, type Preremplissage } from "../donnees"
import { NOMS_SOURCES } from "../libelles"
import ChampDate from "./ChampDate"
import { ChampsClient, useCreationClient } from "./NouveauClient"
import { useFormulairesStyles } from "./useFormulairesStyles.styles"

type Source = ReservationDirecte["source"]
const SOURCES: Source[] = ["sur_place", "telephone", "whatsapp", "booking"]

const normaliser = (texte: string) => texte.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()

// Fenêtre « Nouvelle réservation » (réception) : client existant ou nouveau, hébergement libre aux dates
// choisies, tarif calculé (modifiable), réservation confirmée d'office. Ouverte depuis la barre de titre,
// Aujourd'hui, Planning ou la fiche d'un client (préremplie).
export default function NouvelleReservation() {
  const { nouvelleReservation, fermerNouvelleReservation } = useDonneesChargees()
  return (
    <Dialog open={nouvelleReservation !== null} onOpenChange={(_e, d) => !d.open && fermerNouvelleReservation()}>
      {/* Clé : formulaire remis à zéro à chaque ouverture */}
      <Formulaire key={JSON.stringify(nouvelleReservation)} prerempli={nouvelleReservation ?? {}} onFin={fermerNouvelleReservation} />
    </Dialog>
  )
}

function Formulaire({ prerempli, onFin }: { prerempli: Preremplissage; onFin: () => void }) {
  const styles = useFormulairesStyles()
  const { d, executer, naviguer } = useDonneesChargees()
  const [clientId, setClientId] = useState(prerempli.clientId ?? "")
  const [recherche, setRecherche] = useState(() => (prerempli.clientId ? nomDe(d.clients.find((c) => c.id === prerempli.clientId)) : ""))
  const [nouveauClient, setNouveauClient] = useState(false)
  const creation = useCreationClient()
  const [hebergementId, setHebergementId] = useState(prerempli.hebergementId ?? "")
  const [arrivee, setArrivee] = useState(prerempli.arrivee ?? d.aujourdhui)
  const [depart, setDepart] = useState(ajouterJours(prerempli.arrivee ?? d.aujourdhui, 1))
  const [adultes, setAdultes] = useState(2)
  const [enfants, setEnfants] = useState(0)
  const [navette, setNavette] = useState(false)
  const [source, setSource] = useState<Source>("sur_place")
  const [montant, setMontant] = useState("")
  const [telephone, setTelephone] = useState("")
  const [message, setMessage] = useState("")
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const nuits = arrivee && depart && depart > arrivee ? nombreNuits(arrivee, depart) : 0
  const annee = Number(d.aujourdhui.slice(0, 4))
  const saisons = deplierSaisons(d.saisons, [annee - 1, annee, annee + 1, annee + 2])
  const hebergement = d.hebergements.find((h) => h.id === hebergementId)
  const tarif = hebergement && nuits ? calculerDevis(hebergement, arrivee, depart, saisons).total : null

  // Hébergements déjà pris (réservation active ou dates bloquées) aux dates choisies
  const occupes = new Set(
    nuits
      ? [
          ...d.reservations.filter((r) => (r.statut === "option" || r.statut === "confirmee") && chevauche(arrivee, depart, r.arrivee, r.depart)).map((r) => r.hebergementId),
          ...d.blocages.filter((b) => chevauche(arrivee, depart, b.debut, b.fin)).map((b) => b.hebergementId),
        ]
      : [],
  )
  const clientsTrouves = d.clients.filter((c) => normaliser(`${nomDe(c)} ${c.email} ${c.telephone}`).includes(normaliser(recherche.trim()))).slice(0, 30)

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    setErreur(null)
    let id = clientId
    if (nouveauClient) {
      const client = await creation.creer()
      // Erreur de création affichée par creation.erreur
      if (!client) return setEnCours(false)
      id = client.id
      setClientId(id)
      setNouveauClient(false)
    }
    const resultat = await executer<{ reservation: { id: string } }>("POST", "/api/hotes/reservations", {
      clientId: id,
      hebergementId,
      arrivee,
      depart,
      adultes,
      enfants,
      navette,
      source,
      montantTotal: montant.trim() === "" ? null : Number(montant.replace(/\s/g, "").replace(",", ".")),
      telephone,
      message,
    })
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    onFin()
    naviguer({ page: "client", id })
  }

  return (
    <DialogSurface className={styles.surface}>
      <form onSubmit={envoyer}>
        <DialogBody>
          <DialogTitle>Nouvelle réservation</DialogTitle>
          <DialogContent className={styles.corps}>
            {nouveauClient ? (
              <div className={styles.encart}>
                <div className={styles.ligneEncart}>
                  <Text weight="semibold">Nouveau client</Text>
                  <Link as="button" type="button" onClick={() => setNouveauClient(false)}>
                    Choisir un client existant
                  </Link>
                </div>
                <ChampsClient valeurs={creation.valeurs} onChange={creation.setValeurs} />
              </div>
            ) : (
              <Field label="Client" required hint={<Link as="button" type="button" onClick={() => setNouveauClient(true)}>Le client n&apos;a pas encore de fiche ? Créer un client</Link>}>
                <Combobox
                  className={styles.champ}
                  placeholder="Rechercher par nom, e-mail ou téléphone"
                  value={recherche}
                  selectedOptions={clientId ? [clientId] : []}
                  onChange={(e) => {
                    setRecherche(e.target.value)
                    setClientId("")
                  }}
                  onOptionSelect={(_e, data) => {
                    if (data.optionValue === "nouveau") {
                      setNouveauClient(true)
                      return
                    }
                    setClientId(data.optionValue ?? "")
                    setRecherche(data.optionText ?? "")
                    const client = d.clients.find((c) => c.id === data.optionValue)
                    if (client?.telephone && !telephone) setTelephone(client.telephone)
                  }}
                >
                  <Option value="nouveau" text="Nouveau client">
                    <PersonAddRegular /> Nouveau client…
                  </Option>
                  <OptionGroup label="Clients">
                    {clientsTrouves.map((c) => (
                      <Option key={c.id} value={c.id} text={nomDe(c)}>
                        {nomDe(c)}
                        {(c.telephone || c.email) && ` · ${c.telephone || c.email}`}
                      </Option>
                    ))}
                  </OptionGroup>
                </Combobox>
              </Field>
            )}

            <Divider />

            <div className={styles.grille}>
              <Field label="Arrivée" required>
                <ChampDate
                  className={styles.champ}
                  valeur={arrivee}
                  onChange={(v) => {
                    setArrivee(v)
                    if (v && depart <= v) setDepart(ajouterJours(v, 1))
                  }}
                  min={ajouterJours(d.aujourdhui, -1)}
                />
              </Field>
              <Field label="Départ" required>
                <ChampDate className={styles.champ} valeur={depart} onChange={setDepart} min={arrivee ? ajouterJours(arrivee, 1) : d.aujourdhui} />
              </Field>
              <Field label="Hébergement" required className={styles.pleine}>
                <Dropdown
                  className={styles.champ}
                  placeholder="Choisir un hébergement libre"
                  value={hebergement ? `${hebergement.nom} · ${hebergement.capaciteMax} pers.` : ""}
                  selectedOptions={hebergementId ? [hebergementId] : []}
                  onOptionSelect={(_e, data) => setHebergementId(data.optionValue ?? "")}
                >
                  {d.hebergements.map((h) => (
                    <Option key={h.id} value={h.id} text={`${h.nom} · ${h.capaciteMax} pers.`} disabled={occupes.has(h.id)}>
                      {h.nom} · {h.capaciteMax} pers.{occupes.has(h.id) ? " · déjà pris à ces dates" : ` · ${formaterPrix(h.prixNuit)} / nuit`}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Adultes" required>
                <SpinButton value={adultes} min={1} max={10} onChange={(_e, data) => setAdultes(data.value ?? (Number(data.displayValue) || 1))} />
              </Field>
              <Field label="Enfants">
                <SpinButton value={enfants} min={0} max={10} onChange={(_e, data) => setEnfants(data.value ?? (Number(data.displayValue) || 0))} />
              </Field>
              <Field label="Provenance">
                <Dropdown className={styles.champ} value={NOMS_SOURCES[source]} selectedOptions={[source]} onOptionSelect={(_e, data) => setSource(data.optionValue as Source)}>
                  {SOURCES.map((s) => (
                    <Option key={s} value={s}>
                      {NOMS_SOURCES[s]}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Téléphone / WhatsApp">
                <Input type="tel" value={telephone} onChange={(_e, data) => setTelephone(data.value)} />
              </Field>
              <Switch className={styles.pleine} label="Navette depuis l'aéroport" checked={navette} onChange={(_e, data) => setNavette(data.checked)} />
              <Field label="Message ou demande particulière" className={styles.pleine}>
                <Textarea value={message} onChange={(_e, data) => setMessage(data.value)} resize="vertical" />
              </Field>
            </div>

            <div className={styles.encart}>
              <div className={styles.ligneEncart}>
                <div>
                  <Text weight="semibold" block>
                    Montant du séjour
                  </Text>
                  <Caption1 className={styles.secondaire}>
                    {tarif !== null
                      ? `${pluriel(nuits, "nuit")} · tarif calculé ${formaterPrix(tarif)}, saisons comprises`
                      : nuits
                        ? `${pluriel(nuits, "nuit")} · choisissez l'hébergement`
                        : "Choisissez les dates et l'hébergement"}
                  </Caption1>
                </div>
                <Input
                  input={{ className: styles.nombre, inputMode: "numeric" }}
                  contentAfter="€"
                  placeholder={tarif !== null ? String(tarif) : "—"}
                  value={montant}
                  onChange={(_e, data) => setMontant(data.value)}
                  aria-label="Montant négocié (vide : tarif calculé)"
                />
              </div>
            </div>

            {(erreur || creation.erreur) && (
              <MessageBar intent="error">
                <MessageBarBody>{erreur ?? creation.erreur}</MessageBarBody>
              </MessageBar>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onFin}>Annuler</Button>
            <Button
              type="submit"
              appearance="primary"
              disabled={enCours || (!clientId && !nouveauClient) || !hebergementId || !nuits}
              icon={enCours ? <Spinner size="tiny" /> : <CalendarCheckmarkRegular />}
            >
              Confirmer la réservation
            </Button>
          </DialogActions>
        </DialogBody>
      </form>
    </DialogSurface>
  )
}
