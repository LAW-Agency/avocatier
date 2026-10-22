-- Journal d'activité de l'équipe (logiciel des hôtes, écran Journal) : connexions et actions des gérants et de
-- la réception, avec leur auteur et leur date. Consultable par toute l'équipe, effaçable par les gérants
-- seulement (l'effacement est lui-même noté).

create table journal_activite (
  id text primary key default gen_random_uuid()::text,
  le timestamptz not null default now(),
  -- Compte supprimé un jour : l'entrée reste, avec le nom noté au moment de l'action
  membre_id text references clients (id) on delete set null,
  auteur text not null,
  categorie text not null
    check (categorie in ('connexion', 'reservation', 'client', 'chambre', 'paiement', 'planning', 'tarifs', 'equipe', 'journal')),
  action text not null,
  detail text not null default ''
);

create index journal_activite_le on journal_activite (le desc);
