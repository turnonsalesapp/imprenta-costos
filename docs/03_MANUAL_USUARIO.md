# Manual de Usuario — Sistema de Costos e Imprenta

Guía para el día a día. Está organizada por rol: busca tu rol y sigue los flujos que te aplican.

---

## 1. Ingresar al sistema

1. Abre la dirección del sistema en el navegador.
2. Escribe tu **correo** y tu **clave** y pulsa *Entrar*.
3. Si te equivocas, el mensaje es siempre el mismo ("Correo o clave incorrectos") por seguridad.
4. Para salir, usa **Salir** arriba a la derecha.

Tu sesión dura 7 días. Si un administrador desactiva tu usuario, tu sesión se cierra de inmediato.

---

## 2. Roles: qué ve cada quien

| Rol | Para qué | Qué ve |
|---|---|---|
| **Administrador (ADMIN)** | dueño / gerencia | Todo: cotiza, ve precios y márgenes, edita variables, papeles, inventario, usuarios |
| **Vendedor (VENDEDOR)** | cotizar y vender | Cotiza y ve precios; **no** edita las variables del negocio |
| **Taller (TALLER)** | producción | **Solo** las órdenes de producción. **Nunca** ve precios, costos ni márgenes |

> La barra de navegación muestra solo lo que tu rol puede usar.

---

## 3. Cotizar un trabajo propio (ADMIN / VENDEDOR)

Menú **Cotizar**. La pantalla tiene dos columnas: a la izquierda entras los datos; a la derecha ves el **desglose y el precio en vivo** (se recalcula mientras escribes).

### 3.1 Datos del trabajo
- **Cliente:** elige uno registrado o escribe el nombre a mano.
- **Trabajo** y **Descripción:** nombre corto y detalle.

### 3.2 Formato y material
- **Ancho / Alto (mm):** medida de la pieza.
- **Cantidad:** cuántas piezas.
- **Tamaño de corte:** Pliego, 1/2, 1/4 o 1/8.
- **Papel:** de la lista; abajo se muestra el precio por pliego y por corte.
- **Piezas por corte:** se calcula solo por montaje (casilla *Calcular por montaje*). El dibujo muestra cómo entran las piezas en el corte.

### 3.3 Acabados
Marca lo que lleva el trabajo (impresión tiro/retiro, laminado, troquelado, pegado, etc.). El **troquel** (Básico/Medio/Complejo) se elige con un selector porque son excluyentes.

### 3.4 Tasas y utilidad
- **Tasa BCV / Binance:** vienen de Variables; puedes ajustarlas para esta cotización.
- **Diferencial:** se calcula solo (promedio Binance ÷ BCV). Puedes *fijarlo manualmente*.
- **Margen, Comisión, MercadoLibre (%):** parámetros del precio.

### 3.5 Herramientas de decisión (columna izquierda)
- **Comparador por cantidad:** el mismo trabajo a distintos tirajes, con la curva de precio unitario.
- **Comparador por margen:** el mismo trabajo con distintos márgenes de rentabilidad.
- **Sugeridor de tamaño de corte:** te dice cuál tamaño sale más barato.

### 3.6 Precio de venta a mano
En el ticket, marca **"Fijar precio de venta a mano"** para escribir tú el precio unitario final. La venta total, la ganancia, los Bs y el precio de MercadoLibre se recalculan con ese precio, y aparece la etiqueta **A MANO**. Se muestra el precio *sugerido* y el % de diferencia. Los comparadores siguen mostrando el precio calculado, como guía.

### 3.7 Interpretar la solicitud con IA (si está activada)
Si el administrador activó la función, arriba aparece **"Interpretar solicitud del cliente"**:
1. Pega el texto tal cual lo mandó el cliente.
2. Pulsa **Interpretar**.
3. Revisa el borrador: cada campo trae un nivel de confianza (alta/media/baja) y una lista de **dudas** para preguntarle al cliente.
4. Pulsa **Cargar en la cotización** y ajusta lo que haga falta.

> El texto se procesa con IA de Anthropic. Nada se guarda hasta que guardes la cotización.

