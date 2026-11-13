import { createClient } from "@/lib/supabase/server";
import { CategoriesView, type CategoryWithUsage } from "@/components/categories-view";

export const metadata = { title: "Categorias — Gestor Financeiro Pessoal" };

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,type,color,transactions(count)")
    .order("name");

  const categories: CategoryWithUsage[] = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    color: c.color,
    usage: (c.transactions as unknown as { count: number }[])?.[0]?.count ?? 0,
  }));

  return (
    <div className="space-y-6">
      <CategoriesView categories={categories} />
      {error && (
        <p className="rounded-lg border border-expense/30 bg-expense/5 p-3 text-sm text-expense">
          Não foi possível carregar as categorias. Verifique se a migração 0002 foi executada no Supabase.
        </p>
      )}
    </div>
  );
}
