# Architecture

Ce document explique **comment le projet fonctionne et pourquoi** il est construit ainsi. Les détails sont
dans les commentaires du code ; ici on donne la carte et les règles qu'il ne faut pas casser.

## 1. Vue d'ensemble

```
 Visiteurs ──► Site Next.js (Vercel) ──► PostgreSQL (Neon, puis serveur de l'agence)
                    ▲
                    │ HTTPS, jeton Bearer, /api/hotes/* uniquement
                    │
 Hôtes ──────► Logiciel Electron (bureau/, Windows)
```

- **Le site** vend des séjours, gère les comptes clients et envoie les e-mails.
- **Le logiciel des hôtes** gère l'hôtel au quotidien : demandes à confirmer, planning, arrivées et départs,
  encaissements, factures, caisse du restaurant et du bar, tarifs, équipe. Il remplace l'ancien espace
  `/admin` du site (supprimé le 2026-10-21).
- **Une seule base**, et une seule porte d'entrée vers elle : le code serveur du site. Le logiciel n'a ni
  mot de passe de base ni accès SQL.

Pour changer de serveur de base, seule `DATABASE_URL` change.

## 2. Organisation du code métier (`lib/reservation/`)

Le code est découpé en trois couches :

| Couche | Fichiers | Règle |
|---|---|---|
| **Règles pures** | `regles.ts`, `dates.ts`, `devises.ts`, `folio.ts`, `caisseRegles.ts`, `statuts.ts`, `types.ts`, `tauxDeChange.ts` | aucun accès réseau ni base, **n'importent que des fichiers relatifs purs** (pas de `@/`) : elles sont partagées telles quelles avec le logiciel (alias `@partage`) |
| **Contrats** | `moteur.ts` (site), `gestion.ts` (logiciel), `caisse.ts`, `calendriers.ts` | interfaces TypeScript : ce que l'on peut faire, sans dire comment |
| **Implémentation** | `postgres/*.ts` | SQL écrit à la main, transactions, verrous |

Les pages du site n'importent que `moteur` et `comptes` depuis `lib/reservation/index.ts`. Les contrôles
serveur (dates valides, capacité, transitions de statut…) sont dans `controles.ts`.

**Le serveur revérifie toujours tout.** Les règles pures servent au navigateur et au logiciel pour afficher
un devis ou griser une date, mais `creerDemande`, `creerReservationDirecte`, etc. recalculent tout côté
serveur.

## 3. Hébergements et chambres

- Un **hébergement** est une **catégorie** (ex. « Bungalow Océan ») : prix, capacité, nom.
- Une **chambre** est un logement réel numéroté (ex. « Océan 3 ») appartenant à une catégorie, avec son
  état de ménage (propre / à nettoyer / maintenance).
- Le site vend une **catégorie** ; le serveur attribue la **première chambre libre**
  (`chambresLibres` / `attribuerChambre` dans `postgres/moteurPostgres.ts`).
- Pour une arrivée le jour même (heure de Sainte-Marie), une chambre à nettoyer ou en maintenance n'est pas
  considérée libre. La même règle existe dans le logiciel (`pretePour`) et dans `regles.ts`.
- Les textes, photos et équipements des fiches viennent de `lib/reservation/donnees.ts`, **pas de la base**.
  Seuls prix, capacité et nom viennent de la base.

## 4. Parcours de réservation sur le site

1. Le visiteur choisit dates, voyageurs, hébergement (étapes libres, la sélection est reflétée dans l'URL
   par `selection.ts`).
2. À l'étape Coordonnées, il se connecte ou crée un compte (obligatoire), sans perdre sa sélection.
3. La demande crée une réservation au statut **option**, qui bloque les dates **48 h**.
4. Les hôtes confirment ou refusent dans le logiciel ; le client reçoit un e-mail.

Plusieurs chambres d'une même catégorie dans une demande = une réservation par chambre, reliées par le même
`groupe`. Limites : 3 demandes en option par compte, 5 comptes créés par IP et par heure.

