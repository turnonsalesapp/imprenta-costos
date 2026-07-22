# Análisis del código contra el estándar TOS V2

**Documento de referencia:** `00_Estandares_Codigo_TOS_V2.md` (Turn On Sales V2).
**Objeto de análisis:** código fuente de este proyecto (Sistema de Costos de Imprenta).
**Fecha:** 2026-07-22.

---

## 0. Cómo leer este análisis (contexto importante)

El estándar de referencia fue escrito para **otro proyecto** con un stack y un modelo de negocio distintos:

| | Estándar TOS V2 | Este proyecto |
|---|---|---|
| Lenguaje | Python (FastAPI, SQLAlchemy async, ARQ) | TypeScript (Next.js 15, Prisma) |
| Modelo | **Multi-tenant** SaaS (muchas empresas) | **Single-tenant** (un solo taller) |
| Superficie | webhooks Meta/Stripe, workers, LLM con function-calling que reserva stock y aprueba pagos | app web interna; IA solo redacta un borrador de cotización |
| Base de datos | Postgres con RLS por `id_empresa` | Postgres, un solo dueño |

Por eso el análisis **traduce los principios** del estándar (trazabilidad, seguridad por diseño, consistencia técnica, documentación, tests) al contexto real de este proyecto, y marca explícitamente lo que **no aplica**. Adoptar reglas multi-tenant (RLS, filtro `id_empresa`, idempotencia de webhooks de pago) aquí sería *cargo cult*: no hay tenants, ni webhooks de pago, ni function-calling con acceso a stock.

**Leyenda:** ✅ cumple · 🟡 parcial / mejorable · ⚪ no aplica · 🔴 hueco a corregir.

---

## 1. Tabla de alineación por sección del estándar

