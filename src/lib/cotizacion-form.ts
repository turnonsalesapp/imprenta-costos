/**
 * Forma del formulario de la calculadora y su traducción a la `Entrada` del
 * motor. Puro (sin React ni base), para compartirlo entre el cliente (cálculo
 * en vivo) y el servidor (cálculo autoritativo al guardar).
 */
import type { Config, Entrada, AcabadoSel } from "./calculo";

export type FormCotizacion = {
  // Meta (no entra al motor)
  cliente: string;
  clienteId: string; // "" si es cliente a mano / sin registrar
  trabajo: string;
  descripcion: string;
  ancho: number | string; // mm, para el montaje
  alto: number | string;
  capAuto: boolean;

  // Origen y destino de la receta (trabajos repetidos)
  trabajoId: string; // "" si no viene de un trabajo repetido
  guardarComoTrabajo: boolean; // guardar también la receta como trabajo

  // Entradas del motor
  cantidad: number | string;
  tamano: string;
  papelId: string;
  capacidad: number | string;
  merma: number | string;
  margen: number | string;
  comision: number | string;
  ml: number | string;
  tasaBCV: number | string;
  binCompra: number | string;
  binVenta: number | string;
  difManual: boolean;
  dif: number | string;
  acabados: Record<string, AcabadoSel>;
};

/** Formulario en blanco, tomando los valores por defecto de la configuración. */
export function nuevoForm(cfg: Config): FormCotizacion {
  return {
    cliente: "",
    clienteId: "",
    trabajo: "",
    descripcion: "",
    ancho: "",
    alto: "",
    capAuto: true,
    trabajoId: "",
    guardarComoTrabajo: false,
    cantidad: "",
    tamano: "1/4 Pliego",
    papelId: "",
    capacidad: "",
    merma: cfg.merma,
    margen: cfg.margen,
    comision: cfg.comision,
    ml: cfg.ml,
    tasaBCV: cfg.tasaBCV,
    binCompra: cfg.binCompra,
    binVenta: cfg.binVenta,
    difManual: false,
    dif: "",
    acabados: {
      impTiro: { on: true, q: 1 },
      guillotina: { on: true, q: 1 },
    },
  };
}

/** Extrae del formulario solo lo que el motor entiende. */
export function formAEntrada(f: FormCotizacion): Entrada {
  return {
    cantidad: f.cantidad,
    capacidad: f.capacidad,
    merma: f.merma,
    tamano: f.tamano,
    papelId: f.papelId,
    acabados: f.acabados,
    margen: f.margen,
    comision: f.comision,
    ml: f.ml,
    tasaBCV: f.tasaBCV,
    binCompra: f.binCompra,
    binVenta: f.binVenta,
    difManual: f.difManual,
    dif: f.dif,
  };
}
