# Tokens — fuente de verdad

Reflejo exacto de `tailwind.config.ts` y `src/app/globals.css`. Si cambias un token,
cámbialo **aquí y en el config a la vez**. Usa siempre el nombre del token, nunca el
hex suelto en el JSX.

## Paleta

| Token | Hex | Rol | Cuándo usarlo |
|---|---|---|---|
| `plancha` | `#E3E7E3` | fondo de la app (body) | fondo general; no como superficie de tarjeta |
| `hoja` | `#FCFCFB` | superficie / papel | tarjetas, tablas, barras, botón primario (texto) |
| `tinta` | `#171B19` | texto principal / primario | títulos, datos importantes, botón primario (fondo) |
| `regla` | `#C4CBC5` | filetes / bordes | `border-regla` en tarjetas, tablas, inputs |
| `suave` | `#EFF2EF` | relleno sutil | encabezados de tabla, chips neutros, hover de fila |
| `kraft` | `#767D76` | texto secundario / rótulos | eyebrows, metadatos, texto de apoyo |
| `cian` | `#0B8FA8` | acento C / interacción | foco, enlaces activos, marca; acento primario |
| `magenta` | `#C4177C` | acento M | marca (logo), acento puntual |
| `amarillo` | `#C79400` | acento Y | marca (logo), acento puntual |
| `exito` | `#15794F` | verde semántico | montos positivos, estado aprobado |

**Registro CMYK:** `cian` + `magenta` + `amarillo` + `tinta` (K) forman la marca del
logo (cuatro barras). Fuera de la marca, los tres primeros van con cuentagotas.

### Tonos suaves para badges/estados

No están en el config (son `bg-[#...]` puntuales); mantén el mapa consistente:

| Estado | Fondo | Texto |
|---|---|---|
| Info / enviada | `bg-[#E6F4F8]` | `text-cian` |
| Éxito / aprobada | `bg-[#EDF9F1]` | `text-exito` |
| Error / rechazada | `bg-[#FDEDED]` | `text-[#8A1C1C]` |
| Aviso / vencida | `bg-[#FFF9E6]` | `text-[#5C4A00]` |
| Neutro / borrador | `bg-suave` | `text-kraft` |

Si añades un estado nuevo, crea su par (fondo muy claro + texto oscuro del mismo tono)
siguiendo esta lógica; comprueba contraste AA del texto sobre su fondo.

## Tipografía

- **Sans:** `Helvetica Neue, Helvetica, Arial, sans-serif` (clase `font-sans`, por
  defecto en `<body>`). Es la voz general.
- **Mono:** `ui-monospace, SF Mono, Menlo, Consolas, monospace` (clase `font-mono`).
  **Toda cifra** (dinero, cantidades, tasas, %) va en mono.
- **Números tabulares:** clase `.tabular` (`font-variant-numeric: tabular-nums`) para
  que las columnas de números no se desalineen al cambiar de valor.

### Escala de texto en uso (respétala)

| Uso | Clases |
|---|---|
| Título de página (h1) | `text-lg font-bold tracking-tight` |
| Eyebrow / rótulo de sección | `text-[10px] font-bold uppercase tracking-widest text-kraft` |
| Cuerpo / celdas | `text-sm` |
| Metadato / secundario | `text-xs` (a veces `text-[11px]`) |
| Cifra destacada en tarjeta | `font-mono text-lg font-bold tabular` |
| Correo / clave mono en tabla | `font-mono text-[13px] text-kraft` |

## Forma y espaciado

- **Radio:** `rounded-sm` general; `rounded-[2px]` en marcas diminutas. Nunca `-lg`+.
- **Bordes:** 1 px `border-regla`. La profundidad es por filete + capas, sin sombra.
- **Base de espaciado:** múltiplos de 4 (Tailwind `1` = 4 px). Separación de
  secciones `mt-6`/`mt-8`; grillas `gap-3`; padding de tarjeta `p-3`/`p-4`; celdas
  `px-4 py-2.5`.
- **Contenedor:** `mx-auto max-w-4xl px-6` (lo aplica el layout de `(app)`).
- **Grillas responsivas:** patrón `grid grid-cols-2 gap-3 sm:grid-cols-4` (colapsan a
  2 columnas en móvil).

## globals.css — lo que ya existe

- `body`: fondo `plancha`, texto `tinta`, `-webkit-font-smoothing: antialiased`.
- `:root { color-scheme: light }` — **light-only**. No añadas modo oscuro salvo que se
  pida explícitamente (implicaría duplicar tokens y revisar impresión).
- `.tabular` — números tabulares.
- `@media print`: `.no-print { display:none }`, fondo blanco, `.hoja-orden` sin borde.
  Marca con `no-print` la navegación, botones y acciones que no deben imprimirse.