| Sección del estándar | Estado | Comentario |
|---|---|---|
| §1 Trazabilidad `@source`/`@security` | 🟡 | No hay tags formales, pero el código está bien comentado con el *porqué* y `PLAN.md` traza el origen de cada fase. Se puede formalizar (ver P3-A). |
| §2.0 Menor privilegio / defensa en profundidad / fail-closed | ✅/🟡 | Auth en dos niveles (middleware + BD), fail-closed en login y cron. Sin RLS, pero es single-tenant (⚪). |
| §2.1 Aislamiento multi-tenant | ⚪ | No hay tenants. El invariante equivalente aquí es **TALLER-sin-precios**, y está bien resuelto (✅ estructural). |
| §2.2 Validación de firma de webhooks | ⚪/🟡 | No hay webhooks Meta/Stripe. El único endpoint-máquina (cron de tasas) se protege con token (✅). |
| §2.3 Gestión de secretos | ✅ | `.env` en gitignore, `.env.example` sin valores, secretos en Railway, `AUTH_SECRET` obligatorio (lanza si falta). |
| §2.4 AuthN + AuthZ (JWT + RBAC) | ✅/🟡 | JWT HS256 fijo (jose no acepta `alg:none`), expiración 7 días, revocación por tabla `Sesion`, bcrypt. Mejoras menores en P2-C. |
| §2.5 Inyección SQL | ✅ | Todo pasa por Prisma (parametrizado). No hay SQL crudo con interpolación. |
| §2.6 Seguridad del LLM / prompt injection | ✅/🟡 | La IA **solo redacta un borrador**; no fija precios ni ejecuta acciones. Se le pasa el catálogo y el servidor **vuelve a filtrar** claves inválidas. Entrada tratada como dato. Falta límite de tamaño del texto (P2-B). |
| §2.7 Integridad financiera / antifraude | ⚪ | No hay lectura de comprobantes ni aprobación de pagos. |
| §2.8 Validación de entrada (Pydantic) | ✅/🟡 | `zod` en clientes, usuarios e **inventario (rangos, P3-B)**; tope de tamaño en el texto de IA (P2-B). Las acciones basadas en objeto se apoyan en el recálculo autoritativo del servidor. |
| §2.9 Concurrencia / `SELECT FOR UPDATE` | 🟡 | El descuento de inventario es idempotente pero no usa bloqueo de fila; en este volumen (un taller) el riesgo real es bajo (P3-C). |
| §2.10 Rate limiting / DoS | ✅ | **Resuelto (P1-A):** limitador en memoria (`lib/rate-limit.ts`); login por IP y por correo, IA por usuario. |
| §2.11 Errores sin fugas | ✅ | Las acciones devuelven `{ ok, error }` con mensajes de dominio; no se exponen stack traces al usuario. |
| §2.12 Logging / auditoría / PII | ✅/🟡 | **Auditoría resuelta (P2-D):** `RegistroAuditoria` + pantalla `/auditoria`. Sin `print`/`console` regados. Falta logging estructurado con `trace_id` (sobredimensionado para esta escala). |
| §2.13 Cifrado / retención | ✅/⚪ | TLS y cifrado en reposo los provee Railway. No se guardan comprobantes ni PII financiera. |
| §2.14 Dependencias fijadas | 🟡 | `package.json` usa rangos `^`; el `package-lock.json` sí fija (build reproducible). Falta escaneo en CI (P3-D). |
| §3.1 Compuerta de calidad (format/lint/types) | ✅ | **Resuelto (P2-A):** `.github/workflows/ci.yml` corre tipos + pruebas + build en cada push/PR. TS `strict`. |
| §3.2 Logging estructurado | 🟡 | Ver §2.12. |
| §3.3 Taxonomía de excepciones | ✅/🟡 | El patrón `{ ok, error }` cumple el espíritu (nada se traga en silencio). No hay jerarquía de errores tipada, innecesaria a esta escala. |
| §3.4 Disciplina async | ✅ | Todo es async idiomático; sin llamadas bloqueantes; Prisma singleton correcto. |
| §3.5 Configuración tipada única | ✅ | **Resuelto (P1-B):** `lib/env.ts` centraliza el entorno con getters perezosos + `verificarEnv()` (Zod). Los módulos leen `env`, no `process.env`. |
| §3.6 Migraciones | ✅ | Todo cambio de esquema por migración Prisma; generadas offline; Railway las aplica en preDeploy. |
| §3.7 Testing | ✅/🟡 | Motor muy bien probado (contrato Jugarte), auth cubierto y **test del invariante TALLER-sin-precios resuelto (P2-E)** (`seguridad.test.ts`, 38 pruebas). Falta cobertura de server actions (P3-B). |
| §3.8 Tipos de datos (TIMESTAMPTZ, DECIMAL) | ✅ | Dinero en `Decimal`. **Fechas resueltas (P2-F):** todas las `DateTime` con `@db.Timestamptz(3)`; migración con `AT TIME ZONE 'UTC'`. |
| §4 Documentación y legibilidad | ✅ | Docstrings/comentarios en español explicando el *porqué*. **READMEs por carpeta y glosario añadidos (P3-A).** |
| §4.6 Commits semánticos | 🟡 | Los mensajes son descriptivos pero no usan prefijos `feat:`/`fix:`/`security:`. Opcional. |

---

## 2. Fortalezas ya presentes (no tocar)

Estas prácticas del código **ya cumplen o superan** el estándar y son la mejor parte del proyecto:

1. **Motor de cálculo puro y probado.** `calculo.ts` sin dependencias de UI/BD, con el caso Jugarte como contrato ejecutable. Es el equivalente al "el backend calcula, no el LLM" del estándar (§2.6): la autoridad del número es el código, verificable.
2. **Invariante TALLER-sin-precios estructural.** No se esconde el precio en el cliente; el modelo `Orden` no tiene columnas de dinero y `SELECT_PROD` nunca las selecciona. Es defensa por diseño, igual que el estándar exige para multi-tenant.
3. **Inmutabilidad + snapshot.** Una cotización congela papeles/acabados/variables; se lee de lo guardado, no se recalcula. Protege la promesa hecha al cliente.
4. **Auth en dos niveles con revocación real.** Firma barata en el Edge + verdad de fondo contra `Sesion` (desactivar un usuario corta sus sesiones al instante).
5. **Secretos bien manejados** y `AUTH_SECRET` que falla ruidosamente si falta.
6. **Puente Decimal→number único** (`config.ts`): evita la clase de bug "sumar Decimals como texto".
7. **Comentarios que explican el porqué** (§4.2 del estándar), en español, consistentes.

---

## 3. Mejoras recomendadas (priorizadas)

### Prioridad 1 — ✅ IMPLEMENTADO

