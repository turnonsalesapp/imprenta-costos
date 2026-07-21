# Sistema de costos y producción — Imprenta

Calcula el precio de cualquier trabajo a partir de la estructura de costos real
del taller, guarda el histórico de cotizaciones y lleva las órdenes de producción.

El motor de cálculo (`src/lib/calculo.ts`) está verificado contra la hoja de
Excel original: reproduce exactamente el trabajo de Jugarte Venezuela
(3.000 stickers → $724,47 de costo, $0,5372 unitario, $1.611,58 de venta).
Las pruebas en `src/lib/calculo.test.ts` protegen ese resultado.

## Arrancar

¿No quieres instalar nada en tu computadora? Ver **NUBE.md**: el proyecto ya
trae el entorno de desarrollo en la nube configurado.

```bash
npm install
cp .env.example .env          # completa DATABASE_URL y AUTH_SECRET
npm run db:migrate            # crea las tablas
npm run db:seed               # carga 43 papeles, 11 acabados y el usuario admin
npm run dev                   # http://localhost:3000
```

La base de datos es **PostgreSQL en Railway**.

> **Las dos cadenas de Railway.** Railway expone dos y no son intercambiables:
>
> | Dónde | Cuál va | Cómo la reconoces |
> |---|---|---|
> | Este `.env`, en tu máquina | `DATABASE_PUBLIC_URL` | dice `rlwy.net` |
> | Variables del servicio en Railway | `${{Postgres.DATABASE_URL}}` | referencia entre llaves |
>
> Usar la interna desde tu computadora da `Can't reach database server`.

`npm test` corre las 25 pruebas. Córrelas siempre antes de subir cambios.

## Publicarlo

El repositorio ya trae `railway.json` configurado: Railway construye, aplica
las migraciones pendientes antes de cada despliegue y verifica `/api/health`
antes de mandar tráfico a la versión nueva.

1. Sube el repo a GitHub.
2. En tu proyecto de Railway: **New → GitHub Repo**.
3. En las variables del servicio agrega `DATABASE_URL` con el valor
   `${{Postgres.DATABASE_URL}}` y `AUTH_SECRET` con el mismo valor de tu `.env`.
4. **Settings → Networking → Generate Domain.**

De ahí en adelante, cada push a GitHub republica solo.

## Cómo está armado

```
src/lib/calculo.ts       Motor puro. Todo precio del sistema sale de aquí.
src/lib/calculo.test.ts  Las pruebas que lo amarran a la hoja original.
src/lib/datos-base.ts    Papeles, acabados y variables iniciales.
prisma/schema.prisma     Modelo de datos.
prisma/seed.ts           Carga inicial.
referencia/              El prototipo que ya funciona, para portar la interfaz.
PLAN.md                  Qué falta y en qué orden. Empieza por ahí.
```

## Regla de oro

Nunca calcules un precio fuera de `src/lib/calculo.ts`. Ni en un componente,
ni en una ruta de API, ni en el PDF. Si un número no salió de ese archivo,
tarde o temprano va a discrepar de otro número del sistema.

## Dos cifras por confirmar con el taller

En la hoja original venían duplicadas con valores distintos. Quedaron así:

| Concepto | En VARIABLES | En la calculadora | Quedó |
|---|---|---|---|
| Troquel | $100 | $50 | **$100** |
| Acetato Dangler | $0,03 | $0,05 | **$0,05** |

El acetato quedó en $0,05 porque es el valor con el que cuadra el cálculo real
de Jugarte. Si el correcto es el otro, se corrige desde la pantalla de Variables.
