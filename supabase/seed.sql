-- JRF: one-time seed for a private 2-person household.
-- There is no self-serve signup/invite flow -- this app is fixed to exactly 2 people.
-- Auth users already created manually via Dashboard -> Authentication -> Users.
-- Run this whole file once in the SQL Editor.

-- The SQL Editor session has no auth.uid() (no logged-in user), and profiles/
-- households/household_members have no INSERT policy by design (no self-serve
-- signup). Disable RLS on the tables this seed touches, then re-enable at the end.
alter table profiles disable row level security;
alter table households disable row level security;
alter table household_members disable row level security;
alter table categories disable row level security;

insert into profiles (id, display_name) values
  ('81a9c983-42d0-4d3b-ae80-4755c8462525', 'Jordy'),
  ('680ec57b-e88e-4e33-a04c-798248b833b1', 'Rea');

insert into households (id, name) values
  ('ef0ff337-3458-48c3-8deb-0870829c3326', 'Jordy & Rea');

insert into household_members (household_id, user_id) values
  ('ef0ff337-3458-48c3-8deb-0870829c3326', '81a9c983-42d0-4d3b-ae80-4755c8462525'),
  ('ef0ff337-3458-48c3-8deb-0870829c3326', '680ec57b-e88e-4e33-a04c-798248b833b1');

-- Default categories (all dynamic/editable afterwards -- this just seeds sane starting points)
insert into categories (household_id, name, type) values
  ('ef0ff337-3458-48c3-8deb-0870829c3326', 'Salary', 'income'),
  ('ef0ff337-3458-48c3-8deb-0870829c3326', 'Bonus', 'income'),
  ('ef0ff337-3458-48c3-8deb-0870829c3326', 'THR', 'income'),
  ('ef0ff337-3458-48c3-8deb-0870829c3326', 'Freelance', 'income'),
  ('ef0ff337-3458-48c3-8deb-0870829c3326', 'Investment', 'income'),
  ('ef0ff337-3458-48c3-8deb-0870829c3326', 'Other Income', 'income'),
  ('ef0ff337-3458-48c3-8deb-0870829c3326', 'Food', 'expense'),
  ('ef0ff337-3458-48c3-8deb-0870829c3326', 'Transportation', 'expense'),
  ('ef0ff337-3458-48c3-8deb-0870829c3326', 'Household', 'expense'),
  ('ef0ff337-3458-48c3-8deb-0870829c3326', 'Bills', 'expense'),
  ('ef0ff337-3458-48c3-8deb-0870829c3326', 'Shopping', 'expense'),
  ('ef0ff337-3458-48c3-8deb-0870829c3326', 'Entertainment', 'expense'),
  ('ef0ff337-3458-48c3-8deb-0870829c3326', 'Personal', 'expense'),
  ('ef0ff337-3458-48c3-8deb-0870829c3326', 'Family', 'expense'),
  ('ef0ff337-3458-48c3-8deb-0870829c3326', 'Bank Fee/Interest', 'expense'),
  ('ef0ff337-3458-48c3-8deb-0870829c3326', 'Other', 'expense');

alter table profiles enable row level security;
alter table households enable row level security;
alter table household_members enable row level security;
alter table categories enable row level security;
