// Lógica compartida para importar/verificar tableros de Trello. La usan
// importar-trello-crm.mjs y verificar-import-trello.mjs para que las reglas de
// mapeo sean idénticas (si difieren, la verificación no valdría).

/** Estado de prospecto según el nombre de la lista de Trello, o null para omitir.
 *  `flags` = { perdidos, done, clientes } habilita listas normalmente excluidas. */
export function estadoDeLista(nombreLista, flags = {}) {
  const l = (nombreLista || "").toLowerCase();
  if (l.includes("perdido")) return flags.perdidos ? "DESCARTADO" : null;
  if (l.includes("done")) return flags.done ? "CONVERTIDO" : null;
  // Listas del pipeline (se evalúan ANTES que "cliente", porque algunos nombres
  // incluyen "…a Cliente" sin ser la lista de Clientes).
  if (l.includes("proceso") || l.includes("pendiente") || l.includes("enviar")) return "CONTACTADO";
  if (l.includes("to do") || l.includes("agendar") || l.includes("reunion")) return "NUEVO";
  if (l.includes("cliente")) return flags.clientes ? "NUEVO" : null; // la lista "Clientes"
  return "NUEVO"; // cualquier otra lista activa
}

/** Limpia el título de la tarjeta (quita "167-" inicial). No adivina el cliente
 *  (el formato de las tarjetas es inconsistente). */
export function parseNombre(raw) {
  let limpio = (raw || "").replace(/\s+/g, " ").trim();
  limpio = limpio.replace(/^\d+\s*-\s*/, "");
  return { nombre: limpio || "(sin título)", clienteNombre: null };
}

/**
 * Clasifica TODAS las tarjetas del tablero (reconciliación: nada queda sin
 * contar). Devuelve el plan a importar, el desglose por lista y los totales.
 */
export function planificar(data, flags = {}) {
  const listasActivas = (data.lists || []).filter((l) => !l.closed);
  const nombrePorId = new Map(listasActivas.map((l) => [l.id, l.name]));
  const cards = (data.cards || []).filter((c) => !c.closed);

  const porLista = new Map(); // nombre -> { total, estado|null }
  for (const l of listasActivas) porLista.set(l.name, { total: 0, estado: estadoDeLista(l.name, flags) });

  let enArchivadas = 0;
  const plan = [];
  for (const c of cards) {
    const nombreLista = nombrePorId.get(c.idList);
    if (!nombreLista) { enArchivadas++; continue; }
    const info = porLista.get(nombreLista);
    info.total++;
    if (info.estado) {
      const { nombre, clienteNombre } = parseNombre(c.name);
      plan.push({ nombre, clienteNombre, detalle: (c.desc || "").trim().slice(0, 2000) || null, estado: info.estado });
    }
  }

  const totalActivas = [...porLista.values()].reduce((n, i) => n + i.total, 0);
  return { plan, porLista, totalActivas, omitidas: totalActivas - plan.length, enArchivadas };
}

/** Mapea una lista del tablero de PRODUCCIÓN a estados del sistema, o null para
 *  omitir (histórico "Cobrado", salvo flags.cobrado). */
