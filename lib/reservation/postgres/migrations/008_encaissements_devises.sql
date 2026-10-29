-- Encaissements des séjours en ariary, en euros ou en dollars : `montant` reste la contre-valeur en euros, mais
-- au centime (5 000 Ar = 0,99 €), pour que le restaurant mis sur la chambre se solde exactement
alter table paiements alter column montant type numeric(12, 2);
