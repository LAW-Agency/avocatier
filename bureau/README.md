# Chez L'Avocatier — logiciel des hôtes

Application Windows (Electron + Fluent UI) de Joëlle & Stéphane : demandes à traiter, planning, clients et tarifs.
Elle remplace l'ancien espace `/admin` du site et passe par l'API `app/api/hotes/` du site (le site garde la base
PostgreSQL et l'envoi des e-mails).

## Développement

```bash
npm install          # dans bureau/
npm run dev          # avec le site lancé à la racine (npm run dev, http://localhost:3000)
npm run typecheck
```

Compte de démonstration : celui de `COMPTE_HOTE` dans `lib/reservation/donnees.ts` (créé par `npm run db:amorcer`).

## Installateur

```bash
npm run paquet       # → dist/Chez-LAvocatier-<version>-installation.exe
```

Le logiciel installé se connecte au site en ligne (`SERVEUR_PAR_DEFAUT` dans `src/main/session.ts`, ou
`MAIN_VITE_SERVEUR` dans un fichier `bureau/.env` au moment de la compilation). L'adresse se change aussi à
l'écran de connexion, lien « Paramètres de connexion ».

## Organisation

- `src/main/` : fenêtre (Mica, barre de titre intégrée, zone de notification), session chiffrée, appels à l'API,
  suivi en direct et notifications Windows.
- `src/preload/` : pont `window.avocatier` (contrat dans `src/partage/ipc.ts`).
- `src/renderer/` : interface React et Fluent UI ; logique métier pure importée du site par l'alias `@partage`
  (`../lib/reservation`).