### 3.8 Varios ítems en una cotización
Una cotización puede tener **varios ítems** (por ejemplo, el mismo trabajo a distintos volúmenes, o trabajos distintos para el mismo cliente):
- Arriba de la calculadora hay **pestañas de ítems**. Pulsa **＋ Ítem** para agregar otro; cada pestaña se edita por separado. La ✕ quita un ítem.
- Desde el **Comparador por cantidad**, cada volumen trae **＋ ítem** (lo agrega como ítem con esa cantidad), o **"Agregar los N volúmenes como ítems"** para cargarlos todos de una vez.
- El **cliente** es común a toda la cotización; el **título y la descripción** son por ítem.
- En el panel **"Ítems"** (abajo del ticket) ves cada ítem con su **descripción editable** —que ya viene rellena con lo que incluye (medida, papel, tamaño, acabados)— y el **total** de la cotización.

### 3.9 Guardar
- **Guardar cotización** crea la cotización en estado **Borrador** (con todos sus ítems) y te lleva a su detalle.
- Con un solo ítem puedes marcar **"Guardar también como trabajo repetido"** para reutilizar la receta después.
- En el detalle y en la impresión, cada ítem aparece con su descripción y su total; el cliente ve el **Total** de la cotización con IVA.

---

## 4. Cotizar un trabajo de proveedor (tercerizado)

Menú **Cotizar prov.** Cuando el trabajo lo hace un tercero y solo aplicas tu margen:
- **Proveedor / Referencia / Notas.**
- **Cómo cobra el proveedor:** elige **Costo total** o **Costo unitario del elemento** (× cantidad = total; se muestra el total calculado).
- **Características de lo ofertado:** describe qué incluye la oferta (material, medidas, acabados, tiempos). Va a la cotización del cliente.
- El resto (tasas, margen, comparador por margen, precio a mano) funciona igual que en la cotización propia.

---

## 5. Cotizaciones: estados, edición, PDF y CSV

Menú **Cotizaciones**: listado con búsqueda y filtro por estado, o **tablero Kanban**.

- **Lista o Tablero:** con el selector **Lista / Tablero** cambias de la tabla de
  siempre a un **tablero Kanban** por estado, donde **arrastras** cada tarjeta a otra
  columna para cambiarle el estado.
- **Estados:** Borrador → **Pendiente de aprobación** → Enviada → Aprobada / Rechazada
  / Vencida. Cambias el estado desde el detalle o arrastrando la tarjeta en el Tablero.
  La *Pendiente de aprobación* es el paso opcional de visto bueno interno antes de
  enviar al cliente. Cada estado tiene su color (gris borrador, ámbar pendiente, azul
  enviada, verde aprobada, rojo rechazada, naranja vencida).
- **Editar:** solo si está en **Borrador**. Al guardar se actualiza esa misma cotización.
- **Duplicar:** desde el detalle, "usar como base" crea una **nueva** cotización con la misma estructura (útil para variantes).
- **Imprimir / PDF:** el detalle tiene versión imprimible con el membrete de la empresa (usa *Imprimir* del navegador → Guardar como PDF).
- **Exportar CSV:** desde el listado; abre en Excel en español (respeta punto y coma y acentos).

> Una cotización guardada es **inmutable**: aunque mañana suba el papel, sigue mostrando lo que se le prometió al cliente. Solo el borrador se puede modificar.

---

## 6. Órdenes de producción / Taller

### 6.1 La orden se genera sola (handoff automático)
Cuando pasas una cotización a **Aprobada** (= Orden de Venta), **la orden de producción
se crea sola** (el botón "Generar orden" queda de respaldo). Ahora **todos** los ítems
entran a producción: cada ítem es una **pieza** con su propio estado, en uno de dos
carriles:
- **Carril interno (taller):** Digital y Offset → *En cola de diseño → En diseño →
  Esperando arte → En impresión → En acabado → Lista*. Sus **etapas** salen de los
  acabados, en orden (impresión → laminado → troquel → pegado → guillotina…).
- **Carril tercerizado (compras):** Gran formato, Proveedor y Personalizados —que antes
  no se controlaban— → *Por cotizar → Comprado → Recibido → Entregado*.

### 6.2 Tablero del taller (todos los roles, incluido TALLER)
Menú **Taller**, con dos vistas: **Tablero** (por pieza; arrastra la tarjeta para
avanzarla — el **TALLER puede mover piezas**) y **Órdenes** (la vista clásica por
estado). En ambas, el TALLER ve la receta, las etapas y las piezas **sin ningún precio**.

### 6.3 Trabajar una orden
- Mueve cada **pieza** por sus estados, o marca cada **etapa** como en proceso / lista a
  medida que avanza. La orden pasa por Pendiente → En proceso → **Terminada** → Entregada.
- Al llegar a **Terminada**, el sistema **descuenta el papel consumido del inventario**
  automáticamente (una sola vez).

