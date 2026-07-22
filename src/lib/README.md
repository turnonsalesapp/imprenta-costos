# `src/lib` — lógica de negocio y acceso a datos

El cerebro del sistema. Módulos puros o de servidor, sin JSX.

**Qué vive aquí**
- `calculo.ts` — **el motor** (puro, sin BD ni UI). Todo precio sale de aquí. Amarrado por `calculo.test.ts`.
- `config.ts` — único puente Decimal(Prisma)→number(motor). La conversión ocurre **solo aquí**.
- Repositorios `server-only`: `cotizaciones`, `ordenes`, `inventario`, `clientes`, `trabajos`, `variables`, `consumo`, `resumen`, `tasas`, `interpretar`, `auditoria`.
- Infra: `db` (Prisma singleton), `auth`, `jwt` (edge-safe), `env` (config tipada única), `rate-limit`, `roles`, `modelos-ia`.

**Qué NO debe vivir aquí**
- Componentes React ni JSX (van en `src/app`).
- Lectura directa de `process.env` (usa `env.ts`).
- Cálculo de precios fuera de `calculo.ts` (regla de oro).
- Selección de columnas de dinero en la vista del taller (ver `ordenes.ts` / `seguridad.test.ts`).

**Reglas**
- Los repositorios llevan `import "server-only"`.
- Prisma devuelve `Decimal`; conviértelo a `number` solo en `config.ts`.
