# Auditoría de módulos de cálculo

> Corrida con los **motores reales** del sistema (`src/lib/calculo*.ts`) sobre los
> datos de la semilla. Reproducible con `npx tsx scripts/auditoria.ts`.
>
> **Parámetros comunes:** margen 30 %, comisión 3 %, ML 12 %, tasa BCV 473,
> Binance 659,71/658,01 → **diferencial automático ≈ 1,3929**. Todos los precios
> en USD (el cliente paga el equivalente en Bs a la tasa BCV).

El sistema tiene **6 líneas de cotización**, cada una con su motor de costo, pero
todas comparten la misma **cola de precio** (`precioDesdeCosto`): diferencial →
costo protegido → utilidad protegida → margen → comisión.

| Línea | Motor | Producción | Unidad de costo |
|---|---|---|---|
| Digital | `calcular` | Propia | corte de pliego + acabados |
| Offset | `calcularOffset` | Propia | pliego + planchas + arranque + millar |
| Gran formato impresión | `calcularGF` | Tercerizada | m² del material |
| Gran formato productos | `calcularProductoGF` | Tercerizada | unidad (precio fijo) |
| Personalizados / POP | `calcularPop` | Tercerizada | escalas por cantidad / metro lineal |
| Proveedor | `precioDesdeCosto` | Tercerizada | costo total que da el tercero |

---

## 1) Digital — producción propia

Los 10 trabajos más comunes (capacidad calculada por montaje real):

| Trabajo | Cant | Cap | Cortes | Costo tot | Costo u | Precio u | Venta tot |
|---|--:|--:|--:|--:|--:|--:|--:|
| Sticker troquelado 5×5 | 1.000 | 54 | 19,6 | $108,35 | $0,1083 | $0,2485 | $248,47 |
| Tarjeta presentación 9×5 | 1.000 | 30 | 35,0 | $15,30 | $0,0153 | $0,0351 | $35,08 |
| Volante media carta | 2.000 | 8 | 257,5 | $152,55 | $0,0763 | $0,1749 | $349,83 |
| Volante carta full color | 1.000 | 8 | 128,8 | $156,41 | $0,1564 | $0,3587 | $358,69 |
| Postal 10×15 | 500 | 9 | 57,7 | $21,96 | $0,0439 | $0,1007 | $50,36 |
| Etiqueta producto 6×4 | 3.000 | 55 | 56,6 | $124,16 | $0,0414 | $0,0949 | $284,74 |
| Invitación 12×12 | 200 | 6 | 35,0 | $15,30 | $0,0765 | $0,1754 | $35,08 |
| Menú A4 laminado | 100 | 9 | 12,4 | $35,85 | $0,3585 | $0,8222 | $82,22 |
| Separador libro 5×18 | 500 | 12 | 43,3 | $17,72 | $0,0354 | $0,0813 | $40,63 |
| Flyer cuarto carta | 5.000 | 8 | 643,8 | $189,43 | $0,0379 | $0,0869 | $434,43 |

## 2) Offset — producción propia

| Trabajo | Cant | Col | Cap | Pliegos | Planchas | Costo tot | Costo u | Precio u |
|---|--:|:--:|--:|--:|--:|--:|--:|--:|
| Volante ½ carta 4/0 | 5.000 | 4/0 | 16 | 323 | 4 | $96,76 | $0,0194 | $0,0444 |
| Volante carta 4/4 | 10.000 | 4/4 | 8 | 1.288 | 8 | $277,56 | $0,0278 | $0,0637 |
| Tarjeta presentación 4/0 | 1.000 | 4/0 | 120 | 10 | 4 | $59,20 | $0,0592 | $0,1358 |
| Afiche carta 4/0 | 2.000 | 4/0 | 8 | 258 | 4 | $88,96 | $0,0445 | $0,1020 |
| Díptico A4 4/4 | 3.000 | 4/4 | 9 | 345 | 8 | $152,40 | $0,0508 | $0,1165 |
| Talonario ¼ 2/0 | 5.000 | 2/0 | 32 | 162 | 2 | $56,58 | $0,0113 | $0,0260 |
| Volante ¼ 1/0 económico | 10.000 | 1/0 | 32 | 323 | 1 | $63,07 | $0,0063 | $0,0145 |
| Sobre carta 1/0 | 1.000 | 1/0 | 20 | 52 | 1 | $38,68 | $0,0387 | $0,0887 |
| Volante carta 4/0 corto | 500 | 4/0 | 8 | 65 | 4 | $65,80 | $0,1316 | $0,3018 |
| Revista pág. interior 4/4 | 20.000 | 4/4 | 9 | 2.290 | 8 | $409,80 | $0,0205 | $0,0470 |

