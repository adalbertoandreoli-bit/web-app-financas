-- Finanças Pessoais — schema inicial
-- Execute no SQL Editor do Supabase (ou via supabase db push).

create extension if not exists "pgcrypto";

-- ───────── Categorias (fixas, somente leitura) ─────────
create table if not exists public.categories (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  type  text not null check (type in ('income', 'expense')),
  color text not null,
  unique (name, type)
);

insert into public.categories (name, type, color) values
  ('Alimentação', 'expense', '#f97316'),
  ('Transporte',  'expense', '#3b82f6'),
  ('Moradia',     'expense', '#8b5cf6'),
  ('Lazer',       'expense', '#ec4899'),
  ('Saúde',       'expense', '#ef4444'),
  ('Educação',    'expense', '#eab308'),
  ('Outros',      'expense', '#64748b'),
  ('Salário',     'income',  '#16a34a'),
  ('Freelance',   'income',  '#06b6d4'),
  ('Outros',      'income',  '#84cc16')
on conflict (name, type) do nothing;

alter table public.categories enable row level security;

drop policy if exists "categorias: leitura" on public.categories;
create policy "categorias: leitura" on public.categories
  for select to authenticated using (true);

-- ───────── Transações ─────────
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  description text not null check (char_length(description) between 1 and 100),
  amount      numeric(12, 2) not null check (amount > 0),
  date        date not null,
  type        text not null check (type in ('income', 'expense')),
  category_id uuid not null references public.categories (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);
create index if not exists transactions_user_category_idx
  on public.transactions (user_id, category_id);

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- tipo da transação deve ser igual ao tipo da categoria
create or replace function public.check_category_type()
returns trigger language plpgsql as $$
begin
  if not exists (
    select 1 from public.categories c
    where c.id = new.category_id and c.type = new.type
  ) then
    raise exception 'Categoria incompatível com o tipo da transação';
  end if;
  return new;
end $$;

drop trigger if exists transactions_check_category on public.transactions;
create trigger transactions_check_category
  before insert or update on public.transactions
  for each row execute function public.check_category_type();

-- ───────── Row Level Security ─────────
alter table public.transactions enable row level security;

drop policy if exists "transacoes: select proprias" on public.transactions;
drop policy if exists "transacoes: insert proprias" on public.transactions;
drop policy if exists "transacoes: update proprias" on public.transactions;
drop policy if exists "transacoes: delete proprias" on public.transactions;

create policy "transacoes: select proprias" on public.transactions
  for select to authenticated using (auth.uid() = user_id);

create policy "transacoes: insert proprias" on public.transactions
  for insert to authenticated with check (auth.uid() = user_id);

create policy "transacoes: update proprias" on public.transactions
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transacoes: delete proprias" on public.transactions
  for delete to authenticated using (auth.uid() = user_id);
