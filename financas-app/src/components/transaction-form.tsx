"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/format";
import { transactionSchema, type TransactionInput } from "@/lib/validations";
import { cn } from "@/lib/utils";
import type { Category, Transaction } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  transaction?: Transaction | null;
}

const empty = (): TransactionInput => ({
  description: "",
  amount: undefined as unknown as number,
  date: todayISO(),
  type: "expense",
  category_id: "",
});

export function TransactionForm({ open, onOpenChange, categories, transaction }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const editing = !!transaction;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: empty(),
  });

  useEffect(() => {
    if (!open) return;
    reset(
      transaction
        ? {
            description: transaction.description,
            amount: transaction.amount,
            date: transaction.date,
            type: transaction.type,
            category_id: transaction.category_id,
          }
        : empty(),
    );
  }, [open, transaction, reset]);

  const type = watch("type");
  const available = categories.filter((c) => c.type === type);

  function changeType(next: "income" | "expense") {
    setValue("type", next);
    setValue("category_id", "");
  }

  async function onSubmit(values: TransactionInput) {
    setSaving(true);
    const supabase = createClient();
    const payload = { ...values, description: values.description.trim() };

    const { error } = editing
      ? await supabase.from("transactions").update(payload).eq("id", transaction!.id)
      : await supabase.from("transactions").insert(payload);

    setSaving(false);
    if (error) {
      toast.error("Não foi possível salvar a transação.");
      return;
    }
    toast.success(editing ? "Transação atualizada." : "Transação criada.");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div>
          <DialogTitle className="text-lg font-semibold">
            {editing ? "Editar transação" : "Nova transação"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Preencha os dados da movimentação.
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => changeType(t)}
                className={cn(
                  "h-9 rounded-md text-sm font-medium transition-colors",
                  type === t
                    ? t === "income"
                      ? "bg-income text-white"
                      : "bg-expense text-white"
                    : "text-muted-foreground",
                )}
              >
                {t === "income" ? "Receita" : "Despesa"}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" maxLength={100} {...register("description")} />
            {errors.description && <p className="text-xs text-expense">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && <p className="text-xs text-expense">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-expense">{errors.date.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category_id">Categoria</Label>
            <Select id="category_id" {...register("category_id")}>
              <option value="">Selecione...</option>
              {available.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {errors.category_id && <p className="text-xs text-expense">{errors.category_id.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