export function mapProduccion(nombreLista, flags = {}) {
  const l = (nombreLista || "").toLowerCase();
  if (l.includes("cobrado")) {
    return flags.cobrado ? { carril: "INTERNO", tipo: "PROPIA", pieza: "ENTREGADO", orden: "ENTREGADA", cobro: "COBRADO" } : null;
  }
  // Tercerizado (compras). "comprado" antes que "compra" para no confundir listas.
  if (l.includes("comprado")) return { carril: "TERCERIZADO", tipo: "PROVEEDOR", pieza: "COMPRADO", orden: "EN_PROCESO", cobro: "NO_FACTURADO" };
  if (l.includes("recibido")) return { carril: "TERCERIZADO", tipo: "PROVEEDOR", pieza: "RECIBIDO", orden: "EN_PROCESO", cobro: "NO_FACTURADO" };
  if (l.includes("proveedor") || l.includes("coordinaci")) return { carril: "TERCERIZADO", tipo: "PROVEEDOR", pieza: "POR_COTIZAR", orden: "EN_PROCESO", cobro: "NO_FACTURADO" };
  // Interno (taller).
  if (l.includes("ganado")) return { carril: "INTERNO", tipo: "PROPIA", pieza: "EN_COLA", orden: "PENDIENTE", cobro: "NO_FACTURADO" };
  if (l.includes("inicio")) return { carril: "INTERNO", tipo: "PROPIA", pieza: "EN_DISENO", orden: "EN_PROCESO", cobro: "NO_FACTURADO" };
  if (l.includes("esperando arte") || l.includes("diseño de arte")) return { carril: "INTERNO", tipo: "PROPIA", pieza: "ESPERANDO_ARTE", orden: "EN_PROCESO", cobro: "NO_FACTURADO" };
  if (l.includes("impresi") || l.includes("plancha") || l.includes("artes enviados")) return { carril: "INTERNO", tipo: "PROPIA", pieza: "EN_IMPRESION", orden: "EN_PROCESO", cobro: "NO_FACTURADO" };
  if (l.includes("troquel") || l.includes("pegado") || l.includes("armado") || l.includes("empaquetado")) return { carril: "INTERNO", tipo: "PROPIA", pieza: "EN_ACABADO", orden: "EN_PROCESO", cobro: "NO_FACTURADO" };
  if (l.includes("facturado")) return { carril: "INTERNO", tipo: "PROPIA", pieza: "LISTA", orden: "ENTREGADA", cobro: "FACTURADO" };
  if (l.includes("entregado")) return { carril: "INTERNO", tipo: "PROPIA", pieza: "ENTREGADO", orden: "ENTREGADA", cobro: "NO_FACTURADO" };
  return { carril: "INTERNO", tipo: "PROPIA", pieza: "EN_COLA", orden: "EN_PROCESO", cobro: "NO_FACTURADO" };
}

/** Extrae una referencia de cotización externa del nombre de la tarjeta
 *  (p. ej. "AP-2025-00815"), o el número de tarjeta inicial, o null. */
export function refExterna(name) {
  const m = (name || "").match(/[A-Z]{2,4}-\d{4}-\d{2,6}/i);
  if (m) return m[0].toUpperCase();
  const n = (name || "").match(/^(\d{2,6})\s*-/);
  return n ? n[1] : null;
}

/** Planifica la importación del tablero de PRODUCCIÓN (una orden por tarjeta). */
export function planificarProduccion(data, flags = {}) {
  const listasActivas = (data.lists || []).filter((l) => !l.closed);
  const nombrePorId = new Map(listasActivas.map((l) => [l.id, l.name]));
  const cards = (data.cards || []).filter((c) => !c.closed);

  const porLista = new Map();
  for (const l of listasActivas) porLista.set(l.name, { total: 0, map: mapProduccion(l.name, flags) });

  let enArchivadas = 0;
  const plan = [];
  for (const c of cards) {
    const nombreLista = nombrePorId.get(c.idList);
    if (!nombreLista) { enArchivadas++; continue; }
    const info = porLista.get(nombreLista);
    info.total++;
    if (info.map) {
      const titulo = (c.name || "(sin título)").replace(/\s+/g, " ").trim();
      plan.push({ titulo, ref: refExterna(c.name), notas: (c.desc || "").trim().slice(0, 2000) || null, ...info.map, lista: nombreLista });
    }
  }
  const totalActivas = [...porLista.values()].reduce((n, i) => n + i.total, 0);
  return { plan, porLista, totalActivas, omitidas: totalActivas - plan.length, enArchivadas };
}

/** Lee los flags --include-* de process.argv. */
export function flagsDeArgs(args) {
  return {
    perdidos: args.includes("--include-perdidos"),
    done: args.includes("--include-done"),
    clientes: args.includes("--include-clientes"),
    cobrado: args.includes("--include-cobrado"),
  };
}
