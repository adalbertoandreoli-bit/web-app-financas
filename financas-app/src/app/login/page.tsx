import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Entrar — Gestor Financeiro Pessoal" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
