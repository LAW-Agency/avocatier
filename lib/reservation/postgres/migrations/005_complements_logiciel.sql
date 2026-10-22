-- Compléments du logiciel des hôtes : clients effacés (RGPD), réservations Airbnb, calendriers des plateformes
-- (iCal), factures et reçus.

-- Client effacé à sa demande : la fiche reste (réservations et encaissements de la comptabilité), anonymisée
alter table clients add column efface_le timestamptz;

-- Réservations venues d'Airbnb, comme celles de Booking.com
alter table reservations drop constraint reservations_source_check;
alter table reservations add constraint reservations_source_check
  check (source in ('site', 'booking', 'airbnb', 'telephone', 'whatsapp', 'sur_place'));

-- Calendrier d'une plateforme pour un hébergement : ses dates sont importées (lien iCal donné par la plateforme)
-- et les nôtres exportées (lien secret à donner à la plateforme, /calendrier/<jeton>.ics)
create table calendriers_externes (
  id text primary key default gen_random_uuid()::text,
  hebergement_id text not null references hebergements (id),
  plateforme text not null check (plateforme in ('booking', 'airbnb', 'autre')),
  nom text not null,
  url_import text not null default '', -- vide : export seulement
  jeton text not null unique,
  synchronise_le timestamptz, -- dernière importation réussie
  erreur text not null default '', -- dernière importation en échec
  cree_le timestamptz not null default now()
);

-- Dates importées d'un calendrier : remplacées à chaque synchronisation, jamais libérées à la main
alter table blocages add column calendrier_id text references calendriers_externes (id) on delete cascade;
alter table blocages add column uid text;
create unique index blocages_importes on blocages (calendrier_id, uid) where calendrier_id is not null;

-- Coordonnées de l'hôtel imprimées sur les factures et les reçus (une seule ligne)
create table reglages_facturation (
  id boolean primary key default true check (id),
  raison_sociale text not null default '',
  adresse text not null default '',
  telephone text not null default '',
  email text not null default '',
  identifiants text not null default '', -- NIF, STAT, RCS…
  mentions text not null default '', -- pied des factures (conditions, coordonnées bancaires…)
  mis_a_jour_le timestamptz not null default now()
);

-- Numéro de facture « FA-2026-0001 » attribué à la première édition, jamais réutilisé
create sequence factures_numero;
alter table reservations add column facture_numero text unique;
alter table reservations add column facture_le timestamptz;

-- Numéro des reçus d'encaissement, attribué à l'enregistrement (encaissements existants compris)
alter table paiements add column numero integer generated always as identity;
create unique index paiements_numero on paiements (numero);
