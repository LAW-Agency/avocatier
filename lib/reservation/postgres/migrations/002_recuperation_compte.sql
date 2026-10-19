-- Récupération de compte : lien envoyé par e-mail, à usage unique, valable une heure.
-- Seule l'empreinte SHA-256 du jeton est gardée : une copie de la base ne donne aucun lien utilisable.
create table jetons_reinitialisation (
  empreinte text primary key,
  client_id text not null references clients (id) on delete cascade,
  cree_le timestamptz not null default now(),
  expire_le timestamptz not null,
  utilise_le timestamptz
);

create index jetons_reinitialisation_client on jetons_reinitialisation (client_id, cree_le);

-- Mot de passe changé : les sessions ouvertes avant cette date sont refusées (lib/auth/dal.ts)
alter table clients add column sessions_valides_depuis timestamptz;
