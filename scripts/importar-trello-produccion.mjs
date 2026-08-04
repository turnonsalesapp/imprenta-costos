// Importa el tablero de Trello "Producción AP": crea una ORDEN (en proceso) por
// cada tarjeta activa. Como una orden del sistema necesita una cotización, se crea
// una cotización "cascarón" (estado GANADA, montos en 0) que lleva la referencia a
// tu sistema paralelo de cotización (refCotizacion) y una pieza en el estado que
// corresponde a la lista de Trello.
//
// Uso:
//   node scripts/importar-trello-produccion.mjs <ruta-json>            # dry-run
//   node scripts/importar-trello-produccion.mjs <ruta-json> --apply    # crea
//   Flag: --include-cobrado   (también trae el histórico "Cobrado")
//
// Requiere DATABASE_URL. Idempotente: omite si ya existe una cotización con la
// misma referencia (o el mismo título cuando no hay referencia).

import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { planificarProduccion, flagsDeArgs } from "./lib-trello.mjs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const APPLY = args.includes("--apply");
const flags = flagsDeArgs(args);

if (!file) { console.error("Falta la ruta al JSON de Trello."); process.exit(1); }

async function main() {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const { plan, porLista, totalActivas, omitidas, enArchivadas } = planificarProduccion(data, flags);

  console.log(`Tablero: ${data.name}`);
  console.log("Reconciliación por lista (toda tarjeta se cuenta):");
  for (const [nombre, i] of [...porLista.entries()].sort((a, b) => b[1].total - a[1].total)) {
    console.log(`  ${nombre.slice(0, 44).padEnd(44)} [${String(i.total).padStart(4)}]  ${i.map ? `→ orden ${i.map.orden}/${i.map.pieza}${i.map.cobro !== "NO_FACTURADO" ? " (" + i.map.cobro + ")" : ""}` : "OMITIDA (histórico; usa --include-cobrado)"}`);
  }
  if (enArchivadas) console.log(`  (en listas archivadas: ${enArchivadas} — no se importan)`);
  console.log(`Total en listas activas: ${totalActivas}  =  a crear ${plan.length}  +  omitidas ${omitidas}`);
  console.log(`Comprobación: ${plan.length + omitidas === totalActivas ? "✓ cuadra" : "✗ DESCUADRE"}`);

  if (!APPLY) {
    console.log("\n(DRY-RUN) No se escribió nada. Añade --apply para crear las órdenes.");
    return;
  }

  const db = new PrismaClient();
  let creados = 0, duplicados = 0;
  try {
    for (const p of plan) {
      // Idempotencia: por referencia externa si la hay; si no, por título.
      const dup = await db.cotizacion.findFirst({
        where: p.ref ? { refCotizacion: p.ref } : { titulo: p.titulo },
        select: { id: true },
      });
      if (dup) { duplicados++; continue; }

      await db.$transaction(async (tx) => {
        const cot = await tx.cotizacion.create({
          data: {
            estado: "GANADA", tipo: p.tipo, titulo: p.titulo,
            cantidad: 1, ancho: 0, alto: 0, tamano: "", papelNombre: "", capacidad: 0,
            entrada: {}, snapshot: {}, lineas: [],
            pliegos: 0, costoTotal: 0, costoUnit: 0, diferencial: 0, margen: 0,
            precioUnit: 0, ventaTotal: 0, precioML: 0, tasaBCV: 0, precioBs: 0,
            refCotizacion: p.ref, notas: p.notas,
          },
          select: { id: true },
        });
        const orden = await tx.orden.create({
          data: {
            cotizacionId: cot.id, estado: p.orden, estadoCobro: p.cobro, items: [],
            fechaFactura: p.cobro !== "NO_FACTURADO" ? new Date() : null,
            fechaCobro: p.cobro === "COBRADO" ? new Date() : null,
            cerradaEn: p.orden === "ENTREGADA" ? new Date() : null,
          },
          select: { id: true },
        });
        await tx.piezaOrden.create({
          data: {
            ordenId: orden.id, carril: p.carril, tipo: p.tipo, titulo: p.titulo,
            cantidad: 1, estado: p.pieza, orden: 0,
            proveedorNombre: p.carril === "TERCERIZADO" ? "(por definir)" : null,
            snapshot: {},
          },
        });
      });
      creados++;
    }
  } finally {
    await db.$disconnect();
  }
  console.log(`\n✅ Aplicado: ${creados} órdenes creadas, ${duplicados} ya existían. Esperadas: ${plan.length}.`);
  console.log(`Verifica con: node scripts/verificar-import-produccion.mjs ${file}${flags.cobrado ? " --include-cobrado" : ""}`);
}

main().catch((e) => { console.error("FALLO:", e.message); process.exit(1); });
