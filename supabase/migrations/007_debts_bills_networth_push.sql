-- 007: debts, bills, net worth snapshots, push subscriptions

-- ─── Debts ────────────────────────────────────────────────────────────────────
create table debts (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  lender_id    uuid not null references profiles (id),   -- who lent
  borrower_id  uuid not null references profiles (id),   -- who owes
  amount       numeric(15, 2) not null check (amount > 0),
  description  text,
  due_date     date,
  is_settled   boolean not null default false,
  settled_at   timestamptz,
  created_at   timestamptz not null default now()
);

alter table debts enable row level security;

create policy "household members can manage debts"
  on debts for all
  using (
    household_id in (
      select household_id from household_members where user_id = auth.uid()
    )
  );

-- ─── Bills ────────────────────────────────────────────────────────────────────
create table bills (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references households (id) on delete cascade,
  name           text not null,
  amount         numeric(15, 2),                          -- estimated amount, optional
  due_day        smallint check (due_day between 1 and 31), -- day of month
  category_id    uuid references categories (id) on delete set null,
  last_paid_date date,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger bills_set_updated_at
  before update on bills
  for each row
  execute function set_updated_at();

alter table bills enable row level security;

create policy "household members can manage bills"
  on bills for all
  using (
    household_id in (
      select household_id from household_members where user_id = auth.uid()
    )
  );

-- ─── Net Worth Snapshots ──────────────────────────────────────────────────────
create table net_worth_snapshots (
  id               uuid primary key default gen_random_uuid(),
  household_id     uuid not null references households (id) on delete cascade,
  snapshot_month   char(7) not null,        -- YYYY-MM
  total_assets     numeric(15, 2) not null default 0,
  total_liabilities numeric(15, 2) not null default 0,
  net_worth        numeric(15, 2) not null default 0,
  created_at       timestamptz not null default now(),
  unique (household_id, snapshot_month)
);

alter table net_worth_snapshots enable row level security;

create policy "household members can manage net_worth_snapshots"
  on net_worth_snapshots for all
  using (
    household_id in (
      select household_id from household_members where user_id = auth.uid()
    )
  );

-- ─── Push Subscriptions ───────────────────────────────────────────────────────
create table push_subscriptions (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references profiles (id) on delete cascade,
  endpoint  text not null unique,
  p256dh    text not null,
  auth      text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "users can manage own push subscriptions"
  on push_subscriptions for all
  using (user_id = auth.uid());
