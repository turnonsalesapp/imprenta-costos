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
- **Precio vs. costo** — el **precio** es lo que paga el cliente (precio de venta); el **costo** es lo que le cuesta al taller. Un usuario puede ver el precio sin ver el costo (ver *ver estructura de costos*).
- **Ver estructura de costos** — permiso por usuario (`Usuario.verEstructura`, helper `puedeVerEstructura`): ver costo, margen, diferencial y desglose, no solo el precio de venta. Independiente del rol; se aplica en el servidor (detalle, resumen, CSV) y en la UI. Distinto de `puedeVerPrecios`: el TALLER no ve **nada** de dinero; sin estructura sí se ve el **precio**.

## Cotización / producción
- **Snapshot** — copia congelada de papeles, acabados y variables que guarda cada cotización. Hace la cotización **inmutable**.
- **Borrador** — único estado en que una cotización se puede editar.
- **Pendiente de aprobación** — estado (`PENDIENTE`) intermedio entre Borrador y Enviada: la cotización espera el visto bueno interno antes de mandarla al cliente.
- **Orden de Venta** — una cotización **Ganada** (`GANADA`): el cliente aceptó, el mismo documento vale como orden de venta. (No confundir con `APROBADA`, que es la aprobación interna previa a enviar.)
- **Handoff** — el paso automático de comercial a producción: al pasar una cotización a Ganada, la **orden de producción se genera sola** (el botón "Generar orden" queda de respaldo).
- **Orden de producción** — papel para el taller generado de una cotización ganada. **No lleva precios.**
- **Pieza / PiezaOrden** — cada ítem de la cotización se sigue por separado en producción, con su propio estado. Modelo `PiezaOrden`.
- **Carril interno** — pieza de producción propia (Digital/Offset): va al taller (en cola de diseño → en diseño → esperando arte → en impresión → en acabado → lista). Enum `CarrilPieza.INTERNO`.
- **Carril tercerizado** — pieza que se compra a un proveedor (gran formato, proveedor, personalizado): por cotizar → comprado → recibido → entregado. Enum `CarrilPieza.TERCERIZADO`.
- **Estado de cobro** — seguimiento del cobro de la orden (No facturado → Facturado → Cobrado, con fechas). **No** es una factura fiscal. Enum `EstadoCobro`, lo mueve ADMIN/VENDEDOR.
- **Clave ↔ cuid** — el motor referencia papeles/acabados por `clave` estable; la BD por `id` (cuid).

## Comercial y proveedores (Fases 1–3)
- **Prospecto** — oportunidad/lead comercial **antes** de cotizar (Nuevo → Contactado → Convertido / Descartado). Modelo `Prospecto`, tablero en `/crm`.
- **Actividad** — gestión comercial agendada (reunión, llamada, seguimiento, nota) con fecha y marca de "hecha". Modelo `Actividad`.
- **Proveedor predeterminado** — el proveedor de respaldo global: se usa para costear un papel que no tiene proveedor preferido propio. Uno solo a la vez (`Proveedor.predeterminado`).
- **Proveedor preferido** — el proveedor elegido para costear **un papel concreto**; su precio es el que usa el motor. `Papel.proveedorPreferidoId`.
- **Precio efectivo** — el precio de resma con el que el motor cotiza un papel (`Papel.precio`): copia del precio del proveedor preferido (o del predeterminado). Se actualiza al importar su lista o al fijar preferido.
- **Precio por resma (normalizado)** — precio de una lista llevado a resma completa para comparar proveedores, sea que venga por resma, por hoja o por millar (`precioAResma`).
- **Lista de precios** — precios de papel de un proveedor (`PrecioProveedorPapel`, una fila por papel+proveedor). Se cargan varias y se comparan; se importan desde Excel (.xlsx) con vista previa (diff: sube/baja/igual/nuevo/sin_papel).

## Hilo del trabajo (comentarios y adjuntos)
- **Hilo del trabajo** — comentarios y adjuntos anclados a la **cotización** (`cotizacionId`) y compartidos con la orden que ve el TALLER. Estilo tablero/Trello. **No contiene dinero**: seguro para el TALLER (`puedeVerTrabajo`: TALLER solo si la cotización ya tiene orden).
- **Comentario** — nota de texto del hilo, con autor (`autorNombre` congelado) y fecha. Modelo `Comentario`. Borra su autor o un ADMIN (`puedeBorrarDelHilo`).
- **Adjunto** — archivo del hilo (arte, referencia, cotización del proveedor, PDF). Modelo `Adjunto`; máx. **8 MB**, tipos permitidos (imágenes/PDF/ofimática). Se descarga por `/api/adjuntos/[id]` (con sesión y permiso). Almacén `db` (bytea) o `drive`.
- **Service account** — cuenta de servicio de Google (credencial de máquina, no de persona) con la que el backend `drive` subiría los adjuntos a Google Drive (`GOOGLE_SERVICE_ACCOUNT_JSON` + `GDRIVE_FOLDER_ID`). Reservado, aún no implementado.

## Tutoriales
- **Visita guiada / tour** — tutorial interactivo por pasos con ilustraciones (`Tour.tsx`, contenido en `tours.ts`, dibujos en `mockups/index.tsx`). El de **inicio** se abre tras el login la primera vez y se reabre con «?»; el de **Variables** con "Ver tutorial". Flag por-tour en `localStorage`; "No volver a mostrar" no impide reabrirlo.

## Roles y seguridad
- **SUPERADMIN / ADMIN / VENDEDOR / TALLER** — roles del sistema. TALLER **nunca** ve precios. SUPERADMIN incluye todo lo de ADMIN (⊇ ADMIN) y además puede **purgar la bitácora de auditoría por rango**, dejando rastro de la propia purga.
- **Invariante TALLER-sin-precios** — control estructural: el modelo `Orden` no tiene columnas de dinero y ni `SELECT_PROD` ni `SELECT_PIEZA_TABLERO` (tablero por pieza) seleccionan una columna monetaria; el `snapshot` de cada `PiezaOrden` tampoco lleva dinero. Probado en `seguridad.test.ts`.
- **Sesión revocable** — la sesión vive en la tabla `Sesion`; desactivar un usuario la corta al instante.
- **Rate limiting** — límite de intentos (login) y de uso (IA) para frenar fuerza bruta y abuso de costo.
- **Auditoría** — bitácora de solo-agregar de operaciones sensibles (`RegistroAuditoria`).
