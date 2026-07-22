import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { TAMANOS } from "./calculo";

/**
 * Inventario de papel, en PLIEGOS COMPLETOS.
 *
 * Entra: compras que se cargan a mano (ENTRADA) y correcciones (AJUSTE).
 * Sale: al marcar una orden como TERMINADA se descuenta, una sola vez, el papel
 * que consumió (cortes × fracción del tamaño). El stock se guarda denormalizado
 * en Papel.stock y cada movimiento queda registrado para auditoría.
 */

const num = (v: unknown): number => (v == null ? 0 : Number(v));

function frac(tamano: string): number {
  return TAMANOS.find((t) => t.id === tamano)?.frac ?? 0.25;
}

export type FilaInventario = {
  id: string; nombre: string; medida: string; hojas: number; categoria: string;
  stock: number; stockMin: number; bajo: boolean;
};

export async function listarInventario(): Promise<FilaInventario[]> {
  const papeles = await db.papel.findMany({
    where: { activo: true },
    orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
    select: { id: true, nombre: true, medida: true, hojas: true, categoria: true, stock: true, stockMin: true },
  });
  return papeles.map((p) => {
    const stock = num(p.stock);
    const stockMin = num(p.stockMin);
    return {
      id: p.id, nombre: p.nombre, medida: p.medida, hojas: p.hojas, categoria: p.categoria,
      stock, stockMin, bajo: stockMin > 0 && stock <= stockMin,
    };
  });
}

export type Movimiento = {
  id: string; fecha: Date; papel: string; tipo: string;
  cantidad: number; saldo: number; motivo: string | null;
};

export async function movimientosRecientes(limite = 30): Promise<Movimiento[]> {
  const movs = await db.movimientoInventario.findMany({
    orderBy: { fecha: "desc" },
    take: limite,
    include: { papel: { select: { nombre: true } } },
  });
  return movs.map((m) => ({
    id: m.id, fecha: m.fecha, papel: m.papel.nombre, tipo: m.tipo,
    cantidad: num(m.cantidad), saldo: num(m.saldo), motivo: m.motivo,
  }));
}

/**
 * Bloquea la fila del papel dentro de la transacción (`SELECT ... FOR UPDATE`)
 * y devuelve su stock actual. Serializa lecturas-y-escrituras concurrentes del
 * mismo papel para que no se pisen (no leer un stock viejo y escribir encima).
 */
async function bloquearStock(
  tx: Prisma.TransactionClient, papelId: string,
): Promise<number | null> {
  const filas = await tx.$queryRaw<{ stock: unknown }[]>`
    SELECT "stock" FROM "Papel" WHERE "id" = ${papelId} FOR UPDATE`;
  return filas.length ? num(filas[0].stock) : null;
}

/** Suma una compra al stock. `pliegos` en pliegos completos. */
export async function registrarEntrada(
  papelId: string, pliegos: number, motivo: string | null, usuarioId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!(pliegos > 0)) return { ok: false, error: "Indica cuántos pliegos entraron." };
  return db.$transaction(async (tx) => {
    const stock = await bloquearStock(tx, papelId);
    if (stock == null) return { ok: false, error: "El papel no existe." };
    const saldo = stock + pliegos;
    await tx.papel.update({ where: { id: papelId }, data: { stock: saldo } });
    await tx.movimientoInventario.create({
      data: { papelId, tipo: "ENTRADA", cantidad: pliegos, saldo, motivo: motivo || null, usuarioId },
    });
    return { ok: true };
  });
}

/** Corrige el stock a un valor exacto (inventario físico). */
export async function ajustarStock(
  papelId: string, nuevoStock: number, motivo: string | null, usuarioId: string,
): Promise<{ ok: boolean; error?: string }> {
  return db.$transaction(async (tx) => {
    const stock = await bloquearStock(tx, papelId);
    if (stock == null) return { ok: false, error: "El papel no existe." };
    const diff = nuevoStock - stock;
    await tx.papel.update({ where: { id: papelId }, data: { stock: nuevoStock } });
    await tx.movimientoInventario.create({
      data: { papelId, tipo: "AJUSTE", cantidad: diff, saldo: nuevoStock, motivo: motivo || "Ajuste manual", usuarioId },
    });
    return { ok: true };
  });
}

export async function fijarStockMin(papelId: string, min: number): Promise<void> {
  await db.papel.update({ where: { id: papelId }, data: { stockMin: Math.max(0, min) } });
}

/**
 * Descuenta del inventario el papel consumido por una orden. Idempotente: solo
 * la primera vez que la orden llega a TERMINADA (Orden.inventarioAplicado).
 */
export async function descontarPorOrden(ordenId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    // Bloquea la orden y re-verifica la idempotencia DENTRO de la transacción:
    // si dos completados llegan a la vez, uno espera y ve inventarioAplicado=true.
    const filas = await tx.$queryRaw<{ inventarioAplicado: boolean }[]>`
      SELECT "inventarioAplicado" FROM "Orden" WHERE "id" = ${ordenId} FOR UPDATE`;
    if (!filas.length || filas[0].inventarioAplicado) return;

    const o = await tx.orden.findUnique({
      where: { id: ordenId },
      select: { numero: true, cotizacion: { select: { entrada: true, tamano: true, pliegos: true } } },
    });
    if (!o) return;

    const entrada = o.cotizacion.entrada as unknown as { papelId?: string } | null;
    const clave = entrada?.papelId;
    const pliegos = num(o.cotizacion.pliegos) * frac(o.cotizacion.tamano);

    if (clave && pliegos > 0) {
      // Bloquea la fila del papel por su clave única antes de descontar.
      const pl = await tx.$queryRaw<{ id: string; stock: unknown }[]>`
        SELECT "id", "stock" FROM "Papel" WHERE "clave" = ${clave} FOR UPDATE`;
      if (pl.length) {
        const saldo = num(pl[0].stock) - pliegos;
        await tx.papel.update({ where: { id: pl[0].id }, data: { stock: saldo } });
        await tx.movimientoInventario.create({
          data: {
            papelId: pl[0].id, tipo: "SALIDA", cantidad: -pliegos, saldo,
            motivo: `Orden N° ${o.numero} terminada`, ordenId,
          },
        });
      }
    }
    // Se marca aplicado aunque el papel ya no exista, para no reintentar.
    await tx.orden.update({ where: { id: ordenId }, data: { inventarioAplicado: true } });
  });
}
