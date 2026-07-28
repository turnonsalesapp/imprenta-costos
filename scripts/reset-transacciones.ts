/**
 * Reinicio de datos transaccionales — deja el ambiente "en cero".
 *
 * BORRA (lo operativo / transaccional):
 *   - Cotizaciones, órdenes de producción y sus etapas
 *   - Movimientos de inventario  (y pone el stock de cada papel en 0)
 *   - Histórico de tasas         (luego siembra UNA fila con las tasas actuales)
 *   - Registro de auditoría
 *   - Reinicia los correlativos (numero) de Cotización y Orden a 1
 *
 * CONSERVA (lo maestro / configuración):
 *   - Config (variables del negocio, membrete, tasas actuales)
 *   - Papeles, acabados, materiales GF, productos GF, productos POP, equipos
 *   - Usuarios y sesiones
 *   - Clientes y trabajos repetidos   (salvo --incluir-clientes)
 *
 * SEGURIDAD:
 *   - Por defecto es SIMULACIÓN: solo cuenta lo que borraría, no toca nada.
 *   - Para ejecutar de verdad se exigen DOS confirmaciones:
 *       1) la bandera  --ejecutar
 *       2) la variable de entorno  CONFIRMAR_RESET=BORRAR
 *   - Imprime el host de la base a la que apunta DATABASE_URL antes de actuar,
 *     para que confirmes si es producción o desarrollo.
 *
 * USO:
 *   # Simulación (no cambia nada) — apuntando DATABASE_URL a la base deseada:
 *   npx tsx scripts/reset-transacciones.ts
 *
 *   # Ejecutar de verdad:
 *   CONFIRMAR_RESET=BORRAR npx tsx scripts/reset-transacciones.ts --ejecutar
 *
 *   # También borrar clientes y trabajos repetidos:
 *   CONFIRMAR_RESET=BORRAR npx tsx scripts/reset-transacciones.ts --ejecutar --incluir-clientes
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const args = process.argv.slice(2);
const EJECUTAR = args.includes("--ejecutar");
const INCLUIR_CLIENTES = args.includes("--incluir-clientes");
const CONFIRMADO = process.env.CONFIRMAR_RESET === "BORRAR";

/** Muestra el host de la base (sin credenciales) para confirmar el ambiente. */
function hostDeBase(): string {
  const url = process.env.DATABASE_URL ?? "";
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port || "5432"}${u.pathname}`;
  } catch {
    return "(DATABASE_URL no válida o ausente)";
  }
}

async function contar() {
  const [cot, ord, eta, mov, tasas, aud, cli, trab] = await Promise.all([
    db.cotizacion.count(),
    db.orden.count(),
    db.etapaOrden.count(),
    db.movimientoInventario.count(),
    db.tasa.count(),
    db.registroAuditoria.count(),
    db.cliente.count(),
    db.trabajo.count(),
  ]);
  return { cot, ord, eta, mov, tasas, aud, cli, trab };
}

async function main() {
  console.log("─".repeat(64));
  console.log("Reinicio de datos transaccionales");
  console.log("Base de datos :", hostDeBase());
  console.log("Modo          :", EJECUTAR ? "EJECUTAR (borra datos)" : "SIMULACIÓN (no cambia nada)");
  console.log("Clientes/trab.:", INCLUIR_CLIENTES ? "TAMBIÉN se borran" : "se conservan");
  console.log("─".repeat(64));

  const antes = await contar();
  console.log("Filas actuales:");
  console.log(`  Cotizaciones ............ ${antes.cot}`);
  console.log(`  Órdenes ................. ${antes.ord}`);
  console.log(`  Etapas de orden ......... ${antes.eta}`);
  console.log(`  Movimientos inventario .. ${antes.mov}`);
  console.log(`  Histórico de tasas ...... ${antes.tasas}`);
  console.log(`  Registros de auditoría .. ${antes.aud}`);
  console.log(`  Clientes ................ ${antes.cli}${INCLUIR_CLIENTES ? " (se borran)" : " (se conservan)"}`);
  console.log(`  Trabajos repetidos ...... ${antes.trab}${INCLUIR_CLIENTES ? " (se borran)" : " (se conservan)"}`);
  console.log("─".repeat(64));

  if (!EJECUTAR) {
    console.log("SIMULACIÓN: no se borró nada. Para ejecutar de verdad:");
    console.log("  CONFIRMAR_RESET=BORRAR npx tsx scripts/reset-transacciones.ts --ejecutar");
    return;
  }
  if (!CONFIRMADO) {
    console.error("✗ Falta la confirmación. Repite con la variable de entorno:");
    console.error("  CONFIRMAR_RESET=BORRAR npx tsx scripts/reset-transacciones.ts --ejecutar");
    process.exitCode = 1;
    return;
  }

  await db.$transaction(async (tx) => {
    // Orden de borrado respetando las llaves foráneas.
    await tx.etapaOrden.deleteMany({});
    await tx.orden.deleteMany({});
    await tx.cotizacion.deleteMany({});
    await tx.movimientoInventario.deleteMany({});
    await tx.registroAuditoria.deleteMany({});
    await tx.tasa.deleteMany({});

    // Stock de papel a cero (se conserva el stock mínimo y el catálogo).
    await tx.papel.updateMany({ data: { stock: 0 } });

    if (INCLUIR_CLIENTES) {
      // Trabajos primero (referencian clientes), luego clientes.
      await tx.trabajo.deleteMany({});
      await tx.cliente.deleteMany({});
    }

    // Reiniciar correlativos para que ambos ambientes empiecen en 1.
    await tx.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"Cotizacion"', 'numero'), 1, false)`,
    );
    await tx.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"Orden"', 'numero'), 1, false)`,
    );

    // Sembrar una fila de tasas con los valores actuales de Config, para que la
    // app tenga una línea base de histórico.
    const cfg = await tx.config.findUnique({ where: { id: "global" } });
    if (cfg) {
      await tx.tasa.create({
        data: { bcv: cfg.tasaBCV, binCompra: cfg.binCompra, binVenta: cfg.binVenta },
      });
    }
  });

  const despues = await contar();
  console.log("✓ Listo. Datos transaccionales reiniciados.");
  console.log(`  Cotizaciones ............ ${despues.cot}`);
  console.log(`  Órdenes ................. ${despues.ord}`);
  console.log(`  Movimientos inventario .. ${despues.mov}`);
  console.log(`  Histórico de tasas ...... ${despues.tasas}  (1 = línea base sembrada)`);
  console.log(`  Registros de auditoría .. ${despues.aud}`);
  console.log(`  Clientes ................ ${despues.cli}`);
  console.log(`  Trabajos repetidos ...... ${despues.trab}`);
  console.log("  Stock de papel .......... 0 (en todos)");
}

main()
  .catch((e) => {
    console.error("✗ Error:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
