# Manual de Configuración y Administración

Guía para el administrador/operador técnico: variables de entorno, despliegue, migraciones y toda la configuración funcional del sistema.

---

## 1. Variables de entorno

Se cargan como **secretos del servicio en Railway** (nunca en el repositorio). En local, en un archivo `.env` (que está en `.gitignore`). Hay un `.env.example` con los nombres.

| Variable | Obligatoria | Para qué |
|---|---|---|
| `DATABASE_URL` | **Sí** | Cadena de conexión PostgreSQL. **En Railway** usa `${{Postgres.DATABASE_URL}}`; **en tu máquina** usa la pública (`DATABASE_PUBLIC_URL`, dice `rlwy.net`). |
| `AUTH_SECRET` | **Sí** | Clave para firmar los tokens de sesión (JWT). Larga y aleatoria. El **mismo** valor en local y en Railway. El sistema **no arranca** sin ella. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Solo para el seed | Crean el primer administrador al correr `npm run db:seed`. |
| `ANTHROPIC_API_KEY` | Opcional | Habilita el intérprete de solicitudes con IA. Sin ella, la función queda **oculta**. |
| `ANTHROPIC_MODEL` | Opcional | Solo **respaldo**: el modelo se elige en Variables. |
| `CRON_SECRET` | Opcional | Protege el endpoint de refresco automático de tasas. Sin ella, ese endpoint queda deshabilitado. |
| `TASAS_API` | Opcional | URL de la fuente de tasas (por defecto `https://ve.dolarapi.com/v1/dolares`). |

**Generar `AUTH_SECRET`:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Cargar un secreto en Railway
1. Entra a **railway.app** → tu proyecto → el **servicio de la app** (no el de Postgres).
2. Pestaña **Variables** → **New Variable** → nombre y valor → guardar. Railway redepliega solo.
3. Los secretos se pueden rotar sin redeploy manual.

---

## 2. Despliegue en Railway

El repositorio ya trae `railway.json`. Railway, en cada push:
1. **Construye** (`npm run build` → `prisma generate && next build`).
2. **Aplica las migraciones pendientes** (`preDeployCommand: npx prisma migrate deploy`).
3. **Verifica `/api/health`** antes de mandar tráfico a la versión nueva.

**Primera publicación:**
1. Sube el repo a GitHub.
2. En Railway: **New → GitHub Repo**.
3. Agrega las variables (`DATABASE_URL`, `AUTH_SECRET`, y las opcionales que quieras).
4. **Settings → Networking → Generate Domain.**

De ahí en adelante, cada push republica.

---

## 3. Migraciones de base de datos (importante)

El entorno de desarrollo **no tiene salida** a la base de producción, así que las migraciones se generan **offline** (sin conectarse) y Railway las aplica en el despliegue.

**Generar una migración tras cambiar `prisma/schema.prisma`:**
```bash
# 1. Guarda el esquema anterior (desde git)
git show HEAD:prisma/schema.prisma > /tmp/old.prisma

# 2. Edita prisma/schema.prisma con el cambio

# 3. Genera el SQL de diferencia
TS=$(date -u +%Y%m%d%H%M%S)
mkdir -p prisma/migrations/${TS}_descripcion
npx prisma migrate diff \
  --from-schema-datamodel /tmp/old.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/${TS}_descripcion/migration.sql

# 4. Regenera el cliente y súbelo
npx prisma generate
```
Railway aplica el `.sql` nuevo en el `preDeploy`. **Nunca** cambies la base a mano.

---

## 4. Configuración funcional — pantalla **Variables** (ADMIN)

Menú **Variables**. Estos valores se aplican a **cada cotización nueva**; las guardadas no cambian.

### 4.1 Valores por defecto
- **Merma papel (%)**, **Margen (%)**, **Comisión vendedor (%)**, **MercadoLibre (%)**.
- **Tasa BCV**, **Binance compra**, **Binance venta** — con el botón *Actualizar tasas* para traerlas de la fuente externa.
- **Pinza (mm)** y **Separación (mm)** — para el montaje.
- **Margen mínimo (%)** — avisa si una cotización baja de aquí.
- **IVA (%)** — para la cotización al cliente.

> Cada vez que cambia una tasa, queda registrada en el histórico.

