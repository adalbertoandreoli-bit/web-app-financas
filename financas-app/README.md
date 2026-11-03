# Finanças Pessoais

Next.js (App Router) + TypeScript + Tailwind + Supabase + Recharts. Veja o `../PRD.md`.

## Configuração

1. Crie um projeto no [Supabase](https://supabase.com).
2. No **SQL Editor**, execute `supabase/migrations/0001_init.sql` (tabelas, categorias, RLS).
3. Em **Authentication → Providers → Email**, desative "Confirm email" se quiser entrar logo após o cadastro.
4. Preencha `.env.local` com a URL e a `anon key` do projeto (Settings → API).
5. `npm install` e `npm run dev` → http://localhost:3000

## Deploy (Vercel)

Importe o repositório (Root Directory: `financas-app`) e defina `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
