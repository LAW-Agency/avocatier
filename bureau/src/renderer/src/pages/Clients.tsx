import { Avatar, Badge, Button, CounterBadge, SearchBox, Table, TableBody, TableCell, TableCellLayout, TableHeader, TableHeaderCell, TableRow, Tooltip } from "@fluentui/react-components"
import { ArrowDownloadRegular, ChevronRightRegular, PeopleRegular } from "@fluentui/react-icons"
import { useState } from "react"
import { formaterPlage, pluriel } from "@partage/dates"
import { EnTete, Vide } from "../composants/commun"
import NouveauClient from "../composants/NouveauClient"
import { useCadreTableStyles } from "../composants/useCommunStyles.styles"
import { clientsVisibles, nomDe, useDonneesChargees } from "../donnees"
import { csvClients } from "../exports"
import { useFichiers } from "../fichiers"
import { useClientsStyles } from "./useClientsStyles.styles"

const normaliser = (texte: string) => texte.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()

// Clients : comptes du site et clients enregistrés à la réception, avec leur prochain séjour
export default function Clients() {
  const styles = useClientsStyles()
  const cadre = useCadreTableStyles()
  const { d, naviguer } = useDonneesChargees()
  const { exporter } = useFichiers()
  const [filtre, setFiltre] = useState("")
  const clients = clientsVisibles(d.clients)

  const lignes = clients
    .filter((c) => normaliser(`${nomDe(c)} ${c.email} ${c.telephone} ${c.pays}`).includes(normaliser(filtre.trim())))
    .map((c) => {
      const sejours = d.reservations.filter((r) => r.clientId === c.id)
      const prochain = sejours
        .filter((r) => (r.statut === "option" || r.statut === "confirmee") && r.depart > d.aujourdhui)
        .sort((a, b) => a.arrivee.localeCompare(b.arrivee))[0]
      return { client: c, sejours: sejours.length, prochain }
    })
    .sort((a, b) => (a.prochain?.arrivee ?? "9999").localeCompare(b.prochain?.arrivee ?? "9999"))
  const comptoir = clients.filter((c) => c.origine === "reception").length

  return (
    <>
      <EnTete
        titre="Clients"
        description={`${pluriel(clients.length, "client")}, dont ${pluriel(comptoir, "enregistré", "enregistrés")} à la réception`}
        actions={
          <>
            <SearchBox className={styles.recherche} placeholder="Filtrer les clients" value={filtre} onChange={(_e, data) => setFiltre(data.value)} />
            <Tooltip content="Exporter la liste affichée pour Excel (CSV)" relationship="description">
              <Button icon={<ArrowDownloadRegular />} disabled={lignes.length === 0} onClick={() => exporter("Clients", csvClients(lignes.map((l) => l.client), d))}>
                Exporter
              </Button>
            </Tooltip>
            <NouveauClient onCree={(client) => naviguer({ page: "client", id: client.id })} />
          </>
        }
      />

      {lignes.length === 0 ? (
        <Vide
          Icone={PeopleRegular}
          titre={filtre ? "Aucun client trouvé" : "Aucun client pour l'instant"}
          texte={filtre ? "Essayez un autre nom, une adresse e-mail ou un pays." : "Les comptes créés sur le site et les clients enregistrés à la réception apparaîtront ici."}
        />
      ) : (
        <div className={cadre.root}>
          <Table aria-label="Clients">
            <TableHeader className={cadre.entete}>
              <TableRow>
                <TableHeaderCell className={cadre.premiere}>Client</TableHeaderCell>
                <TableHeaderCell>Contact</TableHeaderCell>
                <TableHeaderCell style={{ width: "120px" }}>Réservations</TableHeaderCell>
                <TableHeaderCell>Prochain séjour</TableHeaderCell>
                <TableHeaderCell style={{ width: "48px" }} aria-label="Fiche" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lignes.map(({ client, sejours, prochain }) => (
                <TableRow
                  key={client.id}
                  className={styles.ligne}
                  tabIndex={0}
                  onClick={() => naviguer({ page: "client", id: client.id })}
                  onKeyDown={(e) => e.key === "Enter" && naviguer({ page: "client", id: client.id })}
                >
                  <TableCell className={cadre.premiere}>
                    <TableCellLayout media={<Avatar name={nomDe(client)} color="colorful" />} description={client.pays || "Pays non renseigné"}>
                      <span className={styles.nom}>
                        {nomDe(client)}
                        {client.origine === "reception" && (
                          <Badge appearance="tint" color="informative" size="small" shape="rounded">
                            Réception
                          </Badge>
                        )}
                      </span>
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <TableCellLayout truncate description={client.email ? client.telephone : undefined}>
                      {client.email || client.telephone || <span className={cadre.secondaire}>Aucun contact</span>}
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <CounterBadge count={sejours} showZero appearance="ghost" color="informative" />
                  </TableCell>
                  <TableCell>{prochain ? formaterPlage(prochain.arrivee, prochain.depart) : <span className={cadre.secondaire}>Aucun séjour à venir</span>}</TableCell>
                  <TableCell>
                    <ChevronRightRegular className={styles.fleche} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
