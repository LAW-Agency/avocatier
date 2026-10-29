import { Badge, Body1, Button, Field, Input, MessageBar, MessageBarActions, MessageBarBody, Spinner, Tab, TabList } from "@fluentui/react-components"
import { DataBarVerticalRegular, DesktopRegular, FoodRegular, LockClosedRegular, ReceiptRegular, TextBulletListSquareRegular } from "@fluentui/react-icons"
import { useState, type FormEvent } from "react"
import type { DateISO } from "@partage/types"
import { useCaisse, type Caisse } from "../caisse"
import CaisseCarte from "../composants/CaisseCarte"
import CaisseCloture, { OuvertureCaisse } from "../composants/CaisseCloture"
import CaisseEnsemble from "../composants/CaisseEnsemble"
import CaisseTickets from "../composants/CaisseTickets"
import CaisseVente from "../composants/CaisseVente"
import { Carte, ChargementLogo, EnTete } from "../composants/commun"
import { useDonneesChargees, type OngletCaisse } from "../donnees"
import { useRestaurantStyles } from "./useRestaurantStyles.styles"

const heure = (instant: string) =>
  new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Indian/Antananarivo" }).format(new Date(instant))

// Restaurant et Bar : caisse de ce poste (vente, tickets du jour, clôture, carte) pour les caissiers, la réception
// et les gérants, plus une vue d'ensemble de tous les postes pour les gérants (ouverte en premier). Un poste
// s'enregistre une fois (nom : Bar, Restaurant…), depuis l'onglet Vente : le serveur lui donne le préfixe de ses
// tickets. On ne vend qu'avec la caisse ouverte (fond de caisse), clôturée en fin de service avec les espèces comptées
// `onglet` : onglet demandé par la navigation (visite guidée), appliqué à chaque changement
export default function Restaurant({ onglet: demande }: { onglet?: OngletCaisse }) {
  const styles = useRestaurantStyles()
  const { gerant } = useDonneesChargees()
  const [onglet, setOnglet] = useState<OngletCaisse>(demande ?? (gerant ? "ensemble" : "vente"))
  const [demandePrecedente, setDemandePrecedente] = useState(demande)
  if (demande !== demandePrecedente) {
    setDemandePrecedente(demande)
    if (demande) setOnglet(demande)
  }
  // Jour des tickets affichés ; null : aujourd'hui (date de Sainte-Marie donnée par le serveur)
  const [jour, setJour] = useState<DateISO | null>(null)
  const caisse = useCaisse(jour)
  const { donnees, erreur, poste, session } = caisse
  const nomPoste = donnees?.postes.find((p) => p.id === poste?.posteId)?.nom

  return (
    <div className={styles.page}>
      <EnTete
        titre="Restaurant et Bar"
        description="Ventes du restaurant et du bar, payées sur place ou mises sur la note d'une chambre."
        actions={
          nomPoste && poste?.prefixe ? (
            <Badge appearance="tint" color={session ? "success" : "subtle"} size="large" shape="rounded" icon={<DesktopRegular />} data-visite="caisse-poste">
              {nomPoste} · {session ? `caisse ouverte depuis ${heure(session.ouverteLe)}` : "caisse fermée"}
            </Badge>
          ) : undefined
        }
      />
      {erreur && (
        <MessageBar intent="error">
          <MessageBarBody>{erreur}</MessageBarBody>
          <MessageBarActions>
            <Button onClick={() => void caisse.charger()}>Réessayer</Button>
          </MessageBarActions>
        </MessageBar>
      )}
      {!donnees || !poste ? (
        !erreur && <ChargementLogo texte="Chargement de la caisse…" />
      ) : (
        <>
          <TabList selectedValue={onglet} onTabSelect={(_e, data) => setOnglet(data.value as OngletCaisse)} data-visite="restaurant-onglets">
            {gerant && (
              <Tab value="ensemble" icon={<DataBarVerticalRegular />}>
                Vue d&apos;ensemble
              </Tab>
            )}
            <Tab value="vente" icon={<ReceiptRegular />}>
              Vente
            </Tab>
            <Tab value="tickets" icon={<TextBulletListSquareRegular />}>
              Tickets du jour
            </Tab>
            <Tab value="cloture" icon={<LockClosedRegular />}>
              Clôture
            </Tab>
            <Tab value="carte" icon={<FoodRegular />}>
              Carte
            </Tab>
          </TabList>
          {onglet === "ensemble" && gerant && <CaisseEnsemble aujourdhui={donnees.aujourdhui} />}
          {/* Cet ordinateur vend : enregistré comme poste, puis caisse ouverte */}
          {onglet === "vente" &&
            (!poste.prefixe || !nomPoste ? (
              <EnregistrementPoste caisse={caisse} />
            ) : session ? (
              <CaisseVente caisse={caisse} donnees={donnees} />
            ) : (
              <OuvertureCaisse caisse={caisse} />
            ))}
          {onglet === "tickets" && <CaisseTickets caisse={caisse} donnees={donnees} jour={jour ?? donnees.aujourdhui} onJour={setJour} />}
          {onglet === "cloture" && <CaisseCloture caisse={caisse} donnees={donnees} />}
          {onglet === "carte" && <CaisseCarte caisse={caisse} donnees={donnees} />}
        </>
      )}
    </div>
  )
}

// Premier passage sur cet ordinateur : le poste prend un nom et reçoit son préfixe de numérotation
function EnregistrementPoste({ caisse }: { caisse: Caisse }) {
  const styles = useRestaurantStyles()
  const [nom, setNom] = useState("")
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    setErreur(await caisse.enregistrerPoste(nom))
    setEnCours(false)
  }

  return (
    <Carte titre="Enregistrer ce poste de caisse" className={styles.accueil} data-visite="caisse-poste">
      <Body1>
        Donnez un nom à cet ordinateur (Bar, Restaurant, Réception…). Ses tickets seront numérotés à part, ce qui permet aussi de vendre pendant une
        coupure d&apos;Internet sans mélanger les numéros.
      </Body1>
      <form className={styles.champLigne} onSubmit={envoyer}>
        <Field label="Nom du poste" style={{ flex: 1 }}>
          <Input value={nom} onChange={(_e, data) => setNom(data.value)} placeholder="Bar" autoFocus />
        </Field>
        <Button type="submit" appearance="primary" disabled={enCours || !nom.trim() || caisse.lectureSeule} icon={enCours ? <Spinner size="tiny" /> : <DesktopRegular />}>
          Enregistrer
        </Button>
      </form>
      {erreur && (
        <MessageBar intent="error">
          <MessageBarBody>{erreur}</MessageBarBody>
        </MessageBar>
      )}
    </Carte>
  )
}
