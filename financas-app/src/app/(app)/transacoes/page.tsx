import { createClient } from "@/lib/supabase/server";
import { currentYM, isValidYM, monthRange } from "@/lib/format";
import type { Category, Transaction } from "@/types";
import { TransactionFilters } from "@/components/transaction-filters";
import { TransactionsView } from "@/components/transactions-view";

export const metadata = { title: "Transações — Finanças Pessoais" };

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; category?: string; type?: string; q?: string; novo?: string }>;
}) {
  const sp = await searchParams;
  const ym = isValidYM(sp.month) ? sp.month : currentYM();
  const [start, end] = monthRange(ym);
  const q = sp.q?.trim().slice(0, 100) ?? "";

  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select("id,description,amount,date,type,category_id,categories(name,color)")
    .gte("date", start)
    .lt("date", end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (sp.category) query = query.eq("category_id", sp.category);
  if (sp.type === "income" || sp.type === "expense") query = query.eq("type", sp.type);
  if (q) query = query.ilike("description", `%${q.replace(/[%_\\]/g, "\\$&")}%`);

  const [{ data: txs, error }, { data: cats }] = await Promise.all([
    query,
    supabase.from("categories").select("id,name,type,color").order("name"),
  ]);

  const hasFilters = !!(sp.category || sp.type || q);

  return (
    <div className="space-y-6">
      <TransactionsView
        transactions={(txs ?? []) as unknown as Transaction[]}
        categories={(cats ?? []) as Category[]}
        month={ym}
        hasFilters={hasFilters}
        openNew={sp.novo === "1"}
        filters={<TransactionFilters categories={(cats ?? []) as Category[]} month={ym} />}
      />
      {error && (
        <p className="rounded-lg border border-expense/30 bg-expense/5 p-3 text-sm text-expense">
          Não foi possível carregar as transações. Tente novamente.
        </p>
      )}
    </div>
  );
}
