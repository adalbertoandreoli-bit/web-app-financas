"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { buildCsv, downloadCsv } from "@/lib/csv";
import { formatBRL, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Category, Transaction } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transaction-form";

interface Props {
  transactions: Transaction[];
  categories: Category[];
  month: string;
  hasFilters: boolean;
  openNew: boolean;
  filters: React.ReactNode;
}

function Amount({ t }: { t: Transaction }) {
  return (
    <span className={cn("font-semibold", t.type === "income" ? "text-income" : "text-expense")}>
      {t.type === "income" ? "+" : "−"} {formatBRL(t.amount)}
    </span>
  );
}

export function TransactionsView({ transactions, categories, month, hasFilters, openNew, filters }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(openNew);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [busy, setBusy] = useState(false);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(t: Transaction) {
    setEditing(t);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    const { error } = await createClient().from("transactions").delete().eq("id", deleting.id);
    setBusy(false);
    if (error) {
      toast.error("Não foi possível excluir a transação.");
      return;
    }
    toast.success("Transação excluída.");
    setDeleting(null);
    router.refresh();
  }

  function exportCsv() {
    downloadCsv(`transacoes-${month}.csv`, buildCsv(transactions));
  }

  const actions = (t: Transaction) => (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => openEdit(t)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => setDeleting(t)}>
        <Trash2 className="h-4 w-4 text-expense" />
      </Button>
    </div>
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Transações</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={transactions.length === 0}>
            <Download className="h-4 w-4" /> <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nova
          </Button>
        </div>
      </div>

      {filters}

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-muted-foreground">
              {hasFilters
                ? "Nenhuma transação encontrada com esses filtros."
                : "Nenhuma transação neste mês."}
            </p>
            {!hasFilters && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Adicionar transação
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop: tabela */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 text-right font-medium">Valor</th>
                  <th className="w-24 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(t.date)}</td>
                    <td className="px-4 py-3">{t.description}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.categories?.color }} />
                        {t.categories?.name}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Amount t={t} />
                    </td>
                    <td className="px-4 py-2">{actions(t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile: cards */}
          <ul className="space-y-3 md:hidden">
            {transactions.map((t) => (
              <li key={t.id}>
                <Card>
                  <CardContent className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-medium">{t.description}</p>
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.categories?.color }} />
                        {t.categories?.name} · {formatDate(t.date)}
                      </p>
                      <Amount t={t} />
                    </div>
                    {actions(t)}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={categories}
        transaction={editing}
      />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <div>
            <DialogTitle className="text-lg font-semibold">Excluir transação?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              &ldquo;{deleting?.description}&rdquo; será removida permanentemente.
            </DialogDescription>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={busy}>
              {busy ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
