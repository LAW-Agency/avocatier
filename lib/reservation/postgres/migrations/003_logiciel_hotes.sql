-- Logiciel des hôtes (bureau/) : équipe de réception, clients enregistrés au comptoir, réservations saisies
-- sur place, arrivées et départs, état des chambres et encaissements.

-- Équipe : « hote » (gérants, tout le logiciel) et « reception » (accueil, sans tarifs ni utilisateurs)
alter table clients drop constraint clients_role_check;
alter table clients add constraint clients_role_check check (role in ('client', 'hote', 'reception'));
-- Compte de l'équipe désactivé : plus de connexion, l'historique reste
alter table clients add column actif boolean not null default true;
-- Client créé au comptoir (sans compte sur le site) : e-mail facultatif, aucun mot de passe
alter table clients add column origine text not null default 'site' check (origine in ('site', 'reception'));
alter table clients add column note text not null default '';
alter table clients alter column email drop not null;

-- Réservation saisie à la réception (client venu sur place)
alter table reservations drop constraint reservations_source_check;
alter table reservations add constraint reservations_source_check
  check (source in ('site', 'booking', 'telephone', 'whatsapp', 'sur_place'));
-- Arrivée et départ enregistrés par la réception (le séjour reste « confirmée »)
alter table reservations add column arrivee_le timestamptz;
alter table reservations add column depart_le timestamptz;

-- Ménage et maintenance des chambres
alter table hebergements add column etat text not null default 'propre'
  check (etat in ('propre', 'a_nettoyer', 'maintenance'));
alter table hebergements add column note_etat text not null default '';

-- Encaissements d'une réservation, en euros comme les tarifs ; montant négatif : remboursement
create table paiements (
  id text primary key default gen_random_uuid()::text,
  reservation_id text not null references reservations (id) on delete cascade,
  montant integer not null check (montant <> 0),
  mode text not null check (mode in ('especes', 'carte', 'mobile_money', 'virement', 'autre')),
  note text not null default '',
  le timestamptz not null default now(),
  enregistre_par text references clients (id)
);

create index paiements_reservation on paiements (reservation_id);
create index paiements_le on paiements (le);
