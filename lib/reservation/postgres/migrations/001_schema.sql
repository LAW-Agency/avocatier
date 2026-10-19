-- Schéma initial de la réservation : reprend les types de lib/reservation/types.ts.
-- Appliqué par `npm run db:migrer` (fichiers de ce dossier, dans l'ordre, une seule fois chacun).

-- Contrainte d'exclusion mêlant égalité (texte) et chevauchement de périodes
create extension if not exists btree_gist;

create table hebergements (
  id text primary key,
  ordre integer not null default 0, -- ordre d'affichage
  slug text not null unique,
  nom text not null,
  type text not null check (type in ('bungalow', 'chambre')),
  description text not null,
  image text not null,
  capacite_max integer not null check (capacite_max > 0),
  literie text not null,
  vue text not null,
  prix_nuit integer not null check (prix_nuit > 0), -- prix de base, en euros
  presentation text not null,
  galerie text[] not null default '{}',
  salle_de_bains text not null,
  equipements text[] not null default '{}'
);

-- Saisons sans année, telles que les hôtes les saisissent : « MM-JJ », fin = dernière nuit comprise
create table regles_saisons (
  nom text primary key,
  debut char(5) not null,
  fin char(5) not null,
  coefficient numeric(4, 2) not null check (coefficient > 0),
  sejour_min integer not null check (sejour_min >= 1)
);

-- Une seule ligne : devises de la vitrine
create table reglages_devises (
  id boolean primary key default true check (id),
  par_defaut text not null,
  actives text[] not null,
  taux jsonb not null, -- { "MGA": 5150, … } : 1 € = taux × devise
  mis_a_jour_le timestamptz not null default now()
);

create table clients (
  id text primary key default gen_random_uuid()::text,
  role text not null default 'client' check (role in ('client', 'hote')),
  email text not null unique check (email = lower(email)),
  prenom text not null,
  nom text not null default '',
  telephone text not null default '',
  pays text not null default '',
  mot_de_passe_hash text not null default '', -- vide : compte sans connexion possible
  cree_le timestamptz not null default now()
);

-- Numéro des références « AVO-2026-0042 »
create sequence reservations_numero;

create table reservations (
  id text primary key default gen_random_uuid()::text,
  reference text not null unique,
  client_id text not null references clients (id),
  hebergement_id text not null references hebergements (id),
  arrivee date not null,
  depart date not null, -- jour du départ : la nuit n'est pas comptée
  adultes integer not null check (adultes >= 1),
  enfants integer not null default 0 check (enfants >= 0),
  navette boolean not null default false,
  telephone text not null default '',
  message text not null default '',
  montant_total integer not null check (montant_total >= 0), -- euros, figé à la demande
  statut text not null check (statut in ('option', 'confirmee', 'annulee', 'refusee', 'expiree')),
  source text not null default 'site' check (source in ('site', 'booking', 'telephone', 'whatsapp')),
  cree_le timestamptz not null default now(),
  expire_le timestamptz, -- fin de l'option
  historique jsonb not null default '[]', -- [{ statut, le, note? }]
  check (depart > arrivee),
  -- Deux réservations actives d'un même hébergement ne partagent jamais une nuit : [arrivée, départ[
  constraint reservations_sans_chevauchement exclude using gist (
    hebergement_id with =,
    daterange(arrivee, depart) with &&
  ) where (statut in ('option', 'confirmee'))
);

create index reservations_client on reservations (client_id);
create index reservations_options on reservations (expire_le) where statut = 'option';

-- Dates fermées sans réservation du site : import Booking.com, travaux, privatisation…
create table blocages (
  id text primary key default gen_random_uuid()::text,
  hebergement_id text not null references hebergements (id),
  debut date not null,
  fin date not null,
  raison text not null default 'Indisponible',
  check (fin > debut)
);

create index blocages_hebergement on blocages (hebergement_id, debut);