**Lectura:** offset solo gana a digital con volumen. Una tarjeta a 1.000 sale
$0,1358 en offset vs **$0,0351 en digital** (4×) por el peso de planchas +
arranque. El volante ¼ a 10.000 sale $0,0145 en offset — imbatible por digital.
El modelo refleja bien el punto de cruce.

## 3) Gran formato — impresión (por m²)

| Trabajo | Cobro | Cant | m² fact | Ojetes | Costo tot | Precio u | Precio m² |
|---|:--:|--:|--:|--:|--:|--:|--:|
| Banner 13oz 2×1 m | mancha | 1 | 2,00 | 15 | $26,00 | $59,63 | $29,81 |
| Banner 13oz 3×1 m | mancha | 1 | 3,00 | 20 | $37,00 | $84,85 | $28,28 |
| Banner blackout 2×1 | mancha | 1 | 2,00 | 15 | $28,00 | $64,21 | $32,11 |
| Banner mesh 4×2 | mancha | 1 | 8,00 | 30 | $104,00 | $238,50 | $29,81 |
| Backlight caja de luz 1×0.5 | mancha | 2 | 1,00 | 0 | $8,00 | $9,17 | $18,35 |
| Vinil estándar 1.5×1 | rollo | 1 | 1,50 | 0 | $10,50 | $24,08 | $16,05 |
| Vinil microperforado 2×1 | rollo | 1 | 2,00 | 0 | $22,00 | $50,45 | $25,23 |
| Vinil vidriera 1×2 m | rollo | 1 | 2,10 | 0 | $14,70 | $33,71 | $16,05 |
| Banner reciclaje 1×1 | mancha | 5 | 5,00 | 50 | $70,00 | $32,11 | $32,11 |
| Vinil holográfico 1×0.5 | rollo | 1 | 0,64 | 0 | $8,26 | $18,93 | $29,81 |

## 4) Gran formato — productos terminados (por unidad)

| Producto | Categoría | Cant | Costo u | Costo tot | Precio u | Venta tot |
|---|---|--:|--:|--:|--:|--:|
| Pendón 40×60 | Pendón | 5 | $5,00 | $25,00 | $11,47 | $57,33 |
| Pendón 60×90 | Pendón | 5 | $8,50 | $42,50 | $19,49 | $97,46 |
| Pendón 80×120 | Pendón | 5 | $12,00 | $60,00 | $27,52 | $137,60 |
| Pendón 100×140 | Pendón | 5 | $16,00 | $80,00 | $36,69 | $183,46 |
| Roll Up estructura 85×200 | Roll Up | 1 | $45,00 | $45,00 | $103,20 | $103,20 |
| Roll Up + Banner Blackout | Roll Up | 1 | $65,00 | $65,00 | $149,06 | $149,06 |
| Araña + Banner 13oz 60×160 | Araña | 1 | $30,00 | $30,00 | $68,80 | $68,80 |
| Araña + Banner 13oz 80×170 | Araña | 1 | $35,00 | $35,00 | $80,26 | $80,26 |
| Araña + Banner UV 60×160 | Araña | 1 | $35,00 | $35,00 | $80,26 | $80,26 |
| Araña + Banner UV 80×170 | Araña | 1 | $45,00 | $45,00 | $103,20 | $103,20 |

