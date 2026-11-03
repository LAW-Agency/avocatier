-- Taux de l'ariary au jour de chaque encaissement (2026-11-03). Un encaissement règle d'abord ce qui est dû dans
-- sa devise, puis l'autre part de la note (hébergement en euros, restaurant et bar en ariary) à ce taux-là, jamais
-- à celui du jour : un séjour soldé le reste quand les hôtes changent le taux (lib/reservation/folio.ts)
alter table paiements add column taux_ariary numeric(14, 6); -- 1 € = taux_ariary Ar, au moment de l'encaissement

-- Encaissements déjà reçus : en ariary, leur propre taux ; sinon celui du dernier encaissement en ariary qui les
-- précède (ou du premier qui les suit), à défaut le taux enregistré aujourd'hui
update paiements p set taux_ariary = case
  when p.devise = 'MGA' and p.taux is not null then p.taux
  else coalesce(
    (select q.taux from paiements q where q.devise = 'MGA' and q.taux is not null and q.le <= p.le order by q.le desc limit 1),
    (select q.taux from paiements q where q.devise = 'MGA' and q.taux is not null order by q.le limit 1),
    (select (taux ->> 'MGA')::numeric from reglages_devises limit 1)
  )
end;
