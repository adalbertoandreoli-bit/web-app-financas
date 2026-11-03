# PRD — Finanças Pessoais App

**Versão:** 1.0 | **Data:** 03/11/2026 | **Status:** Rascunho para implementação

---

## 1. Visão Geral

### 1.1 Problema
Pessoas físicas têm dificuldade em controlar suas finanças de forma simples e visual. As informações ficam dispersas entre extratos bancários, planilhas manuais e anotações avulsas. Sem uma visão consolidada de receitas, despesas e saldo, ocorrem descontrole financeiro, gastos desnecessários e falta de planejamento.

### 1.2 Solução
Web app de gestão financeira pessoal para registrar receitas e despesas, categorizá-las e visualizar um dashboard com o resumo mensal (receitas, despesas e saldo). Aplicação responsiva, com autenticação via Supabase Auth e dados persistidos em Supabase (PostgreSQL).

### 1.3 Diferenciais
- Interface moderna e minimalista (shadcn/ui).
- Dashboard visual com gráfico de categorias.
- Filtros por período e categoria, busca por descrição.
- Exportação CSV.
- Deploy instantâneo na Vercel; desenvolvimento guiado pelo Claude Code.

### 1.4 Objetivos
| # | Objetivo | Métrica de sucesso |
|---|----------|--------------------|
| O1 | Registrar uma transação rapidamente | Criar transação em ≤ 3 interações (abrir formulário, preencher, salvar) |
| O2 | Visão consolidada imediata | Dashboard carrega com os totais do mês corrente em < 2 s |
| O3 | Isolamento de dados | 100% das consultas protegidas por RLS; nenhum usuário acessa dados de outro |
| O4 | Uso em qualquer dispositivo | Todas as telas utilizáveis a partir de 360 px de largura |

### 1.5 Fora de escopo (v1)
- Múltiplos perfis/papéis de usuário (apenas um tipo: usuário final).
- Categorias personalizadas pelo usuário (apenas as pré-definidas).
- Orçamentos/metas, transações recorrentes, anexos, multi-moeda.
- Integração bancária (Open Finance), importação de extratos.
- Login social, recuperação de senha avançada/2FA (ver 6.1 para o mínimo).
- App nativo.

---

## 2. Persona

**Usuário Final** — pessoa física que quer organizar suas finanças. Cadastra transações, acompanha o dashboard e exporta relatórios. Conhecimento técnico básico; usa tanto celular quanto desktop.

**Regra de acesso:** cada usuário vê e gerencia somente as próprias transações (Row Level Security).

---

## 3. Requisitos Funcionais

Prioridade: **P0** = essencial para o MVP, **P1** = desejável na v1.

### RF-01 Autenticação (P0)
- Cadastro e login com e-mail/senha (Supabase Auth).
- Logout.
- Proteção de rotas: usuário não autenticado é redirecionado para `/login`; usuário autenticado que acessa `/login` ou `/cadastro` vai para `/dashboard`.
- Mensagens de erro claras (credenciais inválidas, e-mail já cadastrado, senha curta).

**Critérios de aceite**
- Dado um visitante, ao acessar `/dashboard`, é redirecionado para `/login`.
- Dado um login válido, o usuário chega ao dashboard e a sessão persiste ao recarregar a página.
- Senha mínima de 6 caracteres validada no cliente e no servidor.

### RF-02 Landing Page (P1)
- Página pública em `/` com proposta de valor, principais features, e CTAs "Entrar" e "Criar conta".
- Se o usuário já estiver logado, o CTA principal leva ao dashboard.

### RF-03 Dashboard (P0)
- Cards: **Receita Total**, **Despesa Total** e **Saldo** (receitas − despesas) do período selecionado (padrão: mês corrente).
- Gráfico de pizza (Recharts) com despesas por categoria no período.
- Lista das transações mais recentes (últimas 5) com link para a página completa.
- Estados: carregando (skeleton), vazio (mensagem + CTA "Adicionar primeira transação"), erro.

**Critérios de aceite**
- Saldo exibido em verde se ≥ 0 e em vermelho se < 0.
- Valores formatados em BRL (`R$ 1.234,56`).
- Gráfico mostra legenda e valor/percentual ao passar o mouse ou tocar na fatia.

### RF-04 CRUD de Transações (P0)
Campos:

| Campo | Tipo | Regras |
|-------|------|--------|
| descrição | texto | obrigatório, 1–100 caracteres |
| valor | numérico | obrigatório, > 0, 2 casas decimais |
| data | data | obrigatória, padrão = hoje |
| tipo | enum | `receita` ou `despesa` |
| categoria | enum/ref | obrigatória, compatível com o tipo |

