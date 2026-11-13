-- Categorias por usuário (CRUD).
-- Execute no SQL Editor do Supabase DEPOIS do 0001_init.sql.
-- Seguro para rodar uma vez; faz backfill dos usuários e transações existentes.

-- 1) Dono da categoria ───────────────────────────────────────────────
alter table public.categories
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.categories alter column user_id set default auth.uid();

alter table public.categories drop constraint if exists categories_name_type_key;

-- 2) Categorias padrão (função usada no backfill e no cadastro) ──────
create or replace function public.seed_user_categories(uid uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.categories (user_id, name, type, color) values
    (uid, 'Alimentação', 'expense', '#f97316'),
    (uid, 'Transporte',  'expense', '#3b82f6'),
    (uid, 'Moradia',     'expense', '#8b5cf6'),
    (uid, 'Lazer',       'expense', '#ec4899'),
    (uid, 'Saúde',       'expense', '#ef4444'),
    (uid, 'Educação',    'expense', '#eab308'),
    (uid, 'Outros',      'expense', '#64748b'),
    (uid, 'Salário',     'income',  '#16a34a'),
    (uid, 'Freelance',   'income',  '#06b6d4'),
    (uid, 'Outros',      'income',  '#84cc16')
  on conflict do nothing;
$$;

-- unicidade por usuário (índice criado antes do backfill)
create unique index if not exists categories_user_name_type_key
  on public.categories (user_id, name, type);

-- 3) Backfill: cópia das categorias para cada usuário existente ──────
do $$
declare u record;
begin
  for u in select id from auth.users loop
    perform public.seed_user_categories(u.id);
  end loop;
end $$;

-- 4) Reaponta as transações para as categorias do próprio usuário ────
update public.transactions t
set category_id = c.id
from public.categories old_c, public.categories c
where old_c.id = t.category_id
  and old_c.user_id is null
  and c.user_id = t.user_id
  and c.name = old_c.name
  and c.type = old_c.type;

-- 5) Remove as categorias globais antigas (sem dono) ─────────────────
delete from public.categories where user_id is null;

alter table public.categories alter column user_id set not null;

-- 6) Novo usuário já recebe as categorias padrão ─────────────────────
create or replace function public.handle_new_user_categories()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.seed_user_categories(new.id);
  return new;
end $$;

drop trigger if exists on_auth_user_created_categories on auth.users;
create trigger on_auth_user_created_categories
  after insert on auth.users
  for each row execute function public.handle_new_user_categories();

revoke all on function public.seed_user_categories(uuid) from public, anon, authenticated;
revoke all on function public.handle_new_user_categories() from public, anon, authenticated;

-- 7) RLS: cada usuário gerencia apenas as próprias categorias ────────
drop policy if exists "categorias: leitura" on public.categories;
drop policy if exists "categorias: select proprias" on public.categories;
drop policy if exists "categorias: insert proprias" on public.categories;
drop policy if exists "categorias: update proprias" on public.categories;
drop policy if exists "categorias: delete proprias" on public.categories;

create policy "categorias: select proprias" on public.categories
  for select to authenticated using (auth.uid() = user_id);

create policy "categorias: insert proprias" on public.categories
  for insert to authenticated with check (auth.uid() = user_id);

create policy "categorias: update proprias" on public.categories
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "categorias: delete proprias" on public.categories
  for delete to authenticated using (auth.uid() = user_id);

-- 8) Integridade ─────────────────────────────────────────────────────
alter table public.categories
  drop constraint if exists categories_name_length,
  add constraint categories_name_length check (char_length(btrim(name)) between 1 and 40),
  drop constraint if exists categories_color_hex,
  add constraint categories_color_hex check (color ~ '^#[0-9a-fA-F]{6}$');

-- FK transações -> categorias: bloqueia excluir categoria em uso
alter table public.transactions
  drop constraint if exists transactions_category_id_fkey,
  add constraint transactions_category_id_fkey
    foreign key (category_id) references public.categories (id) on delete restrict;

-- a categoria da transação deve ser do mesmo tipo E do mesmo usuário
create or replace function public.check_category_type()
returns trigger language plpgsql as $$
begin
  if not exists (
    select 1 from public.categories c
    where c.id = new.category_id
      and c.type = new.type
      and c.user_id = new.user_id
  ) then
    raise exception 'Categoria incompatível com o tipo da transação';
  end if;
  return new;
end $$;

-- não permite mudar o tipo de uma categoria que já tem transações
create or replace function public.check_category_type_change()
returns trigger language plpgsql as $$
begin
  if new.type <> old.type
     and exists (select 1 from public.transactions where category_id = old.id) then
    raise exception 'Não é possível alterar o tipo de uma categoria em uso';
  end if;
  return new;
end $$;

drop trigger if exists categories_check_type_change on public.categories;
create trigger categories_check_type_change
  before update on public.categories
  for each row execute function public.check_category_type_change();
