-- Caisse Restaurant et Bar (logiciel des hôtes) : rôle « caissier », carte, postes de caisse, tickets payés sur
-- place ou mis sur la chambre, sessions de caisse (fond, clôture, écart), devise des encaissements de séjour et
-- factures figées (une facture peut couvrir plusieurs chambres d'un même client).
-- Montants de la caisse en ariary (entiers) ; les tarifs des séjours restent en euros.

-- Caissier : écran Restaurant et Bar seulement (la réception et les gérants y ont accès aussi)
alter table clients drop constraint clients_role_check;
alter table clients add constraint clients_role_check check (role in ('client', 'hote', 'reception', 'caissier'));

alter table journal_activite drop constraint journal_activite_categorie_check;
alter table journal_activite add constraint journal_activite_categorie_check
  check (categorie in ('connexion', 'reservation', 'client', 'chambre', 'paiement', 'planning', 'tarifs', 'equipe', 'journal', 'restaurant'));

-- Carte : modifiée par les caissiers, la réception et les gérants. Un article déjà vendu se désactive
-- (les lignes des tickets gardent leur libellé et leur prix)
create table articles (
  id text primary key default gen_random_uuid()::text,
  nom text not null check (nom <> ''),
  categorie text not null check (categorie <> ''), -- « Plats », « Boissons chaudes », « Cocktails »…
  prix integer not null check (prix >= 0), -- ariary
  description text not null default '',
  actif boolean not null default true,
  ordre integer not null default 0,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);

create index articles_categorie on articles (categorie, ordre);

-- Poste de caisse : un ordinateur (bar, restaurant, réception), identifiant créé par le logiciel à l'installation.
-- Le préfixe numérote ses tickets (« C1-000042 »), même hors connexion, sans collision entre postes
create sequence postes_caisse_numero;
create table postes_caisse (
  id text primary key,
  nom text not null check (nom <> ''),
  prefixe text not null unique default 'C' || nextval('postes_caisse_numero'),
  dernier_ticket integer not null default 0, -- plus haut numéro reçu, repris par le poste réinstallé
  cree_le timestamptz not null default now()
);

-- Session de caisse d'un poste : ouverture avec le fond de caisse, clôture avec les espèces comptées.
-- Identifiant créé par le poste (ouverture possible hors connexion, envoyée au retour du réseau)
create table sessions_caisse (
  id text primary key,
  poste_id text not null references postes_caisse (id),
  ouverte_par text references clients (id) on delete set null,
  ouverte_le timestamptz not null,
  fond_caisse integer not null default 0 check (fond_caisse >= 0), -- ariary
  fermee_par text references clients (id) on delete set null,
  fermee_le timestamptz,
  especes_comptees jsonb, -- { "MGA": 412000, "EUR": 20 } : espèces trouvées dans le tiroir, par devise
  bilan jsonb, -- totaux figés à la clôture (ventes, par mode et par devise, attendu, écart)
  commentaire text not null default ''
);

-- Une seule session ouverte par poste
create unique index sessions_caisse_ouverte on sessions_caisse (poste_id) where fermee_le is null;

-- Facture figée : numéro « FA-AAAA-NNNN » (même suite que les factures déjà éditées), devise choisie par le
-- client, taux de change et contenu (lignes, règlements, totaux, coordonnées) enregistrés à l'édition
create table factures (
  id text primary key default gen_random_uuid()::text,
  numero text not null unique,
  le timestamptz not null default now(),
  client_id text not null references clients (id),
  devise text not null,
  taux jsonb not null, -- { "MGA": 5150, "USD": 1.16 } : 1 € = taux × devise, au moment de l'édition
  total numeric(14, 2) not null, -- dans la devise de la facture
  contenu jsonb not null,
  editee_par text references clients (id) on delete set null
);

-- Séjours couverts par une facture (plusieurs chambres d'un groupe au nom d'un même client) ; un séjour n'est
-- facturé qu'une fois
create table factures_reservations (
  facture_id text not null references factures (id),
  reservation_id text not null unique references reservations (id),
  primary key (facture_id, reservation_id)
);

-- Ticket du restaurant ou du bar, identifiant créé par le poste (renvoyé sans doublon après une coupure).
-- statut : paye (réglé sur place), chambre (sur la note du séjour, réglé au départ), annule (avec un motif)
create table tickets (
  id text primary key,
  numero text not null unique,
  poste_id text not null references postes_caisse (id),
  session_id text references sessions_caisse (id),
  caissier_id text references clients (id) on delete set null,
  le timestamptz not null, -- heure de la vente sur le poste
  recu_le timestamptz not null default now(), -- arrivée au serveur (plus tard si vendu hors connexion)
  statut text not null check (statut in ('paye', 'chambre', 'annule')),
  reservation_id text references reservations (id),
  libelle text not null default '', -- « Table 4 », nom d'un client de passage
  total integer not null check (total >= 0), -- ariary, somme des lignes
  annule_le timestamptz,
  annule_par text references clients (id) on delete set null,
  motif_annulation text not null default '',
  facture_id text references factures (id), -- sur une facture de séjour : plus modifiable
  check (statut <> 'chambre' or reservation_id is not null),
  check (statut <> 'annule' or annule_le is not null)
);

create index tickets_le on tickets (le);
create index tickets_reservation on tickets (reservation_id) where reservation_id is not null;
create index tickets_session on tickets (session_id);

create table lignes_ticket (
  id text primary key default gen_random_uuid()::text,
  ticket_id text not null references tickets (id) on delete cascade,
  article_id text references articles (id) on delete set null,
  libelle text not null,
  prix_unitaire integer not null check (prix_unitaire >= 0), -- ariary, figé à la vente
  quantite integer not null check (quantite > 0),
  position integer not null default 0
);

create index lignes_ticket_ticket on lignes_ticket (ticket_id);

-- Règlement d'un ticket payé sur place, dans la devise reçue ; contre-valeur en ariary au taux du moment.
-- La monnaie se rend toujours en ariary
create table reglements_tickets (
  id text primary key default gen_random_uuid()::text,
  ticket_id text not null references tickets (id) on delete cascade,
  mode text not null check (mode in ('especes', 'carte', 'mobile_money', 'virement', 'autre')),
  devise text not null default 'MGA',
  montant numeric(14, 2) not null check (montant > 0), -- dans la devise reçue
  contre_valeur integer not null check (contre_valeur >= 0), -- ariary imputés sur le ticket
  rendu integer not null default 0 check (rendu >= 0) -- ariary rendus au client
);

create index reglements_tickets_ticket on reglements_tickets (ticket_id);

-- Encaissements des séjours : devise réellement reçue et taux du moment. `montant` reste la contre-valeur en
-- euros (statistiques, revenus) ; sans devise, l'encaissement était en euros
alter table paiements add column devise text not null default 'EUR';
alter table paiements add column montant_devise numeric(14, 2);
alter table paiements add column taux numeric(14, 6); -- 1 € = taux × devise
alter table paiements add column session_id text references sessions_caisse (id);
