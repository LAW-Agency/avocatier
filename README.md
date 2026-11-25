# Chez L'Avocatier — site et logiciel des hôtes

Site vitrine et de réservation de l'hôtel **Chez L'Avocatier** (bungalows à Vohilava, Île Sainte-Marie,
Madagascar), réalisé par LAW Agency. Toujours écrire le nom complet « Chez L'Avocatier » : une autre
« Villa l'avocatier » existe juste à côté.

Le dépôt contient **deux projets** :

| Dossier | Quoi | Technologies |
|---|---|---|
| racine | le site public, son API et la base de données | Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript strict, PostgreSQL (`pg`, SQL écrit à la main) |
| [`bureau/`](bureau/README.md) | le logiciel Windows des hôtes (réservations, planning, caisse, factures…) | Electron, React 19, Fluent UI v9 |

Le logiciel des hôtes ne touche jamais la base directement : il passe par l'API du site
(`app/api/hotes/`). Le site est hébergé sur Vercel, la base de test sur Neon.

> Le dépôt est **public** : aucun secret, mot de passe ni clé dans le code. Tout passe par `.env`.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) : comment tout s'articule (réservation, chambres, caisse,
  factures, sécurité, logiciel des hôtes). **À lire en premier.**
- [`docs/CONTRIBUER.md`](docs/CONTRIBUER.md) : branches, commits, migrations, ajout d'une route d'API,
  publication d'une version du logiciel.
- [`bureau/README.md`](bureau/README.md) : le logiciel des hôtes.
- [`docs/refonte-textes-vitrine.md`](docs/refonte-textes-vitrine.md) : textes et référencement de chaque page.

Langue du projet (site, commentaires, commits) : **français**.

## Démarrer

Prérequis : Node.js 20 ou plus récent, une base PostgreSQL (une branche Neon suffit).

```bash
npm install
cp .env.example .env      # puis remplir, au minimum DATABASE_URL, DATABASE_URL_UNPOOLED et SESSION_SECRET
npm run db:migrer         # crée le schéma
npm run db:amorcer        # hébergements, saisons, devises, chambres et comptes de démonstration
npm run dev               # http://localhost:3000
```

`DATABASE_URL` est obligatoire **même pour `npm run build`** : chaque page lit les réglages de devises en
base. Chaque variable est expliquée dans [`.env.example`](.env.example).

Sans serveur SMTP en développement, les e-mails ne partent pas : leurs aperçus HTML sont écrits dans
`.emails/`.

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | build de production (ne lance pas le lint) |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | vérification des types |
| `npm run db:migrer` | applique les migrations de `lib/reservation/postgres/migrations/` |
| `npm run db:amorcer` | données de base, relançable sans risque |
| `npm run db:demo -- --confirmer` | **efface** réservations, encaissements et clients puis recrée ~150 séjours fictifs |
| `npm run db:demo-caisse -- --confirmer` | remplace la carte et les tickets du restaurant et du bar par une démo |
| `npm run db:mots-de-passe-demo -- --confirmer` | change le mot de passe des comptes de démonstration |
| `npm run agenda -- creer \| partager <e-mail> \| partages \| synchroniser` | agenda Google des réservations du propriétaire (voir `docs/ARCHITECTURE.md`) |

Il n'y a pas encore de tests automatisés : vérifier à la main dans le navigateur et dans le logiciel.

## Arborescence

```
app/                  pages du site (App Router) et routes d'API
  api/hotes/          API du logiciel des hôtes (jeton Bearer)
  calendrier/         export iCal des disponibilités pour Booking.com / Airbnb
components/           composants React, rangés par page (home, hotel, reservation, compte…)
data/                 contenus statiques de la vitrine (navigation, galerie, avis réels…)
lib/
  reservation/        règles métier pures + contrats (moteur, gestion, caisse)
    postgres/         implémentation PostgreSQL et migrations SQL
  auth/               sessions, mots de passe, limites de connexion
  email/              modèles et envoi des e-mails
  agenda/             copie des réservations dans l'agenda Google du propriétaire
  api/hotes.ts        garde des routes de l'API des hôtes (rôles, journal)
scripts/db/           migrations, amorçage et jeux de démonstration
scripts/agenda/       création, partage et remplissage de l'agenda Google
public/images/        photos du client
bureau/               logiciel Electron des hôtes
docs/                 documentation
```
