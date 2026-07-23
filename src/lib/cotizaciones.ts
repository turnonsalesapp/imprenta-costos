import "server-only";
import { Prisma, type EstadoCotizacion, type TipoCotizacion } from "@prisma/client";
import { db } from "./db";
import { cargarConfig, snapshot } from "./config";
import {
  calcular, precioDesdeCosto, n, type LineaCosto, type Entrada, type Config,
} from "./calculo";
import {
  formAEntrada, totalProveedor, type FormCotizacion, type FormProveedor,
} from "./cotizacion-form";
import { crearTrabajoDesdeForm } from "./trabajos";

/**
 * Guardar, listar y leer cotizaciones.
 *
 * REGLA DE ORO: la cotización es inmutable. Al crearla, el SERVIDOR vuelve a
 * calcular con la configuración de HOY y congela en `snapshot` los papeles,
 * acabados y variables del momento. Nunca se recalcula al leerla: el detalle
 * se muestra desde lo guardado. Si mañana sube el papel, esta no se mueve.
 */

const num = (v: unknown): number => (v == null ? 0 : Number(v));

export const ESTADOS: EstadoCotizacion[] = [
  "BORRADOR",
  "ENVIADA",
  "APROBADA",
  "RECHAZADA",
  "VENCIDA",
];

export const ETIQUETA_ESTADO: Record<EstadoCotizacion, string> = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  VENCIDA: "Vencida",
};

export type ResultadoGuardar =
  | { ok: true; id: string }
  | { ok: false; error: string };

/** Un ítem congelado de la cotización (una cotización puede tener varios). */
export type ItemGuardado = {
  titulo: string;
  descripcion: string | null;
  cantidad: number;
  ancho: number;
  alto: number;
  tamano: string;
  papelNombre: string;
  capacidad: number;
  entrada: Entrada;
  lineas: LineaCosto[];
  pliegos: number;
  costoTotal: number;
  costoUnit: number;
  diferencial: number;
  margen: number;
  precioUnit: number;
  ventaTotal: number;
  precioML: number;
  precioBs: number;
  tasaBCV: number;
};

/** Descripción legible por defecto (qué incluye el ítem), si el usuario no puso una. */
function autoDescripcion(
  papelNombre: string, ancho: number, alto: number, tamano: string, acabados: string[],
): string {
  const partes = [
    ancho > 0 && alto > 0 ? `${ancho}×${alto} mm` : "",
    papelNombre && papelNombre !== "—" ? papelNombre : "",
    tamano,
    acabados.join(", "),
  ].filter(Boolean);
  return partes.join(" · ");
}

/** Calcula y congela UN ítem a partir de su formulario. */
function datosItem(form: FormCotizacion, cfg: Config): { cant: number; item: ItemGuardado } {
  const entrada = formAEntrada(form);
  const r = calcular(entrada, cfg);
  const papel = cfg.papeles.find((p) => p.id === entrada.papelId) ?? null;
  const papelNombre = papel?.nombre ?? "—";
  const acabados = r.lineas.filter((l) => l.k !== "papel").map((l) => l.label);
  const ancho = Math.round(n(form.ancho));
  const alto = Math.round(n(form.alto));
  const descripcion =
    (form.descripcion ?? "").trim() || autoDescripcion(papelNombre, ancho, alto, entrada.tamano, acabados);

  const item: ItemGuardado = {
    titulo: (form.trabajo ?? "").trim() || "Ítem",
    descripcion,
    cantidad: r.cant,
    ancho, alto,
    tamano: entrada.tamano,
    papelNombre,
    capacidad: Math.round(n(form.capacidad)) || 0,
    entrada,
    lineas: r.lineas,
    pliegos: r.pliegos,
    costoTotal: r.costoTotal,
    costoUnit: r.costoUnit,
    diferencial: r.dif,
    margen: num(entrada.margen),
    precioUnit: r.precioUnit,
    ventaTotal: r.ventaTotal,
    precioML: r.precioML,
    precioBs: r.precioBs,
    tasaBCV: num(entrada.tasaBCV),
  };
  return { cant: r.cant, item };
}

/**
 * Construye las columnas de la cotización a partir de sus ítems. La primera
 * entrada del array trae la meta (cliente, título). Las columnas de dinero de
 * nivel cotización son AGREGADOS (suma) para el listado/CSV; el detalle y la
 * impresión iteran `items`. `lineas` guarda la unión de acabados para la orden.
 */
