import { Badge, Body1, Button, Field, Input, MessageBar, MessageBarActions, MessageBarBody, Spinner, Tab, TabList } from "@fluentui/react-components"
import { DesktopRegular, FoodRegular, ReceiptRegular, TextBulletListSquareRegular } from "@fluentui/react-icons"
import { useState, type FormEvent } from "react"
import type { DateISO } from "@partage/types"
import { useCaisse, type Caisse } from "../caisse"
import CaisseCarte from "../composants/CaisseCarte"
import CaisseTickets from "../composants/CaisseTickets"
import CaisseVente from "../composants/CaisseVente"
import { Carte, ChargementLogo, EnTete } from "../composants/commun"
import { useRestaurantStyles } from "./useRestaurantStyles.styles"

type Onglet = "vente" | "tickets" | "carte"

// Restaurant et Bar : caisse de ce poste (vente, tickets du jour, carte). Caissiers, réception et gérants.
// Un poste s'enregistre une fois (nom : Bar, Restaurant…) : le serveur lui donne le préfixe de ses tickets
export default function Restaurant() {
  const styles = useRestaurantStyles()
  const [onglet, setOnglet] = useState<Onglet>("vente")
  // Jour des tickets affichés ; null : aujourd'hui (date de Sainte-Marie donnée par le serveur)
  const [jour, setJour] = useState<DateISO | null>(null)
  const caisse = useCaisse(jour)
  const { donnees, erreur, poste } = caisse
  const nomPoste = donnees?.postes.find((p) => p.id === poste?.posteId)?.nom

  return (
    <div className={styles.page}>
      <EnTete
        titre="Restaurant et Bar"
        description="Ventes du restaurant et du bar, payées sur place ou mises sur la note d'une chambre."
        actions={
          nomPoste && poste?.prefixe ? (
            <Badge appearance="tint" color="brand" size="large" shape="rounded" icon={<DesktopRegular />}>
              {nomPoste} · tickets {poste.prefixe}
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
      ) : !poste.prefixe || !nomPoste ? (
        <EnregistrementPoste caisse={caisse} />
      ) : (
        <>
          <TabList selectedValue={onglet} onTabSelect={(_e, data) => setOnglet(data.value as Onglet)}>
            <Tab value="vente" icon={<ReceiptRegular />}>
              Vente
            </Tab>
            <Tab value="tickets" icon={<TextBulletListSquareRegular />}>
              Tickets du jour
            </Tab>
            <Tab value="carte" icon={<FoodRegular />}>
              Carte
            </Tab>
          </TabList>
          {onglet === "vente" && <CaisseVente caisse={caisse} donnees={donnees} />}
          {onglet === "tickets" && <CaisseTickets caisse={caisse} donnees={donnees} jour={jour ?? donnees.aujourdhui} onJour={setJour} />}
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
    <Carte titre="Enregistrer ce poste de caisse" className={styles.accueil}>
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
