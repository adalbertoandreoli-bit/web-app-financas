import Link from "next/link";
import { BarChart3, Download, Filter, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  { icon: Wallet, title: "Receitas e despesas", text: "Registre cada movimentação em segundos e mantenha tudo em um só lugar." },
  { icon: BarChart3, title: "Dashboard visual", text: "Receita, despesa e saldo do mês, com gráfico por categoria." },
  { icon: Filter, title: "Filtros e busca", text: "Encontre qualquer transação por mês, categoria ou descrição." },
  { icon: Download, title: "Exportar CSV", text: "Leve suas transações filtradas para o Excel ou Google Planilhas." },
  { icon: Smartphone, title: "Feito para o celular", text: "Layout responsivo: use no computador ou no bolso." },
  { icon: ShieldCheck, title: "Seus dados, só seus", text: "Autenticação segura e isolamento total entre usuários." },
];

export default async function LandingPage() {
  let loggedIn = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    loggedIn = !!data.user;
  } catch {
    loggedIn = false;
  }

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <span className="flex items-center gap-2 font-semibold">
          <Wallet className="h-6 w-6 text-primary" /> Gestor Financeiro Pessoal
        </span>
        <nav className="flex items-center gap-2">
          {loggedIn ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Ir para o dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/cadastro">Criar conta</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Suas finanças, <span className="text-primary">simples e visuais</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Chega de planilhas e extratos espalhados. Veja para onde seu dinheiro vai e planeje
            com clareza.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="default" className="h-11 px-6">
              <Link href={loggedIn ? "/dashboard" : "/cadastro"}>
                {loggedIn ? "Abrir meu dashboard" : "Começar grátis"}
              </Link>
            </Button>
            {!loggedIn && (
              <Button asChild variant="outline" className="h-11 px-6">
                <Link href="/login">Já tenho conta</Link>
              </Button>
            )}
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <CardContent className="space-y-2 p-5">
                <Icon className="h-6 w-6 text-primary" />
                <h2 className="font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Gestor Financeiro Pessoal
      </footer>
    </div>
  );
}
