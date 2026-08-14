-- 006: investment holdings and entries

create table investment_holdings (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  owner_id uuid not null references profiles (id),
  name text not null,                        -- e.g. "Bank Mandiri (BMRI)"
  ticker text,                               -- e.g. "BMRI", optional
  current_value numeric(15, 2) not null default 0,  -- manually updated market value
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger investment_holdings_set_updated_at
  before update on investment_holdings
  for each row
  execute function set_updated_at();

create table investment_entries (
  id uuid primary key default gen_random_uuid(),
  holding_id uuid not null references investment_holdings (id) on delete cascade,
  amount numeric(15, 2) not null check (amount != 0), -- positive = buy/top-up, negative = sell
  units numeric(15, 6),                      -- optional: number of shares/units
  note text,
  entry_date date not null,
  created_at timestamptz not null default now()
);

-- RLS
alter table investment_holdings enable row level security;
alter table investment_entries enable row level security;

create policy "household members can manage investment_holdings"
  on investment_holdings for all
  using (
    household_id in (
      select household_id from household_members where user_id = auth.uid()
    )
  );

create policy "household members can manage investment_entries"
  on investment_entries for all
  using (
    holding_id in (
      select id from investment_holdings
      where household_id in (
        select household_id from household_members where user_id = auth.uid()
      )
    )
  );
