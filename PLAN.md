# Plan de trabajo

Este archivo es el brief para construir el sistema. Está ordenado por
dependencias: cada fase se apoya en la anterior. Termina una, verifica que
corre, y sigue.

**Contexto:** imprenta venezolana. 2 a 5 personas del taller la van a usar,
desde distintos equipos, alojada en la nube. Todo en español (es-VE): miles con
punto, decimales con coma, precios en USD con equivalente en bolívares.

---

## Ya está hecho

**Motor y datos**
- `src/lib/calculo.ts` — motor de cálculo completo y verificado.
- `src/lib/calculo.test.ts` — 17 pruebas del motor, incluida la del caso real.
- `src/lib/datos-base.ts` — 43 papeles con los precios del proveedor (lista del
  16-oct-2025, verificados uno por uno), 11 acabados y las variables del negocio.
- `src/lib/datos-base.test.ts` — 8 pruebas que amarran esos precios a la hoja
  original. En total 25, todas pasan.

**Base de datos**
- `prisma/schema.prisma` — modelo completo, con `binaryTargets` para Railway.
- `prisma/seed.ts` — carga inicial + usuario administrador.
- `src/lib/db.ts` — cliente Prisma singleton.
- `src/lib/config.ts` — puente entre la base y el motor. **Único lugar donde
  se convierte `Decimal` a `number`.** También tiene `snapshot()`.

**Despliegue en Railway**
- `railway.json` — build, start, migraciones automáticas antes de cada
  despliegue y health check.
- `src/app/api/health/route.ts` — la ruta que Railway consulta.
- `.nvmrc` y `engines` en package.json — fijan Node 20+.

**Cáscara de la aplicación**
- `src/app/layout.tsx`, `globals.css`, `tailwind.config.ts` — Tailwind con la
  paleta de artes gráficas ya definida.
- `src/app/page.tsx` — pantalla temporal de verificación. Se reemplaza en la
  Fase 3.
- `referencia/calculadora-artefacto.jsx` — prototipo funcionando de la
  calculadora, el comparador por tiraje y la pantalla de variables. La lógica
  de interfaz ya está resuelta ahí; hay que portarla a componentes de Next.js
  cambiando `window.storage` por la base de datos.

## Falta

### Fase 1 — Que arranque (casi todo listo)

Solo falta la parte que depende de credenciales:

1. `npm install`
2. Crear `.env` a partir de `.env.example`. En la máquina local va la cadena
   **pública** de Railway (dice `rlwy.net`). Generar `AUTH_SECRET` con
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
3. `npm run db:migrate` y luego `npm run db:seed`.

**Verificación:** `npm test` da 25 en verde, `npm run dev` levanta, y
<http://localhost:3000> muestra "Todo conectado" con 43 papeles y 11 acabados.

### Fase 2 — Acceso
1. Login con email y clave. Sesión firmada con `jose` en cookie httpOnly,
   tabla `Sesion` para poder cerrar sesiones. Middleware que protege todo
   menos `/login`.
6. Roles: `ADMIN` ve y edita todo. `VENDEDOR` cotiza y ve precios, pero no
   toca variables ni papeles. `TALLER` **solo ve órdenes de producción, sin
   costos, márgenes ni precios** — esto se filtra en el servidor, no
   escondiendo elementos en el cliente.
7. Pantalla de usuarios (solo ADMIN): crear, cambiar rol, desactivar.

**Verificación:** entrar como TALLER y confirmar que ninguna respuesta del
servidor trae un precio.

### Fase 3 — Cotizar
8. Portar la calculadora desde `referencia/`. Formulario en cliente, cálculo
   en vivo con `calcular()`, y el mismo ticket de desglose.
9. Portar el montaje automático (`calcCapacidad`) con su vista previa SVG.
10. Portar el comparador por tiraje (`comparar()`) con su curva.
11. Guardar cotización. **Clave: es inmutable.** Al guardar, copiar en
    `snapshot` los papeles, acabados y config del momento. Si mañana sube el
    papel, la cotización de ayer debe seguir mostrando lo mismo. Nunca
    recalcular una cotización guardada leyendo los precios de hoy.
12. Listado con buscador, filtro por estado y cliente, exportar a CSV
    (separador `;`, BOM UTF-8 — Excel en español lo abre bien).
