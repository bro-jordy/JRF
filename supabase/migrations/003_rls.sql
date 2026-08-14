-- JRF: Row Level Security
-- Both members of a household get full symmetric read/write access to household data.
-- Nothing is scoped to "owner only" -- owner_id is attribution, not an access boundary.

alter table profiles enable row level security;
alter table households enable row level security;
alter table household_members enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table saving_goals enable row level security;
alter table transactions enable row level security;

create or replace function is_household_member(target_household_id uuid)
returns boolean as $$
  select exists (
    select 1 from household_members
    where household_id = target_household_id and user_id = auth.uid()
  );
$$ language sql stable security definer set search_path = public;

-- profiles: see your own profile and your household-mates'
create policy "profiles_select" on profiles for select
  using (
    id = auth.uid()
    or id in (
      select hm.user_id from household_members hm
      where hm.household_id in (
        select household_id from household_members where user_id = auth.uid()
      )
    )
  );

create policy "profiles_update_own" on profiles for update
  using (id = auth.uid());

-- households: see households you belong to
create policy "households_select" on households for select
  using (is_household_member(id));

-- household_members: see membership rows for your own household(s)
create policy "household_members_select" on household_members for select
  using (is_household_member(household_id));

-- accounts / categories / saving_goals / transactions:
-- full CRUD for any member of the same household
create policy "accounts_all" on accounts for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "categories_all" on categories for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "saving_goals_all" on saving_goals for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "transactions_all" on transactions for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));
