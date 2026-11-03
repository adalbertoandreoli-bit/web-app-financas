import type { Transaction } from "@/types";
import { formatDate } from "./format";

/** Evita injeção de fórmula em planilhas e escapa aspas/separador. */
function cell(value: string) {
  let v = value;
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  if (/[";\n\r]/.test(v)) v = `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function buildCsv(rows: Transaction[]) {
  const header = ["data", "descricao", "tipo", "categoria", "valor"];
  const lines = rows.map((t) =>
    [
      formatDate(t.date),
      cell(t.description),
      t.type === "income" ? "Receita" : "Despesa",
      cell(t.categories?.name ?? ""),
      t.amount.toFixed(2).replace(".", ","),
    ].join(";"),
  );
  // BOM para o Excel reconhecer UTF-8
  return "﻿" + [header.join(";"), ...lines].join("\r\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