13. Detalle de cotización: desglose, condiciones y cambios de estado.

**Verificación:** guardar una cotización, cambiar el precio de un papel en
Variables, y confirmar que la cotización guardada no se movió.

### Fase 4 — Clientes y trabajos repetidos
14. CRUD de clientes. Ficha con su histórico de cotizaciones y trabajos.
15. Trabajos repetidos: un `Trabajo` guarda la receta (medida, papel, tamaño,
    capacidad, acabados) pero **no** el precio.
16. Botón "Recotizar": carga la receta, le pone las tasas y precios de hoy y
    genera una cotización nueva. Es la función que más van a usar.
17. Al guardar una cotización, ofrecer "guardar también como trabajo repetido".

**Verificación:** recotizar un trabajo de hace un mes debe dar un precio
distinto si la tasa cambió, y el mismo si no cambió nada.

### Fase 5 — Órdenes de producción
18. Generar orden desde una cotización aprobada. Numeración correlativa.
19. Las etapas salen de los acabados de la cotización, en el orden en que se
    ejecutan en el taller: impresión → laminado → troquelado → pegado →
    guillotina. Cada etapa se marca lista, con responsable y hora.
20. Tablero del taller: órdenes por estado, ordenadas por fecha de entrega,
    con las atrasadas resaltadas. **Sin un solo precio en pantalla.**
21. Hoja de orden imprimible: cliente, trabajo, medida, cantidad, papel,
    cortes, montaje, etapas e instrucciones. Nada de costos.

**Verificación:** abrir el tablero como TALLER en un teléfono. Tiene que
poder marcarse una etapa con una mano.

### Fase 6 — Variables
22. Pantalla de variables (solo ADMIN): márgenes, comisión, tasas, pinza,
    separación. Portar de `referencia/`.
23. ABM de papeles y acabados. Al desactivar un papel no se borra: las
    cotizaciones viejas lo siguen mostrando por su `snapshot`.
24. Registrar cada cambio de tasa en la tabla `Tasa`.

### Después, si hace falta
- Cotización en PDF con membrete, para enviar al cliente.
- Comparar automáticamente los cuatro tamaños de corte y sugerir el más barato
  para cada tiraje (hoy hay que probarlos a mano).
- Aviso cuando el margen real de una cotización cae por debajo del mínimo.
- Consumo de papel por mes, para las compras.

---

## Reglas que no se rompen

1. **Un solo motor.** Todo precio sale de `src/lib/calculo.ts`. Si un
   componente, una ruta de API o un PDF calcula por su cuenta, en algún momento
   dos pantallas van a mostrar números distintos para lo mismo.
2. **`npm test` en verde siempre.** La prueba del caso Jugarte es el contrato
   con la hoja de Excel del dueño. Si se pone roja, el cambio está mal, no la
   prueba.
3. **Las cotizaciones no se recalculan.** Se guardan con su `snapshot` y así
   se quedan.
4. **El taller no ve precios.** Se filtra en el servidor.
5. **`Decimal` a `number` en un solo lugar** (`src/lib/config.ts`). No regar
   conversiones por todo el código.
6. **Nada de NaN en pantalla.** El motor ya devuelve `0` ante entradas vacías;
   respetar eso al portar la UI.

## Detalles del negocio que no son obvios

- Las tarifas de acabados están referidas a **1/4 de pliego**. Al cambiar de
  tamaño escalan según su campo `escala`: `area` sube y baja con el área,
  `min` sube pero nunca baja de la tarifa base, `fija` no se mueve.
- **Pegado y acetato se cobran por pieza**, aunque la hoja original dijera
  "1/4 de pliego". Está comprobado con el cálculo real.
- El **troquelado** se cobra por millar, redondeando hacia arriba, y sobre las
  piezas **con merma incluida**.
- El **margen es sobre el precio de venta**, no sobre el costo:
  `utilidad = costo × (m / (1 - m))`.
- El **diferencial cambiario** protege contra la brecha: promedio Binance ÷
  tasa BCV. Se aplica dos veces — al costo y otra vez a la utilidad.
- La **comisión del vendedor** se descuenta del precio (`precio / (1 - c)`),
  no se suma al costo.
