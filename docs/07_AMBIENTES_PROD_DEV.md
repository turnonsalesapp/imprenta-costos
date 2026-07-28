# Separar producción y desarrollo

Guía para el administrador/operador técnico. Objetivo: tener **dos ambientes
independientes** —producción y desarrollo—, cada uno con **su propia base de
datos**, de modo que probar en desarrollo nunca toque los datos reales.

**Regla del ejercicio:** se hace una **copia** de la base actual y luego se
**limpian las transacciones** de ambas, para que las dos **arranquen en cero**
conservando lo maestro:

- **Se conservan:** variables del negocio (Config), membrete, tasas actuales,
  papeles, acabados, materiales/productos de gran formato, productos POP, equipos,
  **usuarios** y (por defecto) clientes y trabajos repetidos.
- **Se borran (transaccional):** cotizaciones, órdenes y sus etapas, movimientos de
  inventario (stock → 0), histórico de tasas y registro de auditoría. Los
  correlativos (numero) de cotización y orden se reinician a 1.

> Todo el trabajo con la base se hace con la herramienta de limpieza incluida
> (`scripts/reset-transacciones.ts`) y con `pg_dump`/`pg_restore`. No se toca la
> base a mano.

---

## 1. Estrategia recomendada — dos servicios Postgres en el proyecto

La opción más simple y explícita en Railway:

1. En tu proyecto de Railway, **New → Database → Add PostgreSQL**. Nómbralo, por
   ejemplo, **`Postgres-Dev`** (el existente queda como producción).
2. Tendrás así **dos bases**: la de producción (la actual) y la nueva de desarrollo.
3. Cada **servicio de la app** (ver §4) apunta su `DATABASE_URL` a la base que le
   corresponde:
   - App de **producción** → `${{Postgres.DATABASE_URL}}`
   - App de **desarrollo** → `${{Postgres-Dev.DATABASE_URL}}`

> **Alternativa: Railway Environments.** Railway permite duplicar el proyecto entero
> en un *environment* de desarrollo (con su propia base y variables). Si prefieres
> esa vía, crea el environment `development`, y aun así aplica los pasos §2–§5 para
> copiar los datos y dejar ambas bases en cero. El resto de esta guía asume el
> enfoque de "dos servicios Postgres", que es el más directo.

---

## 2. Las dos cadenas de cada base (importante)

Railway da, por cada Postgres, **dos** URLs y no son intercambiables:

| Dónde la usas | Cuál va | Cómo la reconoces |
|---|---|---|
| Desde tu computadora (dump, restore, reset) | la **pública** | dice `rlwy.net` / `proxy.rlwy.net` |
| En las variables del servicio de la app en Railway | `${{Postgres.DATABASE_URL}}` | referencia entre llaves |

Usar la interna (`railway.internal`) desde tu máquina da *Can't reach database
server*. Para los comandos de este documento (§3, §5), usa siempre la **pública**.

Copia de cada Postgres su **`DATABASE_PUBLIC_URL`** desde la pestaña *Variables* /
*Connect* del servicio en Railway.

---

## 3. Copiar producción → desarrollo

Con la base de desarrollo ya creada (vacía), clona el contenido de producción.
Sustituye las URLs públicas por las tuyas.

```bash
# 1) Asegúrate de que la base de desarrollo tenga el esquema al día.
#    (Aplica las migraciones a la base de dev antes de restaurar datos.)
DATABASE_URL="postgresql://…PUBLICA-DEV…" npx prisma migrate deploy

# 2) Volcado de producción (solo datos; el esquema ya lo pusieron las migraciones).
pg_dump --data-only --no-owner --no-privileges \
  --dbname="postgresql://…PUBLICA-PROD…" \
  --file=prod_datos.sql

# 3) Restaurar en desarrollo.
psql "postgresql://…PUBLICA-DEV…" --file=prod_datos.sql
```

Notas:
- `--data-only` evita chocar con el esquema que ya crearon las migraciones.
- Si prefieres un volcado completo (esquema + datos), usa
  `pg_dump --no-owner --no-privileges -Fc` y `pg_restore --clean --if-exists`, y
  **omite** el paso 1 (`migrate deploy`). Elige una vía u otra, no mezcles.
- `pg_dump`/`pg_restore`/`psql` deben ser de una versión compatible con el Postgres
  de Railway (usa una razonablemente reciente).

En este punto **desarrollo es una copia idéntica de producción**.

---

## 4. Configurar el `DATABASE_URL` de cada app en Railway

- **Servicio de la app de producción:** variable `DATABASE_URL =
  ${{Postgres.DATABASE_URL}}` (la interna del Postgres de producción).
- **Servicio de la app de desarrollo:** variable `DATABASE_URL =
  ${{Postgres-Dev.DATABASE_URL}}`.
- **`AUTH_SECRET`:** puede ser el **mismo** en ambos, o distinto. Si usas uno
  distinto en desarrollo, las sesiones no se comparten entre ambientes (más
  aislado). El resto de secretos (`ANTHROPIC_API_KEY`, `CRON_SECRET`, `TASAS_API`)
  se configuran por servicio según necesites.
