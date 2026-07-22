# `src/app/api` — Route Handlers

Endpoints HTTP para máquinas o descargas (no páginas).

**Qué vive aquí**
- `health` — chequeo de vida para el healthcheck de Railway (público).
- `tasas/refresh` — refresco de tasas por cron; protegido con `CRON_SECRET` (fail-closed 403).
- `tasas/debug` — diagnóstico de la fuente de tasas (solo ADMIN).
- `cotizaciones/export` — CSV; verifica `puedeVerPrecios(rol)` (TALLER no exporta).
- `resumen` — datos del panel.

**Qué NO debe vivir aquí**
- Lógica de negocio (va en `src/lib`).
- Endpoints sin autenticación salvo los explícitamente públicos (`health`, `tasas/refresh` con su token). El middleware exige sesión para el resto.

**Reglas**
- Fail-closed: ante falta de token/rol, responder 401/403, nunca procesar "por si acaso".
- Los secretos se leen desde `lib/env.ts`, no de `process.env`.
