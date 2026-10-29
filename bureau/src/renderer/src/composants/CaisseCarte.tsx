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
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MessageBar,
  MessageBarBody,
  Option,
  SearchBox,
  Spinner,
  Subtitle2,
  Switch,
  Tooltip,
  mergeClasses,
} from "@fluentui/react-components"
import { AddRegular, DeleteRegular, EditRegular, FoodRegular, MoreHorizontalRegular, SaveRegular } from "@fluentui/react-icons"
import { useState, type FormEvent } from "react"
import { formaterDansDevise } from "@partage/devises"
import type { Article } from "@partage/types"
import type { Caisse, DonneesEcranCaisse } from "../caisse"
import { useRestaurantStyles } from "../pages/useRestaurantStyles.styles"
import { Vide } from "./commun"
import { useFormulairesStyles } from "./useFormulairesStyles.styles"

const ariary = (montant: number) => formaterDansDevise(montant, "MGA")

const sansAccents = (texte: string) => texte.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr")

// Carte du restaurant et du bar, modifiée par toute l'équipe de la caisse : catégories en colonnes, une ligne par
// article (prix en ariary, interrupteur « à la carte », modifier / supprimer dans le menu …). Un article déjà vendu
// se retire de la carte au lieu d'être supprimé
export default function CaisseCarte({ caisse, donnees }: { caisse: Caisse; donnees: DonneesEcranCaisse }) {
  const styles = useRestaurantStyles()
  const [edition, setEdition] = useState<Article | "nouveau" | null>(null)
  const [enCours, setEnCours] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [recherche, setRecherche] = useState("")
  const categories = [...new Set(donnees.articles.map((a) => a.categorie))]
  const mots = sansAccents(recherche.trim()).split(/\s+/).filter(Boolean)
  const trouves = donnees.articles.filter((a) => {
    const texte = sansAccents(`${a.nom} ${a.categorie} ${a.description}`)
    return mots.every((m) => texte.includes(m))
  })
  const retires = donnees.articles.filter((a) => !a.actif).length

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
        <div className={styles.filtres}>
          <SearchBox className={styles.recherche} placeholder="Chercher un article" value={recherche} onChange={(_e, data) => setRecherche(data.value)} />
          <Caption1 className={styles.secondaire}>
            {donnees.articles.length} articles en ariary{retires ? `, dont ${retires} retiré${retires > 1 ? "s" : ""} de la carte` : ""}
          </Caption1>
        </div>
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
      ) : trouves.length === 0 ? (
        <Vide Icone={FoodRegular} titre="Aucun article ne correspond" texte="Changez la recherche." />
      ) : (
        <div className={styles.colonnesCarte} data-visite="caisse-carte">
          {categories
            .filter((categorie) => trouves.some((a) => a.categorie === categorie))
            .map((categorie) => {
              const articles = trouves.filter((a) => a.categorie === categorie)
              return (
                <section key={categorie} className={styles.categorie} aria-label={categorie}>
                  <div className={styles.enteteCategorie}>
                    <Subtitle2>{categorie}</Subtitle2>
                    <Caption1 className={styles.secondaire}>{articles.length}</Caption1>
                  </div>
                  <ul className={styles.listeArticles}>
                    {articles.map((a) => (
                      <li key={a.id} className={styles.ligneArticle}>
                        <Tooltip content={a.description || a.nom} relationship="description" positioning="above-start">
                          <Body1 className={mergeClasses(styles.nomCarte, !a.actif && styles.retire)}>{a.nom}</Body1>
                        </Tooltip>
                        <Body1 className={mergeClasses(styles.prixCarte, !a.actif && styles.retire)}>{ariary(a.prix)}</Body1>
                        <Tooltip content={a.actif ? "Proposé à la vente : cliquer pour le retirer" : "Retiré de la carte : cliquer pour le proposer"} relationship="label">
                          <Switch
                            className={styles.interrupteur}
                            checked={a.actif}
                            disabled={enCours === a.id || caisse.lectureSeule}
                            onChange={(_e, data) => modifier(a, { actif: data.checked })}
                          />
                        </Tooltip>
                        <Menu>
                          <MenuTrigger disableButtonEnhancement>
                            <Button
                              appearance="subtle"
                              size="small"
                              aria-label={`Actions pour ${a.nom}`}
                              disabled={enCours === a.id}
                              icon={enCours === a.id ? <Spinner size="tiny" /> : <MoreHorizontalRegular />}
                            />
                          </MenuTrigger>
                          <MenuPopover>
                            <MenuList>
                              <MenuItem icon={<EditRegular />} disabled={caisse.lectureSeule} onClick={() => setEdition(a)}>
                                Modifier
                              </MenuItem>
                              <MenuItem icon={<DeleteRegular />} disabled={caisse.lectureSeule} onClick={() => supprimer(a)}>
                                Supprimer (jamais vendu)
                              </MenuItem>
                            </MenuList>
                          </MenuPopover>
                        </Menu>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
        </div>
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
