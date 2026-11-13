"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { categorySchema, type CategoryInput } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CategoryWithUsage } from "@/components/categories-view";

const PRESETS = [
  "#f97316", "#ef4444", "#ec4899", "#8b5cf6", "#3b82f6",
  "#06b6d4", "#16a34a", "#84cc16", "#eab308", "#64748b",
];

const empty: CategoryInput = { name: "", type: "expense", color: "#3b82f6" };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryWithUsage | null;
}

export function CategoryForm({ open, onOpenChange, category }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const editing = !!category;
  const typeLocked = editing && category.usage > 0;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryInput>({ resolver: zodResolver(categorySchema), defaultValues: empty });

  useEffect(() => {
    if (!open) return;
    reset(category ? { name: category.name, type: category.type, color: category.color } : empty);
  }, [open, category, reset]);

  const type = watch("type");
  const color = watch("color");

  async function onSubmit(values: CategoryInput) {
    setSaving(true);
    const supabase = createClient();
    const payload = { ...values, name: values.name.trim() };

    const { error } = editing
      ? await supabase.from("categories").update(payload).eq("id", category!.id)
      : await supabase.from("categories").insert(payload);

    setSaving(false);
    if (error) {
      toast.error(
        error.code === "23505"
          ? "Já existe uma categoria com esse nome e tipo."
          : "Não foi possível salvar a categoria.",
      );
      return;
    }
    toast.success(editing ? "Categoria atualizada." : "Categoria criada.");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div>
          <DialogTitle className="text-lg font-semibold">
            {editing ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Defina o nome, o tipo e a cor usada nos gráficos.
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={typeLocked}
                  onClick={() => setValue("type", t)}
                  className={cn(
                    "h-9 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
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
            {typeLocked && (
              <p className="text-xs text-muted-foreground">
                O tipo não pode ser alterado: há {category!.usage} transação(ões) usando esta categoria.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" maxLength={40} {...register("name")} />
            {errors.name && <p className="text-xs text-expense">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="color">Cor</Label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Cor ${c}`}
                  onClick={() => setValue("color", c)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2",
                    color.toLowerCase() === c ? "border-foreground" : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                id="color"
                type="color"
                aria-label="Escolher outra cor"
                className="h-8 w-10 cursor-pointer rounded border border-border bg-card"
                {...register("color")}
              />
            </div>
            {errors.color && <p className="text-xs text-expense">{errors.color.message}</p>}
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
