-- 010: turn on Postgres Changes (Realtime) for transactions, so Home and
-- Transactions can pick up changes live instead of needing a manual reload.
-- RLS still applies to the subscribing client, same as any select.
alter publication supabase_realtime add table transactions;
