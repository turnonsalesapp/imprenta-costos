/**
 * Lógica PURA (sin BD) para interpretar los tableros de Trello exportados y
 * planificar su importación. La usan las acciones de la página de Migración.
 * Equivale a scripts/lib-trello.mjs, en TypeScript para el lado servidor.
 */

export type CrmFlags = { perdidos?: boolean; done?: boolean; clientes?: boolean };
export type ProdFlags = { cobrado?: boolean };
export type EstadoProspecto = "NUEVO" | "CONTACTADO" | "CONVERTIDO" | "DESCARTADO";

type TrelloList = { id: string; name: string; closed?: boolean };
type TrelloCard = { idList: string; name?: string; desc?: string; closed?: boolean };
export type TrelloBoard = { name?: string; lists?: TrelloList[]; cards?: TrelloCard[] };

export type FilaLista = { nombre: string; total: number; accion: string };
export type Reconciliacion = {
  tablero: string;
  listas: FilaLista[];
  totalActivas: number;
  aCrear: number;
  omitidas: number;
  enArchivadas: number;
  cuadra: boolean;
};

// ─────────────────────────── CRM → Oportunidades ───────────────────────────

export function estadoDeLista(nombreLista: string, flags: CrmFlags = {}): EstadoProspecto | null {
  const l = (nombreLista || "").toLowerCase();
  if (l.includes("perdido")) return flags.perdidos ? "DESCARTADO" : null;
  if (l.includes("done")) return flags.done ? "CONVERTIDO" : null;
  if (l.includes("proceso") || l.includes("pendiente") || l.includes("enviar")) return "CONTACTADO";
  if (l.includes("to do") || l.includes("agendar") || l.includes("reunion")) return "NUEVO";
  if (l.includes("cliente")) return flags.clientes ? "NUEVO" : null;
  return "NUEVO";
}

export function limpiarNombre(raw?: string): string {
  const limpio = (raw || "").replace(/\s+/g, " ").trim().replace(/^\d+\s*-\s*/, "");
  return limpio || "(sin título)";
}

export type FilaCrm = { nombre: string; detalle: string | null; estado: EstadoProspecto };

export function planificarCrm(
  data: TrelloBoard, flags: CrmFlags = {},
): { plan: FilaCrm[]; recon: Reconciliacion } {
  const listas = (data.lists || []).filter((l) => !l.closed);
  const nombrePorId = new Map(listas.map((l) => [l.id, l.name]));
  const cards = (data.cards || []).filter((c) => !c.closed);
  const porLista = new Map<string, { total: number; estado: EstadoProspecto | null }>();
  for (const l of listas) porLista.set(l.name, { total: 0, estado: estadoDeLista(l.name, flags) });

  let enArchivadas = 0;
  const plan: FilaCrm[] = [];
  for (const c of cards) {
    const nombreLista = nombrePorId.get(c.idList);
    if (!nombreLista) { enArchivadas++; continue; }
    const info = porLista.get(nombreLista)!;
    info.total++;
    if (info.estado) {
      plan.push({ nombre: limpiarNombre(c.name), detalle: (c.desc || "").trim().slice(0, 2000) || null, estado: info.estado });
    }
  }
  return { plan, recon: recon(data, porLista, plan.length, enArchivadas, (i) => i.estado ? `Importa a ${i.estado}` : "Omitida (regla)") };
}

// ─────────────────────────── Producción → Órdenes ───────────────────────────

export type MapProd = {
  carril: "INTERNO" | "TERCERIZADO"; tipo: string;
  pieza: string; orden: string; cobro: string;
};