## 5) Personalizados / Material POP

| Producto | Categoría | Modo | Base | Costo tot | Precio u | Venta tot |
|---|---|:--:|---|--:|--:|--:|
| Chapa prendedor | Chapa | escalas | 50 × $2,10 | $105,00 | $4,82 | $240,79 |
| Chapa llavero liso | Chapa | escalas | 50 × $3,50 | $175,00 | $8,03 | $401,32 |
| Chapa destapador | Chapa | escalas | 50 × $4,00 | $200,00 | $9,17 | $458,66 |
| Bolígrafo 3 en 1 (sublimado) | Bolígrafo | escalas | 50 × $3,20 | $160,00 | $7,34 | $366,93 |
| Llavero acrílico transparente | Llavero | escalas | 50 × $2,00 | $100,00 | $4,59 | $229,33 |
| Llavero acrílico metalizado | Llavero | escalas | 50 × $2,20 | $110,00 | $5,05 | $252,26 |
| Llavero MDF | Llavero | escalas | 50 × $1,80 | $90,00 | $4,13 | $206,40 |
| DTF UV | DTF | lineal | $30/m · 100 cm | $30,00 | $68,80 | $68,80 |

## 6) Proveedor — tercerizado (se parte del costo del tercero)

| Trabajo | Cant | Costo tot | Costo u | Precio u | Venta tot |
|---|--:|--:|--:|--:|--:|
| Encuadernado 100 libros | 100 | $250,00 | $2,50 | $5,73 | $573,32 |
| Sellos de goma ×50 | 50 | $75,00 | $1,50 | $3,44 | $172,00 |
| Bordado gorras ×30 | 30 | $120,00 | $4,00 | $9,17 | $275,19 |
| Termo sublimado ×20 | 20 | $90,00 | $4,50 | $10,32 | $206,40 |
| Franelas DTF ×50 | 50 | $200,00 | $4,00 | $9,17 | $458,66 |
| Trofeos acrílico ×10 | 10 | $150,00 | $15,00 | $34,40 | $343,99 |
| Carnets PVC ×100 | 100 | $120,00 | $1,20 | $2,75 | $275,19 |
| Imán nevera ×200 | 200 | $160,00 | $0,80 | $1,83 | $366,93 |
| Corte CNC MDF letrero | 1 | $80,00 | $80,00 | $183,46 | $183,46 |
| Cajas plegadizas ×500 | 500 | $400,00 | $0,80 | $1,83 | $917,31 |

---

## Hallazgos — ¿hay fallas en el modelo?

Los motores están **correctos aritméticamente** (verificado a mano y contra el
contrato Jugarte). Los hallazgos son de **modelado**, no de bugs de cálculo, y se
ordenan por impacto.

### A. Escalas no monótonas no se validan — Personalizados 🔴
El catálogo de **Chapa llavero liso** es `1:4.2, 12:3.4, **50:3.5**, 100:2.6`:
comprar **50 unidades ($3,50 c/u) sale más caro por unidad que comprar 49 ($3,40)**.
El motor reproduce fielmente el error del proveedor, pero **no avisa**. Un vendedor
puede cotizar 50 sin notar que 49 es más barato.
**Arreglo:** validar en `crearProductoPop`/`editarProductoPop` que los tramos sean
monótonos decrecientes (warning, no bloqueo, porque a veces el catálogo es así), y
en la calculadora sugerir "a 49 u el costo baja a $3,40".

