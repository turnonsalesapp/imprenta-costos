# Especificación Técnica — Sistema de Costos y Producción (Imprenta)

**Producto:** Sistema de cotización, costeo y producción para imprenta (marca *Altoprint* — Producciones AP2024, C.A.).
**Ámbito:** aplicación web interna, un solo taller (single-tenant), en español de Venezuela (es-VE).
**Documento:** especificación técnica y de características. Fuente de verdad del *qué* y del *cómo* del sistema.

---

## 1. Propósito

Calcular el precio de cualquier trabajo de imprenta a partir de la estructura de costos real del taller, guardar el histórico de cotizaciones de forma inmutable y llevar las órdenes de producción hasta el descuento automático de inventario. Todo el dinero del sistema sale de un único motor de cálculo verificado contra la hoja de Excel original.

---

## 2. Stack tecnológico

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | **Next.js 15** (App Router) + **React 19** | Server Components + Server Actions |
| Lenguaje | **TypeScript 5.7**, `strict: true` | tipos obligatorios en todo el código |
| Base de datos | **PostgreSQL** en **Railway** | vía Prisma |
| ORM | **Prisma 6** | `binaryTargets` incluye `debian-openssl-3.0.x` para Railway |
| Estilos | **Tailwind CSS 3.4** + CSS propio (`calc.css`) | |
| Autenticación | **jose** (JWT HS256) + tabla `Sesion` | cookie httpOnly; revocación en BD |
| Hashing | **bcryptjs** (cost 10) | contraseñas |
| Validación | **zod** | parcial (clientes, usuarios, salida IA) |
| IA (opcional) | **@anthropic-ai/sdk** (Claude) | intérprete de solicitudes |
| Excel | **exceljs** | plantilla e importación de listas de precios de proveedores (Fase 3) |
| Tests | **vitest** | 35 pruebas |
| Despliegue | Railway (`railway.json`) | build + migraciones + healthcheck |

---

## 3. Arquitectura por capas

El sistema está organizado en capas con dependencias en una sola dirección (de arriba hacia abajo). **Regla de oro: ningún precio se calcula fuera del motor.**

```
┌──────────────────────────────────────────────────────────────┐
│  Middleware Edge (src/middleware.ts)                          │
│  Barrera barata: exige token de sesión firmado y vigente.     │
└──────────────────────────────────────────────────────────────┘
        │
┌──────────────────────────────────────────────────────────────┐
│  Páginas (Server Components)  ·  src/app/(app)/**/page.tsx    │
│  requireRol(...) / requireUsuario() antes de renderizar.      │
└──────────────────────────────────────────────────────────────┘
   │ props (sin dinero para TALLER)         │ acciones
   ▼                                        ▼
┌──────────────────────┐        ┌──────────────────────────────┐
│ Componentes cliente  │        │ Server Actions               │
│ (calculadoras, forms)│        │ src/app/actions/*.ts         │
│ cálculo EN VIVO       │        │ requireRol + validación      │
└──────────────────────┘        └──────────────────────────────┘
                                          │
                              ┌───────────────────────────────┐
                              │ Repositorios (server-only)    │
                              │ src/lib/*.ts                  │
                              │ cotizaciones, ordenes,        │
                              │ inventario, clientes, …       │
                              └───────────────────────────────┘
                                  │                    │
                    ┌─────────────────────┐   ┌────────────────────┐
                    │ config.ts (puente)  │   │ calculo.ts (MOTOR) │
                    │ Decimal → number    │   │ puro, sin BD ni UI │
                    └─────────────────────┘   └────────────────────┘
                                  │
                            ┌──────────┐
                            │ db.ts    │  PrismaClient singleton
                            └──────────┘
```

**Principios que se derivan de esta arquitectura:**

- **Motor puro** (`src/lib/calculo.ts`): no importa React, ni Prisma, ni nada del navegador. Se usa idéntico en el cliente (cálculo en vivo) y en el servidor (cálculo autoritativo al guardar). Es lo que garantiza que el número que ve el vendedor sea el que se guarda.
- **Puente único BD↔motor** (`src/lib/config.ts`): Prisma devuelve `Decimal`; el motor trabaja con `number`. La conversión ocurre **solo aquí**. Regla explícita para que ninguna pantalla sume `Decimal` como texto.
- **Repositorios `server-only`**: todo `src/lib/*.ts` de acceso a datos lleva `import "server-only"`, lo que impide que se importen por error en un componente cliente y filtren la conexión o los datos.

---

## 4. Modelo de datos (Prisma / PostgreSQL)

Entidades principales (`prisma/schema.prisma`):

