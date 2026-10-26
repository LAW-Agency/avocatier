-- Chambres numérotées : un hébergement (« Bungalow Océan ») devient une catégorie, avec ses chambres physiques
-- (« Océan 1 », « Océan 2 »…). Le site vend la catégorie ; chaque réservation, chaque blocage et chaque calendrier
-- de plateforme porte sur une chambre précise. Une chambre par catégorie est créée pour les données existantes.

create table chambres (
  id text primary key default gen_random_uuid()::text,
  hebergement_id text not null references hebergements (id),
  numero text not null check (numero <> ''),
  etat text not null default 'propre' check (etat in ('propre', 'a_nettoyer', 'maintenance')),
  note_etat text not null default '',
  active boolean not null default true, -- désactivée : plus vendue ni attribuée, son historique reste
  cree_le timestamptz not null default now(),
  -- Cible des clés étrangères (chambre, hébergement) : une réservation ne peut pas pointer sur la chambre
  -- d'une autre catégorie que la sienne
  unique (id, hebergement_id)
);

create unique index chambres_numero on chambres (lower(numero));

-- « Bungalow Océan » → « Océan 1 » ; l'état du ménage passe de la catégorie à sa chambre
insert into chambres (hebergement_id, numero, etat, note_etat)
select id, regexp_replace(nom, '^(Bungalow|Chambre)\s+', '') || ' 1', etat, note_etat from hebergements;

alter table hebergements drop column etat;
alter table hebergements drop column note_etat;

-- Réservations : chambre attribuée ; plusieurs chambres demandées ensemble partagent un `groupe`
alter table reservations add column chambre_id text;
update reservations r set chambre_id = c.id from chambres c where c.hebergement_id = r.hebergement_id;
alter table reservations alter column chambre_id set not null;
alter table reservations add constraint reservations_chambre
  foreign key (chambre_id, hebergement_id) references chambres (id, hebergement_id);
alter table reservations add column groupe text;
create index reservations_groupe on reservations (groupe) where groupe is not null;

-- Une chambre ne se vend jamais deux fois la même nuit (auparavant : un hébergement)
alter table reservations drop constraint reservations_sans_chevauchement;
alter table reservations add constraint reservations_sans_chevauchement exclude using gist (
  chambre_id with =,
  daterange(arrivee, depart) with &&
) where (statut in ('option', 'confirmee'));

-- Dates bloquées : par chambre (supprimées avec elle)
alter table blocages add column chambre_id text;
update blocages b set chambre_id = c.id from chambres c where c.hebergement_id = b.hebergement_id;
alter table blocages alter column chambre_id set not null;
alter table blocages add constraint blocages_chambre
  foreign key (chambre_id, hebergement_id) references chambres (id, hebergement_id) on delete cascade;
drop index blocages_hebergement;
create index blocages_chambre on blocages (chambre_id, debut);

-- Calendriers des plateformes : un par chambre (une annonce Booking.com ou Airbnb = une chambre)
alter table calendriers_externes add column chambre_id text;
update calendriers_externes k set chambre_id = c.id from chambres c where c.hebergement_id = k.hebergement_id;
alter table calendriers_externes alter column chambre_id set not null;
alter table calendriers_externes add constraint calendriers_chambre
  foreign key (chambre_id, hebergement_id) references chambres (id, hebergement_id) on delete cascade;
