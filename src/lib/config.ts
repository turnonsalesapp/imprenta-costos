import { db } from "./db";
import type { Config, Papel, Acabado, MedidaKey, Unidad, Escala } from "./calculo";
import { CONFIG_BASE } from "./datos-base";

/**
 * Único puente entre la base de datos y el motor de cálculo.
 *
 * Prisma devuelve columnas numéricas como `Decimal`; el motor trabaja con
 * `number`. La conversión ocurre AQUÍ y en ningún otro lugar: si se riega por
 * el resto del código, tarde o temprano una pantalla suma Decimals como texto
 * y muestra "0.260.33" en vez de 0,59.
 */
const num = (v: unknown): number => (v == null ? 0 : Number(v));

/**
 * Arma el objeto Config que espera `calcular()`, con los papeles y acabados
 * activos y las variables del negocio.
 *
 * Ojo: esto sirve para cotizar HOY. Para mostrar una cotización ya guardada
 * se usa su propio `snapshot`, nunca esta función.
 */
export async function cargarConfig(): Promise<Config> {
  const [cfg, papeles, acabados] = await Promise.all([
    db.config.findUnique({ where: { id: "global" } }),
    db.papel.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
    db.acabado.findMany({ where: { activo: true }, orderBy: { orden: "asc" } }),
  ]);

  return {
    papeles: papeles.map(
      (p): Papel => ({
        id: p.clave,
        nombre: p.nombre,
        hojas: p.hojas,
        precio: num(p.precio),
        med: p.medida as MedidaKey,
      }),
    ),
    acabados: acabados.map(
      (a): Acabado => ({
        id: a.clave,
        label: a.label,
        costo: num(a.costo),
        unidad: a.unidad as Unidad,
        escala: a.escala as Escala,
      }),
    ),
    merma: cfg ? num(cfg.merma) : CONFIG_BASE.merma,
    margen: cfg ? num(cfg.margen) : CONFIG_BASE.margen,
    comision: cfg ? num(cfg.comision) : CONFIG_BASE.comision,
    ml: cfg ? num(cfg.ml) : CONFIG_BASE.ml,
    tasaBCV: cfg ? num(cfg.tasaBCV) : CONFIG_BASE.tasaBCV,
    binCompra: cfg ? num(cfg.binCompra) : CONFIG_BASE.binCompra,
    binVenta: cfg ? num(cfg.binVenta) : CONFIG_BASE.binVenta,
    pinza: cfg ? num(cfg.pinza) : CONFIG_BASE.pinza,
    sep: cfg ? num(cfg.sep) : CONFIG_BASE.sep,
  };
}

/** Congela la configuración dentro de una cotización, para que no cambie nunca más. */
export function snapshot(cfg: Config) {
  return {
    papeles: cfg.papeles,
    acabados: cfg.acabados,
    variables: {
      merma: cfg.merma, margen: cfg.margen, comision: cfg.comision, ml: cfg.ml,
      tasaBCV: cfg.tasaBCV, binCompra: cfg.binCompra, binVenta: cfg.binVenta,
      pinza: cfg.pinza, sep: cfg.sep,
    },
    congeladoEn: new Date().toISOString(),
  };
}
