-- 008: indexes matching the app's actual query patterns (period + type filters
-- on Home/Report/Budget, and active/unsettled lookups for the new reminder jobs)

create index if not exists transactions_household_type_date_idx
  on transactions (household_id, type, transaction_date);

create index if not exists bills_household_active_idx
  on bills (household_id, is_active)
  where is_active;

create index if not exists debts_household_unsettled_idx
  on debts (household_id, is_settled)
  where not is_settled;
