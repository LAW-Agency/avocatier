# Chez L'Avocatier — logiciel des hôtes

Application Windows (Electron + Fluent UI v9) de l'équipe de l'hôtel : demandes à traiter, planning,
arrivées et départs, clients, encaissements et factures, caisse du restaurant et du bar, tarifs, équipe.
Elle remplace l'ancien espace `/admin` du site.

Le logiciel **n'a pas d'accès direct à la base** : tout passe par l'API `app/api/hotes/` du site, qui garde
la base PostgreSQL et envoie les e-mails. Voir [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) pour les
règles métier.

## Développement

```bash
npm install          # dans bureau/ (package séparé du site)
npm run dev          # avec le site lancé à la racine (npm run dev, http://localhost:3000)
npm run typecheck
```

Compte de démonstration : celui de `COMPTE_HOTE` dans `lib/reservation/donnees.ts` (créé par
`npm run db:amorcer`, mot de passe dans le `.env` du site).

Une seconde instance d'essai peut tourner à côté de l'instance ouverte, avec son propre dossier de réglages :
`AVOCATIER_DOSSIER=<dossier> npx electron-vite dev --remoteDebuggingPort 9223`.

## Organisation

```
src/
  main/        processus principal (Node) : seul à faire des appels réseau
    index.ts      démarrage, fenêtre, raccourcis (zoom, F11), zone de notification
    api.ts        appels HTTP vers /api/hotes/* (jeton Bearer), détection de perte de connexion
    session.ts    jeton chiffré par safeStorage (session.json), serveur par défaut
    suivi.ts      interroge /api/hotes/activite toutes les 15 s → toasts et notifications Windows
    caisse.ts     poste de caisse de cet ordinateur (caisse.json), numéro du prochain ticket
    classeur.ts   mise en forme des exports Excel (.xlsx)
    misesAJour.ts mises à jour automatiques (electron-updater)
    reglages.ts   réglages du poste (reglages.json)
  preload/     pont window.avocatier, seul lien entre l'interface et le processus principal
  partage/     contrat du pont (ipc.ts)
  renderer/src/  interface React
    App.tsx, Coquille.tsx   connexion, navigation, bandeaux, fenêtres globales
    donnees.tsx             chargement des données, droits par rôle, lecture seule hors connexion
    pages/                  un fichier par écran (Aujourd'hui, Réservations, Planning, Restaurant…)
    composants/             fenêtres et blocs réutilisés (fiche réservation, caisse, factures…)
    documents.ts            PDF (factures, avoirs, reçus) et tickets 80 mm
    exports.ts              feuilles Excel
    caisse.ts               logique de la caisse (useCaisse, règlements en devises)
    montants.ts             affichage des prix dans la devise du poste (usePrix)
    visite/                 visite guidée (étapes et données d'exemple)
    nouveautes.ts           contenu de la fenêtre de bienvenue, une entrée par version
```

La logique métier pure (dates, devises, règles, note du séjour…) n'est **pas copiée** : elle est importée
du site par l'alias `@partage` → `../lib/reservation`.

## Écrans et rôles

| Écran | Gérant | Réception | Caissier |
|---|---|---|---|
| Aujourd'hui, Réservations, Planning, Chambres, Clients, Journal | oui | oui | non |
| Restaurant et Bar (caisse) | oui (+ vue d'ensemble) | oui | oui (écran d'accueil) |
| Revenus, Statistiques, Tarifs, Utilisateurs | oui | non | non |
| Guide, Paramètres | oui | oui | oui |

La règle est dans `pageAutorisee(role, page)` de `donnees.tsx` (le serveur revérifie de son côté).

## Conventions de l'interface

- Styles : `makeStyles` et `tokens` de Fluent UI, fichiers `use…Styles.styles.ts` (pas de Tailwind ici).
  Thème de la marque dans `theme.ts`, clair ou sombre selon Windows.
- Attente : `ChargementLogo` (`composants/commun.tsx`), jamais de grand `Spinner`.
- Messages : `useAnnoncer()` (`toasts.tsx`).
- Longues listes par paquets de 50 (`AfficherPlus`).
- **Hors connexion = lecture seule** : chaque bouton qui enregistre ajoute `|| lectureSeule`
  (`useLectureSeule()`).
- Chaque création envoie un `id` choisi par le logiciel, gardé jusqu'au succès (pas de doublon si on
  renvoie).
- Nouvel écran : l'ajouter à la navigation (`Coquille.tsx`), à `pageAutorisee`, à la recherche globale
  (`composants/RechercheGlobale.tsx`), au Guide (`pages/Guide.tsx`) et à la visite guidée
  (`data-visite` + étape dans `visite/etapes.ts`).

## Sécurité

- Interface isolée (`sandbox`, `contextIsolation`) : elle ne voit que `window.avocatier`.
- Le jeton de session est chiffré par Windows (`safeStorage`) et ne quitte jamais le processus principal.
- Logiciel installé : serveur en https obligatoire (http seulement vers localhost).

## Installateur et versions

```bash
npm run paquet               # → dist/Chez-LAvocatier-<version>-installation.exe (ne publie rien)
GH_TOKEN=… npm run publier   # construit puis dépose un brouillon v<version> dans LAW-Agency/avocatier-versions
```

Étapes complètes de publication : [`../docs/CONTRIBUER.md`](../docs/CONTRIBUER.md#publier-une-version-du-logiciel-des-hôtes).
L'installateur n'est pas signé : Windows SmartScreen affiche un avertissement au premier lancement.

Le logiciel installé se connecte au site en ligne (`SERVEUR_PAR_DEFAUT` dans `src/main/session.ts`, ou
`MAIN_VITE_SERVEUR` dans un fichier `bureau/.env` à la compilation). L'adresse se change aussi à l'écran de
connexion, lien « Paramètres de connexion ».

## Visite guidée (voix)

Textes dans `src/renderer/src/visite/etapes.ts`, voix MP3 générées avec ElevenLabs par `npm run voix`
(`ELEVENLABS_API_KEY` dans `bureau/.env`, seuls les textes modifiés sont régénérés). Sans MP3, la visite
affiche les sous-titres seuls.