function datosCotizacion(forms: FormCotizacion[], cfg: Config) {
  const calc = forms.map((f) => datosItem(f, cfg));
  const items = calc.map((c) => c.item);
  const meta = forms[0];
  const suma = (sel: (i: ItemGuardado) => number) => items.reduce((s, i) => s + sel(i), 0);

  const cantidad = suma((i) => i.cantidad);
  const costoTotal = suma((i) => i.costoTotal);
  const papeles = [...new Set(items.map((i) => i.papelNombre))];
  const tamanos = [...new Set(items.map((i) => i.tamano))];
  const primero = items[0];

  // Unión de líneas (dedupe por clave) para generar las etapas de la orden.
  const lineasUnion: LineaCosto[] = [];
  const vistos = new Set<string>();
  for (const it of items) for (const l of it.lineas) if (!vistos.has(l.k)) { vistos.add(l.k); lineasUnion.push(l); }

  return {
    cant: cantidad,
    items,
    data: {
      clienteId: meta.clienteId?.trim() || null,
      clienteNombre: (meta.cliente ?? "").trim() || null,
      titulo: (meta.trabajo ?? "").trim() || "Sin título",
      descripcion: items.length === 1 ? primero.descripcion : `${items.length} ítems`,
      cantidad,
      ancho: primero.ancho,
      alto: primero.alto,
      tamano: tamanos.length === 1 ? tamanos[0] : "Varios",
      papelNombre: papeles.length === 1 ? papeles[0] : "Varios",
      capacidad: primero.capacidad,
      entrada: primero.entrada as unknown as Prisma.InputJsonValue,
      snapshot: snapshot(cfg) as unknown as Prisma.InputJsonValue,
      lineas: lineasUnion as unknown as Prisma.InputJsonValue,
      items: items as unknown as Prisma.InputJsonValue,
      pliegos: suma((i) => i.pliegos),
      costoTotal,
      costoUnit: cantidad > 0 ? costoTotal / cantidad : 0,
      diferencial: primero.diferencial,
      margen: primero.margen,
      precioUnit: primero.precioUnit,
      ventaTotal: suma((i) => i.ventaTotal),
      precioML: suma((i) => i.precioML),
      tasaBCV: primero.tasaBCV,
      precioBs: suma((i) => i.precioBs),
    },
  };
}

/** Crea la cotización (uno o varios ítems), recalculando y congelando en el servidor. */
export async function crearCotizacion(
  items: FormCotizacion[],
  usuarioId: string,
): Promise<ResultadoGuardar> {
  if (!items.length) return { ok: false, error: "Agrega al menos un ítem." };
  const meta = items[0];
  const cliente = (meta.cliente ?? "").trim();
  const trabajo = (meta.trabajo ?? "").trim();
  if (!cliente && !trabajo) {
    return { ok: false, error: "Falta el cliente o el nombre del trabajo." };
  }

  const cfg = await cargarConfig();
  const { cant, data } = datosCotizacion(items, cfg);
  if (cant <= 0) return { ok: false, error: "Indica la cantidad de piezas." };

  // Guardar como trabajo repetido solo tiene sentido con un único ítem.
  let trabajoId = meta.trabajoId?.trim() || null;
  if (items.length === 1 && meta.guardarComoTrabajo && !trabajoId) {
    trabajoId = await crearTrabajoDesdeForm(meta, data.clienteId);
  }

  const cot = await db.cotizacion.create({
    data: { estado: "BORRADOR", usuarioId, trabajoId, ...data },
    select: { id: true },
  });
  return { ok: true, id: cot.id };
}

/** Actualiza una cotización, solo si sigue en BORRADOR. Vuelve a congelar. */
export async function actualizarCotizacion(
  id: string,
  items: FormCotizacion[],
): Promise<ResultadoGuardar> {
  const existente = await db.cotizacion.findUnique({ where: { id }, select: { estado: true } });
  if (!existente) return { ok: false, error: "La cotización no existe." };
  if (existente.estado !== "BORRADOR") {
    return { ok: false, error: "Solo se pueden editar cotizaciones en borrador." };
  }
  if (!items.length) return { ok: false, error: "Agrega al menos un ítem." };
  const meta = items[0];
  const cliente = (meta.cliente ?? "").trim();
  const trabajo = (meta.trabajo ?? "").trim();
  if (!cliente && !trabajo) {
    return { ok: false, error: "Falta el cliente o el nombre del trabajo." };
  }

  const cfg = await cargarConfig();
  const { cant, data } = datosCotizacion(items, cfg);
  if (cant <= 0) return { ok: false, error: "Indica la cantidad de piezas." };

  await db.cotizacion.update({ where: { id }, data });
  return { ok: true, id };
}