| Modelo | Rol | Puntos clave |
|---|---|---|
| **Usuario** | acceso | `rol` (ADMIN/VENDEDOR/TALLER), `passwordHash`, `interpretarIA` (override IA por usuario), permisos de cotización (`puedeCotizar`, `tiposCotizar`, `puedeEliminar`), `verEstructura` (ve costo/margen/desglose, no solo el precio; default `true`) |
| **Sesion** | sesión | token único; permite revocación inmediata |
| **Cliente** | CRM básico | nombre, RIF, contacto; `activo` |
| **Papel** | catálogo/inventario | `clave` estable (la usa el motor), `precio` Decimal, `medida`, `categoria`, `stock`, `stockMin` |
| **MovimientoInventario** | auditoría stock | ENTRADA/SALIDA/AJUSTE, `cantidad` con signo, `saldo`, `ordenId` |
| **Acabado** | catálogo | `clave`, `costo`, `unidad` (pliego/elemento/millar/trabajo), `escala`, `grupo` (excluyentes) |
| **Config** | variables del negocio | fila única `id="global"`: márgenes, tasas, IVA, membrete, `interpretarIA`, `interpretarModelo` |
| **Tasa** | histórico | cada cambio de tasa queda registrado |
| **Trabajo** | plantilla | receta de un trabajo repetido (no guarda precio) |
| **Cotizacion** | documento | `tipo` PROPIA/PROVEEDOR/…/MIXTA, `estado`, `snapshot` congelado, `entrada`, `lineas`, `items`, columnas de dinero |
| **Orden** | producción | 1:1 con cotización aprobada; **sin columnas de dinero**; `inventarioAplicado`; seguimiento de cobro (`estadoCobro`, `fechaFactura`, `fechaCobro`) |
| **EtapaOrden** | taller | una etapa por acabado; estado y responsable; `piezaId` (etapa de una pieza concreta) |
| **PiezaOrden** | producción por pieza | cada ítem de la cotización con su `carril` (INTERNO/TERCERIZADO), `estado` propio y `snapshot` **sin precios**; las etapas internas cuelgan de la pieza (Fase 2) |
| **Proveedor** | catálogo de costos | proveedor de papel; uno `predeterminado` global; guarda sus listas de precios (Fase 3) |
| **PrecioProveedorPapel** | lista de precios | precio vigente de un papel por proveedor (`unidad` resma/hoja/millar), una fila por (papel, proveedor); base del comparador (Fase 3) |
| **Prospecto** | CRM comercial | oportunidad/lead antes de cotizar (NUEVO→CONTACTADO→CONVERTIDO/DESCARTADO); enlace por id, sin FK dura (Fase 1) |
| **Actividad** | CRM comercial | gestión agendada (reunión/llamada/seguimiento/nota) con `fecha` y `hecha` (Fase 1) |
| **Comentario** | hilo del trabajo | comentario anclado a la **cotización** (`cotizacionId`, `onDelete: Cascade`); `autorId?` + `autorNombre` congelado, `texto`, `creadoEn`. **Sin dinero** (Fase 4) |
| **Adjunto** | hilo del trabajo | archivo anclado a la cotización; `nombre`, `tipo` (MIME), `tamano`, `almacen` ("db"/"drive"), `datos` (bytea si "db"), `driveFileId`/`url` (si "drive"). **Sin dinero** (Fase 4) |

**Papel** gana `proveedorPreferidoId` (Fase 3): el `precio` de resma pasa a ser el **precio efectivo** (copia del proveedor preferido, o del predeterminado global) que usa el motor, sin cambiar su firma.

**Enums:** `Rol`, `EstadoCotizacion` (BORRADOR/**PENDIENTE**/ENVIADA/APROBADA/RECHAZADA/VENCIDA), `TipoCotizacion`, `EstadoOrden`, `EstadoEtapa`, `TipoMovimiento`, `CarrilPieza` (INTERNO/TERCERIZADO), `EstadoPieza` (interno: EN_COLA/EN_DISENO/ESPERANDO_ARTE/EN_IMPRESION/EN_ACABADO/LISTA · tercerizado: POR_COTIZAR/COMPRADO/RECIBIDO/ENTREGADO), `EstadoCobro` (NO_FACTURADO/FACTURADO/COBRADO), `ProspectoEstado`, `ActividadTipo`.

---

## 5. El motor de cálculo (`src/lib/calculo.ts`)

Es el corazón del sistema y su comportamiento está **amarrado por pruebas** (`calculo.test.ts`, caso real Jugarte). No se modifica sin actualizar el test.

