import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <AppNav email={user.email ?? ""} />
      <main className="mx-auto max-w-5xl px-4 py-6 pb-24 md:ml-60 md:max-w-none md:px-8 md:pb-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
