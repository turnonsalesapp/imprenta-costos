// Importa el tablero de Trello "CRM Seguimiento Comercial" como Oportunidades
// (Prospectos) del sistema. Solo textos (nombre, descripción, lista→estado).
//
// Uso:
//   node scripts/importar-trello-crm.mjs <ruta-al-json>            # dry-run (no escribe)
//   node scripts/importar-trello-crm.mjs <ruta-al-json> --apply    # aplica en la BD
//   Flags: --include-perdidos  --include-done  --include-clientes
//
// Requiere DATABASE_URL en el entorno (la misma de la app). Es idempotente:
// omite prospectos cuyo nombre ya exista.

import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const APPLY = args.includes("--apply");
const INCLUDE_PERDIDOS = args.includes("--include-perdidos");
const INCLUDE_DONE = args.includes("--include-done");
const INCLUDE_CLIENTES = args.includes("--include-clientes");

if (!file) {
  console.error("Falta la ruta al JSON de Trello. Ej: node scripts/importar-trello-crm.mjs board.json --apply");
  process.exit(1);
}

/** Decide el estado del prospecto según el nombre de la lista de Trello. Devuelve
 *  null para omitir esa lista. */
function estadoDeLista(nombreLista) {
  const l = nombreLista.toLowerCase();
  if (l.includes("perdido")) return INCLUDE_PERDIDOS ? "DESCARTADO" : null;
  if (l.includes("done")) return INCLUDE_DONE ? "CONVERTIDO" : null;
  if (l.includes("cliente")) return INCLUDE_CLIENTES ? "NUEVO" : null;
  if (l.includes("proceso") || l.includes("pendiente")) return "CONTACTADO";
  if (l.includes("to do") || l.includes("agendar") || l.includes("reunion")) return "NUEVO";
  return "NUEVO"; // cualquier otra lista activa
}

/** Limpia el título de la tarjeta y le quita un número inicial ("167-…"). El
 *  nombre de las tarjetas es inconsistente (cliente a veces al inicio, a veces al
 *  final), así que NO se intenta adivinar el cliente: se guarda el título completo
 *  y clienteNombre queda para editar a mano. */
function parseNombre(raw) {
  let limpio = (raw || "").replace(/\s+/g, " ").trim();
  limpio = limpio.replace(/^\d+\s*-\s*/, ""); // quita "167-" inicial
  return { nombre: limpio || "(sin título)", clienteNombre: null };
}

async function main() {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const listasPorId = new Map(
    (data.lists || []).filter((l) => !l.closed).map((l) => [l.id, l.name]),
  );
  const cards = (data.cards || []).filter((c) => !c.closed && listasPorId.has(c.idList));

  const plan = [];
  const omitidasPorLista = {};
  for (const c of cards) {
    const lista = listasPorId.get(c.idList);
    const estado = estadoDeLista(lista);
    if (!estado) { omitidasPorLista[lista] = (omitidasPorLista[lista] || 0) + 1; continue; }
    const { nombre, clienteNombre } = parseNombre(c.name);
    const detalle = (c.desc || "").trim().slice(0, 2000) || null;
    plan.push({ nombre, clienteNombre, detalle, estado, lista });
  }

  console.log(`Tablero: ${data.name}`);
  console.log(`Tarjetas activas en listas consideradas: ${plan.length}`);
  const porEstado = {};
  for (const p of plan) porEstado[p.estado] = (porEstado[p.estado] || 0) + 1;
  console.log("Por estado:", JSON.stringify(porEstado));
  if (Object.keys(omitidasPorLista).length) {
    console.log("Listas omitidas (usa --include-*):", JSON.stringify(omitidasPorLista));
  }
  console.log("Ejemplos:");
  for (const p of plan.slice(0, 5)) console.log(`  [${p.estado}] ${p.nombre}${p.clienteNombre ? " · " + p.clienteNombre : ""}`);

  if (!APPLY) {
    console.log("\n(DRY-RUN) No se escribió nada. Añade --apply para crear las oportunidades.");
    return;
  }

  const db = new PrismaClient();
  let creados = 0, omitidos = 0;
  try {
    for (const p of plan) {
      const existe = await db.prospecto.findFirst({ where: { nombre: p.nombre }, select: { id: true } });
      if (existe) { omitidos++; continue; }
      await db.prospecto.create({
        data: { nombre: p.nombre, clienteNombre: p.clienteNombre, detalle: p.detalle, estado: p.estado },
      });
      creados++;
    }
  } finally {
    await db.$disconnect();
  }
  console.log(`\n✅ Aplicado: ${creados} oportunidades creadas, ${omitidos} omitidas (ya existían).`);
}

main().catch((e) => { console.error("FALLO:", e.message); process.exit(1); });