**Statuts permis** : option → confirmée / refusée ; confirmée → annulée (pas après le départ, pas après
l'arrivée du client). Une option non traitée expire d'elle-même (expiration « paresseuse », vérifiée avant
chaque lecture).

## 5. Comment on empêche les doubles réservations

Trois protections, qui se complètent :

1. **Contrainte d'exclusion** PostgreSQL `reservations_sans_chevauchement` (extension `btree_gist`) : deux
   réservations actives ne peuvent pas partager une nuit sur la même chambre. C'est la garantie finale.
2. **Verrou consultatif** `pg_advisory_xact_lock` par catégorie pendant une demande ou un blocage : les
   blocages manuels ne sont pas couverts par la contrainte, le verrou évite les courses.
3. **Contrôles applicatifs** (`controles.ts`) pour renvoyer un message clair avant d'arriver à la contrainte.

Les nuits sont comptées en intervalle `[arrivée, départ[` : le jour du départ est libre pour un autre client.

## 6. Tarifs, saisons et devises

- Prix de base **en euros** par catégorie. Les **saisons** sont des plages « MM-JJ » sans année (peuvent
  passer le 31 décembre) avec une majoration en % et un séjour minimum. Deux saisons ne partagent jamais une
  nuit.
- Une réservation existante garde son `montantTotal` même si les tarifs changent.
- **Toutes les données financières de l'hôtel sont en euros**, sauf la caisse du restaurant et du bar, en
  **ariary**. Les autres devises sont des conversions indicatives au taux saisi par les hôtes (bouton « taux
  du jour » via open.er-api.com, à valider par les hôtes).
- Sur la vitrine, toujours afficher un prix avec `<Prix montant={euros} />` ou `useDevise().formater`
  (`components/Devise.tsx`). Le choix de devise du visiteur est gardé en `localStorage` (pas de cookie, pour
  que les pages restent statiques).

## 7. Argent : encaissements, note du séjour, factures

C'est la partie la plus délicate. Logique pure dans `lib/reservation/folio.ts`.

- **Encaissement** : un paiement reçu, dans n'importe quelle devise. On garde le montant réel, la devise, le
  taux du jour (`paiements.taux_ariary`) et sa contre-valeur en euros au centime. Montant négatif =
  remboursement (jamais plus que ce qui a été encaissé).
- **Note du séjour** = hébergement (euros) + consommations du restaurant et du bar mises sur la chambre
  (ariary) − encaissements.
- **Reste dû en deux devises** : chaque encaissement règle d'abord sa propre devise, le surplus règle l'autre
  **au taux de son propre jour**. Conséquence voulue : un séjour soldé ne se « rouvre » jamais quand les hôtes
  changent le taux du jour.
- Les ariary sont arrondis au billet de 100 Ar ; un reste de moins de 100 Ar = soldé.
- **Le jour d'un instant** se calcule toujours avec `jourDe` de `dates.ts` (heure de Sainte-Marie), jamais
  `.slice(0, 10)` : en UTC, entre minuit et 3 h, ce serait la veille.
- **Facture** « FA-AAAA-NNNN » : numérotée et **figée** à la première édition (contenu et taux), regroupe les
  chambres d'un même groupe. Elle ne se modifie plus.
- **Avoir** « AV-AAAA-NNNN » : seul moyen d'annuler une facture (gérants, avec motif). La facture reste,
  marquée « Annulée ». Une seule facture en vigueur par séjour.
- Séjour avec une facture en vigueur : pas d'annulation, pas de modification (sauf changement de chambre dans
  la même catégorie), pas de suppression d'un encaissement antérieur à la facture.

## 8. Caisse du restaurant et du bar

Contrat `lib/reservation/caisse.ts`, implémentation `postgres/caissePostgres.ts`, règles pures
`caisseRegles.ts`.

- **Carte** : articles en ariary. Gérants : ajouter, modifier le prix, supprimer. Le reste de l'équipe ne
  fait que retirer / remettre un article.