### 6.4 Estado de cobro (ADMIN / VENDEDOR)
Cada orden tiene un **seguimiento de cobro** aparte de la producción: **No facturado →
Facturado → Cobrado**, con su fecha. Es solo un semáforo de qué está por cobrar, **no
una factura fiscal**. El TALLER no lo ve.

---

## 7. Inventario de papel (ADMIN)

Menú **Inventario** (stock en **pliegos completos**):
- **Registrar entrada:** suma una compra al stock.
- **Ajustar:** corrige el stock a un conteo físico exacto.
- **Mínimo (aviso):** cuando el stock baja de aquí, el papel se marca en rojo y sale un aviso.
- **Movimientos recientes:** auditoría de entradas, salidas (por órdenes terminadas) y ajustes.

Los papeles se agrupan por **categoría** de material.

---

## 8. Clientes y trabajos repetidos (ADMIN / VENDEDOR)

- **Clientes:** alta y edición de datos (nombre, RIF, contacto). Al cotizar, eliges el cliente de la lista.
- **Trabajos repetidos:** recetas guardadas. Para recotizar, cargas el trabajo y el sistema aplica las **tasas de hoy** y vuelve a calcular (la receta no guarda precio, se recalcula).

---

## 9. Panel de inicio y consumo (ADMIN)

- **Inicio:** resumen del estado del negocio.
- **Consumo:** reporte de consumo de papel por mes.

---

## 10. CRM: prospectos y actividades (ADMIN / VENDEDOR)

Menú **CRM**: el tablero comercial **antes** de cotizar.
- **Prospectos (leads):** oportunidades sin cotización aún, en un tablero de cuatro
  columnas que arrastras: **Nuevo → Contactado → Convertido / Descartado**. Crea uno con
  *Oportunidad*, *Cliente*, *Contacto* y *Detalle*.
- **Actividades:** gestiones agendadas (**Reunión, Llamada, Seguimiento, Nota**) con
  fecha, título, cliente y notas. Las pendientes salen primero por fecha; al cumplirlas
  las marcas como **hechas**.

---

## 11. Proveedores y listas de precios (solo ADMIN)

Menú **Proveedores**: de quién compras el papel y a qué precio.
- **Alta y predeterminado:** registras proveedores y marcas **uno** como
  **predeterminado global** (respaldo para papeles sin proveedor propio; no se borra).
- **Comparador:** por cada papel, ves el precio de todos los proveedores **normalizado a
  resma**, con el **más barato** marcado y el **ahorro potencial**. Con **Hacer
  preferido** eliges de qué proveedor sale el precio de un papel; ese pasa a ser su
  **precio efectivo** (el que usa el motor).
- **Importar lista (Excel):** descarga la **plantilla pre-rellenada** con tu catálogo
  (columna **Clave** para emparejar), llena la columna **Precio** (unidad *resma*, *hoja*
  o *millar*), súbela y revisa la **vista previa** (sube / baja / igual / nuevo / sin
  papel) antes de **confirmar**. Puedes cargar varias listas y compararlas.

> El motor de cálculo **no cambia**: sigue leyendo el precio del papel; los proveedores
> solo deciden **de dónde sale** ese precio.

---

## 12. Glosario rápido

| Término | Qué significa |
|---|---|
| **Corte / pliego** | El pliego es la hoja completa; el corte es una fracción (1/2, 1/4, 1/8). |
| **Montaje** | Cuántas piezas entran en un corte descontando pinza y separación. |
| **Diferencial** | Cuántas veces el dólar paralelo supera al BCV (promedio Binance ÷ BCV). |
| **Costo protegido** | Tu costo llevado a valor de dólar real (costo × diferencial). |
| **Utilidad protegida** | Tu ganancia también protegida contra el diferencial. |
| **Snapshot** | La copia congelada de precios y variables que guarda cada cotización. |
| **Borrador** | Único estado en el que una cotización se puede editar. |
| **Handoff** | Al aprobar una cotización, la orden de producción se genera sola. |
| **Pieza / carril** | Cada ítem se sigue en producción por separado; carril interno (taller) o tercerizado (compras). |
| **Estado de cobro** | Semáforo de cobro de la orden (No facturado → Facturado → Cobrado); no es factura fiscal. |
| **Prospecto** | Oportunidad comercial antes de cotizar (CRM). |
| **Precio efectivo** | Precio de resma con que el motor cotiza un papel; copia del proveedor preferido o predeterminado. |
