"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import type { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

export function TransactionFilters({
  categories,
  month,
}: {
  categories: Category[];
  month: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const urlQ = params.get("q") ?? "";
  const [q, setQ] = useState(urlQ);

  function update(changes: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    sp.delete("novo");
    router.replace(`${pathname}?${sp.toString()}`);
  }

  // Busca com debounce
  useEffect(() => {
    if (q === urlQ) return;
    const t = setTimeout(() => update({ q: q.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasFilters = !!(params.get("category") || params.get("type") || urlQ);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_11rem_12rem_10rem_auto]">
      <div className="relative sm:col-span-2 lg:col-span-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por descrição"
          aria-label="Buscar por descrição"
          className="pl-9"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <Input
        type="month"
        aria-label="Mês"
        value={month}
        onChange={(e) => e.target.value && update({ month: e.target.value })}
      />
      <Select
        aria-label="Categoria"
        value={params.get("category") ?? ""}
        onChange={(e) => update({ category: e.target.value })}
      >
        <option value="">Todas as categorias</option>
        <optgroup label="Despesas">
          {categories
            .filter((c) => c.type === "expense")
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </optgroup>
        <optgroup label="Receitas">
          {categories
            .filter((c) => c.type === "income")
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </optgroup>
      </Select>
      <Select
        aria-label="Tipo"
        value={params.get("type") ?? ""}
        onChange={(e) => update({ type: e.target.value })}
      >
        <option value="">Todos os tipos</option>
        <option value="income">Receitas</option>
        <option value="expense">Despesas</option>
      </Select>
      {hasFilters && (
        <Button
          variant="ghost"
          onClick={() => {
            setQ("");
            update({ category: "", type: "", q: "" });
          }}
        >
          <X className="h-4 w-4" /> Limpar
        </Button>
      )}
    </div>
  );
}
