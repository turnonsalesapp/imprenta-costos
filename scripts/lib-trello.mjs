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

/** Lee los flags --include-* de process.argv. */
export function flagsDeArgs(args) {
  return {
    perdidos: args.includes("--include-perdidos"),
    done: args.includes("--include-done"),
    clientes: args.includes("--include-clientes"),
  };
}
