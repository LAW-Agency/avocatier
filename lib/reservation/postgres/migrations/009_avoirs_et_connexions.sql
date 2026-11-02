-- Avoirs, déconnexion révoquée et limite des tentatives de connexion (2026-11-02)

-- Facture figée annulée par un avoir « AV-AAAA-NNNN » (gérants, motif obligatoire) : elle reste dans la suite des
-- numéros et se réimprime marquée « Annulée » ; ses séjours et leurs tickets sont libérés pour une nouvelle facture
alter table factures
  add column annulee_le timestamptz,
  add column annulee_par text references clients (id) on delete set null,
  add column motif_annulation text not null default '',
  add column avoir_numero text unique;
create sequence avoirs_numero;

-- Un séjour peut avoir plusieurs factures dans son histoire, mais une seule en vigueur
alter table factures_reservations add column en_vigueur boolean not null default true;
alter table factures_reservations drop constraint factures_reservations_reservation_id_key;
create unique index factures_reservations_en_vigueur on factures_reservations (reservation_id) where en_vigueur;

-- Jetons de session révoqués par une déconnexion (empreinte SHA-256 seule), jusqu'à leur expiration
create table jetons_revoques (
  empreinte text primary key,
  expire_le timestamptz not null
);

-- Connexions refusées, par adresse e-mail et par adresse IP (« email:… », « ip:… ») : au-delà d'un seuil sur
-- 15 minutes, la connexion est bloquée quelques minutes. Purgées au fil des tentatives
create table tentatives_connexion (
  id bigserial primary key,
  cle text not null,
  le timestamptz not null default now()
);
create index tentatives_connexion_cle on tentatives_connexion (cle, le);