/** Convierte una `Entrada` guardada en los campos de formulario de un ítem. */
function entradaAForm(
  e: Entrada, extra: { ancho: number; alto: number; capacidad: number; titulo: string; descripcion: string | null },
): FormCotizacion {
  return {
    cliente: "", clienteId: "",
    trabajo: extra.titulo,
    descripcion: extra.descripcion ?? "",
    ancho: extra.ancho || "",
    alto: extra.alto || "",
    capAuto: false,
    trabajoId: "", guardarComoTrabajo: false, editarId: "",
    cantidad: e.cantidad ?? "",
    tamano: e.tamano ?? "1/4 Pliego",
    papelId: e.papelId ?? "",
    capacidad: extra.capacidad || "",
    merma: e.merma ?? "",
    margen: e.margen ?? "",
    comision: e.comision ?? "",
    ml: e.ml ?? "",
    tasaBCV: e.tasaBCV ?? "",
    binCompra: e.binCompra ?? "",
    binVenta: e.binVenta ?? "",
    difManual: e.difManual ?? false,
    dif: e.dif ?? "",
    precioManual: e.precioManual ?? "",
    acabados: e.acabados ?? {},
  };
}

/**
 * Carga una cotización guardada como una lista de formularios-ítem, para
 * duplicarla ("copia") o editarla ("editar", si es borrador). La primera trae la
 * meta (cliente, editarId). Las cotizaciones viejas (sin `items`) dan un ítem.
 */
export async function cargarCotizacionEnForm(
  id: string,
  modo: "copia" | "editar",
): Promise<FormCotizacion[] | null> {
  const c = await db.cotizacion.findUnique({
    where: { id },
    select: {
      entrada: true, items: true, titulo: true, descripcion: true, ancho: true, alto: true,
      tamano: true, capacidad: true, clienteNombre: true, clienteId: true,
    },
  });
  if (!c) return null;

  const guardados = (c.items as unknown as ItemGuardado[] | null) ?? null;
  const base: ItemGuardado[] =
    guardados && guardados.length
      ? guardados
      : [{
          titulo: c.titulo, descripcion: c.descripcion,
          cantidad: 0, ancho: c.ancho, alto: c.alto, tamano: c.tamano,
          papelNombre: "", capacidad: c.capacidad,
          entrada: (c.entrada as unknown as Entrada) ?? ({} as Entrada),
          lineas: [], pliegos: 0, costoTotal: 0, costoUnit: 0, diferencial: 0, margen: 0,
          precioUnit: 0, ventaTotal: 0, precioML: 0, precioBs: 0, tasaBCV: 0,
        }];

  return base.map((it, i) => {
    const titulo = i === 0 && modo === "copia" ? `${it.titulo} (copia)` : it.titulo;
    const form = entradaAForm(it.entrada, {
      ancho: it.ancho, alto: it.alto, capacidad: it.capacidad,
      titulo, descripcion: it.descripcion,
    });
    if (i === 0) {
      form.cliente = c.clienteNombre ?? "";
      form.clienteId = c.clienteId ?? "";
      form.editarId = modo === "editar" ? id : "";
    }
    return form;
  });
}

/* ─────────────────────── cotizaciones de proveedor ─────────────────────── */

