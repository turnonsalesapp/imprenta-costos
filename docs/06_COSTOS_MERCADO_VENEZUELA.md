# Costos de referencia — mercado venezolano

> Investigación para afinar los parámetros base. En Venezuela **casi no hay
> tarifarios públicos** de imprenta (se cotiza por WhatsApp/MercadoLibre), así que
> cada valor va etiquetado por su **fuente y confianza**. Todo en USD a tasa BCV.

## Fuentes

- **Catálogo Digital Print — Revendedores 2025** (provisto por el taller): lista
  mayorista real venezolana, "Precios a BCV". Ancla gran formato, DTF y POP.
- **RUPACA** (rupaca.com) — insumos de la industria gráfica en Venezuela: ojetes
  cromados por caja de 1.000.
- **MercadoLibre Venezuela** — pendones y ojetes con ojales (referencia de precio
  de venta al público, no de costo).
- **globoimpresores.com** (VE) — planchas metálicas CTP 1/4 para offset.

Nota: varias páginas (ML, RUPACA, globo) bloquean la lectura automática (403) o
cargan el precio por JavaScript; los rangos de abajo combinan lo visible con la
estructura de costos conocida del sector.

## Parámetros y propuesta

| Parámetro | Valor actual | Rango de mercado (VE) | Confianza | Fuente |
|---|--:|---|:--:|---|
| **Ojete instalado** | **$0,80** | proveedor: $0,80 · en casa: $0,10–0,25 | Alta | Digital Print pág. 3 (tercerizado) |
| Gran formato — banner/vinil m² | (catálogo) | — | Alta | Digital Print 2025 |
| POP — chapas/llaveros/DTF | (catálogo) | — | Alta | Digital Print 2025 |
| **Offset — plancha** | $4 | $1,5–3 poliéster · $3–6 CTP metal 1/4 | Media | globoimpresores (VE) |
| **Offset — arranque/cara** | $12 | $8 – 18 | Baja | Estructura del sector (sin lista pública) |
| **Offset — millar/pasada** | $5 | $3 – 8 | Baja | Estructura del sector |
| **Prensa 4 colores** (millar/arr.) | $8 / $18 | — | Baja | Estimado (prensa grande) |
| **Prensa 2 colores** | $5 / $12 | — | Baja | Estimado |
| **Prensa 1 color** | $3 / $8 | — | Baja | Estimado |

### Lo que quedó afinado con datos reales
- **Ojete → $0,80.** El catálogo Digital Print (pág. 3, "Accesorios para Banner")
  cobra la instalación del ojete a **$0,80 c/u (incluye refilado)**. Como gran
  formato se **terceriza con Digital Print**, ese es el costo base correcto. (Si
  el taller instalara los ojetes en casa, el material RUPACA sale en centavos y
  podría bajarse a ~$0,10–0,20 en Variables.) Se corrigió el $0,20 previo.
- **Gran formato y POP** vienen del catálogo Digital Print 2025 → son los reales.

### Lo que sigue como estimado (a confirmar con el taller)
El **offset** es producción propia y **no tiene tarifario público** en Venezuela:
depende de la prensa, la plancha (poliéster vs CTP metal), la tinta y la labor de
cada taller. Los valores actuales son un punto de partida coherente:

- **Plancha $4** — sirve para poliéster de formato pequeño; si usan **CTP metálico**
  súbanlo a ~$8–10.
- **Arranque y millar por prensa** — la relación es la correcta (prensa grande =
  pasada más cara pero imprime todo de una; prensa de 1 color = pasada barata pero
  un full color son 4 pasadas). Las **magnitudes** hay que calibrarlas con:
  1. costo real de una plancha de su proveedor,
  2. cuántos pliegos bota de arranque (merma de registro),
  3. cuánto cuesta correr 1.000 pliegos (tinta + labor + amortización de la prensa).

Con esos tres números por prensa dejo los valores exactos en Variables (o en una
migración segura que no pisa lo ya ajustado).

## Cómo cambiarlos
Todo es editable en **Variables** sin tocar código:
- *Offset* (plancha, arranque, millar por defecto) y *Ojete gran formato*.
- *Equipos* (cada prensa: colores por pasada, millar y arranque).
- *Gran formato* (materiales por m²) y *Personalizados* (escalas por cantidad).
