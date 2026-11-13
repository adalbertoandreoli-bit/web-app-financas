"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { TxType } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CategoryForm } from "@/components/category-form";

export interface CategoryWithUsage {
  id: string;
  name: string;
  type: TxType;
  color: string;
  usage: number;
}

const groups: { type: TxType; title: string }[] = [
  { type: "expense", title: "Categorias de despesa" },
  { type: "income", title: "Categorias de receita" },
];

export function CategoriesView({ categories }: { categories: CategoryWithUsage[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryWithUsage | null>(null);
  const [deleting, setDeleting] = useState<CategoryWithUsage | null>(null);
  const [busy, setBusy] = useState(false);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(c: CategoryWithUsage) {
    setEditing(c);
    setFormOpen(true);
  }

  /** Reconsulta o uso no banco (a contagem da tela pode estar desatualizada). */
  async function countUsage(id: string) {
    const { count, error } = await createClient()
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);
    return error ? null : (count ?? 0);
  }

  async function requestDelete(c: CategoryWithUsage) {
    const used = await countUsage(c.id);
    if (used === null) {
      toast.error("Não foi possível verificar o uso da categoria.");
      return;
    }
    if (used > 0) {
      toast.error(
        `"${c.name}" está em uso por ${used} transação(ões) e não pode ser excluída. Reclassifique ou exclua essas transações primeiro.`,
      );
      router.refresh();
      return;
    }
    setDeleting(c);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    const used = await countUsage(deleting.id);
    if (used !== 0) {
      setBusy(false);
      setDeleting(null);
      toast.error("Esta categoria está em uso e não pode ser excluída.");
      router.refresh();
      return;
    }
    const { error } = await createClient().from("categories").delete().eq("id", deleting.id);
    setBusy(false);
    if (error) {
      toast.error(
        error.code === "23503"
          ? "Esta categoria está em uso e não pode ser excluída."
          : "Não foi possível excluir a categoria.",
      );
      return;
    }
    toast.success("Categoria excluída.");
    setDeleting(null);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nova categoria
        </Button>
      </div>

      {groups.map(({ type, title }) => {
        const items = categories.filter((c) => c.type === type);
        return (
          <Card key={type}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma categoria. Clique em &ldquo;Nova categoria&rdquo; para criar.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.usage === 0
                              ? "Sem transações"
                              : `${c.usage} transaç${c.usage === 1 ? "ão" : "ões"}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="icon" aria-label={`Editar ${c.name}`} onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label={`Excluir ${c.name}`} onClick={() => requestDelete(c)}>
                          <Trash2 className="h-4 w-4 text-expense" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}

      <CategoryForm open={formOpen} onOpenChange={setFormOpen} category={editing} />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <div>
            <DialogTitle className="text-lg font-semibold">Excluir categoria?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              &ldquo;{deleting?.name}&rdquo; não tem transações e será removida permanentemente.
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
