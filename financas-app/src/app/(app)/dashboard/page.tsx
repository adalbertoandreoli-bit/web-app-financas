import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle, Plus, Scale } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { currentYM, formatBRL, formatDate, isValidYM, monthRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryChart, type CategorySlice } from "@/components/category-chart";
import { MonthPicker } from "@/components/month-picker";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = { title: "Dashboard — Gestor Financeiro Pessoal" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const ym = isValidYM(month) ? month : currentYM();
  const [start, end] = monthRange(ym);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("id,description,amount,date,type,category_id,categories(name,color)")
    .gte("date", start)
    .lt("date", end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  const transactions = (data ?? []) as unknown as Transaction[];

  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const sliceBy = (type: "income" | "expense") => {
    const map = new Map<string, CategorySlice>();
    for (const t of transactions) {
      if (t.type !== type) continue;
      const name = t.categories?.name ?? "Outros";
      const prev = map.get(name);
      map.set(name, {
        name,
        color: t.categories?.color ?? "#64748b",
        value: (prev?.value ?? 0) + t.amount,
      });
    }
    return [...map.values()].sort((a, b) => b.value - a.value);
  };
  const expenseSlices = sliceBy("expense");
  const incomeSlices = sliceBy("income");
  const recent = transactions.slice(0, 5);

  const cards = [
    { label: "Receita total", value: income, icon: ArrowUpCircle, tone: "text-income" },
    { label: "Despesa total", value: expense, icon: ArrowDownCircle, tone: "text-expense" },
    { label: "Saldo", value: balance, icon: Scale, tone: balance >= 0 ? "text-income" : "text-expense" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <MonthPicker value={ym} />
          <ThemeToggle />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-expense/30 bg-expense/5 p-3 text-sm text-expense">
          Não foi possível carregar seus dados. Verifique a conexão com o Supabase e tente novamente.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>{label}</CardTitle>
              <Icon className={cn("h-5 w-5", tone)} />
            </CardHeader>
            <CardContent>
              <p className={cn("text-2xl font-bold", label === "Saldo" && tone)}>{formatBRL(value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {transactions.length === 0 && !error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-muted-foreground">Nenhuma transação neste mês.</p>
            <Button asChild>
              <Link href="/transacoes?novo=1">
                <Plus className="h-4 w-4" /> Adicionar primeira transação
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Despesas por categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {expenseSlices.length ? (
                <CategoryChart data={expenseSlices} />
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">Sem despesas neste mês.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receitas por categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {incomeSlices.length ? (
                <CategoryChart data={incomeSlices} />
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">Sem receitas neste mês.</p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Últimas transações</CardTitle>
              <Link href={`/transacoes?month=${ym}`} className="text-sm font-medium text-primary hover:underline">
                Ver todas
              </Link>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {recent.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(t.date)} · {t.categories?.name}
                      </p>
                    </div>
                    <span className={cn("shrink-0 text-sm font-semibold", t.type === "income" ? "text-income" : "text-expense")}>
                      {t.type === "income" ? "+" : "−"} {formatBRL(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