- Genera un dominio para cada app (**Settings → Networking → Generate Domain**), por
  ejemplo `app.tudominio` y `dev.tudominio`.

---

## 5. Dejar ambas bases "en cero"

Ahora limpia las transacciones en **cada** base. La herramienta apunta a la base que
tenga `DATABASE_URL` en ese momento, así que se corre **dos veces**, una por base,
usando la URL **pública** de cada una.

Primero **simula** (no cambia nada, solo cuenta):

```bash
# Simulación contra producción
DATABASE_URL="postgresql://…PUBLICA-PROD…" npm run db:reset-transacciones

# Simulación contra desarrollo
DATABASE_URL="postgresql://…PUBLICA-DEV…" npm run db:reset-transacciones
```

Revisa el resumen (host de la base y filas que borraría). Cuando estés seguro,
**ejecuta** (exige la bandera `--ejecutar` y la confirmación `CONFIRMAR_RESET=BORRAR`):

```bash
# Producción → en cero
DATABASE_URL="postgresql://…PUBLICA-PROD…" \
  CONFIRMAR_RESET=BORRAR npm run db:reset-transacciones -- --ejecutar

# Desarrollo → en cero
DATABASE_URL="postgresql://…PUBLICA-DEV…" \
  CONFIRMAR_RESET=BORRAR npm run db:reset-transacciones -- --ejecutar
```

Opciones:
- `--incluir-clientes` — además borra **clientes y trabajos repetidos** (por defecto
  se conservan).
- Sin `--ejecutar` = **simulación** siempre.

Qué hace el reinicio (`scripts/reset-transacciones.ts`):
- Borra cotizaciones, órdenes, etapas, movimientos de inventario, histórico de tasas
  y auditoría, en el orden correcto de llaves foráneas, dentro de una transacción.
- Pone el **stock de cada papel en 0** (conserva el catálogo y el stock mínimo).
- Reinicia los correlativos de **cotización** y **orden** a 1.
- Siembra **una** fila de tasas con los valores actuales de Config (línea base).

> **Antes de ejecutar en producción**, haz un respaldo (`pg_dump`) por si acaso. El
> script imprime el host de la base para que confirmes que apuntas a la correcta.

---

## 6. Verificación

En cada ambiente, entra a la app y confirma:
- **Variables** intactas (márgenes, tasas, membrete, catálogos).
- **Usuarios** intactos (puedes iniciar sesión).
- **Cotizaciones**, **Taller** e **Inventario** en cero (stock 0, sin movimientos).
- La primera cotización nueva toma el **número 1**.

Con esto, producción y desarrollo quedan separados, cada uno con su base, ambos
partiendo de cero pero con toda la configuración lista para trabajar.

---

## 6b. Errores comunes al ejecutar

| Error que ves | Causa | Solución |
|---|---|---|
| `Can't reach database server` / *timeout* al conectar | Estás usando la URL **interna** (`railway.internal`) o un puerto bloqueado por la red desde donde corres | Usa la URL **pública** (`proxy.rlwy.net`) desde tu máquina; ese host/puerto sí es alcanzable desde afuera |
| `pg_dump: server version mismatch` / *aborting because of server version mismatch* | Tu `pg_dump` local es más viejo que el Postgres de Railway (PG 16) | Instala/usa un `pg_dump` ≥ 16, o corre el dump desde un contenedor: `docker run --rm postgres:16 pg_dump "<URL_PUBLICA>" -Fc > respaldo.dump` |
| `P2028 Transaction ... already closed` / *transaction timed out* | La transacción tardó más que el límite en una base grande | Ya resuelto en el script (timeout de 120 s). Asegúrate de tener la última versión: `git pull` |
| `@prisma/client did not initialize` / *Cannot find module '.prisma/client'* | Falta generar el cliente Prisma en esa máquina | `npm install` (dispara `prisma generate`) o `npx prisma generate` |
| `password authentication failed` | Copiaste mal la URL o rotó la contraseña | Vuelve a copiar `DATABASE_PUBLIC_URL` desde Railway |
| El script dice *Falta la confirmación* | Corriste `--ejecutar` sin la variable | Antepón `CONFIRMAR_RESET=BORRAR` al comando |

Si el error no está aquí, copia las últimas líneas y el paso en que ocurrió.

---

## 7. De aquí en adelante

- **Desarrollo** es para probar cambios sin miedo. Puedes volver a copiar producción
  cuando quieras repetir §3 (recuerda re-ejecutar §5 si quieres dejarlo en cero otra
  vez).
- **Migraciones:** al publicar, Railway aplica las migraciones pendientes a la base
  del servicio (preDeploy). Asegúrate de apuntar cada app a su base correcta.
- **Nunca** corras el reinicio contra producción sin querer: por eso exige la
  bandera y la variable de confirmación, y muestra el host antes de actuar.
