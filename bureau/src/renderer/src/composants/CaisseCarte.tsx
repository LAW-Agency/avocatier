import {
  Body1,
  Button,
  Caption1,
  Combobox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Option,
  Spinner,
  Subtitle2,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Tooltip,
  mergeClasses,
} from "@fluentui/react-components"
import { AddRegular, DeleteRegular, EditRegular, FoodRegular, SaveRegular } from "@fluentui/react-icons"
import { useState, type FormEvent } from "react"
import { formaterDansDevise } from "@partage/devises"
import type { Article } from "@partage/types"
import type { Caisse, DonneesEcranCaisse } from "../caisse"
import { useRestaurantStyles } from "../pages/useRestaurantStyles.styles"
import { Vide } from "./commun"
import { useCadreTableStyles } from "./useCommunStyles.styles"
import { useFormulairesStyles } from "./useFormulairesStyles.styles"

const ariary = (montant: number) => formaterDansDevise(montant, "MGA")

// Carte du restaurant et du bar, modifiée par toute l'équipe de la caisse : articles par catégorie, prix en
// ariary. Un article déjà vendu se retire de la carte (interrupteur) au lieu d'être supprimé
export default function CaisseCarte({ caisse, donnees }: { caisse: Caisse; donnees: DonneesEcranCaisse }) {
  const styles = useRestaurantStyles()
  const cadre = useCadreTableStyles()
  const [edition, setEdition] = useState<Article | "nouveau" | null>(null)
  const [enCours, setEnCours] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const categories = [...new Set(donnees.articles.map((a) => a.categorie))]

  async function modifier(a: Article, modification: Partial<Article>) {
    setEnCours(a.id)
    const resultat = await caisse.ecrire("PATCH", `/api/hotes/caisse/articles/${encodeURIComponent(a.id)}`, modification)
    setEnCours(null)
    setErreur(resultat.ok ? null : resultat.erreur)
  }

  async function supprimer(a: Article) {
    setEnCours(a.id)
    const resultat = await caisse.ecrire("DELETE", `/api/hotes/caisse/articles/${encodeURIComponent(a.id)}`)
    setEnCours(null)
    setErreur(resultat.ok ? null : resultat.erreur)
  }

  return (
    <div className={styles.page}>
      <div className={styles.barreOutils}>
        <Body1 className={styles.secondaire}>Prix en ariary. Un article retiré de la carte n&apos;est plus proposé à la vente ; les tickets passés le gardent.</Body1>
        <Button appearance="primary" icon={<AddRegular />} disabled={caisse.lectureSeule} onClick={() => setEdition("nouveau")}>
          Nouvel article
        </Button>
      </div>
      {erreur && (
        <MessageBar intent="error">
          <MessageBarBody>{erreur}</MessageBarBody>
        </MessageBar>
      )}
      {donnees.articles.length === 0 ? (
        <Vide Icone={FoodRegular} titre="La carte est vide" texte="Ajoutez les plats, les boissons et les desserts, rangés par catégorie." />
      ) : (
        categories.map((categorie) => (
          <section key={categorie} className={styles.page}>
            <Subtitle2>{categorie}</Subtitle2>
            <div className={cadre.root}>
              <Table aria-label={categorie}>
                <TableHeader className={cadre.entete}>
                  <TableRow>
                    <TableHeaderCell className={cadre.premiere}>Article</TableHeaderCell>
                    <TableHeaderCell style={{ width: "140px" }}>
                      <span className={cadre.droite}>Prix</span>
                    </TableHeaderCell>
                    <TableHeaderCell style={{ width: "150px" }}>À la carte</TableHeaderCell>
                    <TableHeaderCell style={{ width: "88px" }} aria-label="Actions" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donnees.articles
                    .filter((a) => a.categorie === categorie)
                    .map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className={cadre.premiere}>
                          <Body1 block className={a.actif ? undefined : styles.secondaire}>
                            {a.nom}
                          </Body1>
                          {a.description && <Caption1 className={styles.secondaire}>{a.description}</Caption1>}
                        </TableCell>
                        <TableCell>
                          <span className={mergeClasses(cadre.droite, cadre.nombre)}>{ariary(a.prix)}</span>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={a.actif}
                            disabled={enCours === a.id || caisse.lectureSeule}
                            label={a.actif ? "Proposé" : "Retiré"}
                            onChange={(_e, data) => modifier(a, { actif: data.checked })}
                          />
                        </TableCell>
                        <TableCell>
                          <div className={styles.actionsLigne}>
                            <Tooltip content="Modifier" relationship="label">
                              <Button appearance="subtle" size="small" icon={<EditRegular />} disabled={caisse.lectureSeule} onClick={() => setEdition(a)} />
                            </Tooltip>
                            <Tooltip content="Supprimer (article jamais vendu)" relationship="label">
                              <Button
                                appearance="subtle"
                                size="small"
                                disabled={enCours === a.id || caisse.lectureSeule}
                                icon={enCours === a.id ? <Spinner size="tiny" /> : <DeleteRegular />}
                                onClick={() => supprimer(a)}
                              />
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ))
      )}
      {edition && <FenetreArticle article={edition === "nouveau" ? null : edition} categories={categories} caisse={caisse} onFin={() => setEdition(null)} />}
    </div>
  )
}

