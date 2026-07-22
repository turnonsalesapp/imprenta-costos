# Glosario de dominio

Una línea por término. Un mismo concepto se llama igual en código, base de datos y documentación.

## Negocio / imprenta
- **Pliego** — la hoja de papel completa (66×96, 68×96 o 70×100 mm según el papel).
- **Corte** — una fracción del pliego (Pliego, 1/2, 1/4, 1/8). El precio de acabados se refiere a 1/4 de pliego.
- **Montaje** — cuántas piezas del trabajo entran en un corte, descontando pinza y separación.
- **Pinza** — margen no imprimible en cada borde del pliego (mm).
- **Merma** — % de papel que se pierde por errores de consumo.
- **Millar (troquelado)** — el troquelado se cobra por cada mil **cortes** de papel, no por pieza.
- **Acabado** — operación sobre el trabajo (impresión, laminado, troquel, pegado…). En el taller se vuelve una **etapa**.

## Precio (motor de cálculo)
- **Diferencial** — cuántas veces el dólar paralelo supera al BCV (promedio Binance ÷ tasa BCV).
- **Costo protegido** — el costo unitario llevado a valor real: `costoUnit × diferencial`.
- **Utilidad protegida** — la ganancia también protegida contra el diferencial: `utilidad × diferencial`.
- **Margen** — % de rentabilidad **sobre el precio de venta** (no sobre el costo).
- **Precio a mano** — precio unitario fijado manualmente que manda sobre el calculado.

## Cotización / producción
- **Snapshot** — copia congelada de papeles, acabados y variables que guarda cada cotización. Hace la cotización **inmutable**.
- **Borrador** — único estado en que una cotización se puede editar.
- **Orden de producción** — papel para el taller generado de una cotización aprobada. **No lleva precios.**
- **Clave ↔ cuid** — el motor referencia papeles/acabados por `clave` estable; la BD por `id` (cuid).

## Roles y seguridad
- **ADMIN / VENDEDOR / TALLER** — roles del sistema. TALLER **nunca** ve precios.
- **Invariante TALLER-sin-precios** — control estructural: el modelo `Orden` no tiene columnas de dinero y `SELECT_PROD` nunca las selecciona. Probado en `seguridad.test.ts`.
- **Sesión revocable** — la sesión vive en la tabla `Sesion`; desactivar un usuario la corta al instante.
- **Rate limiting** — límite de intentos (login) y de uso (IA) para frenar fuerza bruta y abuso de costo.
- **Auditoría** — bitácora de solo-agregar de operaciones sensibles (`RegistroAuditoria`).
