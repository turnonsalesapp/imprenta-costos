import type { PasoTour } from "./Tour";

/**
 * Contenido de los dos tutoriales. Los `mockup` son claves de MOCKUPS
 * (ilustraciones por paso). Mantener en línea con VisitaGuiada/Variables.
 */

/** Tutorial de bienvenida (se abre tras el login). Incluye el paso a paso de
 *  cómo cotizar cada tipo de trabajo. */
export const PASOS_INICIO: PasoTour[] = [
  {
    eyebrow: "Bienvenida",
    titulo: "Tu taller, de punta a punta",
    cuerpo:
      "Esta guía te muestra el circuito completo: cotizar cada tipo de trabajo, ganar, producir por pieza, cobrar y comparar precios de proveedores. Puedes reabrirla cuando quieras con el botón «?» del menú.",
    mockup: "bienvenida",
  },

  // ── Cotizar: elegir tipo ──
  {
    eyebrow: "Paso 1 · Cotizar",
    titulo: "Elige el tipo de trabajo",
    cuerpo:
      "Cada trabajo se cotiza según su tipo: Digital, Offset, Gran formato, Proveedor o Personalizado. Una cotización puede combinar varios ítems de distintos tipos. Empecemos por cada uno.",
    mockup: "cotizar-tipos",
    href: "/cotizacion-nueva",
    hrefLabel: "Abrir Nueva cotización",
  },
  {
    eyebrow: "Cotizar · Digital",
    titulo: "Digital (producción propia)",
    cuerpo:
      "Para tirajes cortos. Eliges producto y medida, la cantidad, el papel y los acabados. El sistema arma el montaje en el pliego y te sugiere el corte más barato; puedes cotizar varios tirajes del mismo trabajo a la vez. Ves costo y precio al instante.",
    mockup: "cotizar-digital",
  },
  {
    eyebrow: "Cotizar · Offset",
    titulo: "Offset (producción propia)",
    cuerpo:
      "Para tiraje alto. Defines el pliego y el montaje, las tintas y las planchas, el papel y los millares. El motor reparte el costo fijo (planchas, arranque) entre la cantidad y protege tu utilidad con el margen mínimo.",
    mockup: "cotizar-offset",
  },
  {
    eyebrow: "Cotizar · Gran formato",
    titulo: "Gran formato",
    cuerpo:
      "Para lonas, vinilos y rígidos. Eliges el material, pones ancho × alto y la cantidad; se calcula por m². Agregas acabados (ojales, dobladillo, laminado). Sirve tanto para impresión propia como tercerizada.",
    mockup: "cotizar-granformato",
  },
  {
    eyebrow: "Cotizar · Proveedor",
    titulo: "Proveedor (trabajo tercerizado)",
    cuerpo:
      "Cuando el trabajo lo hace un tercero. Registras el nombre del proveedor y el costo que te cobra, y le aplicas tu margen. El cliente ve un solo precio; internamente queda claro que es una compra a proveedor.",
    mockup: "cotizar-proveedor",
  },
  {
    eyebrow: "Cotizar · Personalizado",
    titulo: "Personalizado (a medida)",
    cuerpo:
      "Para lo que no encaja en los demás. Escribes líneas de costo libres (materiales, mano de obra, extras) y el sistema suma y aplica el margen. Ideal para trabajos únicos o combinados.",
    mockup: "cotizar-personalizado",
  },

  // ── Circuito ──
  {
    eyebrow: "Paso 2 · Seguimiento",
    titulo: "Cotizaciones en Lista o Tablero",
    cuerpo:
      "Arrastra cada cotización entre columnas para cambiar su estado (Borrador → Pendiente de aprobación → Enviada → Ganadas / Perdidas) o usa el selector de la tarjeta.",
    mockup: "cotizaciones-tablero",
    href: "/cotizaciones?vista=tablero",
    hrefLabel: "Ver el tablero de cotizaciones",
  },
  {
    eyebrow: "Paso 3 · CRM",
    titulo: "Prospectos y reuniones",
    cuerpo:
      "Antes de cotizar, registra oportunidades y agenda reuniones, llamadas y seguimientos. Mueve el prospecto de Nuevo a Contactado, Convertido o Descartado.",
    mockup: "crm",
    href: "/crm",
    hrefLabel: "Abrir el CRM",
  },
  {
    eyebrow: "Paso 4 · Al ganar",
    titulo: "La orden se genera sola",
    cuerpo:
      "Cuando marcas una cotización como Ganada (Aprobada), se convierte en Orden de Venta y su orden de producción se crea automáticamente — sin recapturar nada.",
    mockup: "handoff",
  },
  {
    eyebrow: "Paso 5 · Producción por pieza",
    titulo: "El taller, pieza por pieza",
    cuerpo:
      "En el Taller, el Tablero sigue cada pieza por separado: las internas por el taller (diseño → impresión → acabado → lista) y las tercerizadas por compras (por cotizar → comprado → recibido → entregado). El taller nunca ve precios.",
    mockup: "taller-piezas",
    href: "/taller",
    hrefLabel: "Ir al Taller",
  },
  {
    eyebrow: "Paso 6 · Cobro",
    titulo: "Seguimiento de cobro",
    cuerpo:
      "En cada orden marcas el cobro: No facturado → Facturado → Cobrado, con sus fechas. Es solo seguimiento (no una factura fiscal) y lo gestionan administración y ventas.",
    mockup: "cobro",
  },
  {
    eyebrow: "Paso 7 · Proveedores",
    titulo: "Compara precios e importa listas",
    cuerpo:
      "En Proveedores cargas listas de precios desde Excel: descargas la plantilla con tu catálogo, la llenas, la subes y confirmas la vista previa. El comparador te muestra el más barato por papel y el ahorro potencial.",
    mockup: "proveedores",
    href: "/proveedores",
    hrefLabel: "Ir a Proveedores",
  },
  {
    eyebrow: "Paso 8 · Inventario",
    titulo: "Papel bajo control",
    cuerpo:
      "El inventario descuenta el papel al terminar una orden y te avisa cuando un material baja de su mínimo. Ajusta stock y mínimos por categoría.",
    mockup: "inventario",
    href: "/inventario",
    hrefLabel: "Ver Inventario",
  },
  {
    eyebrow: "Listo",
    titulo: "Ya conoces el circuito",
    cuerpo:
      "Cotizar → Ganar → Producir por pieza → Cobrar, con proveedores e inventario detrás. Reabre esta guía cuando quieras con el botón «?» del menú.",
    mockup: "bienvenida",
  },
];