### B. El ancho de rollo puede quedar por debajo de la pieza — Gran formato 🟡
`calcularGF` hace `anchoCobro = max(anchoPieza, anchoRollo)`. Si se elige un rollo
más angosto que la pieza (ej. pieza 150 cm con rollo 105), **cobra 150 y no el rollo
real de 152** que físicamente se usaría, y no avisa que 105 no alcanza. La UI lo
mitiga con `sugerirRollo`, pero el motor no lo garantiza.
**Arreglo:** en modo `ancho_rollo`, forzar el rollo al **menor disponible ≥ pieza**
(o marcar error si la pieza excede el rollo más ancho).

### C. Offset: el costo de impresión no depende del nº de colores 🟡
`impresión = millares × costoMillar × caras`. **No multiplica por colores.** Es
correcto **solo si la prensa es 4+ colores** (una pasada imprime todo). En una prensa
de **1 o 2 colores**, un trabajo 4/0 son 4 pasadas → el millar debería multiplicarse
por (colores ÷ colores-por-pasada). Hoy un 1/0 y un 4/0 del mismo tiraje cuestan
**lo mismo en impresión** (solo cambian las planchas).
**Arreglo:** agregar en Variables "colores por pasada de prensa" (ej. 1, 2 o 4) y
cobrar `millares × costoMillar × ceil(colores/porPasada) × caras`.

### D. Offset: la merma es porcentual, no arranque fijo de pliegos 🟡
El arranque real de offset **desperdicia una cantidad casi fija** de pliegos (típico
100–250) para calibrar registro y color, sin importar el tiraje. El motor usa
`pliegos = base × (1+merma%)`, que **subestima el desperdicio en tiros cortos** y lo
sobreestima en tiros muy largos. En "Volante carta 4/0 corto" (500 u, 65 pliegos) el
desperdicio real de arranque puede ser mayor que los pliegos útiles.
**Arreglo:** sumar a los pliegos un **arranque fijo en hojas** por cara (config
`offMermaHojas`), además del % de merma de corrida.

### E. DTF lineal no aprovecha el ancho (57 cm) 🟡
`calcularPop` (lineal) cobra `largo × precio/m` sin considerar cuántas piezas caben a
lo **ancho** de los 57 cm. Un logo de 10×10 cm se cobra igual ocupando 100 cm de
largo que si se "gangara" en filas de 5. **Sobrecobra piezas pequeñas.**
**Arreglo (Fase 2 de POP):** permitir "piezas por ancho" o un montaje que divida el
metraje entre las piezas que entran en 57 cm.

### F. El diferencial se aplica **dos veces** y de forma asimétrica 🟢 (por diseño, a confirmar)
`costoProt = costo × dif` (una vez) pero `utilProt = utilidad × dif` donde
`utilidad = costoProt × m/(1-m)` → la utilidad lleva **dif²**. Efecto: el margen
efectivo costo→precio es **~2,3×** (a 30 %). Es la regla del negocio (se vende a BCV
pero se repone a paralelo) y está verificada contra Jugarte, **pero se aplica igual a
las líneas tercerizadas**, donde el costo del proveedor a veces ya está "duro" (en
USD paralelo). Ahí protegerlo con `dif` puede **sobreproteger**.
**Acción:** confirmar con el negocio si en Proveedor/Gran formato/POP el costo del
tercero está en BCV o en paralelo. Si está en paralelo, esas líneas deberían usar
`dif = 1` (o un dif menor). Es una **decisión de negocio**, no un bug.

### G. Montaje de una sola orientación (Digital/Offset) 🟢
`calcCapacidad` prueba las dos orientaciones de la **pieza**, pero coloca todo en una
grilla uniforme; no mezcla orientaciones por región ni corta en bloques. Por eso
algunas capacidades salen algo **conservadoras** (ej. tarjeta 9×5 da 30 y no ~35).
Subcotiza piezas por pliego → **sube el costo** ligeramente (a favor del taller, no
del cliente).
**Arreglo (opcional):** montaje mixto (n piezas en una orientación + m en la otra).

