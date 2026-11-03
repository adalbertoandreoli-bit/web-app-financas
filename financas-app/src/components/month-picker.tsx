"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

export function MonthPicker({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function onChange(next: string) {
    if (!next) return;
    const sp = new URLSearchParams(params.toString());
    sp.set("month", next);
    router.replace(`${pathname}?${sp.toString()}`);
  }

  return (
    <Input
      type="month"
      aria-label="Mês de referência"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full sm:w-44"
    />
  );
}
