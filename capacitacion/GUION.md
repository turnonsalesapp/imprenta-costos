# Video de capacitación — Guion / maqueta

Video de introducción (~80 s, 1280×720) que recorre el circuito completo del
sistema, en línea con la **visita guiada in-app** (botón «?» del menú). Se rinde a
partir de `capacitacion.html` (presentación auto-reproducible, una escena cada 8 s).

- **Fuente:** `capacitacion/capacitacion.html` (self-contained, sin dependencias).
- **Render:** `capacitacion.webm` (VP8, 1280×720). Reproduce en navegadores y móviles.
- **Voz en off (narración):** el texto "Narración" de cada escena; grábalo con la
  voz del negocio si quieres una versión locutada.

## Escenas

| # | Dur | En pantalla (título) | Narración (voz en off) |
|---|-----|----------------------|------------------------|
| 1 | 8 s | El sistema de la imprenta, de punta a punta | "Este es el recorrido completo de tu taller: cotizar, ganar, producir por pieza y cobrar. En noventa segundos." |
| 2 | 8 s | Paso 1 · Cotizar — Arma un trabajo y guárdalo | "Todo empieza cotizando. Eliges el tipo de trabajo y el sistema calcula el costo y el precio. Una cotización puede tener varios ítems. La guardas y queda en tu historial." |
| 3 | 8 s | Paso 2 · Cotizaciones en Lista o Tablero | "Ves tus cotizaciones como lista o como tablero. En el tablero arrastras cada una entre columnas para cambiar su estado: borrador, pendiente de aprobación, enviada, ganadas o perdidas." |
| 4 | 8 s | Paso 3 · CRM — Prospectos y reuniones | "Antes de cotizar, registras oportunidades en el CRM y agendas reuniones y seguimientos. El prospecto avanza de nuevo a contactado, y luego se convierte o se descarta." |
| 5 | 8 s | Paso 4 · Al ganar — La orden se genera sola | "Cuando marcas una cotización como ganada, se vuelve orden de venta y su orden de producción se crea sola. Es el mismo trabajo que avanza: no vuelves a teclear nada." |
| 6 | 8 s | Paso 5 · Producción por pieza | "En el taller sigues cada pieza por separado. Las propias pasan por diseño, impresión y acabado; las tercerizadas pasan por compras. El taller nunca ve precios." |
| 7 | 8 s | Paso 6 · Cobro — Seguimiento de cobro | "En cada orden marcas el cobro: no facturado, facturado y cobrado, con sus fechas. Es seguimiento, no una factura fiscal, y lo llevan administración y ventas." |
| 8 | 8 s | Paso 7 · Proveedores y precios | "Cargas las listas de precios de tus proveedores desde Excel: descargas la plantilla, la llenas, la subes y confirmas. El comparador te muestra el más barato por papel y cuánto ahorras." |
| 9 | 8 s | Paso 8 · Inventario — Papel bajo control | "El inventario descuenta el papel al terminar una orden y te avisa cuando un material baja de su mínimo." |
| 10 | 8 s | Un solo sistema, todo el circuito | "Cotizar, ganar, producir por pieza y cobrar, con proveedores e inventario detrás. Reabre esta guía cuando quieras con el botón de interrogación del menú." |

## Cómo regenerar el video

Se grabó con Chromium (headless) capturando la reproducción de la presentación:

```bash
# Requiere playwright-core y el Chromium/ffmpeg de Playwright (PLAYWRIGHT_BROWSERS_PATH).
node capacitacion/record.js   # abre capacitacion.html, graba ~80 s → .webm
```

El ffmpeg incluido en Playwright solo produce **webm/VP8**. Para obtener un `.mp4`
(por ejemplo para WhatsApp), convierte el webm con un ffmpeg completo:

```bash
ffmpeg -i capacitacion.webm -c:v libx264 -pix_fmt yuv420p -movflags +faststart capacitacion.mp4
```

Para editar el contenido, cambia las escenas en `capacitacion.html` (array de
`<section class="scene">`) y vuelve a grabar. Mantén la coherencia con la visita
guiada (`src/app/_components/VisitaGuiada.tsx`).
