# Componentes — recetas copiables

Extraídas del código real del proyecto. Reutiliza estas clases antes de inventar
variantes. Rutas de referencia entre paréntesis.

## Rótulo de sección (eyebrow)

La firma visual de la app. Úsalo para encabezar secciones y como sub-título del h1.

```tsx
<h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
  Catálogo y cotizaciones
</h2>
```

## Encabezado de página

```tsx
<header>
  <h1 className="text-lg font-bold tracking-tight">Usuarios</h1>
  <p className="mt-0.5 text-xs uppercase tracking-widest text-kraft">Acceso y roles</p>
</header>
```

## Tarjeta de dato (KPI)

Cifra monoespaciada como protagonista, rótulo pequeño encima (`src/app/(app)/page.tsx`).

```tsx
<div className="rounded-sm border border-regla bg-hoja px-3 py-3">
  <div className="text-[11px] text-kraft">Cotizaciones</div>
  <div className="tabular mt-1 font-mono text-lg font-bold">128</div>
</div>
```

En grilla: `grid grid-cols-2 gap-3 sm:grid-cols-4`.

## Botones

```tsx
{/* Primario */}
<button className="rounded-sm bg-tinta px-4 py-2 text-sm font-bold text-hoja hover:opacity-90">
  Guardar
</button>

{/* Secundario */}
<button className="rounded-sm border border-regla px-2.5 py-1 text-xs font-medium text-kraft hover:border-tinta hover:text-tinta">
  Cancelar
</button>

{/* Acción-icono (en filas de tabla) — lucide-react a size=15 */}
<button className="rounded-sm p-1.5 text-kraft hover:bg-suave hover:text-tinta" aria-label="Editar">
  <Pencil size={15} />
</button>
{/* variante destructiva del icono: hover:text-[#B23A48] */}
```

Enlace-botón primario: misma receta del primario sobre `<Link>` (`px-4 py-2`).

## Tabla

Patrón de listado (`src/app/(app)/cotizaciones/page.tsx`, `usuarios/page.tsx`):

```tsx
<div className="overflow-x-auto rounded-sm border border-regla bg-hoja">
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-regla bg-suave text-left text-[10px] uppercase tracking-widest text-kraft">
        <th className="px-4 py-2 font-bold">Nombre</th>
        <th className="px-4 py-2 text-right font-bold">Venta total</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-suave">
      <tr>
        <td className="px-4 py-2.5">Trabajo X</td>
        <td className="px-4 py-2.5 text-right font-mono">$123.45</td>
      </tr>
    </tbody>
  </table>
</div>
```

Reglas: encabezado en `bg-suave` con eyebrow; filas separadas por `divide-suave`;
números `text-right font-mono`; envoltura `overflow-x-auto` para móvil.

**Tablas anchas (muchas columnas) → tarjetas en móvil.** El scroll horizontal en el
teléfono es incómodo. Para una tabla que no entra por debajo de ~900px, ofrece dos
vistas: una lista de tarjetas apiladas (`<ul className="space-y-3 min-[900px]:hidden">`,
cada registro con su título + badge de estado arriba, metadatos en `text-[11px]
text-kraft`, y las cifras en una grilla `grid-cols-3` con rótulo + valor mono) y la
tabla solo a partir de donde entra completa (`hidden overflow-x-auto min-[900px]:block`).
Así todo se ve por línea, sin scroll. Ejemplo real: `cotizaciones/page.tsx`.

## Badge de estado

`src/app/(app)/cotizaciones/EstadoBadge.tsx` — fondo suave + texto del mismo tono.

```tsx
<span className="inline-block rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide bg-[#EDF9F1] text-exito">
  Aprobada
</span>
```

Mapa de colores por estado: ver `tokens.md` → "Tonos suaves para badges/estados".

## Inputs / formularios

Foco en `cian`, borde `regla`, radio pequeño (patrón en selectores del proyecto).

```tsx
<input
  className="w-full rounded-sm border border-regla bg-white px-3 py-2 text-sm outline-none focus:border-cian"
/>

<select
  className="rounded-sm border border-regla bg-white px-2 py-1 text-sm outline-none focus:border-cian disabled:opacity-40"
/>
```

Etiqueta de campo: `text-xs font-medium` o eyebrow según densidad. Mensaje de error:
`text-xs text-[#8A1C1C]`; ayuda/hint: `text-xs text-kraft`.

**Móvil — evita el zoom de iOS.** Un input con fuente < 16px hace que iOS Safari
haga zoom automático al enfocarlo y "salte" el layout. Para campos en Tailwind usa
`text-base sm:text-sm` (16px en móvil, 13-14px en escritorio). Un buscador ancho:
`w-full sm:w-64` para que no desborde la fila en el teléfono. En las calculadoras
esto ya lo resuelve `calc.css` (sube `.pr .in` a 16px por debajo de 620px).

## Marca / logo (registro CMYK)

Cuatro barras cian/magenta/amarillo/tinta (`src/app/_components/Nav.tsx`):

```tsx
<span className="flex h-4 w-4 overflow-hidden rounded-[2px]">
  <i className="flex-1 bg-cian" />
  <i className="flex-1 bg-magenta" />
  <i className="flex-1 bg-amarillo" />
  <i className="flex-1 bg-tinta" />
</span>
```

## Nota de apoyo / pie de sección

```tsx
<p className="mt-4 text-xs leading-relaxed text-kraft">
  Al desactivar un usuario se cierran sus sesiones al instante.
</p>
```

## Estado vacío (recomendado al elevar)

Cuando una lista/tabla no tiene datos, no dejes el hueco en blanco:

```tsx
<p className="px-4 py-8 text-center text-sm text-kraft">
  Aún no hay cotizaciones. Crea la primera con «Nueva cotización».
</p>
```