/** Tutorial de la pantalla de Variables (configuración del sistema, solo ADMIN). */
export const PASOS_VARIABLES: PasoTour[] = [
  {
    eyebrow: "Variables · Bienvenida",
    titulo: "El motor del negocio",
    cuerpo:
      "Aquí configuras todo lo que usan los cálculos: márgenes, IVA, tasa de cambio, membrete, papeles, acabados y materiales. Cambiar algo aquí afecta las cotizaciones nuevas. Solo administración entra.",
    mockup: "var-config",
  },
  {
    eyebrow: "Variables · Paso 1",
    titulo: "Valores por defecto",
    cuerpo:
      "El margen por defecto, el margen mínimo (utilidad protegida), el IVA y el diferencial. Son el punto de partida de cada cotización; el margen mínimo evita que se venda por debajo de lo rentable.",
    mockup: "var-config",
  },
  {
    eyebrow: "Variables · Paso 2",
    titulo: "Tasa de cambio",
    cuerpo:
      "Con «Actualizar tasas» traes la tasa Binance (compra/venta) para convertir a bolívares. Abajo ves el histórico de las últimas tasas registradas.",
    mockup: "var-tasas",
  },
  {
    eyebrow: "Variables · Paso 3",
    titulo: "Membrete de la cotización",
    cuerpo:
      "Los datos que salen en la cotización impresa: nombre, RIF, dirección, teléfono y logo. Es lo que ve tu cliente en el PDF.",
    mockup: "var-membrete",
  },
  {
    eyebrow: "Variables · Paso 4",
    titulo: "Papeles",
    cuerpo:
      "El catálogo de papeles: referencia, categoría, medida del pliego, hojas por resma y precio. El precio puede venir de las listas de proveedores (módulo Proveedores). Se puede activar/desactivar cada papel.",
    mockup: "var-papeles",
  },
  {
    eyebrow: "Variables · Paso 5",
    titulo: "Acabados",
    cuerpo:
      "Troquelado, plastificado, barniz, etc.: su costo, cómo se cobra (por pieza, por pliego, fijo) y si depende del tamaño. Los acabados aparecen luego al cotizar Digital y Offset.",
    mockup: "var-acabados",
  },
  {
    eyebrow: "Variables · Paso 6",
    titulo: "Gran formato y POP",
    cuerpo:
      "Materiales de gran formato (costo por m² y cómo se cobra), productos de gran formato y productos POP. Alimentan la calculadora de gran formato.",
    mockup: "var-granformato",
  },
  {
    eyebrow: "Variables · Paso 7",
    titulo: "Equipos",
    cuerpo:
      "Las máquinas y su costo, que el motor usa para repartir el costo de producción. Manténlos al día para que los precios reflejen la realidad del taller.",
    mockup: "var-equipos",
  },
  {
    eyebrow: "Listo",
    titulo: "Todo configurado",
    cuerpo:
      "Con las variables al día, cada cotización sale con costos y precios correctos. Reabre este tutorial cuando quieras con «Ver tutorial» en esta pantalla.",
    mockup: "var-config",
  },
];