**P1-A · Rate limiting en login e IA. ✅**
`lib/rate-limit.ts`: limitador en memoria (ventana fija, fail-closed, con cota de memoria). Login limitado por IP (10 / 5 min) y por correo (8 / 15 min), con reinicio del contador de correo tras un login válido. IA limitada por usuario (30 / hora). Mensajes indican los segundos/minutos de espera.

**P1-B · Configuración tipada única. ✅**
`lib/env.ts`: fuente única del entorno con **getters perezosos** (edge-safe; no rompen `next build`) y `verificarEnv()` con Zod para un chequeo explícito. `jwt`, `auth`, `tasas`, `interpretar`, el cron y el debug ahora leen `env`, no `process.env`.

### Prioridad 2

**P2-A · Gate de calidad en CI. ✅** `.github/workflows/ci.yml` corre en cada push/PR: `npm ci`, `prisma generate`, `tsc --noEmit`, `npm test` y `npm run build`. (Sin `next lint`: el proyecto no tiene ESLint configurado.)

**P2-B · Límite de tamaño del texto del intérprete. ✅** `interpretarSolicitud` ahora rechaza textos > 5.000 caracteres.

**P2-C · Endurecer auth (menor).** Pendiente (bajo impacto): subir bcrypt a 12, `maxAge` más corto con refresh.

**P2-D · Log de auditoría. ✅** Modelo `RegistroAuditoria` (solo-agregar) + `lib/auditoria.ts`. Se registran cambios de estado de cotización, de rol, activación y override de IA por usuario. Pantalla `/auditoria` (solo ADMIN).

**P2-E · Test del invariante TALLER. ✅** `seguridad.test.ts` escanea `SELECT_PROD` (exportado) y falla si aparece una columna de dinero; reafirma `puedeVerPrecios(TALLER) === false`. Stub + alias de `server-only` en `vitest.config.ts`.

**P2-F · `TIMESTAMPTZ` en fechas. ✅** Todas las columnas `DateTime` llevan `@db.Timestamptz(3)`. La migración convierte con `USING … AT TIME ZONE 'UTC'` para no desplazar datos existentes (Prisma los guarda en UTC).

### Prioridad 3

- **P3-A · Documentación de módulo y glosario. ✅** README en `lib/`, `actions/`, `api/` y `docs/glosario.md`.
- **P3-B · zod en más server actions. ✅ (parcial)** Rangos validados en inventario; clientes y usuarios ya usaban zod. Las acciones basadas en objeto (`guardarCotizacion`) siguen apoyándose en el recálculo autoritativo del servidor.
- **P3-C · Bloqueo de fila en inventario.** Pendiente (hoy improbable a este volumen).
- **P3-D · Escaneo de dependencias en CI** (`npm audit`/Dependabot). Pendiente.
- **P3-E · Commits semánticos.** Pendiente (convención).

---

## 4. Lo que deliberadamente NO se adopta (y por qué)

| Regla del estándar | Por qué no aplica aquí |
|---|---|
| RLS + filtro `id_empresa` + rol no-superusuario | No hay multi-tenancy; añadiría complejidad sin amenaza que mitigar. |
| Idempotencia y firma de webhooks de pago | No hay webhooks de pago ni de Meta/Stripe. |
| Human-in-the-loop de visión de pagos | No se leen comprobantes ni se aprueban pagos. |
| Validación de function-calling del LLM contra BD | La IA no ejecuta funciones; solo devuelve un borrador que el humano valida. |
| Taxonomía de excepciones tipada, logging JSON con `trace_id` | Sobredimensionado para una app interna de un taller; el patrón `{ ok, error }` cubre el espíritu. Se revisará si el sistema crece. |

---

## 5. Resumen ejecutivo

El código está **bien diseñado para su escala**: el motor puro y probado, el invariante TALLER estructural y la inmutabilidad con snapshot son exactamente el tipo de "seguridad por diseño" que el estándar promueve.

**Estado tras esta iteración:** implementados P1-A, P1-B, P2-A, P2-B, P2-D, P2-E, P2-F, P3-A y P3-B. Quedan como opcionales de baja prioridad: **P2-C** (endurecer bcrypt/sesión), **P3-C** (bloqueo de fila), **P3-D** (escaneo de dependencias en CI) y **P3-E** (commits semánticos).
