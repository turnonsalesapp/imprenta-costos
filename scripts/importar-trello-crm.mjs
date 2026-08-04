// Importa el tablero de Trello "CRM Seguimiento Comercial" como Oportunidades
// (Prospectos). Solo textos (nombre, descripción, lista→estado).
//
// Uso:
//   node scripts/importar-trello-crm.mjs <ruta-json>            # dry-run (no escribe)
//   node scripts/importar-trello-crm.mjs <ruta-json> --apply    # aplica en la BD
//   Flags: --include-perdidos  --include-done  --include-clientes
//
// Requiere DATABASE_URL. Idempotente: omite prospectos cuyo nombre ya exista.

import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { planificar, flagsDeArgs } from "./lib-trello.mjs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const APPLY = args.includes("--apply");
const flags = flagsDeArgs(args);

if (!file) {
  console.error("Falta la ruta al JSON de Trello.");
  process.exit(1);
}

async function main() {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const { plan, porLista, totalActivas, omitidas, enArchivadas } = planificar(data, flags);

  console.log(`Tablero: ${data.name}`);
  console.log("Reconciliación por lista (toda tarjeta se cuenta):");
  for (const [nombre, i] of [...porLista.entries()].sort((a, b) => b[1].total - a[1].total)) {
    console.log(`  ${nombre.padEnd(42)} [${String(i.total).padStart(4)}]  ${i.estado ? "→ importa a " + i.estado : "OMITIDA (regla; usa --include-*)"}`);
  }
  if (enArchivadas) console.log(`  (en listas archivadas: ${enArchivadas} — no se importan)`);
  console.log(`Total en listas activas: ${totalActivas}  =  a importar ${plan.length}  +  omitidas ${omitidas}`);
  console.log(`Comprobación: ${plan.length + omitidas === totalActivas ? "✓ cuadra" : "✗ DESCUADRE"}`);

  if (!APPLY) {
    console.log("\n(DRY-RUN) No se escribió nada. Añade --apply para crear las oportunidades.");
    return;
  }

  const db = new PrismaClient();
  let creados = 0, duplicados = 0;
  try {
    for (const p of plan) {
      const existe = await db.prospecto.findFirst({ where: { nombre: p.nombre }, select: { id: true } });
      if (existe) { duplicados++; continue; }
      await db.prospecto.create({
        data: { nombre: p.nombre, clienteNombre: p.clienteNombre, detalle: p.detalle, estado: p.estado },
      });
      creados++;
    }
  } finally {
    await db.$disconnect();
  }
  console.log(`\n✅ Aplicado: ${creados} creadas, ${duplicados} ya existían. Esperadas: ${plan.length}.`);
  console.log(`Verifica con: node scripts/verificar-import-trello.mjs ${file}${flags.perdidos ? " --include-perdidos" : ""}${flags.done ? " --include-done" : ""}${flags.clientes ? " --include-clientes" : ""}`);
}

main().catch((e) => { console.error("FALLO:", e.message); process.exit(1); });