### 5.1 Flujo de costeo (`calcular`)
1. **Montaje**: cuántas piezas de `ancho×alto` entran en el corte, probando las dos orientaciones y descontando pinza y separación (`calcCapacidad`).
2. **Consumo de papel**: `pliegosBase = ⌈cantidad / piezas_por_corte⌉`, más merma.
3. **Líneas de costo**: papel + cada acabado según su unidad (por corte, por pieza, por millar de cortes, por trabajo) y su escala con el tamaño.
4. **Costo total** → se pasa a la función de precio.

### 5.2 Del costo al precio (`precioDesdeCosto`) — el cálculo "protegido"
Compartido por la cotización propia y la de proveedor:

```
costoUnit  = costoTotal / cantidad
dif        = promedio(binance) / tasaBCV          (diferencial cambiario)
costoProt  = costoUnit × dif                       ← costo protegido
utilidad   = costoProt × (m / (1 − m))             (margen sobre el precio)
utilProt   = utilidad × dif                        ← utilidad protegida
precioCalc = (costoProt + utilProt) / (1 − comisión)
precioUnit = precioManual > 0 ? precioManual : precioCalc
```

El diferencial se aplica **dos veces** (al costo y a la utilidad) porque el taller cobra en Bs a tasa BCV pero repone material y realiza valor a la tasa paralela. `precioManual` permite fijar el precio de venta a mano; conserva el desglose como referencia.

---

## 6. Módulos funcionales

| Módulo | Rutas / archivos | Descripción |
|---|---|---|
| **Cotización propia** | `/cotizar`, `Calculadora.tsx`, `lib/cotizaciones.ts` | motor completo (papel + acabados), comparadores por cantidad y margen, sugeridor de tamaño, precio a mano |
| **Cotización de proveedor** | `/cotizar-proveedor` | parte del costo de un tercero (total o unitario), características de lo ofertado |
| **Intérprete IA** (opcional) | `PanelInterpretar.tsx`, `lib/interpretar.ts` | traduce texto libre del cliente en un borrador estructurado (Claude) |
| **Cotizaciones** | `/cotizaciones`, `[id]`, `[id]/imprimir` | listado (Lista o **Tablero Kanban** con arrastrar/soltar), detalle inmutable, PDF con membrete, export CSV |
| **CRM comercial** | `/crm`, `lib/crm.ts` | tablero de prospectos/leads (arrastrar/soltar) y actividades agendadas; ADMIN/VENDEDOR (Fase 1) |
| **Órdenes / Taller** | `/taller`, `lib/ordenes.ts` | **handoff automático** al aprobar; producción **por pieza** (carril interno/tercerizado, tablero con arrastrar/soltar) y vista de órdenes clásica; etapas; **estado de cobro**; al terminar descuenta inventario |
| **Proveedores** | `/proveedores`, `lib/proveedores.ts`, `lib/proveedores-excel.ts` | alta, predeterminado, comparador por papel (normalizado a resma), proveedor preferido; **importación de listas desde Excel** con vista previa; solo ADMIN (Fase 3) |
| **Inventario** | `/inventario`, `lib/inventario.ts` | stock en pliegos por categoría, entradas, ajustes, mínimos, movimientos |
| **Clientes / Trabajos** | `/clientes`, `lib/trabajos.ts` | CRM básico y recetas repetibles |
| **Variables** | `/variables`, `lib/variables.ts` | márgenes, tasas, IVA, membrete, papeles, acabados, IA |
| **Tasas** | `lib/tasas.ts`, `/api/tasas/*` | fuente externa (dolarapi), refresco por cron, histórico |
| **Usuarios** | `/usuarios` | alta, rol, activación, override de IA, permisos de cotización y `verEstructura` (`SelectorEstructura`) |
| **Hilo del trabajo** | `_hilo/*`, `lib/comentarios.ts`, `lib/adjuntos.ts`, `lib/almacenamiento.ts`, `/api/adjuntos/[id]` | comentarios y adjuntos anclados a la cotización, visibles desde la cotización (ADMIN/VENDEDOR) y la orden (TALLER); **sin dinero**; almacenamiento configurable db/drive (Fase 4) |
| **Tutoriales (visita guiada)** | `_components/Tour.tsx`, `tours.ts`, `mockups/index.tsx` | motor de tour reutilizable; tour de inicio (auto tras login, botón «?») y de Variables ("Ver tutorial") (Fase 4) |

