// Verifica que la importación de PRODUCCIÓN no perdió nada: compara lo que el JSON
// debía crear (mismas reglas que el importador) contra las órdenes/cotizaciones en
// la BD. Reporta faltantes y sale con código ≠ 0 si algo esperado no está.
//
// Uso:  node scripts/verificar-import-produccion.mjs <ruta-json> [--include-cobrado]

import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { planificarProduccion, flagsDeArgs } from "./lib-trello.mjs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const flags = flagsDeArgs(args);
if (!file) { console.error("Falta la ruta al JSON de Trello."); process.exit(1); }

async function main() {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const { plan, totalActivas, omitidas, enArchivadas } = planificarProduccion(data, flags);

  const db = new PrismaClient();
  let cots, ordenes;
  try {
    cots = await db.cotizacion.findMany({ select: { titulo: true, refCotizacion: true } });
    ordenes = await db.orden.count();
  } finally {
    await db.$disconnect();
  }
  const refs = new Set(cots.map((c) => c.refCotizacion).filter(Boolean));
  const titulos = new Set(cots.map((c) => c.titulo));

  const faltantes = plan.filter((p) => (p.ref ? !refs.has(p.ref) : !titulos.has(p.titulo)));

  console.log(`Tablero: ${data.name}`);
  console.log("── Cobertura del tablero ──");
  console.log(`  Tarjetas en listas activas: ${totalActivas}`);
  console.log(`  A crear (por regla):        ${plan.length}`);
  console.log(`  Omitidas (histórico):       ${omitidas}`);
  if (enArchivadas) console.log(`  En listas archivadas:       ${enArchivadas}`);
  console.log(`  Comprobación de conteo:     ${plan.length + omitidas === totalActivas ? "✓ cuadra" : "✗ DESCUADRE"}`);
  console.log("── Contraste con la base de datos ──");
  console.log(`  Órdenes en la BD:           ${ordenes}`);
  console.log(`  Esperadas presentes:        ${plan.length - faltantes.length} / ${plan.length}`);

  if (faltantes.length) {
    console.log(`\n✗ FALTAN ${faltantes.length} órdenes esperadas:`);
    for (const p of faltantes.slice(0, 50)) console.log(`   - ${p.ref ? "[" + p.ref + "] " : ""}${p.titulo}`);
    if (faltantes.length > 50) console.log(`   … y ${faltantes.length - 50} más`);
    process.exit(2);
  }
  console.log("\n✅ Todo lo esperado está en la base de datos. Nada se perdió en el proceso.");
}

main().catch((e) => { console.error("FALLO:", e.message); process.exit(1); });
