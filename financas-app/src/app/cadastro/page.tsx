import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Criar conta — Gestor Financeiro Pessoal" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
