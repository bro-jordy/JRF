-- JRF: one "main" account per owner (used as the default account when adding
-- a transaction, and sorted first in the owner's account list)

alter table accounts add column is_main boolean not null default false;

create unique index accounts_one_main_per_owner
  on accounts (owner_id)
  where is_main;