**Motor de Tour** (`_components/Tour.tsx`): componente cliente que recorre una lista
de pasos (`PasoTour`: `eyebrow`, `titulo`, `cuerpo`, `mockup?`, `href?`), cada uno
con una ilustración opcional resuelta por clave contra `MOCKUPS` (`mockups/index.tsx`,
SVG inline en la estética CMYK de la app). Cada tour tiene un `id`: se abre solo la
primera vez si `autoAbrir` y no hay flag en `localStorage` (`imprenta.tour.<id>`), y
se reabre por evento `abrir-tour:<id>` (lo disparan `BotonGuia` con «?» → `inicio`, y
`BotonTour` en Variables → `variables`). "No volver a mostrar" y cerrar marcan el flag;
reabrir por evento ignora el flag. El contenido de los dos tours vive en `tours.ts`
(`PASOS_INICIO` con el paso a paso por tipo de cotización; `PASOS_VARIABLES`). El tour
de inicio se monta en `(app)/layout.tsx` (`autoAbrir`) y el de Variables en su página.

---

## 7. Seguridad (resumen; detalle en el análisis de estándares)

- **Autenticación** en dos niveles: middleware Edge verifica la firma del JWT (barato, sin BD); `getUsuario()` comprueba contra la tabla `Sesion` que la sesión no esté revocada y el usuario siga activo (verdad de fondo).
- **Autorización por rol**: `requireRol(...)` en cada página/acción; `requireUsuario()` en el layout del grupo `(app)`.
- **Invariante crítico TALLER**: el rol TALLER **nunca** recibe un precio, costo o margen. Es estructural, no cosmético: el modelo `Orden` no tiene columnas de dinero y ni `SELECT_PROD` ni `SELECT_PIEZA_TABLERO` (tablero de producción por pieza, `lib/ordenes.ts`) seleccionan jamás una columna monetaria; el `snapshot` de cada `PiezaOrden` que ve el taller tampoco lleva dinero. La exportación CSV también verifica `puedeVerPrecios(rol)`. `seguridad.test.ts` escanea ambas selecciones para probar el invariante sin BD.
- **Estructura de costos por usuario** (`puedeVerEstructura` en `lib/roles.ts`): `verEstructura` es un permiso por usuario, independiente del rol; exige además ver precios (TALLER nunca la pasa; ausente = `true`, comportamiento histórico). Se aplica **en el servidor**, no solo en la UI: el detalle de cotización (`cotizaciones/[id]/page.tsx`), el resumen/dashboard (`lib/resumen.ts`) y la exportación CSV (`/api/cotizaciones/export`) omiten costo, margen, diferencial y desglose cuando es `false`; las calculadoras reciben la prop `verEstructura` solo para ocultarlos en pantalla. Un usuario sin estructura **sí** ve el precio de venta (a diferencia del TALLER, que no ve nada de dinero).
- **Hilo del trabajo (comentarios/adjuntos), sin precios**: `Comentario` y `Adjunto` se anclan a la cotización y **no** tienen columnas de dinero; el TALLER accede al hilo solo vía la orden (`puedeVerTrabajo` en `lib/comentarios.ts`: TALLER solo si la cotización ya tiene orden). Borrar un elemento requiere ser su autor o ADMIN (`puedeBorrarDelHilo` en `lib/roles.ts`, pura y testeable). La descarga de un adjunto pasa por **`/api/adjuntos/[id]`**: exige sesión (`getUsuario`) y `puedeVerTrabajo`; sin caché (`no-store`); imágenes/PDF en línea, el resto como `attachment`; backend "drive" redirige a la `url` remota.
- **Adaptador de almacenamiento de adjuntos** (`lib/almacenamiento.ts`): validación pura de tamaño (≤ **8 MB**, `MAX_BYTES`) y tipo (`TIPOS_PERMITIDOS`: imágenes, PDF, ofimática) reutilizada por la acción y la ruta; dos backends intercambiables elegidos por `ALMACEN_ADJUNTOS` (`elegirAlmacen`): **"db"** (bytea en `Adjunto.datos`, por defecto) y **"drive"** (Google Drive con service account vía `lib/drive.ts`; se activa con `GOOGLE_SERVICE_ACCOUNT_JSON` + `GDRIVE_FOLDER_ID`, y lanza claro si faltan; un valor desconocido cae a "db").
- **Inmutabilidad**: una cotización guarda un `snapshot` congelado de papeles, acabados y variables; solo es editable en estado BORRADOR (y re-congela al guardar).
- **Secretos** fuera del repositorio (`.gitignore`, `.env.example` sin valores); en producción como variables/secrets de Railway.
- **SQL parametrizado** por Prisma en todo el acceso a datos.
- **Cron** de tasas protegido por `CRON_SECRET`.

---

## 8. Reglas de negocio invariantes

