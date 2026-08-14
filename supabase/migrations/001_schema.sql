-- JRF: core schema
create extension if not exists pgcrypto;

create type account_type as enum ('bank', 'savings', 'credit_card', 'cash', 'ewallet', 'investment', 'other');
create type transaction_type as enum ('income', 'expense', 'transfer');
create type category_type as enum ('income', 'expense');
create type saving_goal_status as enum ('active', 'completed', 'archived');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table household_members (
  household_id uuid not null references households (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  owner_id uuid not null references profiles (id),
  name text not null,
  type account_type not null,
  is_liability boolean not null default false,
  credit_limit numeric(15, 2),
  opening_balance numeric(15, 2) not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  type category_type not null,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table saving_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  target_amount numeric(15, 2) not null,
  target_date date,
  status saving_goal_status not null default 'active',
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  owner_id uuid not null references profiles (id),
  type transaction_type not null,
  account_id uuid not null references accounts (id),
  destination_account_id uuid references accounts (id),
  category_id uuid references categories (id),
  saving_goal_id uuid references saving_goals (id),
  amount numeric(15, 2) not null check (amount > 0),
  description text,
  transaction_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint transfer_destination_check check (
    (type = 'transfer' and destination_account_id is not null and destination_account_id <> account_id)
    or (type <> 'transfer' and destination_account_id is null)
  ),
  constraint income_expense_category_check check (
    (type in ('income', 'expense') and category_id is not null)
    or (type = 'transfer' and category_id is null)
  ),
  constraint saving_goal_only_on_transfer_check check (
    saving_goal_id is null or type = 'transfer'
  )
);

create index transactions_household_date_idx on transactions (household_id, transaction_date desc);
create index transactions_account_idx on transactions (account_id);
create index transactions_destination_account_idx on transactions (destination_account_id) where destination_account_id is not null;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger transactions_set_updated_at
  before update on transactions
  for each row
  execute function set_updated_at();
