import { z } from "zod";

export const transactionSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Informe a descrição")
    .max(100, "Máximo de 100 caracteres"),
  amount: z
    .number({ invalid_type_error: "Informe o valor" })
    .positive("O valor deve ser maior que zero")
    .max(9999999999, "Valor muito alto"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data"),
  type: z.enum(["income", "expense"]),
  category_id: z.string().min(1, "Selecione a categoria"),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export const credentialsSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});

export type Credentials = z.infer<typeof credentialsSchema>;
