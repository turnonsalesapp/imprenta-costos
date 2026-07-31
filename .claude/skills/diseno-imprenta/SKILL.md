---
name: diseno-imprenta
description: Sistema de diseño visual de esta app de imprenta (Next.js + Tailwind). Úsala SIEMPRE que vayas a crear o modificar cualquier pantalla, componente, formulario, tabla, tarjeta, badge, botón, estado visual, layout o estilo (CSS/Tailwind/JSX) de este proyecto — incluso un cambio pequeño de espaciado, color, borde o tipografía, y aunque el usuario no diga "diseño". También cuando pidan "mejorar el look and feel", "que se vea mejor / más profesional", "pulir la interfaz", "más limpio", agregar una pantalla nueva, o cuando dudes de qué color, tamaño, borde o jerarquía usar. Fija la estética de artes gráficas del proyecto (plancha, tinta, registros CMYK, Helvetica, densidad tipo hoja de cálculo) y, sobre todo, cómo elevar la calidad visual sin romper la coherencia de lo ya construido.
---

# Diseño — App de imprenta

Esta app tiene un lenguaje visual **deliberado y coherente**: una hoja impresa. No es
un dashboard SaaS genérico. Tu trabajo con esta skill es **preservar ese carácter y
elevar su calidad** — más ritmo, más jerarquía, más aire donde hace falta — nunca
sustituirlo por lo primero que sugiere Tailwind por defecto.

Antes de tocar UI, abre `references/tokens.md` (la **fuente de verdad** de paleta,
tipografía y medidas) y `references/componentes.md` (recetas copiables de los
componentes reales). No inventes valores que ya existen ahí.

## La idea rectora

Piensa en cada pantalla como **una hoja recién salida de la prensa**: fondo plancha
(gris papel), superficies hoja (blanco cálido), texto en tinta, filetes finos, y el
color CMYK reservado para **marcas de registro** — acentos pequeños, nunca rellenos
grandes. La app respira economía de tinta: pocos colores, planos (sin sombras),
bordes de 2 px, y **los números como protagonistas** (monoespaciados y alineados,
como en una hoja de cálculo o un presupuesto de imprenta).

La jerarquía se logra con **peso tipográfico y micro-etiquetas** (el "rótulo"
mayúsculo espaciado), no con muchos colores ni cajas grandes. Cuando algo se ve
"pobre", casi siempre el arreglo es **ritmo de espaciado y jerarquía**, no agregar
color o decoración.

## Reglas de oro (lo que mantiene la coherencia)

Estas no son caprichos: cada una sostiene el carácter "impreso". Explícito el porqué
para que sepas cuándo una excepción tiene sentido.

- **Radios pequeños.** `rounded-sm` (o `rounded-[2px]` en marcas diminutas). Nada de
  `rounded-lg`/`xl`/`full` en tarjetas o botones: los bordes redondeados grandes leen
  como SaaS de consumo y rompen el aire técnico de artes gráficas.
- **Planas, sin sombras.** No uses `shadow-*`. La profundidad viene del **filete**
  (`border border-regla`) y del contraste hoja-sobre-plancha, como capas de papel.
- **Superficie y fondo.** Contenido en tarjetas `bg-hoja` sobre el fondo `plancha`
  del body. `bg-suave` para rellenos sutiles (encabezados de tabla, chips neutros).
- **Texto.** Principal en `tinta`; secundario/rótulos en `kraft`. No metas grises de
  Tailwind (`text-gray-*`): usa la paleta del proyecto.
- **CMYK con cuentagotas.** `cian`, `magenta`, `amarillo` son **acentos de registro**
  (la marca del logo, un punto de color, un enlace activo). Nunca fondos amplios ni
  varios a la vez compitiendo. El acento de interacción es `cian` (foco, enlaces).
- **Cifras monoespaciadas.** Todo número de dinero, cantidad o tasa va en
  `font-mono` + `tabular` (o `tabular-nums`) y **alineado a la derecha** en tablas,
  para que las columnas cuadren.
- **Rótulos (eyebrows).** Los títulos de sección y metadatos usan el patrón
  `text-[10px] font-bold uppercase tracking-widest text-kraft`. Es la firma visual
  de la app; úsalo para encabezar secciones y tarjetas.
