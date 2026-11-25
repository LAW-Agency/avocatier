# Contribuer au projet

Règles de travail de l'équipe. À lire avec [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Langue

Tout est en **français** : textes du site, noms de fonctions et variables métier (`reservation`, `chambre`,
`encaissement`…), commentaires, messages de commit, titres de PR.

## Branches et pull requests

- `main` est la branche de production : Vercel la déploie automatiquement. On n'y pousse jamais directement.
- Une branche par sujet, nommée par son but :
  - `feat/…` nouvelle fonctionnalité (ex. `feat/caisse-restaurant`)
  - `fix/…` correction (ex. `fix/solde-taux-de-change`)
  - `docs/…` documentation
- Ouvrir une PR vers `main`. Vercel crée une préversion du site pour chaque PR.
- **Après la fusion, supprimer la branche** (bouton « Delete branch » de GitHub, et en local
  `git branch -d <branche>`). Une branche fusionnée n'apporte plus rien : tout son historique est dans `main`
  et dans la PR.
- Une branche sert à **un** sujet : ne pas réutiliser une vieille branche pour un nouveau travail.

## Commits

- Message en français, à l'impératif ou en description courte : « Caisse : clôture avec écart commenté ».
- Préfixe par zone quand c'est utile : `Accueil :`, `Logiciel :`, `Caisse :`, `Démonstration :`…
- **Jamais de secret** : le dépôt est public. Mots de passe, clés et adresses de base vont dans `.env`
  (ignoré par git), et chaque nouvelle variable est ajoutée, vide et commentée, dans `.env.example`.

## Avant de pousser

```bash
npm run lint
npx tsc --noEmit
cd bureau && npm run typecheck   # si le logiciel a changé
```

Il n'y a pas de tests automatisés : vérifier le parcours touché dans le navigateur (`npm run dev`) et/ou dans
le logiciel (`cd bureau && npm run dev`, avec le site lancé).

## Modifier la base de données

1. Ne **jamais** modifier une migration existante : elle est déjà appliquée sur les bases.
2. Ajouter un fichier `lib/reservation/postgres/migrations/0NN_description.sql` (numéro suivant).
3. `npm run db:migrer`.
4. Mettre à jour `lib/reservation/types.ts`, le contrat (`moteur.ts`, `gestion.ts` ou `caisse.ts`) et
   l'implémentation dans `postgres/`.
5. Ajouter la ligne de la migration dans le tableau de `docs/ARCHITECTURE.md`.

## Ajouter une route à l'API des hôtes (`app/api/hotes/`)

Checklist :

- [ ] La route passe par une garde de `lib/api/hotes.ts` : `pourLesHotes`, `pourLesGerants` ou
      `pourLaCaisse`. Jamais de route sans garde.
- [ ] Les données reçues sont vérifiées côté serveur (le logiciel peut se tromper ou être ancien).
- [ ] Une écriture appelle `journaliser(...)`.
- [ ] Si elle change les disponibilités ou les prix : `rafraichirSite()`. Si elle touche une réservation ou
      un client sans appeler `rafraichirSite()` : `planifierAgenda()` (agenda Google du propriétaire).
- [ ] Les e-mails partent dans `after()`, après la transaction.
- [ ] Une écriture qui **crée** quelque chose accepte un `id` fourni par le logiciel et renvoie `deja: true`
      si cet `id` existe déjà (pas de doublon quand une réponse se perd).
- [ ] Côté logiciel, le bouton qui appelle la route est désactivé hors connexion (`|| lectureSeule`, avec
      `useLectureSeule()` de `donnees.tsx`).

## Ajouter une page au site

- Composants dans `components/<page>/`, contenus statiques dans `data/`.
- Page avec hero plein écran : l'ajouter à `HERO_PAGES` de `components/Header.tsx`.
- Lien dans le menu : `data/navLinks.ts`.
- Prix affichés avec `<Prix />` (`components/Devise.tsx`), jamais en dur.
- Textes et référencement dans `docs/refonte-textes-vitrine.md`.

## Publier une version du logiciel des hôtes

1. Augmenter `version` dans `bureau/package.json`.
2. **Ajouter la version en tête de `NOUVEAUTES`** dans `bureau/src/renderer/src/nouveautes.ts` (sinon la
   fenêtre de bienvenue ne s'ouvre pas après la mise à jour).
3. `cd bureau && GH_TOKEN=… npm run publier` : construit l'installateur et le dépose dans un brouillon
   `v<version>` du dépôt `LAW-Agency/avocatier-versions`.
4. Sur GitHub, relire le brouillon (notes de version) et le **publier**. Les logiciels installés le proposent
   dans les 4 h.

`npm run paquet` seul construit l'installateur dans `bureau/dist/` sans rien publier.

## Données de démonstration

Les comptes de démonstration (`COMPTE_DEMO`, `COMPTE_HOTE`… dans `lib/reservation/donnees.ts`) ont leur mot
de passe dans `.env` (`MOT_DE_PASSE_DEMO_*`), jamais dans le code. Ils **doivent être supprimés avant
l'ouverture du site au public**.

Les clients fictifs utilisent le domaine `@exemple.test`.
