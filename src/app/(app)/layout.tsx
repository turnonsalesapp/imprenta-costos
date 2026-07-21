import { requireUsuario } from "@/lib/auth";
import { Nav } from "@/app/_components/Nav";

/**
 * Layout de todo lo que va detrás del login. `requireUsuario()` es la guardia
 * central: cualquier página bajo este grupo exige sesión válida y, si no la
 * hay, redirige a /login antes de renderizar nada.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const usuario = await requireUsuario();

  return (
    <div className="min-h-screen">
      <Nav usuario={usuario} />
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  );
}
