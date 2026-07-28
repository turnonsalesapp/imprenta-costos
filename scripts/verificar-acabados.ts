/**
 * Verifica (y opcionalmente restaura) los acabados base del sistema.
 *
 * La app NO borra acabados: el botón "Quitar" solo los desactiva (activo=false),
 * y siguen apareciendo en Variables con opción de "Activar". Si un acabado base
 * (p. ej. "Impresión Tiro") desapareció por completo de la lista, fue borrado a
 * mano en la base. Este script detecta cuáles de los acabados base faltan y los
 * puede recrear sin tocar los que ya existen (ni sus precios editados).
 *
 * Compara por `clave` contra ACABADOS_BASE (la carga inicial canónica).
 *
 * USO:
 *   # Solo diagnóstico (no cambia nada):
 *   npx tsx scripts/verificar-acabados.ts
 *
 *   # Restaurar los que falten (recrea únicamente los borrados):
 *   npx tsx scripts/verificar-acabados.ts --restaurar
 *
 *   # Además reactivar los que estén "quitados" (activo=false):
 *   npx tsx scripts/verificar-acabados.ts --restaurar --reactivar
 */
import { PrismaClient } from "@prisma/client";
import { ACABADOS_BASE } from "../src/lib/datos-base";

const db = new PrismaClient();
const args = process.argv.slice(2);
const RESTAURAR = args.includes("--restaurar");
const REACTIVAR = args.includes("--reactivar");

async function main() {
  const enBase = await db.acabado.findMany({ select: { clave: true, label: true, activo: true } });
  const porClave = new Map(enBase.map((a) => [a.clave, a]));

  const faltantes = ACABADOS_BASE.filter((a) => !porClave.has(a.id));
  const inactivos = ACABADOS_BASE.filter((a) => porClave.get(a.id)?.activo === false);

  console.log("─".repeat(64));
  console.log("Verificación de acabados base");
  console.log(`  En la base .............. ${enBase.length}`);
  console.log(`  Definidos como base ..... ${ACABADOS_BASE.length}`);
  console.log("─".repeat(64));

  if (!faltantes.length) {
    console.log("✓ No falta ningún acabado base (ninguno fue borrado).");
  } else {
    console.log(`✗ Faltan ${faltantes.length} acabado(s) base (borrados de la base):`);
    for (const a of faltantes) {
      console.log(`   · ${a.label}  [${a.id}]  ${a.modulo ?? "digital"}`);
    }
  }

  if (inactivos.length) {
    console.log(`\n• ${inactivos.length} acabado(s) base están "quitados" (activo=false), no borrados:`);
    for (const a of inactivos) console.log(`   · ${a.label}  [${a.id}]`);
  }

  if (!RESTAURAR) {
    console.log("\nDiagnóstico solamente. Para recrear los borrados:");
    console.log("  npx tsx scripts/verificar-acabados.ts --restaurar");
    return;
  }

  // Restaurar: recrear los faltantes con sus valores base. `orden` = posición en
  // ACABADOS_BASE, para que queden en el mismo sitio. No se tocan los existentes.
  let recreados = 0;
  for (const [i, a] of ACABADOS_BASE.entries()) {
    if (porClave.has(a.id)) continue;
    await db.acabado.create({
      data: {
        clave: a.id, label: a.label, costo: a.costo, unidad: a.unidad, escala: a.escala,
        orden: i, grupo: a.grupo ?? null, modulo: a.modulo ?? "digital",
      },
    });
    recreados++;
  }

  let reactivados = 0;
  if (REACTIVAR && inactivos.length) {
    const r = await db.acabado.updateMany({
      where: { clave: { in: inactivos.map((a) => a.id) } },
      data: { activo: true },
    });
    reactivados = r.count;
  }

  console.log(`\n✓ Restaurados ${recreados} acabado(s) borrado(s).`);
  if (REACTIVAR) console.log(`✓ Reactivados ${reactivados} acabado(s) que estaban quitados.`);
  console.log("  (Los acabados que ya existían no se modificaron.)");
}

main()
  .catch((e) => { console.error("✗ Error:", e); process.exitCode = 1; })
  .finally(async () => { await db.$disconnect(); });