function datosProveedor(form: FormProveedor) {
  const cant = Math.max(0, Math.round(n(form.cantidad)));
  const costoTotal = totalProveedor(form);
  const costoUnitario = n(form.costoUnitario);
  const params = {
    margen: form.margen, comision: form.comision, ml: form.ml,
    tasaBCV: form.tasaBCV, binCompra: form.binCompra, binVenta: form.binVenta,
    difManual: form.difManual, dif: form.dif, precioManual: form.precioManual,
  };
  const pr = precioDesdeCosto(costoTotal, cant, params);
  const provNombre = (form.proveedorNombre ?? "").trim() || null;
  const provRef = (form.proveedorRef ?? "").trim() || null;
  const detalle =
    form.costoModo === "unitario" && costoUnitario > 0
      ? `${[provNombre, provRef].filter(Boolean).join(" · ") || "Externo"} · ${cant} × costo unit.`
      : [provNombre, provRef].filter(Boolean).join(" · ") || "Externo";
  const lineas = [{ k: "proveedor", label: "Costo del proveedor", detalle, monto: costoTotal }];
  return {
    pr,
    data: {
      tipo: "PROVEEDOR" as const,
      clienteId: form.clienteId?.trim() || null,
      clienteNombre: (form.cliente ?? "").trim() || null,
      titulo: (form.trabajo ?? "").trim() || "Trabajo de proveedor",
      descripcion: form.descripcion?.trim() || null,
      proveedorNombre: provNombre,
      proveedorRef: provRef,
      proveedorNotas: (form.proveedorNotas ?? "").trim() || null,
      cantidad: pr.cant,
      ancho: 0, alto: 0, tamano: "—",
      papelNombre: provNombre ? `Proveedor: ${provNombre}` : "Proveedor externo",
      capacidad: 0,
      entrada: {
        costoTotal, cantidad: cant, costoModo: form.costoModo, costoUnitario, ...params,
      } as unknown as Prisma.InputJsonValue,
      snapshot: { tipo: "proveedor" } as unknown as Prisma.InputJsonValue,
      lineas: lineas as unknown as Prisma.InputJsonValue,
      pliegos: 0,
      costoTotal: pr.costoTotal, costoUnit: pr.costoUnit, diferencial: pr.dif,
      margen: n(form.margen),
      precioUnit: pr.precioUnit, ventaTotal: pr.ventaTotal, precioML: pr.precioML,
      tasaBCV: n(form.tasaBCV), precioBs: pr.precioBs,
    },
  };
}

export async function crearCotizacionProveedor(
  form: FormProveedor, usuarioId: string,
): Promise<ResultadoGuardar> {
  const cliente = (form.cliente ?? "").trim();
  const trabajo = (form.trabajo ?? "").trim();
  if (!cliente && !trabajo) return { ok: false, error: "Falta el cliente o el trabajo." };
  if (totalProveedor(form) <= 0) return { ok: false, error: "Indica el costo del proveedor." };
  const { pr, data } = datosProveedor(form);
  if (pr.cant <= 0) return { ok: false, error: "Indica la cantidad." };

  const cot = await db.cotizacion.create({
    data: { estado: "BORRADOR", usuarioId, ...data },
    select: { id: true },
  });
  return { ok: true, id: cot.id };
}

export async function actualizarCotizacionProveedor(
  id: string, form: FormProveedor,
): Promise<ResultadoGuardar> {
  const ex = await db.cotizacion.findUnique({ where: { id }, select: { estado: true } });
  if (!ex) return { ok: false, error: "La cotización no existe." };
  if (ex.estado !== "BORRADOR") {
    return { ok: false, error: "Solo se pueden editar cotizaciones en borrador." };
  }
  if (totalProveedor(form) <= 0) return { ok: false, error: "Indica el costo del proveedor." };
  const { pr, data } = datosProveedor(form);
  if (pr.cant <= 0) return { ok: false, error: "Indica la cantidad." };

  await db.cotizacion.update({ where: { id }, data });
  return { ok: true, id };
}

export async function cargarProveedorEnForm(
  id: string, modo: "copia" | "editar",
): Promise<Partial<FormProveedor> | null> {
  const c = await db.cotizacion.findUnique({
    where: { id },
    select: {
      entrada: true, titulo: true, descripcion: true, clienteNombre: true, clienteId: true,
      proveedorNombre: true, proveedorRef: true, proveedorNotas: true,
    },
  });
  if (!c) return null;
  const e = (c.entrada as unknown as Record<string, unknown>) ?? {};
  const v = (k: string) => (e[k] ?? "") as number | string;
  return {
    cliente: c.clienteNombre ?? "",
    clienteId: c.clienteId ?? "",
    trabajo: modo === "copia" ? `${c.titulo} (copia)` : c.titulo,
    descripcion: c.descripcion ?? "",
    proveedorNombre: c.proveedorNombre ?? "",
    proveedorRef: c.proveedorRef ?? "",
    proveedorNotas: c.proveedorNotas ?? "",
    cantidad: v("cantidad"),
    costoModo: e.costoModo === "unitario" ? "unitario" : "total",
    costoTotal: v("costoTotal"),
    costoUnitario: v("costoUnitario"),
    margen: v("margen"), comision: v("comision"), ml: v("ml"),
    tasaBCV: v("tasaBCV"), binCompra: v("binCompra"), binVenta: v("binVenta"),
    difManual: Boolean(e.difManual), dif: v("dif"), precioManual: v("precioManual"),
    editarId: modo === "editar" ? id : "",
  };
}

