// Verifica que la importación del CRM de Trello no perdió nada: compara lo que el
// JSON DEBÍA importar (mismas reglas que el importador) contra lo que quedó en la
// BD (prospectos). Reporta faltantes y coincidencias. Sale con código ≠ 0 si algo
// esperado no está en la BD.
//
// Uso:
//   node scripts/verificar-import-trello.mjs <ruta-json> [--include-perdidos ...]
//
// Requiere DATABASE_URL. Usa los MISMOS flags con que corriste el importador.

import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { planificar, flagsDeArgs } from "./lib-trello.mjs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const flags = flagsDeArgs(args);

if (!file) { console.error("Falta la ruta al JSON de Trello."); process.exit(1); }

async function main() {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const { plan, totalActivas, omitidas, enArchivadas } = planificar(data, flags);

  // Nombres esperados (los que el importador crearía). Se deduplican porque el
  // importador también omite duplicados por nombre.
  const esperados = [...new Set(plan.map((p) => p.nombre))];

  const db = new PrismaClient();
  let enBD;
  try {
    const filas = await db.prospecto.findMany({ select: { nombre: true } });
    enBD = new Set(filas.map((f) => f.nombre));
  } finally {
    await db.$disconnect();
  }

  const faltantes = esperados.filter((n) => !enBD.has(n));

  console.log(`Tablero: ${data.name}`);
  console.log("── Cobertura del tablero (nada sin contar) ──");
  console.log(`  Tarjetas en listas activas: ${totalActivas}`);
  console.log(`  A importar (por regla):     ${plan.length}   (nombres únicos: ${esperados.length})`);
  console.log(`  Omitidas por regla:         ${omitidas}`);
  if (enArchivadas) console.log(`  En listas archivadas:       ${enArchivadas} (no aplican)`);
  console.log(`  Comprobación de conteo:     ${plan.length + omitidas === totalActivas ? "✓ cuadra" : "✗ DESCUADRE"}`);
  console.log("── Contraste con la base de datos ──");
  console.log(`  Esperados presentes en BD:  ${esperados.length - faltantes.length} / ${esperados.length}`);

  if (faltantes.length) {
    console.log(`\n✗ FALTAN ${faltantes.length} en la BD (esperadas pero no importadas):`);
    for (const n of faltantes.slice(0, 50)) console.log(`   - ${n}`);
    if (faltantes.length > 50) console.log(`   … y ${faltantes.length - 50} más`);
    console.log("\nRevisa: ¿corriste el importador con --apply y los MISMOS flags? ¿hubo un error a mitad?");
    process.exit(2);
  }

  console.log("\n✅ Todo lo esperado está en la base de datos. Nada se perdió en el proceso.");
}

main().catch((e) => { console.error("FALLO:", e.message); process.exit(1); });