- **Criar** via modal/drawer (dialog no desktop, drawer/sheet no mobile).
- **Editar** pré-preenchendo o formulário.
- **Excluir** com diálogo de confirmação.
- Validação com Zod + React Hook Form; feedback por toast (sucesso/erro).
- Listagem em tabela (desktop) e cards (mobile), ordenada por data decrescente.

**Critérios de aceite**
- Após criar/editar/excluir, lista e dashboard refletem a mudança sem recarregar manualmente.
- Valor ≤ 0 ou descrição vazia bloqueia o envio com mensagem no campo.

### RF-05 Categorias (P0)
Pré-definidas e fixas na v1:
- **Despesa:** Alimentação, Transporte, Moradia, Lazer, Saúde, Educação, Outros
- **Receita:** Salário, Freelance, Outros

Cada categoria tem nome, tipo e cor (usada nos gráficos e badges). Ao selecionar o tipo no formulário, o seletor de categoria mostra apenas as categorias compatíveis.

### RF-06 Busca e Filtros (P0)
- Filtro por **mês/ano** (padrão: mês corrente) e por **categoria** (todas por padrão).
- Filtro por **tipo** (todos / receita / despesa) — P1.
- Busca por descrição (case-insensitive, parcial, com debounce de ~300 ms).
- Filtros combináveis; estado refletido na URL (query params) para permitir compartilhar/recarregar.
- Botão "Limpar filtros".

### RF-07 Exportar CSV (P1)
- Botão "Exportar CSV" na página de transações exporta **exatamente as transações filtradas**.
- Colunas: `data, descricao, tipo, categoria, valor`.
- Codificação UTF-8 com BOM (compatibilidade com Excel), separador `;`, decimal com vírgula, data `dd/mm/aaaa`.
- Nome do arquivo: `transacoes-AAAA-MM.csv`.
- Proteção contra injeção de fórmula: prefixar com `'` células iniciadas por `=`, `+`, `-`, `@`.

### RF-08 Responsividade (P0)
- Layout adaptável 360 px → desktop.
- Desktop: sidebar fixa; mobile: navegação inferior ou menu hambúrguer.
- Alvos de toque ≥ 44 px; sem rolagem horizontal da página.

---

## 4. Requisitos Não Funcionais

| Área | Requisito |
|------|-----------|
| Segurança | RLS ativo em todas as tabelas; chave `service_role` nunca exposta ao cliente; somente `anon key` no front; variáveis em `.env.local` e no painel da Vercel |
| Desempenho | LCP < 2,5 s em 4G; consultas paginadas/limitadas; índices em `(user_id, date)` |
| Acessibilidade | Contraste WCAG AA; navegação por teclado; labels em todos os campos; componentes shadcn/Radix |
| Compatibilidade | Últimas 2 versões de Chrome, Edge, Firefox e Safari; iOS Safari e Android Chrome |
| Qualidade | TypeScript strict; ESLint sem erros; build da Vercel verde |
| Idioma/Locale | pt-BR; moeda BRL; datas `dd/mm/aaaa` |
| Observabilidade | Erros tratados com mensagens ao usuário; logs de erro no console/Vercel |

---

## 5. Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 14+ (App Router), React, TypeScript |
| Estilo/UI | Tailwind CSS, shadcn/ui |
| Gráficos | Recharts |
| Backend/BaaS | Supabase (PostgreSQL, Auth, RLS) — sem backend separado |
| Validação/Forms | Zod, React Hook Form |
| Deploy | Vercel (CI/CD via GitHub) |
| Dev | Claude Code; Git/GitHub |

Integração Supabase: `@supabase/supabase-js` + `@supabase/ssr` (clientes para browser, Server Components e middleware).

---

## 6. Arquitetura e Dados

### 6.1 Autenticação e rotas
| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/` | Pública | Landing page |
| `/login`, `/cadastro` | Pública (redireciona se logado) | Autenticação |
| `/dashboard` | Autenticada | Resumo e gráfico |
| `/transacoes` | Autenticada | Lista, filtros, CRUD, exportação |

Proteção via `middleware.ts` (refresh de sessão + redirecionamento) e verificação adicional em layouts de Server Components. Confirmação de e-mail: configurável no Supabase; para o escopo de aula, pode ser desativada.

### 6.2 Modelo de dados

**`categories`** (seed fixo, leitura para autenticados)
| Coluna | Tipo | Observação |
|--------|------|-----------|
| id | uuid PK | `gen_random_uuid()` |
| name | text | not null |
| type | text | check in (`income`,`expense`) |
| color | text | hex, usado em gráficos |

Unique `(name, type)`.

**`transactions`**
| Coluna | Tipo | Observação |
|--------|------|-----------|
| id | uuid PK | `gen_random_uuid()` |
| user_id | uuid | FK `auth.users(id)` on delete cascade, default `auth.uid()` |
| description | text | not null, check `char_length` 1–100 |
| amount | numeric(12,2) | not null, check `> 0` |
| date | date | not null |
| type | text | check in (`income`,`expense`) |
| category_id | uuid | FK `categories(id)` |
| created_at | timestamptz | default `now()` |
| updated_at | timestamptz | trigger de atualização |

Índices: `(user_id, date desc)`, `(user_id, category_id)`.

### 6.3 Políticas RLS
```sql
alter table transactions enable row level security;

