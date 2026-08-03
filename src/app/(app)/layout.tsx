import { requireUsuario } from "@/lib/auth";
import { Nav } from "@/app/_components/Nav";
import { Tour } from "@/app/_components/Tour";
import { PASOS_INICIO } from "@/app/_components/tours";

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
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      <Tour id="inicio" autoAbrir pasos={PASOS_INICIO} />
    </div>
  );
}
