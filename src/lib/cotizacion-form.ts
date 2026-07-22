/**
 * Forma del formulario de la calculadora y su traducción a la `Entrada` del
 * motor. Puro (sin React ni base), para compartirlo entre el cliente (cálculo
 * en vivo) y el servidor (cálculo autoritativo al guardar).
 */
import type { Config, Entrada, AcabadoSel } from "./calculo";
import { n } from "./calculo";

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

  // Si viene de editar un borrador, el id de la cotización a actualizar ("" = nueva).
  editarId: string;

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
  precioManual: number | string; // precio unitario de venta fijado a mano ("" = calculado)
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
    editarId: "",
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
    precioManual: "",
    acabados: {
      impTiro: { on: true, q: 1 },
      guillotina: { on: true, q: 1 },
    },
  };
}

/**
 * Formulario de cotización de PROVEEDOR (trabajo tercerizado): no hay papel ni
 * acabados; se parte del costo que da el proveedor y se aplica el mismo
 * diferencial cambiario y margen.
 */
export type FormProveedor = {
  cliente: string;
  clienteId: string;
  trabajo: string;
  descripcion: string;
  proveedorNombre: string;
  proveedorRef: string;
  proveedorNotas: string;
  cantidad: number | string;
  // El costo del proveedor se puede indicar de dos formas: total, o unitario por
  // elemento (× cantidad). `costoModo` decide cuál manda; el motor siempre parte
  // del total efectivo (ver `totalProveedor`).
  costoModo: "total" | "unitario";
  costoTotal: number | string; // costo total que cobra el proveedor
  costoUnitario: number | string; // costo por elemento que cobra el proveedor
  margen: number | string;
  comision: number | string;
  ml: number | string;
  tasaBCV: number | string;
  binCompra: number | string;
  binVenta: number | string;
  difManual: boolean;
  dif: number | string;
  precioManual: number | string; // precio unitario de venta fijado a mano ("" = calculado)
  editarId: string;
};

export function nuevoFormProveedor(cfg: Config): FormProveedor {
  return {
    cliente: "", clienteId: "", trabajo: "", descripcion: "",
    proveedorNombre: "", proveedorRef: "", proveedorNotas: "",
    cantidad: "", costoModo: "total", costoTotal: "", costoUnitario: "",
    margen: cfg.margen, comision: cfg.comision, ml: cfg.ml,
    tasaBCV: cfg.tasaBCV, binCompra: cfg.binCompra, binVenta: cfg.binVenta,
    difManual: false, dif: "", precioManual: "", editarId: "",
  };
}

/**
 * Costo total efectivo del proveedor. Si se indicó por elemento, lo multiplica
 * por la cantidad; si no, usa el total tal cual. Fuente única para el cálculo,
 * la validación y lo que se congela al guardar.
 */
export function totalProveedor(f: FormProveedor): number {
  const cant = Math.max(0, Math.round(n(f.cantidad)));
  return f.costoModo === "unitario" ? n(f.costoUnitario) * cant : n(f.costoTotal);
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
    precioManual: f.precioManual,
  };
}