export type FiltroLista = { q?: string; estado?: EstadoCotizacion | "" };

/** Fila del listado (Decimals ya convertidos a number). */
export type CotizacionFila = {
  id: string;
  numero: number;
  creadaEn: Date;
  estado: EstadoCotizacion;
  tipo: TipoCotizacion;
  clienteNombre: string | null;
  titulo: string;
  papelNombre: string;
  tamano: string;
  cantidad: number;
  costoUnit: number;
  precioUnit: number;
  ventaTotal: number;
  costoTotal: number;
};

export async function listarCotizaciones(f: FiltroLista): Promise<CotizacionFila[]> {
  const filas = await db.cotizacion.findMany({
    where: whereLista(f),
    orderBy: { creadaEn: "desc" },
    select: {
      id: true, numero: true, creadaEn: true, estado: true, tipo: true, clienteNombre: true,
      titulo: true, papelNombre: true, tamano: true, cantidad: true,
      costoUnit: true, precioUnit: true, ventaTotal: true, costoTotal: true,
    },
  });

  return filas.map((c) => ({
    ...c,
    costoUnit: num(c.costoUnit),
    precioUnit: num(c.precioUnit),
    ventaTotal: num(c.ventaTotal),
    costoTotal: num(c.costoTotal),
  }));
}

/** Detalle completo de una cotización guardada, leído tal cual se congeló. */
export type CotizacionDetalle = {
  id: string;
  numero: number;
  creadaEn: Date;
  estado: EstadoCotizacion;
  tipo: TipoCotizacion;
  clienteId: string | null;
  clienteNombre: string | null;
  proveedorNombre: string | null;
  proveedorRef: string | null;
  proveedorNotas: string | null;
  titulo: string;
  descripcion: string | null;
  cantidad: number;
  ancho: number;
  alto: number;
  tamano: string;
  papelNombre: string;
  capacidad: number;
  autor: string | null;
  lineas: LineaCosto[];
  pliegos: number;
  costoTotal: number;
  costoUnit: number;
  diferencial: number;
  margen: number;
  precioUnit: number;
  ventaTotal: number;
  precioML: number;
  tasaBCV: number;
  precioBs: number;
  orden: { id: string; numero: number } | null;
  items: ItemDetalle[];
};

/** Ítem para el detalle/impresión: como el guardado pero sin la `entrada` cruda. */
export type ItemDetalle = Omit<ItemGuardado, "entrada">;

function aItemDetalle(i: ItemGuardado): ItemDetalle {
  return {
    titulo: i.titulo, descripcion: i.descripcion ?? null,
    cantidad: num(i.cantidad), ancho: num(i.ancho), alto: num(i.alto), tamano: i.tamano,
    papelNombre: i.papelNombre, capacidad: num(i.capacidad), pliegos: num(i.pliegos),
    lineas: (i.lineas as LineaCosto[]) ?? [],
    costoTotal: num(i.costoTotal), costoUnit: num(i.costoUnit), diferencial: num(i.diferencial),
    margen: num(i.margen), precioUnit: num(i.precioUnit), ventaTotal: num(i.ventaTotal),
    precioML: num(i.precioML), precioBs: num(i.precioBs), tasaBCV: num(i.tasaBCV),
  };
}

