-- JRF: dev seed — ganti <JORDY_UUID> dan <REA_UUID> dengan UUID dari auth users dev project
-- Cara dapat UUID: Dashboard dev project → Authentication → Users → copy User UID

alter table profiles disable row level security;
alter table households disable row level security;
alter table household_members disable row level security;
alter table categories disable row level security;

insert into profiles (id, display_name) values
  ('d04c333d-85a2-4cb6-b2eb-38eba2e72cf5', 'Jordy'),
  ('17cff985-e54f-4849-b20d-f3147e5e894a', 'Rea');

insert into households (id, name) values
  ('ef0ff337-3458-48c3-8deb-0870829c3326', 'Jordy & Rea');

insert into household_members (household_id, user_id) values
  ('ef0ff337-3458-48c3-8deb-0870829c3326', 'd04c333d-85a2-4cb6-b2eb-38eba2e72cf5'),
  ('ef0ff337-3458-48c3-8deb-0870829c3326', '17cff985-e54f-4849-b20d-f3147e5e894a');

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
