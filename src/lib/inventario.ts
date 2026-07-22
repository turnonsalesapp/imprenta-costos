import "server-only";
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
  id: string; nombre: string; medida: string; hojas: number;
  stock: number; stockMin: number; bajo: boolean;
};

export async function listarInventario(): Promise<FilaInventario[]> {
  const papeles = await db.papel.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, medida: true, hojas: true, stock: true, stockMin: true },
  });
  return papeles.map((p) => {
    const stock = num(p.stock);
    const stockMin = num(p.stockMin);
    return {
      id: p.id, nombre: p.nombre, medida: p.medida, hojas: p.hojas,
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

/** Suma una compra al stock. `pliegos` en pliegos completos. */
export async function registrarEntrada(
  papelId: string, pliegos: number, motivo: string | null, usuarioId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!(pliegos > 0)) return { ok: false, error: "Indica cuántos pliegos entraron." };
  const p = await db.papel.findUnique({ where: { id: papelId }, select: { stock: true } });
  if (!p) return { ok: false, error: "El papel no existe." };

  const saldo = num(p.stock) + pliegos;
  await db.$transaction([
    db.papel.update({ where: { id: papelId }, data: { stock: saldo } }),
    db.movimientoInventario.create({
      data: { papelId, tipo: "ENTRADA", cantidad: pliegos, saldo, motivo: motivo || null, usuarioId },
    }),
  ]);
  return { ok: true };
}

/** Corrige el stock a un valor exacto (inventario físico). */
export async function ajustarStock(
  papelId: string, nuevoStock: number, motivo: string | null, usuarioId: string,
): Promise<{ ok: boolean; error?: string }> {
  const p = await db.papel.findUnique({ where: { id: papelId }, select: { stock: true } });
  if (!p) return { ok: false, error: "El papel no existe." };
  const diff = nuevoStock - num(p.stock);
  await db.$transaction([
    db.papel.update({ where: { id: papelId }, data: { stock: nuevoStock } }),
    db.movimientoInventario.create({
      data: { papelId, tipo: "AJUSTE", cantidad: diff, saldo: nuevoStock, motivo: motivo || "Ajuste manual", usuarioId },
    }),
  ]);
  return { ok: true };
}

export async function fijarStockMin(papelId: string, min: number): Promise<void> {
  await db.papel.update({ where: { id: papelId }, data: { stockMin: Math.max(0, min) } });
}

/**
 * Descuenta del inventario el papel consumido por una orden. Idempotente: solo
 * la primera vez que la orden llega a TERMINADA (Orden.inventarioAplicado).
 */
export async function descontarPorOrden(ordenId: string): Promise<void> {
  const o = await db.orden.findUnique({
    where: { id: ordenId },
    select: {
      inventarioAplicado: true,
      numero: true,
      cotizacion: { select: { entrada: true, tamano: true, pliegos: true } },
    },
  });
  if (!o || o.inventarioAplicado) return;

  const entrada = o.cotizacion.entrada as unknown as { papelId?: string } | null;
  const clave = entrada?.papelId;
  const pliegos = num(o.cotizacion.pliegos) * frac(o.cotizacion.tamano);

  if (clave && pliegos > 0) {
    const papel = await db.papel.findUnique({ where: { clave }, select: { id: true, stock: true } });
    if (papel) {
      const saldo = num(papel.stock) - pliegos;
      await db.$transaction([
        db.papel.update({ where: { id: papel.id }, data: { stock: saldo } }),
        db.movimientoInventario.create({
          data: {
            papelId: papel.id, tipo: "SALIDA", cantidad: -pliegos, saldo,
            motivo: `Orden N° ${o.numero} terminada`, ordenId,
          },
        }),
      ]);
    }
  }
  // Se marca aplicado aunque el papel ya no exista, para no reintentar.
  await db.orden.update({ where: { id: ordenId }, data: { inventarioAplicado: true } });
}
