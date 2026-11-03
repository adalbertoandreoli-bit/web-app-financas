import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Criar conta — Finanças Pessoais" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
