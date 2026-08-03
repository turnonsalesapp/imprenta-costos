import { listarComentarios } from "@/lib/comentarios";
import { listarAdjuntos } from "@/lib/adjuntos";
import { HiloTrabajo, type ComentarioUI, type AdjuntoUI } from "./HiloTrabajo";

/**
 * Envoltura de servidor del hilo del trabajo: carga comentarios y adjuntos de la
 * cotización y los pasa (con fechas ya formateadas, para no arriesgar desajustes
 * de hidratación) al componente cliente. Se monta tanto en el detalle de la
 * cotización (ADMIN/VENDEDOR) como en el de la orden en el taller (todos los
 * roles). El hilo NO contiene precios: seguro para el TALLER.
 */

function fmtFecha(d: Date): string {
  return (
    d.toLocaleDateString("es-VE") +
    " " +
    d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })
  );
}

export async function Hilo({
  cotizacionId,
  usuario,
}: {
  cotizacionId: string;
  usuario: { id: string; rol: string };
}) {
  const [comentariosRaw, adjuntosRaw] = await Promise.all([
    listarComentarios(cotizacionId),
    listarAdjuntos(cotizacionId),
  ]);

  const comentarios: ComentarioUI[] = comentariosRaw.map((c) => ({
    id: c.id,
    autorId: c.autorId,
    autorNombre: c.autorNombre,
    texto: c.texto,
    fecha: fmtFecha(c.creadoEn),
  }));

  const adjuntos: AdjuntoUI[] = adjuntosRaw.map((a) => ({
    id: a.id,
    autorId: a.autorId,
    autorNombre: a.autorNombre,
    nombre: a.nombre,
    tipo: a.tipo,
    tamano: a.tamano,
    fecha: fmtFecha(a.creadoEn),
  }));

  return (
    <HiloTrabajo
      cotizacionId={cotizacionId}
      usuario={usuario}
      comentarios={comentarios}
      adjuntos={adjuntos}
    />
  );
}