export async function obtenerCotizacion(id: string): Promise<CotizacionDetalle | null> {
  const c = await db.cotizacion.findUnique({
    where: { id },
    include: {
      usuario: { select: { nombre: true } },
      orden: { select: { id: true, numero: true } },
    },
  });
  if (!c) return null;

  // Ítems: los guardados (multi-ítem) o uno sintetizado desde las columnas (viejas).
  const guardados = (c.items as unknown as ItemGuardado[] | null) ?? null;
  const items: ItemDetalle[] =
    guardados && guardados.length
      ? guardados.map(aItemDetalle)
      : [{
          titulo: c.titulo, descripcion: c.descripcion,
          cantidad: c.cantidad, ancho: c.ancho, alto: c.alto, tamano: c.tamano,
          papelNombre: c.papelNombre, capacidad: c.capacidad, pliegos: num(c.pliegos),
          lineas: (c.lineas as unknown as LineaCosto[]) ?? [],
          costoTotal: num(c.costoTotal), costoUnit: num(c.costoUnit), diferencial: num(c.diferencial),
          margen: num(c.margen), precioUnit: num(c.precioUnit), ventaTotal: num(c.ventaTotal),
          precioML: num(c.precioML), precioBs: num(c.precioBs), tasaBCV: num(c.tasaBCV),
        }];

  return {
    items,
    id: c.id,
    numero: c.numero,
    creadaEn: c.creadaEn,
    estado: c.estado,
    tipo: c.tipo,
    clienteId: c.clienteId,
    clienteNombre: c.clienteNombre,
    proveedorNombre: c.proveedorNombre,
    proveedorRef: c.proveedorRef,
    proveedorNotas: c.proveedorNotas,
    titulo: c.titulo,
    descripcion: c.descripcion,
    cantidad: c.cantidad,
    ancho: c.ancho,
    alto: c.alto,
    tamano: c.tamano,
    papelNombre: c.papelNombre,
    capacidad: c.capacidad,
    autor: c.usuario?.nombre ?? null,
    lineas: (c.lineas as unknown as LineaCosto[]) ?? [],
    pliegos: num(c.pliegos),
    costoTotal: num(c.costoTotal),
    costoUnit: num(c.costoUnit),
    diferencial: num(c.diferencial),
    margen: num(c.margen),
    precioUnit: num(c.precioUnit),
    ventaTotal: num(c.ventaTotal),
    precioML: num(c.precioML),
    tasaBCV: num(c.tasaBCV),
    precioBs: num(c.precioBs),
    orden: c.orden,
  };
}

export async function cambiarEstadoCotizacion(
  id: string,
  estado: EstadoCotizacion,
): Promise<void> {
  await db.cotizacion.update({ where: { id }, data: { estado } });
}

/**
 * Borrado inteligente: solo se elimina de verdad lo "sin historia" — una
 * cotización en BORRADOR sin orden. Lo demás se marca Rechazada, no se borra.
 */
export async function eliminarCotizacion(id: string): Promise<ResultadoGuardar> {
  const c = await db.cotizacion.findUnique({
    where: { id },
    select: { estado: true, orden: { select: { id: true } } },
  });
  if (!c) return { ok: false, error: "La cotización no existe." };
  if (c.orden) {
    return { ok: false, error: "Tiene una orden de producción; anúlala primero." };
  }
  if (c.estado !== "BORRADOR") {
    return { ok: false, error: "Solo se borra un borrador; las demás se marcan Rechazada." };
  }
  await db.cotizacion.delete({ where: { id } });
  return { ok: true, id };
}

function whereLista(f: FiltroLista): Prisma.CotizacionWhereInput {
  const where: Prisma.CotizacionWhereInput = {};
  if (f.estado) where.estado = f.estado;
  const q = f.q?.trim();
  if (q) {
    where.OR = [
      { titulo: { contains: q, mode: "insensitive" } },
      { clienteNombre: { contains: q, mode: "insensitive" } },
      { descripcion: { contains: q, mode: "insensitive" } },
      { papelNombre: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export type FilaCsv = {
  creadaEn: Date;
  numero: number;
  estado: EstadoCotizacion;
  clienteNombre: string | null;
  titulo: string;
  descripcion: string | null;
  ancho: number;
  alto: number;
  cantidad: number;
  tamano: string;
  papelNombre: string;
  pliegos: number;
  costoTotal: number;
  costoUnit: number;
  diferencial: number;
  margen: number;
  precioUnit: number;
  ventaTotal: number;
  precioML: number;
  tasaBCV: number;
  precioBs: number;
};

/** Filas completas para exportar a CSV, con Decimals ya en number. */
export async function listarParaCsv(f: FiltroLista): Promise<FilaCsv[]> {
  const filas = await db.cotizacion.findMany({
    where: whereLista(f),
    orderBy: { creadaEn: "desc" },
    select: {
      creadaEn: true, numero: true, estado: true, clienteNombre: true, titulo: true,
      descripcion: true, ancho: true, alto: true, cantidad: true, tamano: true,
      papelNombre: true, pliegos: true, costoTotal: true, costoUnit: true,
      diferencial: true, margen: true, precioUnit: true, ventaTotal: true,
      precioML: true, tasaBCV: true, precioBs: true,
    },
  });

  return filas.map((c) => ({
    ...c,
    pliegos: num(c.pliegos),
    costoTotal: num(c.costoTotal),
    costoUnit: num(c.costoUnit),
    diferencial: num(c.diferencial),
    margen: num(c.margen),
    precioUnit: num(c.precioUnit),
    ventaTotal: num(c.ventaTotal),
    precioML: num(c.precioML),
    tasaBCV: num(c.tasaBCV),
    precioBs: num(c.precioBs),
  }));
}
