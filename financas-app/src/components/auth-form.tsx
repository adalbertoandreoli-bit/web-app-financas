"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { credentialsSchema, type Credentials } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

function translateError(message: string) {
  if (/invalid login credentials/i.test(message)) return "E-mail ou senha incorretos.";
  if (/already registered/i.test(message)) return "Este e-mail já está cadastrado.";
  if (/email not confirmed/i.test(message)) return "Confirme seu e-mail antes de entrar.";
  if (/password/i.test(message)) return "A senha deve ter ao menos 6 caracteres.";
  return "Não foi possível concluir. Tente novamente.";
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isLogin = mode === "login";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Credentials>({ resolver: zodResolver(credentialsSchema) });

  async function onSubmit({ email, password }: Credentials) {
    setLoading(true);
    const supabase = createClient();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/dashboard");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          router.replace("/dashboard");
          router.refresh();
        } else {
          toast.success("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
        }
      }
    } catch (e) {
      toast.error(translateError(e instanceof Error ? e.message : ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="flex items-center justify-center gap-2 text-lg font-semibold">
          <Wallet className="h-6 w-6 text-primary" /> Gestor Financeiro Pessoal
        </Link>
        <Card>
          <CardContent className="space-y-5 p-6">
            <div>
              <h1 className="text-xl font-semibold">{isLogin ? "Entrar" : "Criar conta"}</h1>
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Acesse suas finanças." : "Comece a organizar seu dinheiro."}
              </p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" autoComplete="email" {...register("email")} />
                {errors.email && <p className="text-xs text-expense">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-expense">{errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar conta"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "Ainda não tem conta? " : "Já tem conta? "}
              <Link
                href={isLogin ? "/cadastro" : "/login"}
                className="font-medium text-primary hover:underline"
              >
                {isLogin ? "Criar conta" : "Entrar"}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