- **Poste** : un ordinateur de caisse (ex. Restaurant, Bar), avec un préfixe de numérotation des tickets.
- **Session** : une caisse s'ouvre (fond de caisse) et se clôture ; aucune vente sans session ouverte, une
  seule session ouverte par poste. À la clôture, le bilan est figé (espèces attendues = fond + espèces
  reçues − monnaie rendue, par devise) ; un écart impose un commentaire.
- **Ticket** : payé, mis sur la chambre (ajouté à la note du séjour) ou annulé (avec motif). Chaque ligne doit
  correspondre à un article actif au prix de la carte, sinon refus.
- La caisse **exige la connexion** : la vente hors ligne a été abandonnée.

## 9. Comptes, rôles et sécurité

**Clients du site** (`role: "client"`) : cookie de session signé HMAC (`lib/auth/session.ts`,
`SESSION_SECRET`). Chaque page et Server Action protégée appelle `clientConnecte()` (`lib/auth/dal.ts`).
`proxy.ts` (équivalent Next 16 du middleware) ne fait qu'une redirection optimiste.

**Équipe de l'hôtel** (jamais par l'inscription, créés dans l'écran Utilisateurs du logiciel) :

| Rôle | Accès |
|---|---|
| `hote` (gérant) | tout |
| `reception` | tout sauf revenus, statistiques, tarifs, utilisateurs |
| `caissier` | caisse du restaurant et du bar seulement |

Un compte de l'équipe ne peut pas se connecter au site public. Le dernier gérant actif ne peut pas être
retiré.

