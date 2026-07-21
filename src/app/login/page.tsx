import { redirect } from "next/navigation";
import { getUsuario } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getUsuario()) redirect("/");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <div className="flex h-1.5 overflow-hidden rounded-sm">
        <i className="flex-1 bg-cian" />
        <i className="flex-1 bg-magenta" />
        <i className="flex-1 bg-amarillo" />
        <i className="flex-1 bg-tinta" />
      </div>

      <h1 className="mt-6 text-xl font-bold tracking-tight">
        Costos y precios de producción
      </h1>
      <p className="mt-1 text-xs uppercase tracking-widest text-kraft">
        Entrar al sistema
      </p>

      <LoginForm />
    </main>
  );
}
