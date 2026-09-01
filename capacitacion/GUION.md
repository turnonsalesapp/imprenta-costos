# Video de capacitación — Guion / maqueta

Video de introducción (~80 s, 1280×720) que recorre el circuito completo del
sistema, en línea con la **visita guiada in-app** (botón «?» del menú). Se rinde a
partir de `capacitacion.html` (presentación auto-reproducible, una escena cada 8 s).

> **Estado:** el video **aún no está renderizado**. Por ahora solo existen la
> presentación `capacitacion.html` y el script `record.js`; el `.webm`/`.mp4` se
> genera corriendo el render (ver "Cómo regenerar el video").

- **Fuente:** `capacitacion/capacitacion.html` (self-contained, sin dependencias).
- **Render (pendiente):** `capacitacion.webm` (VP8, 1280×720). Reproduce en navegadores y móviles.
- **Voz en off (narración):** el texto "Narración" de cada escena; grábalo con la
  voz del negocio si quieres una versión locutada.

## Escenas

| # | Dur | En pantalla (título) | Narración (voz en off) |
|---|-----|----------------------|------------------------|
| 1 | 7 s | El sistema de la imprenta, de punta a punta | "Este es el recorrido completo de tu taller: cotizar cada tipo de trabajo, ganar, producir por pieza y cobrar." |
| 2 | 7 s | Paso 1 · Cotizar — Elige el tipo | "Todo empieza cotizando. Cada trabajo se cotiza según su tipo: Digital, Offset, Gran formato, Proveedor o Personalizado. Una cotización puede combinar varios." |
| 3 | 7 s | Cotizar · Digital | "Digital, para tirajes cortos: producto y medida, cantidad, papel y acabados. El sistema arma el montaje y sugiere el corte más barato." |
| 4 | 7 s | Cotizar · Offset | "Offset, para tiraje alto: pliego y montaje, tintas y planchas, papel y millares. Reparte el costo fijo y protege tu utilidad." |
| 5 | 7 s | Cotizar · Gran formato | "Gran formato, para lonas y vinilos: material, ancho por alto y cantidad; se calcula por metro cuadrado, con sus acabados." |
| 6 | 7 s | Cotizar · Proveedor | "Proveedor, cuando el trabajo lo hace un tercero: registras su costo y le aplicas tu margen. El cliente ve un solo precio." |
| 7 | 7 s | Cotizar · Personalizado | "Personalizado, para lo que no encaja: escribes líneas de costo libres y el sistema suma y aplica el margen." |
| 8 | 7 s | Paso 2 · Cotizaciones en Lista o Tablero | "Ves tus cotizaciones como lista o tablero; arrastras cada una entre columnas: borrador, pendiente, enviada, ganadas o perdidas." |
| 9 | 7 s | Paso 3 · CRM — Prospectos y reuniones | "En el CRM registras oportunidades y agendas reuniones y seguimientos. El prospecto avanza de nuevo a contactado, y se convierte o se descarta." |
| 10 | 7 s | Paso 4 · Al ganar — La orden se genera sola | "Cuando marcas una cotización como ganada, su orden de producción se crea sola. El mismo trabajo que avanza, sin recapturar nada." |
| 11 | 7 s | Paso 5 · Producción por pieza | "En el taller sigues cada pieza por separado: las propias por el taller, las tercerizadas por compras. El taller nunca ve precios." |
| 12 | 7 s | Paso 6 · Cobro — Seguimiento de cobro | "En cada orden marcas el cobro: no facturado, facturado y cobrado, con sus fechas. Es seguimiento, no una factura fiscal." |
| 13 | 7 s | Paso 7 · Comentarios y adjuntos | "En la cotización y en la orden dejas comentarios y adjuntas archivos: imágenes de referencia, la cotización del proveedor, PDFs. El taller también participa, sin ver precios." |
| 14 | 7 s | Paso 8 · Proveedores y precios | "Cargas las listas de tus proveedores desde Excel, confirmas la vista previa, y el comparador te muestra el más barato por papel y cuánto ahorras." |
| 15 | 7 s | Paso 9 · Inventario — Papel bajo control | "El inventario descuenta el papel al terminar una orden y te avisa cuando un material baja de su mínimo." |
| 16 | 7 s | Un solo sistema, todo el circuito | "Cotizar por tipo, ganar, producir por pieza y cobrar, con proveedores, inventario y el hilo de cada trabajo. Reabre la guía con el botón de interrogación del menú." |

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
guiada (`src/app/_components/Tour.tsx`, con `BotonGuia.tsx`).