1. **Ningún precio fuera del motor.**
2. **Cotización inmutable** salvo BORRADOR; el detalle se lee del `snapshot`, nunca se recalcula.
3. **Mapeo `clave`↔`cuid`**: el motor referencia papeles/acabados por `clave` estable; la BD por `id` (cuid). La traducción vive en `trabajos.ts` / `inventario.ts`.
4. **Descuento de inventario idempotente**: solo la primera vez que una orden llega a TERMINADA (`Orden.inventarioAplicado`).
5. **Formato es-VE**: miles con punto, decimales con coma; precios en USD con equivalente en Bs.
6. **Handoff automático (best-effort)**: al pasar una cotización a APROBADA, `cambiarEstadoCotizacion` genera la orden con `generarOrden` si aún no existe; una carrera o una cotización 100 % tercerizada no rompe el cambio de estado (se registra el fallo, no se propaga). El botón "Generar orden" queda como respaldo manual.
7. **Producción por pieza**: cada ítem se convierte en una `PiezaOrden` con su carril (interno→taller / tercerizado→compras). Las órdenes con etapas las gobierna `recomputarEstadoOrden` (por etapas, además descuenta papel); las 100 % tercerizadas, `recomputarEstadoOrdenPorPiezas` (por estado de las piezas).
8. **Precio efectivo del papel**: `Papel.precio` (resma) es siempre copia del proveedor preferido del papel, o del predeterminado global si no tiene uno. Importar la lista de ese proveedor o fijar preferido lo actualiza; el motor de cálculo no cambia.

---

## 9. Migraciones y despliegue

- **Migraciones generadas offline** (el entorno de desarrollo no tiene salida a la BD de producción):
  `npx prisma migrate diff --from-schema-datamodel <schema-anterior> --to-schema-datamodel prisma/schema.prisma --script`.
- **Railway** aplica las migraciones en el `preDeployCommand: npx prisma migrate deploy` (ver `railway.json`) y valida `/api/health` antes de enrutar tráfico.
- Cada push a la rama principal republica.
- **Migraciones nuevas (Fases 1–4), 6 en total**, que aplica `prisma migrate deploy`:
  `20260801130000_estado_pendiente` (estado PENDIENTE de cotización),
  `20260802120000_crm_prospecto_actividad` (CRM: Prospecto y Actividad),
  `20260802140000_produccion_por_pieza` (PiezaOrden, carriles y estado de cobro de la orden),
  `20260802160000_proveedores_precios` (Proveedor, PrecioProveedorPapel y `Papel.proveedorPreferidoId`),
  `20260803120000_ver_estructura` (`Usuario.verEstructura`, permiso de ver estructura de costos),
  `20260803140000_comentarios_adjuntos` (modelos Comentario y Adjunto del hilo del trabajo).
- Fase 3 agrega la dependencia **`exceljs`** (plantilla e importación de listas de precios): al desplegar, recuerda instalar dependencias (`npm ci`) antes del build.
- **Variables de entorno nuevas (Fase 4)** para el almacenamiento de adjuntos:
  `ALMACEN_ADJUNTOS` = `db` (por defecto, bytes en la BD) o `drive`. Con `drive` se
  define `GDRIVE_FOLDER_ID` (carpeta destino) y UNA de dos credenciales, ambas
  soportadas por `lib/drive.ts` (obtiene el access token y hace subida
  multipart + descarga en streaming por `/api/adjuntos/[id]`; sin dependencias
  pesadas, usa `jose` + fetch):
  - **OAuth de usuario (recomendado)** — `GOOGLE_OAUTH_CLIENT_ID`,
    `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`. Funciona con una
    carpeta de "Mi unidad" y no necesita clave de service account (útil cuando la
    organización aplica `iam.managed.disableServiceAccountKeyCreation`). El refresh
    token se obtiene una vez (OAuth Playground con un cliente OAuth propio). Con la
    pantalla de consentimiento **Interna** el refresh token no expira.
  - **Cuenta de servicio** — `GOOGLE_SERVICE_ACCOUNT_JSON` (JWT firmado); requiere
    poder crear claves y una **Unidad Compartida** donde el SA sea Administrador de
    contenido (un SA no puede subir a "Mi unidad" por falta de cuota).
  Con `db` no hace falta configurar nada. Probado de punta a punta con OAuth.

---

## 10. Testing

- `vitest`, 35 pruebas. El caso **Jugarte** (3.000 stickers) es el contrato del motor: costo, diferencial, costo/utilidad protegidos, precio unitario, venta total y precio a mano.
- `auth.test.ts` cubre firma/verificación de token.
- `datos-base.test.ts` verifica la carga inicial de 43 papeles contra la hoja original.
