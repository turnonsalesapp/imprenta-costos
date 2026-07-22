# Guía de contribución

## Antes de subir cambios

1. `npx tsc --noEmit` — sin errores de tipos.
2. `npm test` — todas las pruebas en verde (el motor de cálculo está amarrado por el caso Jugarte).
3. `npm run build` — compila.

El workflow de CI corre estos tres en cada push y Pull Request; un cambio no está terminado si el CI falla.

## Convención de commits (semánticos)

Cada mensaje empieza con un prefijo que dice de qué tipo es el cambio:

| Prefijo | Para qué |
|---|---|
| `feat:` | funcionalidad nueva |
| `fix:` | corrección de un error |
| `security:` | cambio de seguridad (auth, permisos, validación, rate limiting) |
| `refactor:` | reestructurar sin cambiar comportamiento |
| `perf:` | mejora de rendimiento |
| `docs:` | documentación |
| `test:` | pruebas |
| `chore:` | mantenimiento (dependencias, config, CI) |

Ejemplos:
- `feat: precio de venta editable a mano`
- `security: rate limiting en login e IA`
- `fix: el diferencial no se recalculaba al cambiar la tasa`

El cuerpo del commit explica el **porqué**, no el qué. Las decisiones de arquitectura o seguridad relevantes valen una línea extra.

## Reglas de oro del proyecto

- **Ningún precio se calcula fuera de `src/lib/calculo.ts`.**
- El rol **TALLER nunca** recibe un precio, costo o margen (invariante probado en `seguridad.test.ts`).
- Las cotizaciones son **inmutables** salvo en estado Borrador; se leen de su `snapshot`.
- Los cambios de esquema van por **migración** (generada offline; Railway la aplica en el preDeploy).
- Los secretos se leen desde `src/lib/env.ts`, nunca `process.env` directo.
