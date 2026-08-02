# Documentación de Usuario — Sistema de Costos y Producción (Imprenta)

**Producto:** sistema web interno de cotización, costeo y producción para imprenta
(*Altoprint* — Producciones AP2024, C.A.).
**Ámbito:** un solo taller (single-tenant), en español de Venezuela (es-VE).
**Para quién es este documento:** vendedores, taller y administración. Está
organizado por tarea; busca lo que necesitas hacer y sigue el flujo.

> Convención de números en todo el sistema: **miles con punto y decimales con
> coma** (es-VE). Los precios se muestran en **USD** con su equivalente en
> **bolívares** a tasa BCV.

---

## Índice

1. [Ingresar al sistema](#1-ingresar-al-sistema)
2. [Roles: qué ve y qué puede hacer cada quien](#2-roles)
3. [El menú de navegación](#3-el-menú)
4. [Cómo cotizar — visión general](#4-cómo-cotizar--visión-general)
5. [Digital (producción propia)](#5-digital)
6. [Offset (producción propia)](#6-offset)
7. [Proveedor (tercerizado)](#7-proveedor)
8. [Gran formato (tercerizado)](#8-gran-formato)
9. [Personalizados / Material POP (tercerizado)](#9-personalizados)
10. [Cotización con varios ítems y de tipos mezclados](#10-mixtas)
11. [Herramientas de decisión: comparadores y sugeridor](#11-comparadores)
12. [Interpretar la solicitud del cliente con IA](#12-ia)
13. [Cotizaciones: estados, tablero Kanban, edición, PDF, CSV, Orden de Venta](#13-cotizaciones)
14. [Órdenes de producción / Taller (producción por pieza)](#14-taller)
15. [Inventario de papel](#15-inventario)
16. [Consumo de papel por mes](#16-consumo)
17. [Clientes y trabajos repetidos](#17-clientes)
18. [Variables del negocio (administración)](#18-variables)
19. [Tasas de cambio](#19-tasas)
20. [Usuarios](#20-usuarios)
21. [Auditoría](#21-auditoría)
22. [CRM: prospectos y actividades](#22-crm)
23. [Proveedores y listas de precios de papel](#23-proveedores)
24. [Glosario rápido](#24-glosario)

---

## 1. Ingresar al sistema

1. Abre la dirección del sistema en el navegador.
2. Escribe tu **correo** y tu **clave** y pulsa **Entrar**.
3. Si te equivocas, el mensaje es siempre el mismo ("Correo o clave incorrectos")
   por seguridad — no revela si el correo existe.
4. Para salir, usa **Salir** arriba a la derecha.

**Duración de la sesión:** tu sesión se mantiene activa mientras la uses. Si dejas
de usarla, vence a los **7 días** de inactividad. La cookie del navegador vive
hasta 30 días, pero la autoridad es el servidor: si un administrador **te
desactiva**, tu sesión se cierra de inmediato, aunque el navegador todavía tenga
la cookie.

---

## 2. Roles

Hay tres roles. La barra de navegación muestra solo lo que tu rol puede usar, pero
la protección real está en el servidor (no depende de esconder botones).

| Rol | Para qué | Qué ve / puede |
|---|---|---|
| **Administrador (ADMIN)** | dueño / gerencia | **Todo:** cotiza todos los tipos, ve precios y márgenes, edita variables, papeles, acabados, catálogos, inventario, usuarios y auditoría; siempre puede **eliminar** |
| **Vendedor (VENDEDOR)** | cotizar y vender | Cotiza y **ve precios**; **no** edita las variables ni los catálogos del negocio. **Qué tipos puede cotizar y si puede eliminar lo define el ADMIN por usuario** (ver §20) |
| **Taller (TALLER)** | producción | **Solo** las órdenes de producción. **Nunca** ve un precio, costo o margen |

> **Regla de oro del sistema:** el rol TALLER **jamás** recibe dinero. No es que se
> le oculte en pantalla: las órdenes de producción no tienen columnas de precio y
> las consultas del taller nunca leen dinero. Esto está garantizado por diseño y
> verificado por pruebas automáticas.

Solo el ADMIN puede: editar Variables, papeles, acabados, catálogos (gran formato,
POP, equipos), gestionar **Proveedores** y sus listas de precios, crear/editar
usuarios y ver Auditoría. El **estado de cobro** de las órdenes lo mueven ADMIN y
VENDEDOR; el **CRM** (prospectos y actividades) es de ADMIN y VENDEDOR.

**Permisos de cotización (por usuario).** El ADMIN puede afinar, para cada
vendedor, **qué tipos de trabajo puede cotizar** (Digital, Offset, Proveedor, Gran
formato, Personalizados) y **si puede eliminar** cotizaciones. Por defecto un
vendedor nuevo puede cotizar **todos los tipos** y **no** puede eliminar. El ADMIN
siempre puede todo (estos ajustes no le aplican) y el TALLER no cotiza. La
protección es real en el servidor: aunque alguien fuerce la interfaz, guardar un
tipo no permitido o eliminar sin permiso es rechazado. Los cambios de permiso
surten efecto de inmediato, sin volver a iniciar sesión.

---

## 3. El menú

Según el rol verás algunos de estos enlaces:

- **Inicio** — resumen del estado del negocio.
- **Taller** — tablero de órdenes de producción (único módulo del rol TALLER).
- **Digital** — calculadora de impresión digital propia.
- **Offset** — calculadora de impresión offset propia.
- **Cotizar prov.** — cotización de trabajos tercerizados con proveedor.
- **Gran formato** — banners, viniles, pendones, roll-ups, etiquetas.
- **Personalizados** — chapas, llaveros, DTF, sublimación, láser (material POP).
- **Armar cotiz.** — revisar y guardar una cotización con varios ítems mezclados.
- **Cotizaciones** — listado o **tablero Kanban**, búsqueda, detalle, PDF, CSV.
- **CRM** — prospectos (leads) y actividades comerciales (ADMIN / VENDEDOR).
- **Clientes** — CRM básico y trabajos repetidos.
- **Proveedores** — listas de precios de papel y comparador (solo ADMIN).
- **Variables**, **Inventario**, **Consumo**, **Usuarios**, **Auditoría** — solo ADMIN.

---

## 4. Cómo cotizar — visión general

El sistema tiene **cinco calculadoras**, una por línea de trabajo. Todas comparten
la misma pantalla en dos columnas:

- **Izquierda:** los datos del trabajo y las herramientas de decisión.
- **Derecha:** el **desglose y el precio en vivo** (el ticket), que se recalcula
  mientras escribes.

Todas las calculadoras terminan igual: el número que ves es el que se guarda,
porque el mismo motor de cálculo corre en tu navegador (vista previa) y en el
servidor (cálculo autoritativo al guardar). Cuando guardas, **el servidor vuelve a
calcular todo** con la configuración del momento y **congela** los precios; una
cotización guardada nunca cambia aunque mañana suba el papel.

Cada calculadora ofrece dos formas de guardar:

- **Guardar cotización** — crea de una vez la cotización (en estado Borrador) con
  el ítem que tienes en pantalla y te lleva a su detalle.
- **Agregar a la cotización** — mete el ítem en un "carrito" (el panel *En esta
  cotización*) para seguir sumando más ítems —de esta u otras calculadoras— y
  guardarlos todos juntos. Ver [§10](#10-mixtas).

Elementos comunes a todas las calculadoras:

- **Cliente:** elige uno registrado o escribe el nombre a mano.
- **Tasas y utilidad:** tasa BCV, Binance compra/venta, diferencial (automático o a
  mano), margen, comisión y MercadoLibre — todos vienen de Variables y puedes
  ajustarlos para esta cotización.
- **Precio de venta a mano:** en el ticket puedes fijar tú el precio unitario
  final; la venta total, la ganancia, los Bs y el precio ML se recalculan con él y
  aparece la etiqueta **A MANO**. Se muestra el precio *sugerido* como referencia.
- **Panel "En esta cotización":** lista los ítems que has ido agregando al carrito.

> **Cómo se forma el precio (en palabras).** El sistema parte del **costo** del
> trabajo, lo lleva a valor de dólar real multiplicándolo por el **diferencial**
> (cuánto supera el dólar paralelo al BCV), le suma tu **utilidad** —también
> protegida por el diferencial— según el **margen**, y descuenta la **comisión**
> del vendedor. El cliente paga en Bs a la **tasa BCV**. Detalle exacto en la
> Documentación de Desarrollo.

---

## 5. Digital

Menú **Digital**. Impresión digital de **producción propia**: papel cortado del
pliego más acabados. La digital imprime como máximo en **1/4 de pliego**, así que
solo verás los tamaños 1/4 y 1/8.

### 5.1 Datos del trabajo
- **Cliente**, **Trabajo** (nombre corto) y **Descripción** (se autogenera con
  material, medida, tamaño y acabados; puedes editarla).

### 5.2 Formato y material
- **Ancho / Alto (mm):** medida de la pieza.
- **Cantidad:** cuántas piezas.
- **Tamaño de corte:** 1/4 o 1/8 de pliego.
- **Papel:** de la lista; abajo se ve el precio por pliego y por corte.
- **Piezas por corte (montaje):** se calcula solo probando las dos orientaciones y
  descontando pinza y separación. El dibujo muestra cómo entran las piezas.

### 5.3 Acabados
Marca lo que lleva el trabajo: impresión tiro/retiro, laminado tiro/retiro,
troquelado digital, troquel (Básico / Medio / Complejo — excluyentes, se eligen con
un selector), pegado, acetato dangler, guillotina, prueba de color. Cada acabado se
cobra según su regla (por corte, por pieza, por millar de cortes o por trabajo).

### 5.4 Pestañas de ítems (＋ Ítem)
Arriba de la calculadora hay **pestañas de ítems**: pulsa **＋ Ítem** para agregar
otro trabajo digital a la misma cotización; cada pestaña se edita por separado y la
✕ la quita. El cliente es común; el título y la descripción son por ítem. (Esto es
específico de la calculadora Digital; para mezclar tipos distintos usa el carrito,
[§10](#10-mixtas).)

### 5.5 Guardar
- **Guardar cotización** crea la cotización con todos sus ítems, en Borrador.
- Con un solo ítem puedes marcar **"Guardar también como trabajo repetido"** para
  reutilizar la receta después ([§17](#17-clientes)).

---

## 6. Offset

Menú **Offset**. Impresión offset de **producción propia**. A diferencia de la
digital, el offset monta el arte en el **pliego** y su costo suma:

- **Papel** por pliego (según el tamaño que imprime la prensa: pliego, 1/2 o 1/4).
- **Planchas:** una por color y por cara. El costo de la plancha depende del tamaño
  (1/4, 1/2 o pliego).
- **Arranque (montaje):** costo fijo por cada cara, para calibrar registro y color.
- **Impresión:** por cada millar de pliegos × **pasadas** × caras. Las pasadas
  dependen del **equipo (prensa)**: una prensa de 4 colores imprime todo en una
  pasada; una de 1 color necesita 4 pasadas para un full color.
- **Tinta:** por millar de pliegos × colores × caras.
- **Acabados** propios del offset (ver abajo).

### 6.1 Campos
- **Papel** y **tamaño del pliego** que imprime la prensa.
- **Medida de la pieza (mm)** y **capacidad** (se calcula por montaje, editable).
- **Equipo (prensa):** elige la prensa; fija colores por pasada, millar y arranque.
- **Colores**, **colores por pasada**, **caras** (tiro / tiro y retiro).
- Costos de **plancha (por tamaño)**, **arranque**, **millar** y **tinta** — vienen
  de Variables, editables para esta cotización.

### 6.2 Acabados de offset
El offset tiene su **propio catálogo de acabados** (distinto al digital, porque los
costos son diferentes): guillotina, laminado, barniz UV, barniz litográfico,
doblez, engrapado, numerado, pegado de acetato, pegado de caja, encuadernado.

> **Cuándo conviene offset.** El offset solo le gana a la digital con **volumen**,
> por el peso de las planchas y el arranque. Una tarjeta a 1.000 sale más cara en
> offset que en digital; un volante a 10.000 sale mucho más barato en offset. Usa
> el [comparador por cantidad](#11-comparadores) para ver el punto de cruce.

---

## 7. Proveedor

Menú **Cotizar prov.** Cuando el trabajo lo hace un **tercero** y tú solo aplicas
tu margen sobre lo que te cobra:

- **Proveedor / Referencia / Notas** del proveedor.
- **Cómo cobra el proveedor:**
  - **Costo total** — un monto fijo por todo el trabajo, o
  - **Costo unitario del elemento** — × cantidad = total (se muestra el total).
- **Características de lo ofertado:** describe qué incluye (material, medidas,
  acabados, tiempos). Va tal cual a la cotización del cliente.
- El resto (tasas, margen, comparador por margen, precio a mano) funciona igual que
  en las demás.

> El **comparador por cantidad** en Proveedor solo aparece en modo **costo
> unitario** (en "costo total" el monto es fijo y no escala con la cantidad).

---

## 8. Gran formato

Menú **Gran formato**. Impresión de **gran formato tercerizada**. Tiene tres modos:

### 8.1 Impresión por m² (banners y viniles)
- **Material** (banner 13oz, vinil, mesh, blackout, UV…) — cada uno con su costo
  por m².
- **Ancho / Alto (cm)** de la pieza y **cantidad**.
- **Cómo se cobra:**
  - **Por mancha** — se cobra el área impresa (ancho × alto de la pieza).
  - **Por ancho de rollo** — se cobra el ancho del rollo usado (nunca menor que la
    pieza), típico de viniles. Se sugiere el rollo más angosto que cubre la pieza.
- **Ojetes:** se calculan solos por el perímetro (uno cada X cm, mínimo 4 en las
  esquinas) o los pones a mano. Cada ojete tiene un costo (instalado por el
  proveedor).

### 8.2 Producto terminado
Pendones, roll-ups, arañas/X-banner, estructuras, stands de degustación,
accesorios: **costo fijo por unidad** del catálogo. Eliges el producto y la
cantidad.

### 8.3 Etiquetas / stickers
Elige un **material de etiqueta**: se imprimen en **láminas de montaje** (p. ej.
125×70 cm) y cada tamaño de etiqueta rinde N por lámina. Indica el **tamaño de
etiqueta** y la **cantidad**; el sistema calcula cuántas láminas y el área.

---

## 9. Personalizados

Menú **Personalizados**. Material **POP tercerizado**: chapas (prendedor, llavero,
destapador), bolígrafos, llaveros (acrílico, MDF), DTF, sublimación, corte láser.
Dos modos según el producto del catálogo:

- **Por escalas (por cantidad):** el precio unitario baja por tramos de volumen
  (p. ej. 1, 12, 50, 100, 250, 500). El sistema muestra la **tabla de escalas** y
  marca el tramo que aplica. Si al subir un poco la cantidad baja el precio, aparece
  un **empujón**: "💡 subiendo a X u el precio baja a $Y".
- **Lineal (por metro):** productos como el DTF UV se cobran por metro lineal, con
  un ancho fijo y un largo mínimo.

Desde la tabla de escalas puedes convertir cada tramo en un ítem de la cotización
(botón **＋ cotiz** por tramo, o "Agregar los N tramos como ítems") — útil para
ofrecerle al cliente opciones 100 / 250 / 500 que elija.

---

## 10. Mixtas

Una cotización puede tener **varios ítems**, incluso de **tipos distintos**
(por ejemplo: unas tarjetas en Digital + un banner en Gran formato + unas chapas en
Personalizados, todo para el mismo cliente en un solo documento).

### 10.1 El carrito — panel "En esta cotización"
Todas las calculadoras tienen abajo el panel **En esta cotización**, que lista lo
que has ido agregando con el botón **Agregar a la cotización**. Muestra, por ítem,
su **tipo**, cantidad y venta, el **total** acumulado, un botón **×** para quitarlo,
**Vaciar** y **Revisar / guardar**.

Flujo típico:
1. En cualquier calculadora, arma el ítem y pulsa **Agregar a la cotización**.
2. Cambia a otra calculadora (o al mismo módulo con otros datos) y agrega más.
3. Cuando tengas todo, pulsa **Revisar / guardar** (o entra por **Armar cotiz.**).

### 10.2 Revisar y guardar (Armar cotiz.)
La pantalla **Armar cotiz.** muestra todos los ítems del carrito con su tipo y
total, deja ajustar el cliente/título y **guarda todos juntos** en una sola
cotización. Si los ítems son de tipos distintos, la cotización queda marcada como
**Mixta**.

### 10.3 Editar una mixta
Una cotización mixta en Borrador se puede **Editar**: se vuelve a cargar en el
carrito con todos sus ítems y, al guardar, se actualiza esa misma cotización.

---

## 11. Comparadores

En la calculadora Digital (y en versión adaptada en las demás) tienes herramientas
de decisión que recalculan en vivo:

- **Comparador por cantidad:** el mismo trabajo a distintos tirajes (p. ej. 500,
  1.000, 3.000, 5.000, 10.000), con la **curva** de precio unitario y una tabla con
  costo, precio, venta, ganancia y **% vs. el primer tiraje**. La fila del tiraje
  actual se marca **ACTUAL**. Cada fila trae **Usar N** (fija esa cantidad) y
  **＋ cotiz** (agrega ese volumen como ítem), más "Agregar los N volúmenes".
- **Comparador por margen:** el mismo trabajo a distintos márgenes de rentabilidad,
  para elegir el precio.
- **Sugeridor de tamaño de corte (Digital):** compara los tamaños posibles y te dice
  cuál sale más barato para la pieza.

Estos comparadores están presentes en las cinco calculadoras (Digital y Offset con
economías de escala reales; Proveedor, Gran formato y Personalizados con la utilidad
de generar varios ítems por tiraje de una vez).

---

## 12. IA

Si el administrador activó la función, arriba de la calculadora Digital aparece
**"Interpretar solicitud del cliente"**:

1. Pega el texto tal cual lo mandó el cliente (WhatsApp, correo, nota).
2. Pulsa **Interpretar**.
3. Revisa el borrador: cada campo trae un nivel de **confianza** (alta / media /
   baja) y una lista de **dudas** para preguntarle al cliente.
4. Pulsa **Cargar en la cotización** y ajusta lo que haga falta.

> El texto se procesa con IA de Anthropic (Claude). **Nada se guarda** hasta que tú
> guardes la cotización. La IA solo redacta un **borrador**: nunca fija precios ni
> ejecuta acciones, y el servidor descarta cualquier papel o acabado que no exista
> en el catálogo real. Si la IA falla, cargas la cotización a mano.

---

## 13. Cotizaciones

Menú **Cotizaciones**: listado con búsqueda (por título, cliente, descripción o
papel) y filtro por estado.

- **Lista o Tablero (Kanban):** arriba tienes un selector **Lista / Tablero**. La
  **Lista** es la tabla de siempre (con filtro por estado y export); el **Tablero**
  muestra las cotizaciones en columnas por estado y puedes **arrastrar una tarjeta**
  de una columna a otra para cambiarle el estado (por ejemplo, de *Enviada* a
  *Aprobada*). La búsqueda funciona en las dos vistas.
- **Tipos a la vista:** cada fila muestra una etiqueta por **cada tipo de trabajo
  que contiene** (Digital, Offset, Proveedor, Gran formato, Personalizado). Una
  cotización con varios tipos muestra varias etiquetas.
- **Estados:** Borrador → **Pendiente de aprobación** → Enviada → Aprobada /
  Rechazada / Vencida. El estado se cambia desde el detalle o arrastrando la tarjeta
  en el Tablero. La *Pendiente de aprobación* es el paso opcional en que la cotización
  espera el visto bueno interno antes de enviarla al cliente. Cada estado tiene su
  **color**: gris (borrador), ámbar (pendiente), azul (enviada), verde (aprobada /
  ganada), rojo (rechazada / perdida), naranja (vencida).
- **Orden de Venta:** cuando una cotización pasa a **Aprobada**, el mismo documento
  se presenta como **Orden de Venta** (mismo número, mismo registro) y **la orden de
  producción se genera sola** (ver [§14](#14-taller)).
- **Acciones por fila:** a la derecha de cada cotización, sin abrir el detalle:
  **Editar** (solo borradores), **Usar como base**, **Imprimir/PDF** y **Eliminar**.
  Cada acción aparece solo si tu rol y permisos la permiten.
- **Editar:** solo en **Borrador**. Abre la cotización en el cotizador; al guardar se
  actualiza esa misma cotización. (Se ofrece únicamente si puedes cotizar todos los
  tipos que contiene.)
- **Usar como base (duplicar):** crea una **nueva** cotización con la misma
  estructura (útil para variantes), desde el listado o desde el detalle. Funciona con
  cualquier tipo y con las mixtas.
- **Imprimir / PDF:** versión imprimible con el **membrete** de la empresa; usa
  *Imprimir* del navegador → Guardar como PDF. Cada ítem aparece con su descripción y
  total; el cliente ve el **Total** con IVA.
- **Exportar CSV:** desde el listado; abre en Excel en español (separador `;`, BOM
  UTF-8, respeta acentos). Incluye costos, margen, ML, tasa BCV y precio en Bs (solo
  para roles que ven precios).
- **Eliminar (ADMIN, o quien tenga el permiso):** "borrado inteligente" — solo se
  borra de verdad un Borrador sin orden; lo que tiene historia se marca **Rechazada**,
  y no se puede borrar si ya generó una orden.

> Una cotización guardada es **inmutable**: aunque mañana suba el papel, sigue
> mostrando lo que se le prometió al cliente. Solo el Borrador se modifica.

---

## 14. Taller

### 14.1 La orden se genera sola (handoff automático)
Cuando pasas una cotización a **Aprobada** (= Orden de Venta), **la orden de
producción se crea sola**, sin recapturar nada: comercial le pasa el trabajo a
producción de un solo movimiento. Antes había que pulsar "Generar orden" a mano; ese
botón **queda en el detalle como respaldo** por si hiciera falta rehacerla.

A diferencia de antes, **todos los ítems entran a producción**, no solo los de
producción propia. Cada ítem se convierte en una **pieza** con su propio estado, en
uno de dos **carriles**:

- **Carril interno (taller):** ítems Digital y Offset. Recorre *En cola de diseño →
  En diseño → Esperando arte → En impresión → En acabado → Lista*. Sus **etapas** de
  acabado salen de la cotización, en el orden en que se ejecutan (pruebas → planchas →
  arranque → impresión → laminado → troquel → pegado → guillotina).
- **Carril tercerizado (compras al proveedor):** ítems de Gran formato, Proveedor y
  Personalizados —que antes **no** se controlaban en producción—. Recorre *Por cotizar
  → Comprado → Recibido → Entregado*.

### 14.2 Tablero del taller (rol TALLER incluido)
Menú **Taller**, con un selector de dos vistas:

- **Tablero** (por defecto): **producción por pieza**. Cada pieza es una tarjeta en la
  columna de su estado; **arrastra la tarjeta** para avanzarla (el rol **TALLER puede
  mover piezas**). Las piezas internas y las tercerizadas se ven juntas, cada una con
  las columnas de su carril.
- **Órdenes:** la vista clásica —una tarjeta por orden con sus etapas—, por estado
  (Pendiente, En proceso, Terminada) y ordenada por fecha de entrega; las **atrasadas**
  se marcan.

En ambas vistas el TALLER ve la receta, las etapas y las piezas **sin ningún precio**.

### 14.3 Trabajar una orden
- En el **Tablero**, mueve cada **pieza** por sus estados; en la vista de detalle o en
  **Órdenes**, marca cada **etapa** como lista (con responsable) a medida que avanza.
- La orden pasa por Pendiente → En proceso → **Terminada** → Entregada. El sistema la
  actualiza sola según avancen sus etapas o sus piezas.
- Al llegar a **Terminada**, el sistema **descuenta el papel consumido del
  inventario** automáticamente y **una sola vez** (aunque se marque dos veces).

### 14.4 Estado de cobro (ADMIN / VENDEDOR)
Cada orden lleva un **seguimiento de cobro**, aparte de su avance de producción:
**No facturado → Facturado → Cobrado**, y al marcar cada paso se guarda la **fecha**.
Lo gestionan ADMIN y VENDEDOR desde el detalle de la orden. **No es una factura
fiscal**: es solo un semáforo para saber qué está por cobrar. El TALLER no lo ve.

---

## 15. Inventario

Menú **Inventario** (solo ADMIN). El stock se lleva en **pliegos completos**:

- **Registrar entrada:** suma una compra al stock.
- **Ajustar:** fija el stock a un conteo físico exacto (registra la diferencia).
- **Mínimo (aviso):** cuando el stock baja de aquí, el papel se marca en rojo.
- **Movimientos recientes:** auditoría de entradas, salidas (por órdenes terminadas)
  y ajustes.

Los papeles se agrupan por **categoría** de material.

---

## 16. Consumo

Menú **Consumo** (solo ADMIN): reporte de **consumo de papel por mes**, a partir de
las cotizaciones **aprobadas**, para planificar compras. Agrupa por mes y papel, y
muestra cortes y pliegos completos.

> Nota: el reporte de Consumo cuenta cotizaciones **aprobadas** (proyección de
> compra); la **salida de inventario** ocurre cuando la orden se **termina**. Son
> dos momentos distintos del ciclo.

---

## 17. Clientes

- **Clientes:** alta y edición de datos (nombre, RIF, contacto, teléfono, email,
  dirección, notas). La ficha muestra el histórico de cotizaciones y trabajos. Un
  cliente con historia no se borra: se desactiva.
- **Trabajos repetidos:** recetas guardadas (medida, papel, tamaño, capacidad,
  acabados) que **no guardan precio**. Para **recotizar**, cargas el trabajo y el
  sistema aplica las **tasas de hoy** y vuelve a calcular. Es la función que más se
  usa: un trabajo de hace un mes da un precio distinto si la tasa cambió, y el mismo
  si no cambió nada.

---

## 18. Variables

Menú **Variables** (solo ADMIN). Estos valores se aplican a **cada cotización
nueva**; las guardadas no cambian.

### 18.1 Valores por defecto del negocio
- **Merma papel (%)**, **Margen (%)**, **Comisión vendedor (%)**, **MercadoLibre (%)**.
- **Pinza (mm)** y **Separación (mm)** — para el montaje.
- **Margen mínimo (%)** — avisa si una cotización baja de aquí.
- **IVA (%)** — para la cotización al cliente.

### 18.2 Offset y gran formato
- **Offset:** costo de plancha (1/4, 1/2 y pliego), arranque, millar y tinta.
- **Equipos (prensas):** cada prensa con sus colores por pasada, millar y arranque.
- **Ojete de gran formato:** costo por ojete y separación en cm.

### 18.3 Tasas
- **Tasa BCV**, **Binance compra**, **Binance venta**, con **Actualizar tasas**.
- Cada cambio de tasa queda en el histórico.

### 18.4 IA
- Interruptor general **"Interpretar solicitud del cliente con IA"** (por defecto
  apagado) y **Modelo** (Opus 4.8 recomendado, Sonnet 5 o Haiku 4.5). Solo aparece
  si hay clave de API cargada.

### 18.5 Membrete
Datos de la empresa (nombre, RIF, teléfono, dirección, email, web) que salen en la
cotización imprimible.

### 18.6 Papeles y catálogos
- **Papeles:** referencia, categoría, medida, hojas por resma, precio. Se agregan,
  editan o **desactivan** (nunca se borran: las cotizaciones viejas los siguen
  mostrando por su snapshot).
- **Acabados:** nombre, costo (tarifa base para 1/4 de pliego), cómo se cobra, cómo
  escala al cambiar de tamaño, orden en el taller, **módulo** (digital u offset) y
  **grupo** (los del mismo grupo son excluyentes, como los troqueles).
- **Materiales de gran formato**, **productos terminados**, **productos POP** y
  **equipos** — cada uno con su catálogo editable.

---

## 19. Tasas

- **Fuente:** por defecto dolarapi (Venezuela). Trae BCV y paralelo.
- **Manual:** botón **Actualizar tasas** en Variables.
- **Automático:** un programador (cron) puede refrescarlas solo (lo configura el
  administrador técnico).
- Cada actualización registra una fila en el histórico de tasas.

> La fuente da **un solo** valor de paralelo, así que al actualizar, *Binance
> compra* y *Binance venta* quedan iguales; la diferencia compra/venta solo existe
> cuando la pones a mano en Variables.

---

## 20. Usuarios

Menú **Usuarios** (solo ADMIN):
- **Crear usuario:** nombre, correo, clave (mín. 6), rol.
- **Rol:** ADMIN / VENDEDOR / TALLER (no puedes quitarte a ti mismo el rol de
  admin).
- **Cotizar / eliminar (por usuario):** para cada vendedor, casillas por tipo de
  trabajo (Digital, Offset, Proveedor, Gran formato, Personalizado) y una casilla
  **Eliminar**. Marca los tipos que puede cotizar; si **no marcas ninguno**, ese
  vendedor no puede cotizar. Un vendedor nuevo empieza con **todos** los tipos y
  **sin** eliminar. El ADMIN muestra "Todo · puede eliminar" (no se configura) y el
  TALLER "No cotiza". Cada cambio queda en Auditoría y surte efecto de inmediato.
- **Activar / Desactivar:** al desactivar, se cierran sus sesiones al instante.
- **Interpretar IA (por usuario):** *Según el sistema* (sigue el interruptor
  general), *Activado* o *Desactivado*. Solo aparece si hay clave de API.

---

## 21. Auditoría

Menú **Auditoría** (solo ADMIN): bitácora de **solo-agregar** de operaciones
sensibles — cambios de estado de cotización, cambios de rol, activación/desactivación
de usuarios y override de IA por usuario. Cada registro guarda quién, cuándo y qué.

---

## 22. CRM

Menú **CRM** (ADMIN / VENDEDOR). Es el tablero comercial **antes** de cotizar:
sirve para no perder oportunidades ni compromisos con los clientes. Tiene dos partes.

### 22.1 Prospectos (leads)
Un **prospecto** es una oportunidad todavía sin cotización: "Fulano quiere 500
volantes", "la panadería preguntó por menús". Se lleva en un **tablero** de cuatro
columnas por las que arrastras la tarjeta:

- **Nuevo** — recién capturado.
- **Contactado** — ya le hablaste.
- **Convertido** — se volvió cotización.
- **Descartado** — no prosperó.

Para crear uno, usa **Nuevo prospecto** (arriba): *Oportunidad* (obligatorio),
*Cliente*, *Contacto* (correo o teléfono) y *Detalle* (qué necesita, presupuesto
estimado, notas). Arrastra la tarjeta a la columna que corresponda a medida que
avanza; también puedes eliminar un prospecto que ya no aplica.

### 22.2 Actividades
Una **actividad** es una gestión agendada: **Reunión, Llamada, Seguimiento** o
**Nota**. Con **Agendar actividad** pones el *Tipo*, una *Fecha* (opcional), el
*Título* (p. ej. "Llamar para confirmar arte"), el *Cliente* y unas *Notas*. La lista
muestra las **pendientes** primero por fecha; cuando la cumples, la marcas como
**hecha** y desaparece de la lista de pendientes.

> El CRM se enlaza con clientes, prospectos y cotizaciones de forma flexible: no exige
> que el cliente ya exista para anotar una oportunidad o una llamada.

---

## 23. Proveedores

Menú **Proveedores** (**solo ADMIN**). Aquí llevas **de quién compras el papel** y a
qué precio, para costear con el proveedor más conveniente sin cambiar nada más del
sistema.

### 23.1 Proveedores y predeterminado
- **Nuevo proveedor:** *Nombre* (obligatorio), *Moneda* (USD por defecto), *Contacto*
  y *Notas*.
- **Predeterminado:** marca **un** proveedor como el **predeterminado global** con
  *Hacer predeterminado*. Es el proveedor de respaldo: se usa para costear cualquier
  papel que no tenga un proveedor propio asignado. El predeterminado no se puede
  borrar (primero nombra otro).

### 23.2 Comparador de precios
Por **cada papel** del catálogo, el comparador muestra el precio de **todos** los
proveedores que tienen lista, **normalizado a resma completa** (aunque uno cotice por
hoja y otro por millar, se comparan parejo). Marca el **más barato**, muestra el
**ahorro potencial** frente al precio actual y señala el **preferido**.

- **Proveedor preferido (por papel):** con **Hacer preferido** eliges de qué proveedor
  sale el precio de ese papel. Ese precio pasa a ser el **precio efectivo** —el que usa
  el motor para cotizar—. Así puedes tener un proveedor global y, para papeles puntuales,
  preferir otro más barato.

### 23.3 Importar una lista de precios (Excel)
Para cargar los precios de un proveedor de una vez, desde un **.xlsx**:

1. **Descargar plantilla:** baja la plantilla ya **pre-rellenada con tu catálogo**
   (trae la columna **Clave**, que es la que empareja cada fila con el papel correcto —
   no la cambies). Llena la columna **Precio** y, si hace falta, ajusta **Unidad**
   (*resma*, *hoja* o *millar*) y **Hojas**.
2. **Importar lista:** elige el proveedor y sube el archivo.
3. **Vista previa:** antes de confirmar, ves el **diff** de cada papel: si el precio
   **sube**, **baja**, queda **igual**, es **nuevo** o si la fila **no coincide** con
   ningún papel del catálogo (*sin papel*, se ignora).
4. **Confirmar:** se guardan los precios de ese proveedor. Si el proveedor es el
   **preferido** de un papel (o el predeterminado y el papel no tiene preferido), su
   nuevo precio actualiza el **precio efectivo** de ese papel automáticamente.

Puedes cargar **varias listas** (una por proveedor) y compararlas lado a lado en el
comparador.

> **Lo importante:** el motor de cálculo **no cambia**. Sigue leyendo el precio del
> papel; lo que hacen los proveedores es decidir **de dónde sale** ese precio y dejarte
> ver cuánto ahorrarías cambiando de proveedor.

---

## 24. Glosario

| Término | Qué significa |
|---|---|
| **Pliego / corte** | El pliego es la hoja completa; el corte es una fracción (1/2, 1/4, 1/8). Las tarifas de acabados se refieren a 1/4 de pliego. |
| **Montaje** | Cuántas piezas entran en un corte descontando pinza y separación. |
| **Merma** | % de papel que se pierde por errores de consumo. |
| **Millar (troquelado)** | Se cobra por cada mil **cortes** de papel, no por pieza. |
| **Arranque (offset)** | Pliegos y trabajo que se gastan calibrando registro y color, por cara. |
| **Pasadas (offset)** | Cuántas veces pasa el pliego por la prensa = colores ÷ colores por pasada del equipo. |
| **Ojete** | Argolla metálica del borde del banner; se cuenta por el perímetro. |
| **Diferencial** | Cuántas veces el dólar paralelo supera al BCV (promedio Binance ÷ BCV). |
| **Costo protegido** | Tu costo llevado a valor de dólar real (costo × diferencial). |
| **Utilidad protegida** | Tu ganancia también protegida contra el diferencial. |
| **Margen** | % de rentabilidad **sobre el precio de venta** (no sobre el costo). |
| **Comisión** | % del vendedor, descontado del precio. |
| **Precio a mano** | Precio unitario fijado manualmente que manda sobre el calculado. |
| **Snapshot** | Copia congelada de papeles, acabados y variables que guarda cada cotización; la hace inmutable. |
| **Borrador** | Único estado en que una cotización se puede editar. |
| **Pendiente de aprobación** | Estado intermedio (entre Borrador y Enviada) en que la cotización espera el visto bueno interno. |
| **Orden de Venta** | Una cotización Aprobada; mismo documento, listo para producir. |
| **Handoff** | El paso automático de comercial a producción: al aprobar, la orden se genera sola. |
| **Orden de producción** | Papel para el taller generado de una cotización aprobada. **No lleva precios.** |
| **Pieza** | Cada ítem de la cotización se sigue por separado en producción, con su propio estado. |
| **Carril interno / tercerizado** | Interno = ítems propios (Digital/Offset) que van al taller; tercerizado = ítems que se compran a un proveedor. |
| **Estado de cobro** | Semáforo de cobro de la orden (No facturado → Facturado → Cobrado). No es factura fiscal. |
| **Prospecto** | Oportunidad/lead comercial antes de cotizar (tablero del CRM). |
| **Actividad** | Gestión comercial agendada (reunión, llamada, seguimiento, nota) con fecha y "hecha". |
| **Proveedor predeterminado** | Proveedor de respaldo global, para papeles sin proveedor propio. |
| **Proveedor preferido** | Proveedor elegido para costear un papel concreto; su precio es el que usa el motor. |
| **Precio efectivo** | El precio de resma con que el sistema cotiza un papel (copia del preferido o del predeterminado). |
| **Mixta** | Cotización con ítems de varios tipos a la vez. |

---

*Documento de referencia para el uso diario. La contraparte técnica (arquitectura,
motores de cálculo, modelo de datos, seguridad y decisiones de diseño) está en
[DOCUMENTACION_DESARROLLO.md](DOCUMENTACION_DESARROLLO.md).*