### H. Sin costo de diseño ni mínimos de venta 🟢 (todas las líneas)
Ningún motor suma **diseño/arte** ni impone un **mínimo de facturación**. El catálogo
del proveedor dice "no incluye diseño" en casi todo. Trabajos chicos (invitación 200
u → venta $35) pueden quedar por debajo del piso rentable del taller.
**Arreglo:** acabado/rubro "Diseño" (por trabajo) ya es posible en Digital/Offset vía
acabados `trabajo`; falta un **mínimo de venta configurable** que avise igual que el
margen mínimo.

---

## Estado (decisiones del negocio)

| # | Hallazgo | Decisión | Estado |
|---|---|---|---|
| A | Escalas no monótonas | Rediseñar escalas que **motiven volumen** + empujón "sube a X" | ✅ Resuelto |
| C | Offset no cuenta colores | **Definir equipos (prensas) en Variables**; el offset usa las pasadas del equipo | ✅ Resuelto |
| B | Ancho de rollo | **No forzar**; se elige de la lista estándar de anchos | ✔️ Por diseño |
| F | Diferencial doble | **Dejar así** | ✔️ Por diseño |
| D | Merma offset | (no priorizado) | ⏸️ |
| E | DTF ancho | Dejar así | ⏸️ |
| G | Montaje 1 orientación | Dejar así | ⏸️ |
| H | Diseño / mínimo venta | Dejar así | ⏸️ |

**A — resuelto:** las escalas de la semilla ahora **siempre bajan** al subir la
cantidad (se corrigió *Chapa llavero*: 50 u pasó de $3,50 → **$3,00**) y suman
tramos 250/500 para empujar pedidos grandes. La calculadora muestra un empujón
"💡 subiendo a X u el precio baja a $Y". Crear un producto con escalas que suban
queda **bloqueado** (deben motivar el volumen).

**C — resuelto:** nuevo catálogo **Equipos** en Variables (nombre, colores por
pasada, millar y arranque). En offset se elige la prensa y el costo de impresión
se multiplica por las **pasadas = ⌈colores ÷ colores por pasada⌉**: un 4/0 en una
prensa de 1 color cuesta 4× la impresión de una prensa de 4 colores (las planchas
no cambian: una por color). Semilla: prensa de 4, 2 y 1 color.

## Prioridad recomendada (histórica)

1. **A** — Validación de escalas monótonas (barato, evita cotizar de más al cliente).
2. **C** y **D** — Precisión de offset (colores por pasada + arranque en hojas): son
   los que más distorsionan el costo real de la línea nueva.
3. **B** — Clamp del ancho de rollo al disponible ≥ pieza.
4. **F** — Decisión de negocio sobre el diferencial en líneas tercerizadas.
5. **E**, **G**, **H** — Mejoras de afinamiento (Fase 2).

Ninguno es un error de cálculo: son **supuestos del modelo** que conviene explicitar
y afinar con los números del taller.

---

## Módulos nuevos (Fases 1–3): comercial, producción por pieza y proveedores

Estas fases **no tocan la cola de precio** ni los seis motores de costo de arriba:
son de **flujo** (comercial → producción) y de **origen de datos** (de dónde sale el
precio del papel). Se documentan aquí porque cambian cómo se mueve un trabajo por el
sistema y extienden el invariante TALLER-sin-precios.

### Fase 1 — Comercial (`lib/crm.ts`, `lib/cotizaciones.ts`)
- **Handoff automático.** Al pasar una cotización a **APROBADA** (= Orden de Venta),
  `cambiarEstadoCotizacion` llama a `generarOrden` si la cotización aún no tiene orden.
  Es *best-effort*: si es 100 % tercerizada o hay una carrera de doble aprobación, el
  fallo se registra y **no** rompe el cambio de estado. El botón "Generar orden" del
  detalle queda como respaldo manual.
- **Estado `PENDIENTE`** (pendiente de aprobación) entre BORRADOR y ENVIADA. Colores de
  estado al estándar: gris=borrador, ámbar=pendiente, azul=enviada, verde=ganada,
  rojo=perdida, naranja=vencida (`EstadoBadge`).