### 4.2 Intérprete de solicitud con IA
- Casilla **"Interpretar solicitud del cliente con IA"** (interruptor general del sistema; por defecto **apagado**).
- **Modelo de IA:** Opus 4.8 (recomendado), Sonnet 5 (más económico) o Haiku 4.5 (más rápido y barato).
- Requiere `ANTHROPIC_API_KEY` cargada; sin ella la sección no aparece.

### 4.3 Membrete de la cotización
Datos de la empresa (nombre, RIF, teléfono, dirección, email, web) que salen en la cotización imprimible.

### 4.4 Papeles y acabados
- **Papeles:** referencia, **categoría** (para el inventario), medida, hojas por resma, precio. Se pueden agregar, editar o "quitar" (desactivar sin borrar: las cotizaciones viejas los siguen mostrando por su snapshot).
- **Acabados:** nombre, costo (tarifa base para 1/4 de pliego), **cómo se cobra** (por corte / por pieza / por millar de cortes / por trabajo), **cómo escala** al cambiar de tamaño, orden en el taller y **grupo** (acabados del mismo grupo son excluyentes, como los tres niveles de troquel).

---

## 5. Tasas automáticas

- **Fuente:** `TASAS_API` (por defecto dolarapi). El parser tolera el formato de dolarapi (arreglo con `oficial`/`paralelo`).
- **Manual:** botón *Actualizar tasas* en Variables.
- **Automático (cron):** apunta un programador (p. ej. cron de Railway) a
  `https://TU-DOMINIO/api/tasas/refresh?token=EL_CRON_SECRET`.
  Sin `CRON_SECRET` configurado, el endpoint responde 403 (deshabilitado).
- **Diagnóstico:** `/api/tasas/debug` (solo ADMIN) muestra lo que devuelve la fuente.

---

## 6. Usuarios y roles (ADMIN)

Menú **Usuarios**:
- **Crear usuario:** nombre, correo, clave (mín. 6), rol.
- **Rol:** ADMIN / VENDEDOR / TALLER (no puedes quitarte a ti mismo el rol de admin).
- **Activar / Desactivar:** al desactivar, se cierran sus sesiones al instante.
- **Interpretar IA (por usuario):** *Según el sistema* (sigue el interruptor general), *Activado* o *Desactivado* (fuerza el valor para esa persona). La columna solo aparece si hay `ANTHROPIC_API_KEY`.

---

## 7. El intérprete de IA — puesta en marcha y privacidad

**Para activarlo:**
1. Carga `ANTHROPIC_API_KEY` como secreto en Railway (§1).
2. En **Variables**, marca la casilla y elige el modelo.
3. Opcional: ajusta por usuario en **Usuarios**.

**Privacidad:** el texto que se pega **se envía a la API de Anthropic** para procesarlo. Anthropic no entrena con datos de la API, pero conviene saber que ese texto sale del sistema. La función es un acelerador **opcional**: si la API falla, el vendedor carga la cotización a mano.

**Seguridad de diseño:** la IA solo produce un **borrador**; nunca fija precios ni ejecuta acciones. Se le pasa el catálogo real del taller y el servidor **vuelve a filtrar** cualquier clave de papel/acabado que no exista.

---

## 8. Buenas prácticas operativas

- **Respaldo:** la base vive en Railway (Postgres gestionado). Configura respaldos según tu plan de Railway.
- **Antes de subir cambios:** corre `npm test` (35 pruebas). El motor de cálculo está amarrado por el caso Jugarte; si una prueba se rompe, el cambio está mal.
- **Nunca** calcules un precio fuera de `src/lib/calculo.ts`.
- **Rotación de secretos:** si `AUTH_SECRET` cambia, todas las sesiones se invalidan (todos vuelven a entrar).
- **Tasas:** revisa que estén "en verde" tras cada actualización; si la fuente cambia de formato, ajusta `TASAS_API` o el parser en `src/lib/tasas.ts`.

---

## 9. Referencia rápida de comandos

```bash
npm install            # instalar dependencias
npm run dev            # desarrollo en http://localhost:3000
npm test               # las 35 pruebas
npm run build          # build de producción (prisma generate + next build)
npm run db:seed        # carga inicial (papeles, acabados, admin) — una sola vez
npx prisma generate    # regenerar el cliente tras cambiar el esquema
```
