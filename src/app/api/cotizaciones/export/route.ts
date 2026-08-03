import type { NextRequest } from "next/server";
import type { EstadoCotizacion } from "@prisma/client";
import { getUsuario } from "@/lib/auth";
import { puedeVerPrecios, puedeVerEstructura } from "@/lib/roles";
import { listarParaCsv, ESTADOS, ETIQUETA_ESTADO } from "@/lib/cotizaciones";
import { fmtNum } from "@/lib/calculo";

export const dynamic = "force-dynamic";

// Columnas comunes (identificación y datos del trabajo), antes del dinero.
const COLUMNAS_BASE = [
  "Fecha", "N°", "Estado", "Cliente", "Trabajo", "Descripción", "Medida",
  "Cantidad", "Tamaño", "Papel", "Cortes",
];
// Estructura de costos: solo si el usuario la ve.
const COLUMNAS_COSTO = ["Costo total USD", "Costo unit USD", "Diferencial", "Margen %"];
// Precio de venta: siempre presente para quien exporta.
const COLUMNAS_PRECIO = [
  "Precio unit USD", "Venta total USD", "Precio MercadoLibre", "Tasa BCV", "Precio unit Bs",
];

/** Escapa un valor para CSV (comillas dobles, con escape interno). */
function esc(v: unknown): string {
  return '"' + String(v ?? "").replace(/"/g, '""') + '"';
}
const numCsv = (v: number, d = 2) => esc(fmtNum(v, d));

export async function GET(req: NextRequest) {
  const usuario = await getUsuario();
  // El taller no ve precios: tampoco los exporta.
  if (!usuario || !puedeVerPrecios(usuario.rol)) {
    return new Response("No autorizado", { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const estadoRaw = sp.get("estado") ?? "";
  const estado = (ESTADOS.includes(estadoRaw as EstadoCotizacion)
    ? (estadoRaw as EstadoCotizacion)
    : "") as EstadoCotizacion | "";

  const filas = await listarParaCsv({ q, estado });

  // Sin estructura de costos: se omiten las columnas de costo/margen (encabezado
  // y celdas), dejando solo las de precio de venta. Coherente entre título y filas.
  const verEstructura = puedeVerEstructura(usuario);
  const COLUMNAS = [...COLUMNAS_BASE, ...(verEstructura ? COLUMNAS_COSTO : []), ...COLUMNAS_PRECIO];

  const cuerpo = filas.map((c) =>
    [
      esc(c.creadaEn.toLocaleDateString("es-VE")),
      esc(c.numero),
      esc(ETIQUETA_ESTADO[c.estado]),
      esc(c.clienteNombre ?? ""),
      esc(c.titulo),
      esc(c.descripcion ?? ""),
      esc(`${fmtNum(c.ancho, 0)}×${fmtNum(c.alto, 0)} mm`),
      numCsv(c.cantidad, 0),
      esc(c.tamano),
      esc(c.papelNombre),
      numCsv(c.pliegos),
      ...(verEstructura
        ? [numCsv(c.costoTotal), numCsv(c.costoUnit, 4), numCsv(c.diferencial, 4), numCsv(c.margen, 0)]
        : []),
      numCsv(c.precioUnit, 4),
      numCsv(c.ventaTotal),
      numCsv(c.precioML, 4),
      numCsv(c.tasaBCV, 2),
      numCsv(c.precioBs, 2),
    ].join(";"),
  );

  // BOM UTF-8 + CRLF: así Excel en español lo abre bien y respeta el punto y coma.
  const csv = "﻿" + [COLUMNAS.map(esc).join(";"), ...cuerpo].join("\r\n");
  const fecha = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cotizaciones-${fecha}.csv"`,
    },
  });
}