- **Kanban de cotizaciones** (toggle Lista/Tablero con arrastrar/soltar) y **CRM**
  (`/crm`): tablero de prospectos (NUEVO→CONTACTADO→CONVERTIDO/DESCARTADO) y actividades.
  Sin dinero en juego: son datos comerciales, no cálculo.

### Fase 2 — Producción por pieza (`lib/ordenes.ts`)
- Cada ítem de la cotización se convierte en una **`PiezaOrden`** con su carril:
  **INTERNO** (Digital/Offset → taller: en cola de diseño → en diseño → esperando arte
  → en impresión → en acabado → lista) o **TERCERIZADO** (gran formato / proveedor /
  personalizado → compras: por cotizar → comprado → recibido → entregado). Antes los
  ítems tercerizados **no** se controlaban en producción; ahora sí.
- **Dos gobiernos de estado de orden** conviven sin pisarse: las órdenes con etapas las
  lleva `recomputarEstadoOrden` (por etapas, que además descuenta papel al terminar); las
  100 % tercerizadas (sin etapas) las lleva `recomputarEstadoOrdenPorPiezas` (por estado
  de las piezas). Sin esto último, una orden solo de compras nacía PENDIENTE y no salía
  nunca del tablero.
- **Estado de cobro** de la orden (`EstadoCobro`: No facturado → Facturado → Cobrado, con
  fechas), gestionado por ADMIN/VENDEDOR. Es **solo seguimiento**, no una factura fiscal.
- **Invariante TALLER-sin-precios extendido a piezas** 🟢: el tablero por pieza usa
  `SELECT_PIEZA_TABLERO`, que —como `SELECT_PROD`— **jamás** selecciona una columna de
  dinero, y el `snapshot` de cada pieza es `ItemProd` (sin precios). El rol TALLER puede
  **mover piezas** (`requireUsuario`) pero sigue sin ver un solo número. Probado en
  `seguridad.test.ts`.

### Fase 3 — Proveedores y listas de precios (`lib/proveedores.ts`, `lib/proveedores-excel.ts`)
- **Comparador por papel:** normaliza cada lista a **precio de resma** (`precioAResma`
  desde resma/hoja/millar), marca el más barato y el **ahorro potencial** frente al precio
  efectivo. Puro y testeable (`proveedores.test.ts`).
- **Precio efectivo:** cada papel tiene un **proveedor preferido** (o el **predeterminado**
  global) cuyo precio se copia a `Papel.precio`. Importar su lista o fijar preferido
  actualiza el precio efectivo; **el motor de cálculo no cambia** (sigue leyendo `precio`).
- **Importación Excel** (`exceljs`): plantilla pre-rellenada con el catálogo (columna
  `Clave` para emparejar), carga de la lista de un proveedor y **vista previa (diff:
  sube/baja/igual/nuevo/sin_papel)** antes de confirmar. La aplicación es atómica
  (`$transaction`): filas inválidas (precio ≤ 0, unidad/hojas mal) se descartan sin
  romper el catálogo.

**Observaciones de modelado (no bugs):**
- **I. Sobreprotección tercerizada, ahora visible en producción** 🟢 — el hallazgo **F**
  (diferencial aplicado a líneas tercerizadas) no cambia con estas fases, pero ahora esas
  piezas se ven en el tablero (carril tercerizado) y el **precio efectivo** del papel abre
  la puerta a decidir el costo real por proveedor. Sigue siendo decisión de negocio.
- **J. `Papel.precio` como dato derivado** 🟢 — el precio efectivo es una **copia** del
  preferido, no una vista calculada: si se edita el papel a mano en Variables, puede
  quedar desalineado de la lista del proveedor hasta la próxima importación o cambio de
  preferido. Es a propósito (el motor no debe recalcular listas), pero conviene saberlo.
