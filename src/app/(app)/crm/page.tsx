import type { ActividadTipo } from "@prisma/client";
import { requireRol } from "@/lib/auth";
import {
  listarProspectos, proximasActividades,
  ACTIVIDAD_TIPOS, ETIQUETA_ACTIVIDAD,
} from "@/lib/crm";
import { crearProspectoAction, crearActividadAction } from "@/app/actions/crm";
import { PageHeader, SectionTitle, EmptyState } from "@/app/_components/ui";
import { TableroProspectos } from "./TableroProspectos";
import { ActividadHecha } from "./ActividadHecha";

export const dynamic = "force-dynamic";

// Badge por tipo de actividad, dentro de la paleta de estatus del sistema.
const BADGE_TIPO: Record<ActividadTipo, string> = {
  REUNION: "bg-[#E6F4F8] text-cian",
  LLAMADA: "bg-suave text-kraft",
  SEGUIMIENTO: "bg-[#FFF9E6] text-[#5C4A00]",
  NOTA: "bg-suave text-kraft",
};

const campo =
  "mt-1 block w-full rounded-sm border border-regla bg-hoja px-3 py-2 text-base outline-none focus:border-cian sm:text-sm";
const rotulo = "text-[10px] font-bold uppercase tracking-widest text-kraft";

// Envoltorios que descartan el `{ error }` para satisfacer el tipo de <form
// action> (void). La validación y la revalidación las hace la acción real; con
// nombre obligatorio inválido simplemente no se crea nada y la vista se recarga.
async function crearProspectoForm(formData: FormData) {
  "use server";
  await crearProspectoAction(formData);
}

async function crearActividadForm(formData: FormData) {
  "use server";
  await crearActividadAction(formData);
}

export default async function CrmPage() {
  await requireRol("ADMIN", "VENDEDOR");

  const prospectos = await listarProspectos();
  const actividades = await proximasActividades();

  const filasTablero = prospectos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    clienteNombre: p.clienteNombre,
    contacto: p.contacto,
    detalle: p.detalle,
    estado: p.estado,
  }));

  // Remonta el tablero cuando cambia el conjunto de prospectos (crear/eliminar),
  // pero no al mover un estado (los ids no cambian), preservando el optimismo.
  const tableroKey = prospectos.map((p) => p.id).slice().sort().join("|");

  return (
    <>
      <PageHeader title="CRM" eyebrow="Prospectos y actividades" />

      {/* Nuevo prospecto */}
      <section className="mt-8">
        <SectionTitle>Nuevo prospecto</SectionTitle>
        <form action={crearProspectoForm} className="rounded-sm border border-regla bg-hoja p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={rotulo}>Oportunidad</span>
              <input
                name="nombre"
                required
                placeholder="Nombre de la oportunidad"
                className={campo}
              />
            </label>
            <label className="block">
              <span className={rotulo}>Cliente</span>
              <input name="clienteNombre" placeholder="Empresa o persona" className={campo} />
            </label>
            <label className="block">
              <span className={rotulo}>Contacto</span>
              <input name="contacto" placeholder="Correo o teléfono" className={campo} />
            </label>
            <label className="block sm:col-span-2">
              <span className={rotulo}>Detalle</span>
              <textarea
                name="detalle"
                rows={2}
                placeholder="Qué necesita, presupuesto estimado, notas…"
                className={campo}
              />
            </label>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              className="rounded-sm bg-tinta px-4 py-2 text-sm font-bold text-hoja hover:opacity-90"
            >
              Agregar prospecto
            </button>
          </div>
        </form>
      </section>

      {/* Tablero de prospectos */}
      <section className="mt-8">
        <SectionTitle>Tablero de prospectos</SectionTitle>
        {prospectos.length === 0 ? (
          <EmptyState title="Aún no hay prospectos">
            Crea el primero con el formulario de arriba.
          </EmptyState>
        ) : (
          <TableroProspectos key={tableroKey} filasIniciales={filasTablero} />
        )}
      </section>

      {/* Actividades */}
      <section className="mt-8">
        <SectionTitle>Actividades</SectionTitle>
        <form action={crearActividadForm} className="rounded-sm border border-regla bg-hoja p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={rotulo}>Tipo</span>
              <select name="tipo" defaultValue="REUNION" className={campo}>
                {ACTIVIDAD_TIPOS.map((t) => (
                  <option key={t} value={t}>{ETIQUETA_ACTIVIDAD[t]}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={rotulo}>Fecha</span>
              <input type="datetime-local" name="fecha" className={campo} />
            </label>
            <label className="block sm:col-span-2">
              <span className={rotulo}>Título</span>
              <input
                name="titulo"
                required
                placeholder="Llamar para confirmar arte"
                className={campo}
              />
            </label>
            <label className="block">
              <span className={rotulo}>Cliente</span>
              <input name="clienteNombre" placeholder="Empresa o persona" className={campo} />
            </label>
            <label className="block">
              <span className={rotulo}>Notas</span>
              <input name="notas" placeholder="Detalle breve" className={campo} />
            </label>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              className="rounded-sm bg-tinta px-4 py-2 text-sm font-bold text-hoja hover:opacity-90"
            >
              Agendar actividad
            </button>
          </div>
        </form>

        {actividades.length === 0 ? (
          <EmptyState title="No hay actividades pendientes">
            Agenda una reunión, llamada o seguimiento con el formulario de arriba.
          </EmptyState>
        ) : (
          <ul className="mt-4 space-y-3">
            {actividades.map((a) => (
              <li key={a.id} className="rounded-sm border border-regla bg-hoja p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-block rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${BADGE_TIPO[a.tipo]}`}
                      >
                        {ETIQUETA_ACTIVIDAD[a.tipo]}
                      </span>
                      {a.fecha && (
                        <span className="font-mono text-[11px] text-kraft">
                          {a.fecha.toLocaleString("es-VE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm font-medium">{a.titulo}</div>
                    {a.clienteNombre && (
                      <div className="mt-0.5 text-[11px] text-kraft">{a.clienteNombre}</div>
                    )}
                    {a.notas && (
                      <p className="mt-1 text-[11px] leading-relaxed text-kraft">{a.notas}</p>
                    )}
                  </div>
                  <ActividadHecha id={a.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