export function mapProduccion(nombreLista: string, flags: ProdFlags = {}): MapProd | null {
  const l = (nombreLista || "").toLowerCase();
  if (l.includes("cobrado")) return flags.cobrado ? { carril: "INTERNO", tipo: "PROPIA", pieza: "ENTREGADO", orden: "ENTREGADA", cobro: "COBRADO" } : null;
  if (l.includes("comprado")) return { carril: "TERCERIZADO", tipo: "PROVEEDOR", pieza: "COMPRADO", orden: "EN_PROCESO", cobro: "NO_FACTURADO" };
  if (l.includes("recibido")) return { carril: "TERCERIZADO", tipo: "PROVEEDOR", pieza: "RECIBIDO", orden: "EN_PROCESO", cobro: "NO_FACTURADO" };
  if (l.includes("proveedor") || l.includes("coordinaci")) return { carril: "TERCERIZADO", tipo: "PROVEEDOR", pieza: "POR_COTIZAR", orden: "EN_PROCESO", cobro: "NO_FACTURADO" };
  if (l.includes("ganado")) return { carril: "INTERNO", tipo: "PROPIA", pieza: "EN_COLA", orden: "PENDIENTE", cobro: "NO_FACTURADO" };
  if (l.includes("inicio")) return { carril: "INTERNO", tipo: "PROPIA", pieza: "EN_DISENO", orden: "EN_PROCESO", cobro: "NO_FACTURADO" };
  if (l.includes("esperando arte") || l.includes("diseño de arte")) return { carril: "INTERNO", tipo: "PROPIA", pieza: "ESPERANDO_ARTE", orden: "EN_PROCESO", cobro: "NO_FACTURADO" };
  if (l.includes("impresi") || l.includes("plancha") || l.includes("artes enviados")) return { carril: "INTERNO", tipo: "PROPIA", pieza: "EN_IMPRESION", orden: "EN_PROCESO", cobro: "NO_FACTURADO" };
  if (l.includes("troquel") || l.includes("pegado") || l.includes("armado") || l.includes("empaquetado")) return { carril: "INTERNO", tipo: "PROPIA", pieza: "EN_ACABADO", orden: "EN_PROCESO", cobro: "NO_FACTURADO" };
  if (l.includes("facturado")) return { carril: "INTERNO", tipo: "PROPIA", pieza: "LISTA", orden: "ENTREGADA", cobro: "FACTURADO" };
  if (l.includes("entregado")) return { carril: "INTERNO", tipo: "PROPIA", pieza: "ENTREGADO", orden: "ENTREGADA", cobro: "NO_FACTURADO" };
  return { carril: "INTERNO", tipo: "PROPIA", pieza: "EN_COLA", orden: "EN_PROCESO", cobro: "NO_FACTURADO" };
}

export function refExterna(name?: string): string | null {
  const m = (name || "").match(/[A-Z]{2,4}-\d{4}-\d{2,6}/i);
  if (m) return m[0].toUpperCase();
  const n = (name || "").match(/^(\d{2,6})\s*-/);
  return n ? n[1] : null;
}

export type FilaProd = MapProd & { titulo: string; ref: string | null; notas: string | null };

export function planificarProduccion(
  data: TrelloBoard, flags: ProdFlags = {},
): { plan: FilaProd[]; recon: Reconciliacion } {
  const listas = (data.lists || []).filter((l) => !l.closed);
  const nombrePorId = new Map(listas.map((l) => [l.id, l.name]));
  const cards = (data.cards || []).filter((c) => !c.closed);
  const porLista = new Map<string, { total: number; map: MapProd | null }>();
  for (const l of listas) porLista.set(l.name, { total: 0, map: mapProduccion(l.name, flags) });

  let enArchivadas = 0;
  const plan: FilaProd[] = [];
  for (const c of cards) {
    const nombreLista = nombrePorId.get(c.idList);
    if (!nombreLista) { enArchivadas++; continue; }
    const info = porLista.get(nombreLista)!;
    info.total++;
    if (info.map) {
      plan.push({ ...info.map, titulo: limpiarNombre(c.name), ref: refExterna(c.name), notas: (c.desc || "").trim().slice(0, 2000) || null });
    }
  }
  return { plan, recon: recon(data, porLista, plan.length, enArchivadas, (i) => i.map ? `Orden ${i.map.orden}/${i.map.pieza}` : "Omitida (histórico)") };
}

// ─────────────────────────── util reconciliación ───────────────────────────

function recon<T extends { total: number }>(
  data: TrelloBoard,
  porLista: Map<string, T>,
  aCrear: number,
  enArchivadas: number,
  accion: (i: T) => string,
): Reconciliacion {
  const listas = [...porLista.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .map(([nombre, i]) => ({ nombre, total: i.total, accion: accion(i) }));
  const totalActivas = listas.reduce((n, l) => n + l.total, 0);
  const omitidas = totalActivas - aCrear;
  return { tablero: data.name || "(tablero)", listas, totalActivas, aCrear, omitidas, enArchivadas, cuadra: aCrear + omitidas === totalActivas };
}