function FenetreArticle({ article, categories, caisse, onFin }: { article: Article | null; categories: string[]; caisse: Caisse; onFin: () => void }) {
  const formulaire = useFormulairesStyles()
  const [nom, setNom] = useState(article?.nom ?? "")
  const [categorie, setCategorie] = useState(article?.categorie ?? categories[0] ?? "")
  const [prix, setPrix] = useState(article ? String(article.prix) : "")
  const [description, setDescription] = useState(article?.description ?? "")
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const proposees = categories.filter((c) => c.toLocaleLowerCase("fr").includes(categorie.trim().toLocaleLowerCase("fr")))

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    setEnCours(true)
    const corps = { nom, categorie, prix: Number(prix.replace(/\s/g, "")), description }
    const resultat = article
      ? await caisse.ecrire("PATCH", `/api/hotes/caisse/articles/${encodeURIComponent(article.id)}`, corps)
      : await caisse.ecrire("POST", "/api/hotes/caisse/articles", corps)
    setEnCours(false)
    if (!resultat.ok) return setErreur(resultat.erreur)
    onFin()
  }

  return (
    <Dialog open onOpenChange={(_e, data) => !data.open && onFin()}>
      <DialogSurface className={formulaire.surface} style={{ maxWidth: "560px" }}>
        <form onSubmit={envoyer}>
          <DialogBody>
            <DialogTitle>{article ? `Modifier « ${article.nom} »` : "Nouvel article"}</DialogTitle>
            <DialogContent className={formulaire.corps}>
              <div className={formulaire.grille}>
                <Field label="Nom" required className={formulaire.pleine}>
                  <Input value={nom} onChange={(_e, data) => setNom(data.value)} placeholder="Poisson coco, THB grande…" autoFocus />
                </Field>
                <Field label="Catégorie" required hint="Choisissez-en une ou tapez-en une nouvelle">
                  <Combobox
                    className={formulaire.champ}
                    freeform
                    value={categorie}
                    selectedOptions={categories.includes(categorie) ? [categorie] : []}
                    onChange={(e) => setCategorie(e.target.value)}
                    onOptionSelect={(_e, data) => data.optionValue && setCategorie(data.optionValue)}
                    placeholder="Plats, Boissons…"
                  >
                    {proposees.map((c) => (
                      <Option key={c} value={c}>
                        {c}
                      </Option>
                    ))}
                  </Combobox>
                </Field>
                <Field label="Prix" required>
                  <Input className={formulaire.champ} input={{ className: formulaire.nombre, inputMode: "numeric" }} contentAfter="Ar" value={prix} onChange={(_e, data) => setPrix(data.value)} />
                </Field>
                <Field label="Description" hint="Facultative : affichée au survol dans la caisse" className={formulaire.pleine}>
                  <Input value={description} onChange={(_e, data) => setDescription(data.value)} />
                </Field>
              </div>
              {erreur && (
                <MessageBar intent="error">
                  <MessageBarBody>{erreur}</MessageBarBody>
                </MessageBar>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={onFin}>Annuler</Button>
              <Button type="submit" appearance="primary" disabled={enCours || caisse.lectureSeule} icon={enCours ? <Spinner size="tiny" /> : article ? <SaveRegular /> : <AddRegular />}>
                {article ? "Enregistrer" : "Ajouter à la carte"}
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  )
}
