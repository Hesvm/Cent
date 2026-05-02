alter table public.transactions
  add column if not exists recurring jsonb,
  add column if not exists is_auto_generated boolean not null default false,
  add column if not exists parent_recurring_id text;

create index if not exists transactions_parent_recurring_id_idx
  on public.transactions (parent_recurring_id);

create index if not exists transactions_is_auto_generated_idx
  on public.transactions (is_auto_generated);
