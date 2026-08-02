"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Visita guiada / tutorial de bienvenida. Se abre sola la primera vez (guarda un
 * flag en localStorage) y se puede reabrir desde el botón "?" del menú, que
 * dispara el evento `abrir-guia`. Es un recorrido por pasos, no un spotlight
 * anclado a elementos, para que funcione igual en todas las pantallas.
 */

type Paso = {
  eyebrow: string;
  titulo: string;
  cuerpo: string;
  href?: string;
  hrefLabel?: string;
};

const PASOS: Paso[] = [
  {
    eyebrow: "Bienvenida",
    titulo: "Tu taller, de punta a punta",
    cuerpo:
      "Esta guía te muestra el circuito completo: cotizar, ganar, producir por pieza, cobrar y comparar precios de proveedores. Puedes reabrirla cuando quieras con el botón «?» del menú.",
  },
  {
    eyebrow: "Paso 1 · Cotizar",
    titulo: "Arma un trabajo y guárdalo",
    cuerpo:
      "Elige el tipo (digital, offset, gran formato, proveedor, personalizado) y la app calcula el costo y el precio. Una cotización puede tener varios ítems. Guárdala para empezar su historia.",
    href: "/cotizacion-nueva",
    hrefLabel: "Ir a Nueva cotización",
  },
  {
    eyebrow: "Paso 2 · Seguimiento comercial",
    titulo: "Cotizaciones en Lista o Tablero",
    cuerpo:
      "En Cotizaciones cambia entre Lista y Tablero. En el Tablero arrastras cada cotización entre columnas (Borrador → Pendiente de aprobación → Enviada → Ganadas / Perdidas) o usas el selector de la tarjeta.",
    href: "/cotizaciones?vista=tablero",
    hrefLabel: "Ver el tablero de cotizaciones",
  },
  {
    eyebrow: "Paso 3 · CRM",
    titulo: "Prospectos y reuniones",
    cuerpo:
      "Antes de cotizar, registra oportunidades en el CRM y agenda reuniones, llamadas y seguimientos. Mueve los prospectos de Nuevo a Contactado, Convertido o Descartado.",
    href: "/crm",
    hrefLabel: "Abrir el CRM",
  },
  {
    eyebrow: "Paso 4 · Al ganar",
    titulo: "La orden se genera sola",
    cuerpo:
      "Cuando marcas una cotización como Ganada (Aprobada), se convierte en Orden de Venta y su orden de producción se crea automáticamente — sin recapturar nada. Es el mismo registro que avanza.",
  },
  {
    eyebrow: "Paso 5 · Producción por pieza",
    titulo: "El taller, pieza por pieza",
    cuerpo:
      "En el Taller, el Tablero sigue cada pieza por separado: las internas por el taller (diseño → impresión → acabado → lista) y las tercerizadas por compras (por cotizar → comprado → recibido → entregado). Arrastra las piezas para avanzarlas. El taller nunca ve precios.",
    href: "/taller",
    hrefLabel: "Ir al Taller",
  },
  {
    eyebrow: "Paso 6 · Cobro",
    titulo: "Seguimiento de cobro",
    cuerpo:
      "En cada orden, marca el cobro: No facturado → Facturado → Cobrado, con sus fechas. Es solo seguimiento (no una factura fiscal) y lo gestionan administración y ventas.",
  },
  {
    eyebrow: "Paso 7 · Proveedores",
    titulo: "Compara precios e importa listas",
    cuerpo:
      "En Proveedores cargas varias listas de precios desde Excel: descargas la plantilla con tu catálogo, la llenas, la subes y confirmas la vista previa. El comparador te muestra el proveedor más barato por papel y el ahorro potencial.",
    href: "/proveedores",
    hrefLabel: "Ir a Proveedores",
  },
  {
    eyebrow: "Paso 8 · Inventario",
    titulo: "Papel bajo control",
    cuerpo:
      "El inventario descuenta el papel al terminar una orden y te avisa cuando un material baja de su mínimo. Ajusta stock y mínimos por categoría.",
    href: "/inventario",
    hrefLabel: "Ver Inventario",
  },
  {
    eyebrow: "Listo",
    titulo: "Ya conoces el circuito",
    cuerpo:
      "Cotizar → Ganar → Producir por pieza → Cobrar, con proveedores e inventario detrás. Reabre esta guía cuando quieras con el botón «?» del menú.",
  },
];

const CLAVE_LS = "imprenta.visitaGuiada.vista";

export function VisitaGuiada() {
  const [abierta, setAbierta] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    // Se abre sola la primera vez.
    try {
      if (!localStorage.getItem(CLAVE_LS)) setAbierta(true);
    } catch { /* localStorage no disponible */ }
    const abrir = () => { setI(0); setAbierta(true); };
    window.addEventListener("abrir-guia", abrir);
    return () => window.removeEventListener("abrir-guia", abrir);
  }, []);

  function cerrar() {
    setAbierta(false);
    try { localStorage.setItem(CLAVE_LS, "1"); } catch { /* ignore */ }
  }

  if (!abierta) return null;
  const paso = PASOS[i];
  const primero = i === 0;
  const ultimo = i === PASOS.length - 1;

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-tinta/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Visita guiada"
      onClick={cerrar}
    >
      <div
        className="w-full max-w-md rounded-sm border border-regla bg-hoja"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-1.5 overflow-hidden rounded-t-sm">
          <i className="flex-1 bg-cian" />
          <i className="flex-1 bg-magenta" />
          <i className="flex-1 bg-amarillo" />
          <i className="flex-1 bg-tinta" />
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-kraft">
              {paso.eyebrow}
            </span>
            <button
              onClick={cerrar}
              className="text-sm text-kraft hover:text-tinta"
              aria-label="Cerrar la guía"
            >
              ✕
            </button>
          </div>

          <h2 className="mt-1 text-lg font-bold tracking-tight">{paso.titulo}</h2>
          <p className="mt-2 text-sm leading-relaxed text-tinta">{paso.cuerpo}</p>

          {paso.href ? (
            <Link
              href={paso.href}
              onClick={cerrar}
              className="mt-3 inline-block rounded-sm border border-regla px-3 py-1.5 text-sm font-medium text-kraft hover:border-tinta hover:text-tinta"
            >
              {paso.hrefLabel ?? "Ir"} →
            </Link>
          ) : null}

          {/* Progreso */}
          <div className="mt-5 flex items-center justify-center gap-1.5">
            {PASOS.map((_, n) => (
              <span
                key={n}
                className={`h-1.5 rounded-[2px] transition-all ${n === i ? "w-4 bg-cian" : "w-1.5 bg-regla"}`}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={cerrar}
              className="text-xs text-kraft underline hover:text-tinta"
            >
              Saltar
            </button>
            <div className="flex gap-2">
              {!primero ? (
                <button
                  onClick={() => setI((n) => n - 1)}
                  className="rounded-sm border border-regla px-3 py-1.5 text-sm font-medium text-kraft hover:border-tinta hover:text-tinta"
                >
                  Anterior
                </button>
              ) : null}
              {ultimo ? (
                <button
                  onClick={cerrar}
                  className="rounded-sm bg-tinta px-4 py-1.5 text-sm font-bold text-hoja hover:opacity-90"
                >
                  Listo
                </button>
              ) : (
                <button
                  onClick={() => setI((n) => n + 1)}
                  className="rounded-sm bg-tinta px-4 py-1.5 text-sm font-bold text-hoja hover:opacity-90"
                >
                  Siguiente
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
