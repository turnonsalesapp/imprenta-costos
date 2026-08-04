// Reseteo de datos TRANSACCIONALES antes de importar en limpio.
//
// BORRA:   cotizaciones (y en cascada sus órdenes, piezas, etapas, comentarios y
//          adjuntos), oportunidades (prospectos) y actividades del CRM.
// CONSERVA: catálogo (papeles, acabados, materiales, proveedores y sus precios),
//          configuración, membrete, usuarios, clientes, trabajos e inventario.
//
// Uso:
//   node scripts/reset-transaccional.mjs           # DRY-RUN: solo muestra conteos
//   node scripts/reset-transaccional.mjs --apply   # BORRA de verdad
//   Flags extra: --incluir-clientes  --incluir-trabajos
//
// Requiere DATABASE_URL (la misma de la app). IRREVERSIBLE: haz un respaldo antes
// si tienes datos que te importen.

import { PrismaClient } from "@prisma/client";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const INCLUIR_CLIENTES = args.includes("--incluir-clientes");
const INCLUIR_TRABAJOS = args.includes("--incluir-trabajos");

const db = new PrismaClient();

async function main() {
  // Conteos actuales (lo que se vería afectado).
  const [cot, ord, piezas, prospectos, actividades, comentarios, adjuntos, clientes, trabajos] =
    await Promise.all([
      db.cotizacion.count(),
      db.orden.count(),
      db.piezaOrden.count(),
      db.prospecto.count(),
      db.actividad.count(),
      db.comentario.count(),
      db.adjunto.count(),
      db.cliente.count(),
      db.trabajo.count(),
    ]);

  console.log("Datos actuales:");
  console.log(`  Cotizaciones:   ${cot}  (→ órdenes ${ord}, piezas ${piezas}, comentarios ${comentarios}, adjuntos ${adjuntos})`);
  console.log(`  Oportunidades:  ${prospectos}  (prospectos)`);
  console.log(`  Actividades:    ${actividades}`);
  console.log(`  Clientes:       ${clientes}  ${INCLUIR_CLIENTES ? "(SE BORRAN)" : "(se conservan)"}`);
  console.log(`  Trabajos:       ${trabajos}  ${INCLUIR_TRABAJOS ? "(SE BORRAN)" : "(se conservan)"}`);
  console.log("  Catálogo / config / usuarios / inventario: SE CONSERVAN");

  if (!APPLY) {
    console.log("\n(DRY-RUN) No se borró nada. Añade --apply para ejecutar el reseteo.");
    return;
  }

  console.log("\nBorrando…");
  // Cotizacion cascada: Orden → Etapa/Pieza, y Comentario/Adjunto de la cotización.
  const rCot = await db.cotizacion.deleteMany();
  const rPros = await db.prospecto.deleteMany();
  const rAct = await db.actividad.deleteMany();
  let rCli = { count: 0 }, rTra = { count: 0 };
  if (INCLUIR_TRABAJOS) rTra = await db.trabajo.deleteMany();
  if (INCLUIR_CLIENTES) rCli = await db.cliente.deleteMany();

  console.log(`✅ Borrado: ${rCot.count} cotizaciones (+ cascada), ${rPros.count} oportunidades, ${rAct.count} actividades`
    + (INCLUIR_TRABAJOS ? `, ${rTra.count} trabajos` : "")
    + (INCLUIR_CLIENTES ? `, ${rCli.count} clientes` : "") + ".");
  console.log("Nota: el inventario (stock y movimientos) NO se tocó.");
}

main()
  .catch((e) => { console.error("FALLO:", e.message); process.exit(1); })
  .finally(() => db.$disconnect());
