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
| **Usuario** | acceso | `rol` (ADMIN/VENDEDOR/TALLER), `passwordHash`, `interpretarIA` (override IA por usuario) |
| **Sesion** | sesión | token único; permite revocación inmediata |
| **Cliente** | CRM básico | nombre, RIF, contacto; `activo` |
| **Papel** | catálogo/inventario | `clave` estable (la usa el motor), `precio` Decimal, `medida`, `categoria`, `stock`, `stockMin` |
| **MovimientoInventario** | auditoría stock | ENTRADA/SALIDA/AJUSTE, `cantidad` con signo, `saldo`, `ordenId` |
| **Acabado** | catálogo | `clave`, `costo`, `unidad` (pliego/elemento/millar/trabajo), `escala`, `grupo` (excluyentes) |
| **Config** | variables del negocio | fila única `id="global"`: márgenes, tasas, IVA, membrete, `interpretarIA`, `interpretarModelo` |
| **Tasa** | histórico | cada cambio de tasa queda registrado |
| **Trabajo** | plantilla | receta de un trabajo repetido (no guarda precio) |
| **Cotizacion** | documento | `tipo` PROPIA/PROVEEDOR, `estado`, `snapshot` congelado, `entrada`, `lineas`, columnas de dinero |
| **Orden** | producción | 1:1 con cotización aprobada; **sin columnas de dinero**; `inventarioAplicado` |
| **EtapaOrden** | taller | una etapa por acabado; estado y responsable |

**Enums:** `Rol`, `EstadoCotizacion` (BORRADOR/ENVIADA/APROBADA/RECHAZADA/VENCIDA), `TipoCotizacion`, `EstadoOrden`, `EstadoEtapa`, `TipoMovimiento`.

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
| **Cotizaciones** | `/cotizaciones`, `[id]`, `[id]/imprimir` | listado, detalle inmutable, PDF con membrete, export CSV |
| **Órdenes / Taller** | `/taller`, `lib/ordenes.ts` | genera orden de cotización aprobada; tablero; etapas; al terminar descuenta inventario |
| **Inventario** | `/inventario`, `lib/inventario.ts` | stock en pliegos por categoría, entradas, ajustes, mínimos, movimientos |
| **Clientes / Trabajos** | `/clientes`, `lib/trabajos.ts` | CRM básico y recetas repetibles |
| **Variables** | `/variables`, `lib/variables.ts` | márgenes, tasas, IVA, membrete, papeles, acabados, IA |
| **Tasas** | `lib/tasas.ts`, `/api/tasas/*` | fuente externa (dolarapi), refresco por cron, histórico |
| **Usuarios** | `/usuarios` | alta, rol, activación, override de IA |

---

## 7. Seguridad (resumen; detalle en el análisis de estándares)

- **Autenticación** en dos niveles: middleware Edge verifica la firma del JWT (barato, sin BD); `getUsuario()` comprueba contra la tabla `Sesion` que la sesión no esté revocada y el usuario siga activo (verdad de fondo).
- **Autorización por rol**: `requireRol(...)` en cada página/acción; `requireUsuario()` en el layout del grupo `(app)`.
- **Invariante crítico TALLER**: el rol TALLER **nunca** recibe un precio, costo o margen. Es estructural, no cosmético: el modelo `Orden` no tiene columnas de dinero y `SELECT_PROD` (`lib/ordenes.ts`) jamás selecciona una columna monetaria. La exportación CSV también verifica `puedeVerPrecios(rol)`.
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

---

## 9. Migraciones y despliegue

- **Migraciones generadas offline** (el entorno de desarrollo no tiene salida a la BD de producción):
  `npx prisma migrate diff --from-schema-datamodel <schema-anterior> --to-schema-datamodel prisma/schema.prisma --script`.
- **Railway** aplica las migraciones en el `preDeployCommand: npx prisma migrate deploy` (ver `railway.json`) y valida `/api/health` antes de enrutar tráfico.
- Cada push a la rama principal republica.

---

## 10. Testing

- `vitest`, 35 pruebas. El caso **Jugarte** (3.000 stickers) es el contrato del motor: costo, diferencial, costo/utilidad protegidos, precio unitario, venta total y precio a mano.
- `auth.test.ts` cubre firma/verificación de token.
- `datos-base.test.ts` verifica la carga inicial de 43 papeles contra la hoja original.