create policy "select own"  on transactions for select using (auth.uid() = user_id);
create policy "insert own"  on transactions for insert with check (auth.uid() = user_id);
create policy "update own"  on transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own"  on transactions for delete using (auth.uid() = user_id);

alter table categories enable row level security;
create policy "read categories" on categories for select to authenticated using (true);
```
Regra adicional: o `type` da transação deve ser igual ao `type` da categoria (validar via trigger ou na camada de aplicação).

### 6.4 Estrutura de pastas sugerida
```
src/
  app/
    (public)/page.tsx            # landing
    (auth)/login, cadastro
    (app)/dashboard, transacoes  # layout com sidebar
  components/ui/                 # shadcn
  components/                    # transaction-form, summary-cards, category-chart, filters...
  lib/supabase/                  # client.ts, server.ts, middleware.ts
  lib/                           # utils, csv.ts, format.ts, validations.ts
  types/
middleware.ts
supabase/migrations/             # SQL de schema, seed e RLS
```

---

## 7. Design e UX

- **Referências:** Mobills, Organizze, template de dashboard do shadcn/ui.
- **Estilo:** claro, fonte sem serifa (Inter/Geist), cards com bordas suaves, paleta neutra com acentos azul e verde.
- **Semântica de cor:** receita = verde, despesa = vermelho/âmbar, ação primária = azul.
- **Estados obrigatórios:** loading (skeleton), vazio, erro, sucesso (toast).
- **Mobile:** botão flutuante "+" para nova transação; tabela vira lista de cards.
- **Dark mode:** opcional (P1 futuro).

---

## 8. Plano de Entrega (marcos)

| Marco | Entregas | Prioridade |
|-------|----------|-----------|
| M1 — Fundação | Projeto Next.js + Tailwind + shadcn; repositório GitHub; deploy inicial na Vercel; projeto Supabase | P0 |
| M2 — Dados e Auth | Migrations (tabelas, seed de categorias, RLS); login/cadastro/logout; middleware de proteção | P0 |
| M3 — Transações | CRUD completo, validações, listagem responsiva | P0 |
| M4 — Dashboard | Cards de totais, gráfico de pizza, recentes | P0 |
| M5 — Filtros e busca | Mês/ano, categoria, busca, filtros na URL | P0 |
| M6 — Extras | Exportar CSV, landing page, polimento responsivo e acessibilidade | P1 |
| M7 — Release | Testes manuais da checklist, revisão de segurança (RLS), deploy de produção | P0 |

---

## 9. Testes e Critérios de Aceite Globais

**Checklist de aceite (MVP):**
- [ ] Cadastro, login, logout e persistência de sessão funcionam.
- [ ] Rotas protegidas redirecionam corretamente.
- [ ] CRUD de transações funciona com validações.
- [ ] Usuário A não vê nem altera dados do usuário B (testar com duas contas, inclusive via chamadas diretas à API).
- [ ] Dashboard mostra totais e gráfico corretos para o período.
- [ ] Filtros e busca combinam e persistem na URL.
- [ ] CSV exportado contém apenas as transações filtradas e abre corretamente no Excel.
- [ ] Layout usável em 360 px, 768 px e ≥ 1280 px.
- [ ] Build e deploy na Vercel sem erros; variáveis de ambiente configuradas.

**Estratégia:** testes manuais guiados pela checklist; testes unitários opcionais para utilitários (`csv.ts`, `format.ts`, cálculo de totais).

---

## 10. Riscos e Premissas

| Risco / Premissa | Mitigação |
|------------------|-----------|
| RLS mal configurado expõe dados | Testar com duas contas; revisar políticas antes do release |
| Vazamento de chaves | `.env.local` no `.gitignore`; só `anon key` no cliente |
| Cálculo de totais incorreto por arredondamento | Usar `numeric(12,2)` no banco e formatar apenas na exibição |
| Fuso horário deslocando datas | Tipo `date` (sem hora) e formatação sem conversão de timezone |
| Escopo excessivo para o tempo de aula | Priorizar P0; P1 (landing, CSV) entram por último |
| Premissa: um único papel de usuário e categorias fixas | Revisitar em v2 |

---

## 11. Evoluções Futuras (v2+)
Categorias personalizadas, orçamentos e metas por categoria, transações recorrentes, anexos de comprovantes, gráficos de evolução mensal, dark mode, importação de extratos (OFX/CSV), PWA.