**API des hôtes** : jeton signé (même format que le cookie), valable 14 jours, envoyé en
`Authorization: Bearer`. Chaque route passe par une garde de `lib/api/hotes.ts` :
`pourLesHotes` (toute l'équipe), `pourLesGerants` (gérants), `pourLaCaisse` (caisse). 401 sans jeton
valable, 403 si le rôle n'a pas accès.

**Protections** : 8 échecs de connexion par e-mail ou 30 par IP en 15 min ⇒ refus ; déconnexion = jeton
révoqué (`jetons_revoques`) ; changement de mot de passe ⇒ anciennes sessions refusées
(`sessions_valides_depuis`) ; lien de récupération valable 1 h, usage unique, seule son empreinte SHA-256 est
gardée.

Il n'y a **pas de RLS** dans PostgreSQL : toute la sécurité est dans l'application, d'où l'importance des
gardes.

## 10. Écritures : les trois réflexes

Toute route d'écriture de `app/api/hotes/` :

1. **journalise** : `journaliser(membre, catégorie, action, détail)` (écran Journal du logiciel) ;
2. **rafraîchit le site** avec `rafraichirSite()` si les disponibilités ou les prix changent (l'agenda Google du
   propriétaire suit ; une écriture sur une réservation qui n'appelle pas `rafraichirSite()` appelle
   `planifierAgenda()`) ;
3. **envoie ses e-mails dans `after()`**, seulement après une transaction validée (jamais depuis le moteur).

Et toute écriture qui **crée** quelque chose reçoit un `id` choisi par le logiciel : si la réponse se perd et
que le logiciel renvoie, le serveur reconnaît l'`id` et ne crée pas de doublon (`deja`).

## 11. Calendriers Booking.com et Airbnb

`lib/reservation/calendriers.ts` et `ical.ts`. Par catégorie :

- **Import** : un lien iCal (https obligatoire) ; ses dates deviennent des blocages, remplacés à chaque
  synchronisation. Synchronisation par le logiciel (toutes les 10 min), par la tâche planifiée Vercel
  (`vercel.json`, 3 h chaque jour, protégée par `CRON_SECRET`) et juste avant chaque demande du site.
- **Export** : un lien secret `/calendrier/<jeton>.ics`, dates seules, aucune donnée client.

### Agenda Google du propriétaire

`lib/agenda/` copie les réservations dans un agenda Google que le propriétaire voit sur son téléphone, en
lecture seule. Il n'a rien à configurer : l'agenda appartient à un **compte de service** Google Cloud de
l'agence (API Google Calendar), qui le partage avec son adresse Gmail. C'est l'agence qui le crée et l'entretient.

- **Contenu** : une réservation active (option ou confirmée) = un événement « journée entière »
  [arrivée, départ[. Titre « Océan 1 · Claire Martin », « Option · » devant une demande en attente. Couleurs :
  jaune pour une option, vert pour une réservation confirmée, gris après le départ. Description : chambre,
  voyageurs, navette, statut, référence, origine. Jamais d'e-mail, de téléphone, de message ni de montant.
- **Synchronisation complète par différence** (`synchroniserAgenda`), sans table en base. Elle lit les
  réservations dont le départ date de moins de 30 jours et les événements marqués de l'agenda. Elle réécrit
  seulement ceux dont l'empreinte a changé et supprime les autres. L'identifiant d'événement est tiré de celui
  de la réservation, donc le passage est relançable sans doublon. Un seul passage à la fois par processus.
- **Quand** : `planifierAgenda()` la lance dans `after()` après chaque écriture qui touche une réservation
  (`rafraichirSite()` l'appelle ; arrivée/départ, fiches clients, demande et annulation du site l'appellent aussi),
  puis chaque nuit dans la tâche planifiée `/api/calendriers/synchroniser` (rattrapage des options expirées et
  des échecs). Une erreur de Google n'empêche jamais l'écriture : elle part dans les journaux.
- **Mise en place** (variables `GOOGLE_*` de `.env.example`, dans `.env` et sur Vercel) :
  `npm run agenda -- creer`, puis `npm run agenda -- partager <gmail du propriétaire>`, puis
  `npm run agenda -- synchroniser` pour le premier remplissage. Sans `GOOGLE_AGENDA_ID`, rien ne part.

## 12. Base de données

- Schéma = fichiers numérotés de `lib/reservation/postgres/migrations/`, appliqués par `npm run db:migrer`
  (une transaction par fichier, table `migrations`).
- **Ne jamais modifier une migration déjà appliquée** : en ajouter une nouvelle.
- Les colonnes `date` sont rendues en texte « AAAA-MM-JJ » (analyseur de type dans `postgres/db.ts`).
- Adresse `-pooler` pour le site, adresse directe (`DATABASE_URL_UNPOOLED`) pour les scripts.
- Écritures groupées en JSON (`json_to_recordset`) dans une seule transaction : jamais d'`ALTER TABLE`
  dedans, il bloquerait le site et le logiciel.

| Migration | Contenu |
|---|---|
| 001 | schéma initial |
| 002 | récupération de compte |
| 003 | logiciel des hôtes (clients au comptoir, sources, arrivées/départs, encaissements) |
| 004 | journal d'activité |
| 005 | RGPD, Airbnb, iCal, factures |
| 006 | chambres numérotées |
| 007 | caisse du restaurant et du bar, factures figées, rôle caissier |
| 008 | encaissements en devises |
| 009 | avoirs, révocation des jetons, limites de connexion |
| 010 | taux de l'ariary de chaque encaissement |

## 13. Le site (vitrine)

- Pages de `app/`, composants rangés par page dans `components/`, contenus statiques dans `data/`.
- Styles : tokens Tailwind v4 dans `app/globals.css` (`@theme`). Utiliser les tokens, jamais de couleur en
  dur ; ne jamais construire un nom de classe dynamiquement (Tailwind ne le verrait pas).
- Animations à l'entrée à l'écran : attribut `data-reveal` (un seul observateur, `RevealObserver.tsx`).
- Header fixe : transparent sur les pages avec hero plein écran (`HERO_PAGES` de `components/Header.tsx`).
- Police Google Sans partout. Les e-mails ont leur propre mise en page (`lib/email/modeles.ts`).
- `data/testimonials.ts` ne contient que des avis réels : ne jamais en inventer.
- Les « TODO client » du code signalent des contenus provisoires à fournir par l'hôtel.

## 14. Le logiciel des hôtes

Voir [`bureau/README.md`](../bureau/README.md).
