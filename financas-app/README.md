# Gestor Financeiro Pessoal

Next.js (App Router) + TypeScript + Tailwind + Supabase + Recharts. Veja o `../PRD.md`.

## Configuração local

1. Crie um projeto no [Supabase](https://supabase.com).
2. No **SQL Editor**, execute `supabase/migrations/0001_init.sql` (tabelas, categorias, RLS).
3. Em **Authentication → Providers → Email**, desative "Confirm email" se quiser entrar logo após o cadastro.
4. Copie `.env.example` para `.env.local` e preencha com a **Project URL** e a **publishable key** (Settings → API).
5. `npm install` e `npm run dev` → http://localhost:3000

## Deploy na Vercel

1. Importe o repositório na Vercel e defina **Root Directory = `financas-app`** (framework: Next.js, detectado automaticamente).
2. Em **Settings → Environment Variables**, cadastre (Production, Preview e Development):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Faça o deploy.
4. No Supabase, em **Authentication → URL Configuration**, defina **Site URL** com o domínio da Vercel e inclua em **Redirect URLs** `https://SEU-DOMINIO.vercel.app/**` (e o de preview, se usar).

## Segurança

- A **publishable key** (antiga *anon key*) é feita para ser pública: vai ao navegador por design. Quem protege os dados é o **Row Level Security** do banco (`0001_init.sql`): cada usuário só lê e escreve as próprias transações.
- **Nunca** use a `service_role` / *secret key* neste projeto, nem com prefixo `NEXT_PUBLIC_`: variáveis com esse prefixo são embutidas no JavaScript do navegador.
- `.env.local` está no `.gitignore`. Só o `.env.example` (sem valores reais) é versionado.
- O `middleware.ts` e o layout autenticado validam o usuário com `auth.getUser()` (verificado no servidor, não só pelo cookie).
- Cabeçalhos de segurança (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) configurados em `next.config.ts`.
- Se uma chave vazar, gire-a em Settings → API Keys no Supabase.