- **Botones.** Primario `bg-tinta text-hoja font-bold hover:opacity-90`; secundario
  `border border-regla text-kraft hover:border-tinta hover:text-tinta`. No introduzcas
  un tercer estilo sin razón.
- **Badges de estado.** Fondo suave + texto del mismo tono (ver `componentes.md`).
  Mantén el mapa de colores semántico existente (éxito, aviso, error, info).
- **Contenedor.** Las páginas viven en `mx-auto max-w-4xl px-6 py-8` (ya lo pone el
  layout). No ensanches sin motivo: la medida de línea corta se lee mejor.
- **Claro e imprimible.** El sistema es *light-only* (`color-scheme: light`) y muchas
  vistas se imprimen: respeta `no-print` en navegación/acciones y prueba `@media print`
  cuando toques algo que se imprime (cotización, orden).

## Cómo ELEVAR la calidad (la capa de mejora)

Cuando el encargo sea "que se vea mejor", trabaja esta lista antes que agregar nada
nuevo. Casi todo el salto de calidad está aquí:

1. **Ritmo de espaciado.** Escala en múltiplos de 4 (Tailwind `1`=4 px). Separa
   secciones con `mt-6`/`mt-8`, agrupa lo relacionado con `gap-3`, y da a las tarjetas
   respiración interna consistente (`p-3`/`p-4`). La inconsistencia de espaciado es el
   defecto #1 que hace ver "amateur" una pantalla ordenada.
2. **Una sola jerarquía clara.** Un `h1` por página (`text-lg font-bold tracking-tight`)
   con su rótulo debajo; secciones con eyebrow; el resto se ordena por peso, no por
   tamaño desmedido. Evita "todo en negrita".
3. **Alineación y tabularidad.** Números a la derecha, etiquetas a la izquierda,
   `tabular` para que no "bailen" al cambiar. Alinea bordes de columnas entre tarjetas
   de una misma grilla.
4. **Contraste accesible.** `kraft` sobre `hoja`/`plancha` sirve para texto secundario,
   **no** para datos críticos pequeños: sube a `tinta` cuando el dato importa. Apunta a
   AA (≥ 4.5:1 en texto normal). Ante la duda, oscurece el texto, no agregues color.
5. **Estados de foco visibles.** Inputs y controles con `focus:border-cian` (o
   `outline` con cian). La navegación por teclado debe verse.
6. **Estados vacíos y de carga.** Una tabla o lista sin datos merece una línea en
   `kraft` que explique qué falta ("Aún no hay cotizaciones"), no un hueco en blanco.
7. **Menos ruido.** Quita bordes y fondos que no aportan; un filete separa, dos
   compiten. Prefiere espacio en blanco a líneas divisorias cuando alcance.
8. **Consistencia > ingenio.** Reusa un componente/idiom existente antes de crear una
   variante. Tres botones "casi iguales" se ven peor que uno repetido.

## Antipatrones (rompen el look al instante)

- `rounded-lg`/`rounded-xl`/`rounded-full`, `shadow-md`, gradientes.
- Colores fuera de paleta (`text-gray-500`, `bg-blue-600`, hex al azar). Si necesitas
  un tono nuevo, primero pregúntate si un token existente sirve; sólo si es semántico
  (un estado nuevo) añádelo a la paleta con su versión suave, siguiendo el patrón de
  los badges.
- Varios acentos CMYK a la vez, o CMYK como fondo grande.
- Emojis como iconos de interfaz. Si hace falta iconografía, usa `lucide-react`
  (ya presente) a tamaño pequeño (`size={15}`) y color heredado/`kraft`.
- Todo en negrita, o títulos gigantes. La app es sobria y técnica.

## Flujo de trabajo al tocar UI

1. Lee `references/tokens.md` y `references/componentes.md`; reutiliza recetas.
2. Prefiere **editar el componente/idiom compartido** a duplicar estilos.
3. Respeta la densidad existente (compacta, `text-sm`/`text-xs`, `py-2`/`py-2.5`).
4. Verifica: `npx tsc --noEmit` y `npm run build`; revisa **móvil** (grids que
   colapsan a `grid-cols-2`) y **print** si la vista se imprime.
5. Cambios visuales sin lógica: descríbelos claro en el commit (qué y por qué).
