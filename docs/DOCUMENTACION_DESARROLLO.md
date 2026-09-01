# Documentación de Desarrollo — Sistema de Costos y Producción (Imprenta)

**Producto:** aplicación web interna de cotización, costeo y producción para
imprenta (*Altoprint* — Producciones AP2024, C.A.). Single-tenant, es-VE.
**Este documento** es la referencia técnica completa: arquitectura, motores de
cálculo (fórmulas exactas), modelo de datos, flujos de cotización, seguridad,
subsistemas de apoyo, despliegue, pruebas y **decisiones de diseño documentadas**.

> Contraparte funcional para el usuario final:
> [DOCUMENTACION_USUARIO.md](DOCUMENTACION_USUARIO.md).

---

## Índice

1. [Stack y principios](#1-stack)
2. [Arquitectura por capas](#2-arquitectura)
3. [El motor de precio compartido `precioDesdeCosto`](#3-precio)
4. [Motor digital `calcular`](#4-digital)
5. [Motor offset `calcularOffset`](#5-offset)
6. [Motores de gran formato](#6-granformato)
7. [Motor de personalizados `calcularPop`](#7-pop)
8. [Modelo de datos (Prisma)](#8-datos)
9. [Flujos de cotización y sistema de ítems mezclados](#9-flujos)
10. [Formularios y factorías](#10-forms)
11. [Server actions y rutas](#11-actions)
12. [Órdenes de producción e inventario](#12-ordenes)
13. [Seguridad](#13-seguridad)
14. [Configuración, variables y snapshot](#14-config)
15. [Tasas de cambio](#15-tasas)
16. [Catálogos y datos semilla](#16-catalogos)
17. [Intérprete de IA](#17-ia)
18. [Rutas de API](#18-api)
19. [Variables de entorno](#19-env)
20. [Migraciones y despliegue](#20-migraciones)
21. [Pruebas](#21-pruebas)
22. [Decisiones de diseño documentadas](#22-decisiones)
23. [Reglas de oro y convenciones](#23-reglas)

---

## 1. Stack

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | **Next.js 15** (App Router) + **React 19** | Server Components + Server Actions; grupo de rutas `(app)` |
| Lenguaje | **TypeScript** `strict: true` | tipos obligatorios |
| Base de datos | **PostgreSQL** en **Railway** | vía Prisma |
| ORM | **Prisma 6** | `binaryTargets = ["native","debian-openssl-3.0.x"]` para Railway |
| Estilos | **Tailwind CSS** + CSS propio (`cotizar/calc.css`) | |
| Autenticación | **jose** (JWT HS256) + tabla `Sesion` | cookie httpOnly; revocación en BD |
| Hashing | **bcryptjs** | seed cost 10; login y `crearUsuario` cost 12 (también el señuelo anti-timing) |
| Validación | **zod** | clientes, usuarios, inventario, salida IA |
| IA (opcional) | **@anthropic-ai/sdk** (Claude) | intérprete de solicitudes |
| Pruebas | **vitest** | **108 pruebas** en 11 archivos |
| Despliegue | Railway (`railway.json`) | build + migraciones (preDeploy) + healthcheck |

**Principios rectores**

- **Ningún precio se calcula fuera de los motores** (`src/lib/calculo*.ts`). El
  mismo motor puro corre en el cliente (vista previa en vivo) y en el servidor
  (cálculo autoritativo al guardar).
- **Un solo puente `Decimal`→`number`** (`src/lib/config.ts`). Prisma devuelve
  `Decimal`; el motor trabaja con `number`; la conversión ocurre **solo ahí**.
- **`server-only`** en todo `src/lib/*.ts` de acceso a datos.
- **Cotización inmutable con snapshot**: se congela lo usado para calcularla y se
  lee de lo guardado, nunca se recalcula.
- **TALLER sin dinero**, estructural (ver [§13](#13-seguridad)).

---

## 2. Arquitectura

Dependencias en una sola dirección (arriba → abajo):

```
Middleware Edge (src/middleware.ts)
  Barrera barata: exige token de sesión firmado y vigente.
        │
Páginas (Server Components) · src/app/(app)/**/page.tsx
  requireRol(...) / requireUsuario() antes de renderizar.
   │ props (sin dinero para TALLER)        │ acciones
   ▼                                       ▼
Componentes cliente (calculadoras)   Server Actions · src/app/actions/*.ts
  cálculo EN VIVO                     requireRol + recálculo autoritativo
                                             │
                              Repositorios (server-only) · src/lib/*.ts
                              cotizaciones, ordenes, inventario, clientes…
                                  │                        │
                         config.ts (puente)          calculo*.ts (MOTORES)
                         Decimal → number             puros, sin BD ni UI
                                  │
                               db.ts (PrismaClient singleton)
```

- **Motores puros** (`calculo.ts`, `calculo-offset.ts`, `calculo-granformato.ts`,
  `calculo-personalizado.ts`): sin React ni Prisma. Garantizan que el número que ve
  el vendedor sea el que se guarda.
- **Puente único** (`config.ts`): `cargarConfig()` es el único que convierte
  `Decimal`→`number` y arma el `Config` que el motor espera.

---

## 3. Precio

`precioDesdeCosto(costoTotal, cant, params)` (`src/lib/calculo.ts`) es **la función
más importante del sistema**: convierte un costo en un objeto `Precio` completo.
**Todos** los motores la llaman al final, así que la protección cambiaria, el margen
y la comisión son uniformes en toda la app.

```ts
costoUnit  = cant > 0 ? costoTotal / cant : 0
binProm    = (binCompra + binVenta) / 2                 // paralelo promedio
difAuto    = tasaBCV > 0 ? binProm / tasaBCV : 1        // diferencial cambiario
dif        = difManual ? (dif || 1) : difAuto
costoProt  = costoUnit * dif                            // costo protegido (×dif una vez)
m          = clamp(margen/100, 0, 0.95)
utilidad   = costoProt * (m / (1 - m))                  // margen SOBRE el precio
utilProt   = utilidad * dif                             // utilidad protegida (×dif otra vez)
precioSinCom = costoProt + utilProt
com        = clamp(comision/100, 0, 0.9)
precioCalc = com > 0 ? precioSinCom / (1 - com) : precioSinCom   // comisión "grossed up"
precioUnit = precioManual > 0 ? precioManual : precioCalc
ventaTotal = precioUnit * cant
precioML   = precioUnit * (1 + ml/100)                  // recargo ML, sumado encima
precioBs   = precioUnit * tasaBCV                       // cliente paga a BCV
gananciaTotal = ventaTotal - costoTotal                 // sobre el costo CRUDO
```

**Notas clave**

- **Diferencial cambiario doble.** Venezuela tiene doble tasa: BCV (oficial) y
  paralelo/Binance. Los costos se pagan a base BCV, pero reponer material exige
  comprar dólares a paralelo. El diferencial `dif = binProm / tasaBCV` (≈1,3929 en
  el caso verificado) se aplica **dos veces**: al costo (`costoProt`) y a la utilidad
  (`utilProt`), preservando en valor real tanto el capital en material como la
  ganancia. Si `dif = 1`, el mecanismo es un no-op.
- **Margen sobre el precio, no sobre el costo:** `utilidad = costoProt·m/(1−m)`.
- **Comisión descontada del precio:** `precio/(1−c)`, no sumada al costo.
- **`precioBs` vende a BCV** mientras el costo se protege a paralelo: ese spread es
  justo lo que la doble protección defiende.
- **`gananciaTotal` usa el costo crudo** (`costoTotal`), no el protegido, así que
  incluye margen + colchón del diferencial. No es la ganancia "pura".

Tipos: `ParamsPrecio` (entradas comunes), `Precio` (salida completa), `LineaCosto`
(`{k, label, detalle, monto}`). Helpers numéricos es-VE: **`n(v)`** (parsea con coma
decimal, nunca NaN → 0), **`fmtNum(v,d)`**, **`usd(v,d)`**, **`bs(v,d)`**.

---

## 4. Digital

`calcular(f, cfg)` en `src/lib/calculo.ts`. Unidad de costo: el **corte** de pliego.

**Geometría y consumo:**
```ts
tam    = TAMANOS.find(id === f.tamano) ?? 1/4 Pliego
frac   = tam.frac                       // Pliego 1 · 1/2 0.5 · 1/4 0.25 · 1/8 0.125
factor = frac / 0.25                    // las tarifas se refieren a 1/4 de pliego
precioPliego = papel.precio / max(1, papel.hojas)
precioCorte  = precioPliego * frac
pliegosBase  = ceil(cant / cap)         // cap = piezas por corte (montaje)
pliegos      = pliegosBase * (1 + merma)   // NO se re-redondea (fraccional)
millares     = ceil(pliegos / 1000)
```

- **Montaje** `calcCapacidad(w,h,W,H,pinza,sep)`: prueba las **dos orientaciones**,
  descuenta pinza en los bordes y `sep` entre piezas, devuelve la capacidad mayor.
- **`medidaCorte(medida, frac)`**: parte el pliego a la mitad por el lado más largo
  tantas veces como `log2(1/frac)`.
- **`TAMANOS_DIGITAL`** = tamaños con `frac ≤ 0.25` (la digital imprime máx 1/4).

**Líneas de costo:** papel (`pliegos · precioCorte`) + cada acabado activo según su
`unidad`:
- `pliego`: `pliegos · base · esc · q`, con `esc = area→factor · min→max(1,factor) ·
  fija→1`.
- `elemento`: `cant · base · q` (por pieza).
- `millar`: `millares · base · q` (por mil **cortes**).
- `trabajo`: `base · q` (fijo).

`costoTotal = Σ monto` → `precioDesdeCosto(costoTotal, cant, f)`. Resultado extiende
`Precio` con `frac, factor, precioPliego, precioCorte, pliegosBase, pliegos, piezas,
millares, lineas`.

---

## 5. Offset

`calcularOffset(f)` en `src/lib/calculo-offset.ts`. Modelo: "digital + planchas +
arranque + corrida por millar". El arte se monta en el **pliego**.

```ts
frac    = (TAMANOS.find(id === f.tamano) ?? Pliego).frac   // por defecto pliego completo
[W,H]   = medidaCorte(f.medida, frac)
cap     = capacidadManual || calcCapacidad(...) || 1
pliegosBase = ceil(cant / cap)
pliegos     = ceil(pliegosBase * (1 + merma))              // SÍ se redondea a pliegos enteros
millaresImp = ceil(pliegos / 1000)

caras     = f.caras >= 2 ? 2 : 1
colores   = round(f.colores)
nPlanchas = colores * caras                                // una plancha por color y cara
pasadas   = ceil(colores / coloresPasada)                  // del equipo/prensa
```

**Líneas de costo:**
1. **Papel:** `pliegos · (precioPliego · frac)`.
2. **Planchas:** `nPlanchas · costoPlancha` (costoPlancha según tamaño: 1/4, 1/2 o
   pliego).
3. **Arranque:** `costoArranque · caras` (una vez por cara).
4. **Impresión:** `millaresImp · costoMillar · pasadas · caras`.
5. **Tinta:** `millaresImp · costoTinta · colores · caras`.
6. **Acabados:** mismo esquema que digital, sobre `catalogoAcab` (acabados con
   `modulo === "offset"`), `factor = frac/0.25`.

`costoTotal = Σ` → `precioDesdeCosto`. Resultado añade `cap, capAuto, cols, filas,
rot, corteW, corteH, frac, pliegosBase, pliegos, millaresImp, colores, caras,
nPlanchas, pasadas, lineas`.

> Diferencia clave con digital: en offset `pliegos` **se redondea** a pliegos
> enteros; en digital queda fraccional.

---

## 6. Granformato

`src/lib/calculo-granformato.ts`. Unidad de costo: el **m²** del material. Tres
funciones:

**`calcularGF(f)` — impresión por m²:**
```ts
anchoCobroCm = modoCobro === "ancho_rollo"
  ? max(anchoCm, anchoRollo>0 ? anchoRollo : anchoCm)   // cobra el ancho del rollo
  : anchoCm                                             // "mancha": solo el área impresa
areaFactM2   = (anchoCobroCm * altoCm / 10000) * cant
costoMaterial = areaFactM2 * costoM2
ojetesPorPieza = ojetesAuto ? ojetesPorPerimetro(anchoCm, altoCm, ojeteCm) : n(ojetes)
costoOjetes  = ojetesPorPieza * cant * ojeteCosto
```
`ojetesPorPerimetro = max(4, round(2·(ancho+alto) / sep))` (mínimo 4, las esquinas).
`precioM2Venta = ventaTotal / areaFactM2` (referencia).

**`calcularEtiquetaGF(f)` — etiquetas por lámina de montaje:**
```ts
uds        = unidadesMontaje (por tamaño, de la tabla del material)
montajes   = ceil(cant / uds)                  // láminas necesarias
areaFactM2 = montajes * areaMontajeM2(montaje)  // "125x70" cm → m²
costoMaterial = areaFactM2 * costoM2
```
El costo se reparte entre las etiquetas **pedidas**.

**`calcularProductoGF(f)` — producto terminado:** `costoTotal = costoUnit · cant`
(costo fijo de catálogo, sin cálculo de área).

Las tres terminan en `precioDesdeCosto`. Dimensiones en **centímetros**.

---

## 7. POP

`calcularPop(f)` en `src/lib/calculo-personalizado.ts`. Dos modos:

**`escalas`** (precio por tramo de volumen):
```ts
escalas       = parseEscalas("1:3.5,12:2.2,50:2.1,100:1.5")   // ordenadas asc por 'desde'
costoUnitBase = precioEscala(escalas, cant)   // precio del tramo más alto con desde ≤ cant
costoTotal    = costoUnitBase * cant
```

**`lineal`** (por metro, ancho fijo, mínimo):
```ts
facturableCm  = max(largoCm, minCm)           // impone el largo mínimo
costoUnitBase = (facturableCm/100) * precioLineal    // costo de UNA pieza
costoTotal    = costoUnitBase * cant
```

`precioEscala` devuelve el precio del tramo cuyo `desde ≤ cant` más alto (por debajo
del primer tramo aplica el primero). Resultado añade `costoUnitBase, facturableCm,
lineas, escalas`.

### Resumen cruzado de motores

| Motor | Unidad | Driver de `costoTotal` | Pliegos enteros | Mecánica propia |
|---|---|---|---|---|
| Digital `calcular` | corte | papel + acabados | fraccional | `factor=frac/0.25`; millar = mil cortes |
| Offset `calcularOffset` | pliego | papel + planchas + arranque + impresión + tinta + acabados | **sí** | planchas=colores·caras; pasadas=⌈colores/coloresPasada⌉ |
| GF `calcularGF` | m² | material + ojetes | qty | mancha vs ancho_rollo; ojetes ≥4 |
| GF etiqueta | m² | láminas · areaMontaje · costoM2 | láminas | tabla de rendimiento |
| GF producto | unidad | `costoUnit·cant` | — | costo fijo de catálogo |
| POP `calcularPop` | tramo / metro | `costoUnitBase·cant` | — | escalas vs lineal con mínimo |

Todos: `lineas[] → costoTotal = Σ monto → precioDesdeCosto(costoTotal, cant, f)`.

---

## 8. Datos

`prisma/schema.prisma`. Datasource PostgreSQL; generator con `binaryTargets` para
Railway. Todas las `DateTime` con `@db.Timestamptz(3)`; dinero en `Decimal`.

**El detalle campo por campo, las relaciones (FK duras vs enlaces suaves) y las
máquinas de estado viven ahora en el documento autoritativo
[MODELO_DATOS.md](MODELO_DATOS.md).** Aquí solo el mapa de conjunto.

**24 modelos · 11 enums**, en cinco áreas:

- **Acceso** — `Usuario`, `Sesion`.
- **Catálogo** — `Papel`, `Proveedor`, `PrecioProveedorPapel`, `Acabado`,
  `MaterialGF`, `ProductoGF`, `ProductoPop`, `Equipo`, `Config`.
- **Comercial** — `Cliente`, `Prospecto`, `Actividad`, `Trabajo`, `Cotizacion`.
- **Producción** — `Orden`, `EtapaOrden`, `PiezaOrden`, `MovimientoInventario`.
- **Transversal** — `Comentario`, `Adjunto` (hilo del trabajo, sin precios),
  `RegistroAuditoria`, `Tasa`.

**Enums (11):** `Rol` (`SUPERADMIN`, `ADMIN`, `VENDEDOR`, `TALLER`),
`EstadoCotizacion` (7: `BORRADOR`, `PENDIENTE`, `APROBADA`, `ENVIADA`, `GANADA`,
`RECHAZADA`, `VENCIDA`), `TipoCotizacion` (`PROPIA`, `PROVEEDOR`, `GRAN_FORMATO`,
`PERSONALIZADO`, `OFFSET`, `MIXTA`), `EstadoOrden`, `EstadoEtapa`, `TipoMovimiento`,
`CarrilPieza` (`INTERNO`/`TERCERIZADO`), `EstadoPieza`, `EstadoCobro`,
`ProspectoEstado`, `ActividadTipo`.

**Invariantes que atraviesan el esquema:**

- `Cotizacion` es el documento **inmutable con snapshot**: guarda `entrada`,
  `snapshot`, `lineas` congelados, un array `items` con cada ítem por separado (cada
  uno con su `tipo`) y columnas agregadas de dinero para el listado/CSV.
- `Orden` es **1:1** con la cotización; su `items` (proyección de producción) va
  **sin dinero**, y cada ítem se materializa además en una `PiezaOrden` (ver
  [§12](#12-ordenes)).
- El **hilo del trabajo** (`Comentario`/`Adjunto`, en cascada desde `Cotizacion` y
  `Prospecto`) no lleva precios: es seguro para TALLER.
- `RegistroAuditoria` es **solo-agregar**, salvo la purga por rango de fechas
  reservada a SUPERADMIN, que deja su propio rastro (ver [§13](#13-seguridad)).

---

## 9. Flujos

`src/lib/cotizaciones.ts` (server-only). Una `Cotizacion` es un **contenedor de
ítems tipados**, inmutable y con snapshot.

**Principio de autoridad del servidor.** Las calculadoras del cliente calculan solo
para la vista previa. Al guardar, el servidor **vuelve a correr el motor correcto por
ítem** y congela el resultado; los números del cliente nunca se confían. Para los
tercerizados (gran formato, personalizados) el servidor **re-lee el costo del
catálogo** en la BD, así el precio es autoritativo sin importar qué envió el
navegador.

**Tipo derivado del documento:** si todos los ítems comparten tipo, la cotización
toma ese tipo; si difieren, es `MIXTA` (`armarMixta`). `ETIQUETA_TIPO` mapea a las
etiquetas de UI; nota que **`PROPIA` se muestra como "Digital"**.

**Constructores por tipo** (`datosItem`/`datosCotizacion` digital, `datosProveedor`,
`datosGranFormato`/`datosProductoGF` vía `armarGranFormato`, `datosPersonalizado`,
`datosOffset`): cada uno arma `{...result, data}` con `tipo`, `entrada`, `snapshot`,
`lineas` y columnas de dinero. `datosOffset` también arma un `items:[item]` para que
el offset fluya por el mismo camino de taller/impresión que el digital.

**CRUD por tipo:** `crear*`, `actualizar*` (exige `estado==="BORRADOR"`),
`cargar*EnForm(id, "copia"|"editar")` (rehidrata el `entrada` a un form; "copia"
agrega "(copia)" y limpia `editarId`, "editar" fija `editarId=id`).

**Sistema mixto:**
- `ItemMixto` — ítem normalizado de cualquier tipo (siempre con `tipo`).
- `itemDeData` — extrae un `ItemMixto` del `data` que produjo cualquier motor.
- `ItemBorrador = { tipo, form }`.
- **`construirItemMixto`** — el switch autoritativo: por `tipo` llama al constructor
  correcto y normaliza. Aquí el servidor re-deriva los números de cada ítem.
- **`armarMixta`** — agrega N ítems: deriva `tipo` (único o `MIXTA`), suma dinero,
  une líneas de acabado, y guarda `itemsStore` **conservando el `form` crudo** de
  cada ítem para poder reeditar.
- `construirMixta` → `crearCotizacionMixta` / `actualizarCotizacionMixta` (exige
  BORRADOR).
- `cargarMixtaEnDraft` — lee una mixta BORRADOR de vuelta al carrito del cliente
  `{meta, items:[{tipo, form, resumen}]}` (motor del botón **Editar**).

**Carrito cliente** `src/lib/draft-cotizacion.ts` (localStorage, clave
`"cotizacion-draft"`, evento `"draft-cotizacion-cambio"`): `Draft = {meta, items}`;
`agregarItemDraft`, `quitarItemDraft`, `actualizarMetaDraft`, `vaciarDraft`,
`cargarDraft`, y el hook reactivo `useDraft()` (usado por `PanelBorrador` y
`RevisarCotizacion`).

**Semántica Orden de Venta:** `esOrdenVenta(estado)` = true si `GANADA`;
`etiquetaDocumento` devuelve "Orden de Venta" vs "Cotización" — una cotización
**ganada** *es* la orden de venta (mismo registro, mismo número). `APROBADA` es solo
la aprobación **interna** previa a enviar; **no** dispara producción.

**Ciclo de vida completo:** calculadora (vista previa) → carrito (opcional,
`agregarItemDraft`) → guardar (`guardar*Action` o `guardarMixtaAction`, el servidor
recomputa) → ver (`obtenerCotizacion`, nunca recalcula) → editar (solo BORRADOR) →
estados (`BORRADOR→PENDIENTE→APROBADA→ENVIADA→GANADA`, con salidas `RECHAZADA`
(="Perdida") / `VENCIDA`) → generar orden de producción (solo **GANADA**).

---

## 10. Forms

`src/lib/cotizacion-form.ts` (puro, compartido cliente+servidor). Formas de
formulario y su traducción a `Entrada` del motor:

- `FormCotizacion` (digital), `FormProveedor` (`costoModo` total/unitario,
  `totalProveedor` es la única fuente del costo efectivo), `FormGranFormato`
  (`modo` impresion/producto, `modoCobro`, etiquetas), `FormPersonalizado`
  (`modo` escalas/lineal), `FormOffset` (prensa `equipoId`, colores, planchas,
  tinta).
- Factorías `nuevoForm*` — forms en blanco sembrados con los defaults de `Config`.
  `nuevoFormOffset` recibe además `OffsetDefaults`.
- `formAEntrada` — extrae del `FormCotizacion` solo los campos del motor.
- Todas las formas con dinero comparten la "cola financiera" (`margen, comision, ml,
  tasaBCV, binCompra, binVenta, difManual, dif, precioManual`) → misma lógica de
  diferencial/margen.

---

## 11. Actions

`src/app/actions/cotizaciones.ts` — todas con `requireRol("ADMIN","VENDEDOR")`. Cada
`guardar*Action` mira `form.editarId`: si hay → `actualizar*`, si no → `crear*`; al
éxito `redirect(/cotizaciones/{id})`, al fallo devuelve `{error}`.

- `guardarCotizacionAction(items)` (digital, array), `guardarProveedorAction`,
  `guardarGranFormatoAction`, `guardarPersonalizadoAction`, `guardarOffsetAction`,
  `guardarMixtaAction(borrador)`.
- **Permisos por tipo (servidor):** cada `guardar*Action` veta con
  `puedeCotizarTipo(usuario, tipo)` antes de escribir; la mixta valida **cada** ítem
  del borrador. El error se devuelve como `{error}` (no basta con esconder botones).
- `cargarEnCotizadorAction(id, modo)` — envuelve `cargarCotizacionEnDraft` para los
  botones **Editar / Usar como base** del listado (client → server action → carga el
  borrador en el cotizador unificado).
- `cambiarEstadoAction` — valida contra `ESTADOS`, cambia estado, escribe auditoría
  (`"cotizacion.estado"`), revalida.
- `eliminarCotizacionAction` — `requireRol("ADMIN","VENDEDOR")` + guard
  `puedeEliminarCotizaciones(usuario)`; borrado inteligente.
- `generarOrdenAction` (`src/app/actions/ordenes.ts`) → `generarOrden` → redirige a
  `/taller/{ordenId}`.

**Rutas** `src/app/(app)/`: `cotizar` (Digital; `?trabajo=`/`?desde=`/`?editar=`),
`cotizar-offset`, `cotizar-proveedor`, `cotizar-granformato`, `cotizar-personalizado`
(todas con `?desde=`/`?editar=`), `cotizacion-nueva` (revisar el carrito mixto,
`RevisarCotizacion`), `cotizaciones` (listado + CSV), `cotizaciones/[id]` (detalle
congelado + `imprimir/`).

**Comparadores y PanelBorrador** (`cotizar/Calculadora.tsx`, `cotizar/PanelBorrador.tsx`):
recalculan en el cliente desde el form activo. `Comparador por cantidad` (default
`"500, 1000, 3000, 5000, 10000"`), `Comparador por margen` (default
`"20, 25, 30, 35, 40"`), sugeridor de tamaño. `PanelBorrador` usa `useDraft()`, lista
el carrito y ofrece quitar/vaciar/"Revisar / guardar"; el **agregar** vive en cada
calculadora.

---

## 12. Ordenes

`src/lib/ordenes.ts`.

- **`esProducible(tipo, cotTipo)`** — al taller solo van ítems `PROPIA` u `OFFSET`;
  los tercerizados se excluyen.
- **`ORDEN_ETAPAS`** (clave → orden): `prueba:0, planchas:5, arranque:6, impTiro:10,
  impRetiro:11, impresion:12, lamTiro:20, lamRetiro:21, troqDig:30, troquel:31,
  troquelado:32, pegado:40, acetato:41, guillotina:50`.
- **`generarOrden(cotizacionId)`** — exige `estado==="GANADA"` y que no exista ya
  orden; crea **una `PiezaOrden` por cada ítem** de la cotización; deriva etapas de la
  unión de líneas de acabado de los ítems producibles (dedup por `k`, ordenadas);
  guarda `proyeccionProd(producibles)` **sin dinero** en `Orden.items`; crea las
  etapas.
- **Producción por pieza (Fase 2).** `carrilDe(tipo)` clasifica cada ítem en un
  **carril**:
  - **`INTERNO`** — `PROPIA`/`OFFSET` (lo producible): va al **taller**, nace
    `EN_COLA` y avanza por etapas
    (`EN_COLA→EN_DISENO→ESPERANDO_ARTE→EN_IMPRESION→EN_ACABADO→LISTA`).
  - **`TERCERIZADO`** — `GRAN_FORMATO`/`PROVEEDOR`/`PERSONALIZADO`: va a **compras**,
    nace `POR_COTIZAR` y avanza sin etapas
    (`POR_COTIZAR→COMPRADO→RECIBIDO→ENTREGADO`).

  Cada pieza guarda su `snapshot` de producción **sin precios** (`proyeccionProd`
  del ítem) y su `estadoCobro` (`NO_FACTURADO`/`FACTURADO`/`COBRADO`). `cambiarEstadoPieza`
  mueve la tarjeta en el tablero; para las órdenes **100 % tercerizadas** (sin etapas)
  el estado de la orden lo recalcula `recomputarEstadoOrdenPorPiezas`.
- **`proyeccionProd`** — proyecta cada ítem a `ItemProd` con solo campos de
  producción (`titulo, descripcion, cantidad, ancho, alto, tamano, papelNombre,
  capacidad, pliegos, acabados`); ninguna columna de dinero se copia.
- **`marcarEtapa` / `recomputarEstadoOrden`** — al quedar todas las etapas
  `LISTA`/`OMITIDA` la orden pasa a `TERMINADA`, fija `cerradaEn` y llama
  `descontarPorOrden` (descuenta papel una sola vez).

**Inventario** `src/lib/inventario.ts` — stock en **pliegos completos**,
denormalizado en `Papel.stock`, con cada cambio en `MovimientoInventario`.
`registrarEntrada`/`ajustarStock`/`descontarPorOrden` usan transacciones con
`SELECT … FOR UPDATE` (`bloquearStock`). `descontarPorOrden` es **idempotente**:
re-verifica `inventarioAplicado` bajo el lock. `planConsumo(cot)` (puro): cada ítem
descuenta su papel = `pliegos × frac(tamano)`.

---

## 13. Seguridad

**Autenticación** (`src/lib/auth.ts`, `src/lib/jwt.ts`):
- Cookie `imp_sesion`, httpOnly, `sameSite lax`, `secure` en prod, maxAge 30 días.
- Token JWT HS256 (`jose`) con payload `{sid, rol}` firmado con `AUTH_SECRET` (lanza
  si falta). `SESION_DIAS=7` (ventana de inactividad en BD), `COOKIE_DIAS=30`.
- `getUsuario()` es la **verdad de fondo**: verifica el token, busca la `Sesion` por
  `sid`, y devuelve null si no existe, venció (borra la fila) o el usuario está
  inactivo. **Sesión deslizante:** extiende `expiraEn` con la actividad.
- `requireUsuario()` (redirige a `/login`), `requireRol(...)` (redirige a `/` si el
  rol no aplica). La `Sesion` incluye los permisos de cotización (`puedeCotizar`,
  `tiposCotizar`, `puedeEliminar`), leídos **frescos de la BD en cada request**, de
  modo que un cambio de permiso surte efecto sin re-login (igual que activar/rol).
- `iniciarSesion` compara bcrypt contra un **señuelo válido** (cost 12) cuando el
  usuario no existe, para no filtrar por tiempo qué correos existen; error genérico
  idéntico en todos los casos.

**Autorización** (`src/lib/roles.ts`, módulo puro): `puedeVerPrecios(rol) = rol !==
"TALLER"`; `puedeAdministrar(rol) = esAdmin(rol)`. Hay **cuatro roles**: `SUPERADMIN`,
`ADMIN`, `VENDEDOR`, `TALLER`. **`SUPERADMIN` es superconjunto de `ADMIN`**: toda
comprobación de "es administrador" pasa por `esAdmin(rol) = ADMIN || SUPERADMIN`, y
además el SUPERADMIN **purga la bitácora de auditoría** (ver más abajo). `ROLES` y
`rolesAsignables(actor)` gobiernan quién asigna qué: **solo un SUPERADMIN puede
otorgar o quitar el rol SUPERADMIN**; un ADMIN gestiona ADMIN/VENDEDOR/TALLER. El
primer SUPERADMIN se crea por fuera con `npm run db:promover-superadmin <correo>`
(`scripts/promover-superadmin.ts`), porque desde la app solo un SUPERADMIN puede
crear otro.

**Permisos de cotización por usuario** (`src/lib/roles.ts`): `tiposQuePuedeCotizar(u)`
(ADMIN → todos; TALLER → ninguno; VENDEDOR → `tiposCotizar`, vacío = todos, salvo que
`puedeCotizar` sea false), y encima `puedeCotizarTipo`, `puedeCotizar` y
`puedeEliminarCotizaciones(u)` (ADMIN siempre; VENDEDOR según `puedeEliminar`). Se
aplican en el servidor (actions) y en la UI (cotizador, listado, detalle, nav). El
ADMIN los edita en **Usuarios** vía `cambiarPermisos` (auditoría `"usuario.permisos"`).

**Invariante TALLER-sin-precios** (estructural, no cosmético) — vive en
`src/lib/ordenes.ts` (**no hay `seguridad.ts`**, solo `seguridad.test.ts`):
1. **`proyeccionProd`** copia solo campos en lista blanca; ninguna columna de dinero.
   Alimenta tanto `Orden.items` como el `snapshot` de cada **`PiezaOrden`**, que por
   tanto también nace sin precios.
2. **`SELECT_PROD`** (consulta de la orden que usa el taller) nunca selecciona una
   columna monetaria; su equivalente para el tablero de piezas es
   **`SELECT_PIEZA_TABLERO`**, que expone `carril/tipo/titulo/cantidad/estado/…` pero
   **ninguna** columna de dinero de la pieza.
3. El invariante se extiende al **hilo del trabajo** (`Comentario`/`Adjunto`) y a las
   **piezas**: nada de lo que ve el taller lleva precio, costo ni margen.
4. **`seguridad.test.ts`** recorre `SELECT_PROD` (y `SELECT_PIEZA_TABLERO`) y falla si
   aparece cualquier columna de `COLUMNAS_PROHIBIDAS`; alimenta `proyeccionProd` con
   dinero y verifica que nada sobrevive; afirma `puedeVerPrecios("TALLER") === false`.

**Middleware Edge** (`src/middleware.ts`): barrera barata sin BD — verifica la firma
del token; rutas públicas `/login`, `/api/health`, `/api/tasas/refresh`; API sin
sesión → `401 JSON`, páginas → redirect. No comprueba rol ni revocación (eso es de
`getUsuario`).

**Otras defensas** (ver `docs/02_ANALISIS_ESTANDARES_CODIGO.md` para el detalle):
inmutabilidad + snapshot; secretos fuera del repo y leídos desde `src/lib/env.ts`;
SQL parametrizado por Prisma; **rate limiting** (`src/lib/rate-limit.ts`: login por
IP/correo, IA por usuario); **auditoría** solo-agregar (`RegistroAuditoria`) — la única
escritura destructiva es la **purga por rango de fechas** (`purgarAuditoria`,
`src/lib/auditoria.ts`), reservada a **SUPERADMIN** y que deja su propio rastro
(acción `"auditoria.purga"` con el rango y el total borrado); cron de tasas protegido
por `CRON_SECRET`; CI con tipos + pruebas + build.

---

## 14. Config

`src/lib/config.ts` y `src/lib/variables.ts` leen la fila única `Config`
(`id:"global"`).

- **`cargarConfig()`** (config.ts) — **único puente BD→motor**: config global +
  papeles y acabados **activos**, con `Decimal`→`number`. Solo para cotizar HOY.
- **`obtenerConfig()`** (variables.ts) — escalares editables para el form de admin.
- **`snapshot(cfg)`** — congela papeles, acabados y variables en la cotización.
- **`actualizarConfig(d)`** — upsert; si cambió alguna tasa, agrega fila a `Tasa`.

**Parámetros de negocio (campo · default · significado):**

| Campo | Default | Significado |
|---|--:|---|
| `merma` | 3 | % de merma de papel |
| `margen` | 30 | % de margen sobre el precio |
| `comision` | 3 | % de comisión del vendedor |
| `ml` | 12 | % de recargo MercadoLibre |
| `tasaBCV` | (473) | tasa oficial BCV (Bs/USD) |
| `binCompra` | (659,71) | paralelo compra |
| `binVenta` | (658,01) | paralelo venta |
| `pinza` | 5 | mm no imprimible por borde |
| `sep` | 3 | mm entre piezas |
| `margenMin` | 15 | % mínimo (avisa si baja) |
| `iva` | 16 | % IVA de la cotización |
| `interpretarIA` | false | interruptor general de la IA |
| `interpretarModelo` | null | modelo de IA elegido |
| `gfOjeteCosto` | 0,8 | USD por ojete de gran formato |
| `gfOjeteCm` | 40 | cm entre ojetes |
| `offPlancha` | 4 | plancha offset 1/4 |
| `offPlanchaMedio` | 7 | plancha 1/2 |
| `offPlanchaPliego` | 12 | plancha pliego |
| `offArranque` | 12 | arranque por cara |
| `offMillar` | 5 | por millar de pliegos, por pasada |
| `offTinta` | 2 | tinta por millar, por color |
| `empresa*` | null | membrete (nombre, RIF, teléfono, dirección, email, web) |

> `merma/margen/comision/ml/tasaBCV/binCompra/binVenta/pinza/sep` fluyen a
> `cargarConfig` y se snapshotean; los de offset/ojete/IVA/margenMin se leen vía
> `obtenerConfig`. `CONFIG_BASE` (datos-base) sí trae los valores de tasas.

**ABM de catálogos** (patrón común, server-only): `listar*` (activos) + `listar*Admin`
(todos) + `crear*`/`editar*`/`alternar*`. **Nunca se borra, solo se desactiva**; la
`clave` se genera `nombre + "-" + base36(timestamp)`; `P2002` → "ya existe".

---

## 15. Tasas

`src/lib/tasas.ts`, `src/app/api/tasas/refresh/route.ts`, `.../debug/route.ts`.
**No hay** `api/tasas/route.ts`.

- **Fuente:** `TASAS_API` (default `https://ve.dolarapi.com/v1/dolares`). Sin token.
- **`fetchTasasExternas()`** — `cache:"no-store"`, timeout 8 s, **nunca lanza**
  (best-effort; si falla, se conserva la última tasa). Parser tolerante a dos formas
  (arreglo dolarapi u objeto pydolarve). La fuente da **un solo** paralelo →
  `binCompra` y `binVenta` quedan iguales (la distinción solo existe manual).
- **`/api/tasas/refresh?token=$CRON_SECRET`** — GET `force-dynamic`; sin
  `CRON_SECRET` responde 403 (deshabilitado); al éxito hace
  `actualizarConfig({...cfg, tasaBCV, binCompra, binVenta})` que agrega fila a `Tasa`.
- **`/api/tasas/debug`** — solo ADMIN; muestra url, status y cuerpo crudo (3000
  chars) para depurar el parseo.
- **Histórico:** cada cambio inserta una fila `Tasa`; `historicoTasas(limite)`.

---

## 16. Catalogos

`src/lib/datos-base.ts` — datos **semilla** (`npm run db:seed`), lista de papel
fechada `2025-10-16`. Tras sembrar, todo vive en la BD y se edita en Variables.

- **`PAPELES_BASE`** — 43 papeles (verificados contra la hoja original en
  `datos-base.test.ts`).
- **`ACABADOS_BASE`** — 23 acabados (**13 digital + 10 offset**). Los digital sin
  `modulo` (default digital), los offset con `modulo:"offset"`. Ej. digital:
  `impTiro/impRetiro`, `lamTiro/lamRetiro`, `troqDig`, `troquel/troquelMedio/troquelComplejo`
  (grupo `troquel`), `troquelado` (millar), `pegado`/`acetato` (elemento), `guillotina`,
  `prueba`. Ej. offset: `off-guillotina`, `off-laminado`, `off-barniz` (UV),
  `off-barniz-lito`, `off-doblez`, `off-engrapado`, `off-numerado`,
  `off-pegado-acetato`, `off-pegado-caja`, `off-encuadernado`.
- **`MATERIALES_GF_BASE`** — 47 materiales (Banner, Vinil, UV, Etiquetas…). Las
  etiquetas comparten tres tablas de rendimiento (`ETQ_A` 125×70, `ETQ_B` 115×70,
  `ETQ_C` 50×90).
- **`PRODUCTOS_GF_BASE`** — 20 productos terminados (pendones, roll-ups, arañas,
  estructuras, stands, accesorios).
- **`PRODUCTOS_POP_BASE`** — 8 productos POP; escalas **siempre decrecientes** (ver
  decisión A). Incluye DTF UV (lineal, $30/m, ancho 57 cm, mín 30 cm).
- **`EQUIPOS_BASE`** — 3 prensas: `prensa-4c` (4 col/pasada, $8/$18), `prensa-2c`
  (2, $5/$12), `prensa-1c` (1, $3/$8).
- **`CONFIG_BASE`** — `merma:3, margen:30, comision:3, ml:12, tasaBCV:473,
  binCompra:659.71, binVenta:658.01, pinza:5, sep:3`.

`prisma/seed.ts` hace upsert por `clave` de cada catálogo, crea una fila `Tasa`
inicial y el **admin por defecto** (`ADMIN_EMAIL`/`ADMIN_PASSWORD`, `rol ADMIN`,
bcrypt cost 10).

---

## 17. IA

`src/lib/interpretar.ts` — parsea texto libre del cliente en un **borrador**
estructurado. **No guarda nada**; el vendedor revisa y carga. Todo en el servidor;
la clave nunca llega al navegador (el texto sí se envía a Anthropic).

- **SDK/modelo:** `@anthropic-ai/sdk`, `messages.create`, `max_tokens: 2000`.
  Resolución de modelo: elección del admin → env `ANTHROPIC_MODEL` →
  `MODELO_IA_DEFAULT` = **`claude-opus-4-8`** (`src/lib/modelos-ia.ts`; opciones
  `claude-sonnet-5`, `claude-haiku-4-5`).
- **Gating:** `interpretarDisponible()` (hay API key) + `interpretarActivo(usuarioId)`
  (interruptor global `Config.interpretarIA` con override por usuario). Nunca activo
  sin API key.
- **Salida estructurada:** `output_config.format: json_schema` + `EsquemaSolicitud`
  (Zod) que valida por `safeParse`. Extrae (todo nullable, con `dudas` en vez de
  inventar): `cliente, trabajo, descripcion, cantidad, anchoMm/altoMm` (siempre a mm),
  `tamano` (exacto o null), `papelClave` (exacto o null), `imprimeTiro/imprimeRetiro`,
  `acabados` (claves exactas), `notas`, `dudas`, `confianza` (por bloque).
- **Guardas:** rechaza texto <3 o >5000 chars; JSON tolerante (cae a "cargar a
  mano"); descarta cualquier `papelClave`/`acabados` que no exista en el catálogo real
  (agrega una duda).

---

## 18. API

- **`/api/health`** — `SELECT 1`; 200 `{ok, db}` o 503. Healthcheck de Railway.
- **`/api/resumen`** — resumen del dashboard, filtrado por rol en el servidor (401 si
  no autenticado; TALLER no ve dinero).
- **`/api/cotizaciones/export`** — CSV `;` + BOM UTF-8 + CRLF (Excel-es), gated por
  `puedeVerPrecios` (403 para taller), filtros `q`/`estado`.
- **`/api/tasas/refresh`**, **`/api/tasas/debug`** — ver [§15](#15-tasas).

---

## 19. Env

`src/lib/env.ts` — getters perezosos, edge-safe; `verificarEnv()` valida con Zod sin
lanzar (para CI/arranque). Los módulos leen `env`, **no** `process.env`.

| Variable | Obligatoria | Para qué |
|---|:--:|---|
| `DATABASE_URL` | **Sí** | PostgreSQL. En Railway `${{Postgres.DATABASE_URL}}`; en local la pública (`rlwy.net`). |
| `AUTH_SECRET` | **Sí** | Firma de tokens JWT. Mismo valor en local y Railway. No arranca sin ella. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | seed | Primer admin en `db:seed`. |
| `ANTHROPIC_API_KEY` | Opcional | Habilita la IA; sin ella la función queda oculta. |
| `ANTHROPIC_MODEL` | Opcional | Respaldo del modelo (se elige en Variables). |
| `CRON_SECRET` | Opcional | Protege el refresco de tasas; "" lo deshabilita. |
| `TASAS_API` | Opcional | Fuente de tasas (default dolarapi). |

`AUTH_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

---

## 20. Migraciones

- **Generadas offline** (el entorno de desarrollo no tiene salida a la BD de
  producción): `npx prisma migrate diff --from-schema-datamodel <anterior>
  --to-schema-datamodel prisma/schema.prisma --script`. **Nunca** se toca la BD a
  mano. Hay **38 migraciones** en `prisma/migrations/` (de `20260721050809_init` a
  `20260820150000_rol_superadmin`); su nombre traza la evolución de features.
- **Railway** aplica las pendientes en `preDeployCommand: npx prisma migrate deploy`
  (`railway.json`) y valida `/api/health` antes de enrutar tráfico. Cada push a la
  rama principal republica.

Comandos: `npm run dev`, `npm run build` (`prisma generate && next build`),
`npm test`, `npm run db:seed`, `npm run db:migrate`, `npm run db:deploy`,
`npx prisma generate`.

---

## 21. Pruebas

`vitest` — **108 pruebas** en 11 archivos:
- `calculo.test.ts` — contrato del motor digital (caso real **Jugarte**: 3.000
  stickers, regla de cortes enteros → 773 cortes, $679,68 costo, $0,2266 unit,
  $1.511,95 venta). No se modifica sin actualizar el test.
- `calculo-offset.test.ts`, `calculo-granformato.test.ts`,
  `calculo-personalizado.test.ts` — los otros motores.
- `datos-base.test.ts` — amarra los 43 papeles y los conteos de acabados
  (13 digital / 10 offset) a la hoja original.
- `seguridad.test.ts` — invariante TALLER-sin-precios (ver [§13](#13-seguridad)).
- `roles-superadmin.test.ts` — jerarquía de roles y `rolesAsignables` (SUPERADMIN).
- `inventario.test.ts` — `planConsumo` y movimientos.
- `proveedores.test.ts` — precios de proveedor de papel.
- `almacenamiento.test.ts` — adjuntos del hilo del trabajo.
- `auth.test.ts` — firma/verificación del token.

`scripts/auditoria.ts` (`npx tsx scripts/auditoria.ts`) corre los motores reales
sobre la semilla y produce la tabla de la [auditoría de módulos](05_AUDITORIA_MODULOS.md).

---

## 22. Decisiones

Decisiones de modelado documentadas (detalle y números en
[05_AUDITORIA_MODULOS.md](05_AUDITORIA_MODULOS.md) y
[06_COSTOS_MERCADO_VENEZUELA.md](06_COSTOS_MERCADO_VENEZUELA.md)):

| # | Tema | Decisión |
|---|---|---|
| **A** | Escalas POP no monótonas cotizaban de más | **Resuelto:** las escalas de la semilla siempre bajan al subir la cantidad; crear un producto con escalas que suban queda **bloqueado**; la calculadora muestra el empujón "sube a X". |
| **C** | Offset no contaba colores en la impresión | **Resuelto:** catálogo **Equipos (prensas)**; la impresión se multiplica por **pasadas = ⌈colores ÷ colores por pasada⌉** (las planchas no cambian: una por color). |
| **B** | Ancho de rollo por debajo de la pieza | **Por diseño:** no se fuerza; se elige de la lista estándar de anchos (`sugerirRollo` propone el menor que cubre). |
| **F** | El diferencial se aplica **dos veces** | **Por diseño:** el negocio vende a BCV pero repone a paralelo; verificado contra Jugarte. Pendiente confirmar si en líneas tercerizadas el costo del tercero ya viene "duro" (en paralelo) → usarían `dif = 1`. |
| **D** | Merma offset porcentual vs arranque fijo en hojas | Pendiente (no priorizado). |
| **E** | DTF lineal no aprovecha el ancho (57 cm) | Dejar así (Fase 2 de POP). |
| **G** | Montaje de una sola orientación | Dejar así (capacidades algo conservadoras, a favor del taller). |
| **H** | Sin costo de diseño ni mínimo de venta | Dejar así; el diseño es posible vía acabado "trabajo"; falta un mínimo de venta configurable. |

Decisiones estructurales adicionales:
- **Ojete a $0,80** (no $0,20): gran formato se terceriza con Digital Print, que
  cobra la instalación del ojete a $0,80 (pág. 3 del catálogo). Si se instalara en
  casa, el material RUPACA baja a centavos y se ajusta en Variables.
- **Acabados de offset con catálogo propio** (`modulo`): los costos son distintos a
  los del digital; no se reutiliza la lista.
- **Digital imprime máx 1/4 de pliego** (`TAMANOS_DIGITAL`).
- **PROPIA se muestra como "Digital"** en el menú y las etiquetas.
- **Alineación con el estándar TOS V2** (multi-tenant) traducida a este proyecto
  single-tenant: el equivalente a "aislamiento por tenant" es el invariante
  TALLER-sin-precios; se documenta lo que **no aplica** (RLS, webhooks de pago,
  function-calling del LLM) en [02_ANALISIS_ESTANDARES_CODIGO.md](02_ANALISIS_ESTANDARES_CODIGO.md).

---

## 23. Reglas

- **Ningún precio se calcula fuera de `src/lib/calculo*.ts`.**
- El rol **TALLER nunca** recibe un precio, costo o margen (probado en
  `seguridad.test.ts`).
- Las cotizaciones son **inmutables** salvo en Borrador; se leen de su `snapshot`.
- **`Decimal`→`number` en un solo lugar** (`src/lib/config.ts`).
- Los cambios de esquema van por **migración** (offline; Railway la aplica en
  preDeploy).
- Los secretos se leen desde **`src/lib/env.ts`**, nunca `process.env` directo.
- **`npm test` en verde siempre** — el caso Jugarte es el contrato con la hoja del
  dueño.
- **Commits semánticos** (`feat:`/`fix:`/`security:`/`refactor:`/`perf:`/`docs:`/
  `test:`/`chore:`) — ver [CONTRIBUTING.md](../CONTRIBUTING.md).

---

*Ver también:
[MODELO_DATOS.md](MODELO_DATOS.md) ·
[02_ANALISIS_ESTANDARES_CODIGO.md](02_ANALISIS_ESTANDARES_CODIGO.md) ·
[04_MANUAL_CONFIGURACION.md](04_MANUAL_CONFIGURACION.md) ·
[05_AUDITORIA_MODULOS.md](05_AUDITORIA_MODULOS.md) ·
[06_COSTOS_MERCADO_VENEZUELA.md](06_COSTOS_MERCADO_VENEZUELA.md) ·
[glosario.md](glosario.md).*
