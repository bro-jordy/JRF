-- 005: budgets per category + recurring transactions flag

-- Budget: per household, per category, per month (YYYY-MM)
create table budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  category_id uuid not null references categories (id) on delete cascade,
  month char(7) not null, -- format: YYYY-MM
  amount numeric(15, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, category_id, month)
);

create trigger budgets_set_updated_at
  before update on budgets
  for each row
  execute function set_updated_at();

-- RLS for budgets
alter table budgets enable row level security;

create policy "household members can manage budgets"
  on budgets for all
  using (
    household_id in (
      select household_id from household_members where user_id = auth.uid()
    )
  );

-- Recurring flag on transactions
alter table transactions add column if not exists is_recurring boolean not null default false;
