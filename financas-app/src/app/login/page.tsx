import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Entrar — Finanças Pessoais" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
