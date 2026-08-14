-- JRF: computed views (balances, CC summary, saving goal progress)
-- Balances are never stored, always derived from transactions + opening_balance,
-- so they can never drift out of sync with the ledger.

create view account_balances as
select
  a.id as account_id,
  a.household_id,
  a.opening_balance
    + coalesce(flows.increases, 0) * (case when a.is_liability then -1 else 1 end)
    - coalesce(flows.decreases, 0) * (case when a.is_liability then -1 else 1 end)
    as balance
from accounts a
left join (
  select
    account_id,
    sum(case when type = 'income' then amount else 0 end) as increases_direct,
    sum(case when type = 'expense' then amount else 0 end) as decreases_direct
  from transactions
  group by account_id
) direct on direct.account_id = a.id
left join (
  select
    coalesce(src.account_id, dst.destination_account_id) as account_id,
    coalesce(dst.transfer_in, 0) as increases,
    coalesce(src.transfer_out, 0) as decreases
  from (
    select account_id, sum(amount) as transfer_out
    from transactions where type = 'transfer'
    group by account_id
  ) src
  full outer join (
    select destination_account_id, sum(amount) as transfer_in
    from transactions where type = 'transfer'
    group by destination_account_id
  ) dst on dst.destination_account_id = src.account_id
) xfer on xfer.account_id = a.id,
lateral (
  select
    coalesce(direct.increases_direct, 0) + coalesce(xfer.increases, 0) as increases,
    coalesce(direct.decreases_direct, 0) + coalesce(xfer.decreases, 0) as decreases
) flows;

create view credit_card_summary as
select
  a.id as account_id,
  a.household_id,
  a.name,
  a.owner_id,
  a.credit_limit,
  b.balance as outstanding,
  case when a.credit_limit is not null then a.credit_limit - b.balance end as available_limit,
  case when a.credit_limit is not null and a.credit_limit > 0
    then round(b.balance / a.credit_limit, 4)
  end as utilization
from accounts a
join account_balances b on b.account_id = a.id
where a.type = 'credit_card';

create view saving_goal_progress as
select
  g.id as saving_goal_id,
  g.household_id,
  g.name,
  g.target_amount,
  coalesce(sum(t.amount), 0) as current_amount,
  g.target_date,
  g.status
from saving_goals g
left join transactions t
  on t.saving_goal_id = g.id and t.type = 'transfer'
group by g.id, g.household_id, g.name, g.target_amount, g.target_date, g.status;
