import type { ReactNode } from "react";

/**
 * Ilustraciones (mockups SVG) de cada paso de los tutoriales. Clave → SVG.
 * Son maquetas on-brand de cómo se ve cada pantalla; están pensadas como
 * "ranuras": se pueden reemplazar por capturas reales cuando se tengan.
 *
 * Un paso cuyo `mockup` no exista aquí simplemente se muestra sin imagen, así
 * que el tutorial funciona aunque falte alguna ilustración.
 *
 * Estética: artes gráficas del proyecto (plancha, tinta, registros CMYK,
 * Helvetica, densidad tipo hoja de cálculo). Todo en un lienzo 400×220.
 */

// ── Paleta (hex del sistema; en SVG no hay tokens de Tailwind) ──────────────
const C = {
  hoja: "#FCFCFB",
  plancha: "#E3E7E3",
  suave: "#EFF2EF",
  tinta: "#171B19",
  regla: "#C4CBC5",
  kraft: "#767D76",
  cian: "#0B8FA8",
  magenta: "#C4177C",
  amarillo: "#C79400",
  exito: "#15794F",
  error: "#8A1C1C",
} as const;

const FONT = "Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,Menlo,Consolas,monospace";

// ── Primitivas reutilizables ────────────────────────────────────────────────

/** Lienzo estándar de todos los mockups. */
function Frame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 400 220"
      width="100%"
      height="auto"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      fontFamily={FONT}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <title>{title}</title>
      <rect width={400} height={220} fill={C.hoja} />
      {children}
    </svg>
  );
}

/** Franja de registro CMYK (cian · magenta · amarillo · tinta). */
function Cmyk({ x = 0, y = 0, w = 400, h = 5 }: { x?: number; y?: number; w?: number; h?: number }) {
  const s = w / 4;
  return (
    <g>
      <rect x={x} y={y} width={s} height={h} fill={C.cian} />
      <rect x={x + s} y={y} width={s} height={h} fill={C.magenta} />
      <rect x={x + s * 2} y={y} width={s} height={h} fill={C.amarillo} />
      <rect x={x + s * 3} y={y} width={s} height={h} fill={C.tinta} />
    </g>
  );
}

/** Rótulo/eyebrow en mayúsculas espaciadas. */
function Eyebrow({ x, y, children, anchor = "start" }: { x: number; y: number; children: string; anchor?: "start" | "middle" | "end" }) {
  return (
    <text x={x} y={y} fontSize={8} fontWeight="bold" fill={C.kraft} textAnchor={anchor} style={{ letterSpacing: "1.2px" }}>
      {children.toUpperCase()}
    </text>
  );
}

/** Campo de formulario: rótulo + caja con valor. */
function Field({
  x, y, w = 120, h = 20, label, value, accent,
}: { x: number; y: number; w?: number; h?: number; label: string; value?: string; accent?: string }) {
  return (
    <g>
      <Eyebrow x={x} y={y}>{label}</Eyebrow>
      <rect x={x} y={y + 5} width={w} height={h} rx={2} fill={C.hoja} stroke={accent ?? C.regla} strokeWidth={1} />
      {value ? (
        <text x={x + 7} y={y + 5 + h / 2 + 3.5} fontSize={10} fill={C.tinta} fontFamily={MONO}>
          {value}
        </text>
      ) : null}
    </g>
  );
}

/** Tarjetita neutra de Kanban con filete de acento a la izquierda. */
function MiniCard({ x, y, w = 62, h = 22, accent }: { x: number; y: number; w?: number; h?: number; accent: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={2} fill={C.hoja} stroke={C.regla} strokeWidth={1} />
      <rect x={x} y={y} width={3} height={h} fill={accent} />
      <rect x={x + 9} y={y + 6} width={w - 18} height={3} rx={1} fill={C.regla} />
      <rect x={x + 9} y={y + 13} width={w - 28} height={3} rx={1} fill={C.suave} />
    </g>
  );
}

/** Flecha horizontal simple. */
function Arrow({ x1, x2, y, color = C.kraft }: { x1: number; x2: number; y: number; color?: string }) {
  return (
    <g stroke={color} fill={color}>
      <line x1={x1} y1={y} x2={x2 - 5} y2={y} strokeWidth={1.5} />
      <polygon points={`${x2},${y} ${x2 - 6},${y - 3.5} ${x2 - 6},${y + 3.5}`} stroke="none" />
    </g>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// INICIO
// ════════════════════════════════════════════════════════════════════════════

const bienvenida = (
  <Frame title="Portada — Imprenta: cotizar, ganar, producir, cobrar">
    {/* Marca: cuatro barras CMYK */}
    {[C.cian, C.magenta, C.amarillo, C.tinta].map((col, n) => (
      <rect key={n} x={162 + n * 20} y={48} width={13} height={48} rx={1} fill={col} />
    ))}
    <text x={200} y={135} fontSize={30} fontWeight="bold" fill={C.tinta} textAnchor="middle" style={{ letterSpacing: "0.5px" }}>
      Imprenta
    </text>
    <text x={200} y={162} fontSize={12} fill={C.kraft} textAnchor="middle" fontFamily={MONO}>
      cotizar → ganar → producir → cobrar
    </text>
    <line x1={130} y1={182} x2={270} y2={182} stroke={C.regla} strokeWidth={1} />
  </Frame>
);

const cotizarTipos = (
  <Frame title="Nueva cotización — elegir tipo de trabajo">
    <Cmyk />
    <Eyebrow x={16} y={26}>Nueva cotización · tipo de trabajo</Eyebrow>
    {[
      { t: "Digital", sel: true },
      { t: "Offset", sel: false },
      { t: "Gran formato", sel: false },
      { t: "Proveedor", sel: false },
      { t: "Personalizado", sel: false },
    ].map((f, n) => {
      const w = 68;
      const x = 16 + n * (w + 5);
      return (
        <g key={n}>
          <rect x={x} y={40} width={w} height={70} rx={2} fill={f.sel ? "#E6F4F8" : C.hoja} stroke={f.sel ? C.cian : C.regla} strokeWidth={f.sel ? 1.5 : 1} />
          <Cmyk x={x + 12} y={54} w={w - 24} h={4} />
          <rect x={x + 12} y={66} width={w - 24} height={16} rx={1} fill={C.suave} />
          <text x={x + w / 2} y={100} fontSize={8.5} fontWeight="bold" fill={f.sel ? C.cian : C.tinta} textAnchor="middle">
            {f.t}
          </text>
        </g>
      );
    })}
    <text x={16} y={135} fontSize={9} fill={C.kraft}>Una cotización puede combinar varios ítems de distintos tipos.</text>
    <rect x={300} y={190} width={84} height={20} rx={2} fill={C.tinta} />
    <text x={342} y={204} fontSize={9} fontWeight="bold" fill={C.hoja} textAnchor="middle">Continuar →</text>
  </Frame>
);

const cotizarDigital = (
  <Frame title="Cotizar Digital — formulario y tarjeta de costo/precio">
    <Cmyk />
    <Eyebrow x={16} y={26}>Cotizar · Digital</Eyebrow>
    <Field x={16} y={40} w={150} label="Producto / medida" value="Tarjeta · 9×5 cm" />
    <Field x={16} y={78} w={70} label="Cantidad" value="1.000" />
    <Field x={96} y={78} w={70} label="Papel" value="Couché 300" />
    <Field x={16} y={116} w={150} label="Acabados" value="Plastificado mate" />
    {/* Montaje sugerido */}
    <Eyebrow x={16} y={162}>Montaje en pliego · corte más barato</Eyebrow>
    <rect x={16} y={168} width={150} height={34} rx={2} fill={C.suave} stroke={C.regla} />
    {Array.from({ length: 5 }).map((_, r) =>
      Array.from({ length: 8 }).map((_, c) => (
        <rect key={`${r}-${c}`} x={22 + c * 18} y={172 + r * 6} width={16} height={4} fill={C.hoja} stroke={C.regla} strokeWidth={0.5} />
      )),
    )}
    {/* Tarjeta costo / precio */}
    <rect x={200} y={40} width={184} height={162} rx={2} fill={C.hoja} stroke={C.regla} />
    <Cmyk x={200} y={40} w={184} h={4} />
    <text x={214} y={70} fontSize={9} fill={C.kraft}>Costo</text>
    <text x={370} y={70} fontSize={12} fill={C.tinta} textAnchor="end" fontFamily={MONO}>$ 42,00</text>
    <line x1={214} y1={80} x2={370} y2={80} stroke={C.regla} />
    <text x={214} y={102} fontSize={9} fill={C.kraft}>Margen</text>
    <text x={370} y={102} fontSize={11} fill={C.tinta} textAnchor="end" fontFamily={MONO}>45 %</text>
    <text x={214} y={132} fontSize={10} fontWeight="bold" fill={C.tinta}>Precio</text>
    <text x={370} y={135} fontSize={17} fontWeight="bold" fill={C.exito} textAnchor="end" fontFamily={MONO}>$ 76,40</text>
    <rect x={214} y={168} width={156} height={20} rx={2} fill="#EDF9F1" stroke={C.exito} strokeWidth={0.75} />
    <text x={292} y={182} fontSize={8.5} fill={C.exito} textAnchor="middle">Utilidad protegida ✓</text>
  </Frame>
);

const cotizarOffset = (
  <Frame title="Cotizar Offset — planchas, tintas, millares y costos">
    <Cmyk />
    <Eyebrow x={16} y={26}>Cotizar · Offset</Eyebrow>
    <Field x={16} y={40} w={150} label="Pliego / montaje" value="70×100 · 8 up" />
    <Field x={16} y={78} w={70} label="Tintas" value="4/4 CMYK" />
    <Field x={96} y={78} w={70} label="Planchas" value="8" />
    <Field x={16} y={116} w={70} label="Millares" value="10" />
    <Field x={96} y={116} w={70} label="Papel" value="Bond 90" />
    {/* Tarjeta costos */}
    <rect x={200} y={40} width={184} height={162} rx={2} fill={C.hoja} stroke={C.regla} />
    <Cmyk x={200} y={40} w={184} h={4} />
    <text x={214} y={68} fontSize={9} fill={C.kraft}>Costo total</text>
    <text x={370} y={68} fontSize={12} fill={C.tinta} textAnchor="end" fontFamily={MONO}>$ 1.240</text>
    <line x1={214} y1={78} x2={370} y2={78} stroke={C.regla} />
    <text x={214} y={98} fontSize={9} fill={C.kraft}>Costo unitario</text>
    <text x={370} y={98} fontSize={11} fill={C.tinta} textAnchor="end" fontFamily={MONO}>$ 0,124</text>
    <text x={214} y={122} fontSize={9} fill={C.kraft}>Utilidad protegida</text>
    <text x={370} y={122} fontSize={11} fill={C.exito} textAnchor="end" fontFamily={MONO}>+ 38 %</text>
    <rect x={214} y={136} width={156} height={2} fill={C.regla} />
    <text x={214} y={158} fontSize={10} fontWeight="bold" fill={C.tinta}>Precio</text>
    <text x={370} y={161} fontSize={16} fontWeight="bold" fill={C.exito} textAnchor="end" fontFamily={MONO}>$ 1.980</text>
    <text x={214} y={186} fontSize={8} fill={C.kraft}>Costo fijo repartido entre millares</text>
  </Frame>
);

const cotizarGranformato = (
  <Frame title="Cotizar Gran formato — material, medidas y costo por m²">
    <Cmyk />
    <Eyebrow x={16} y={26}>Cotizar · Gran formato</Eyebrow>
    <Field x={16} y={40} w={150} label="Material" value="Lona banner 13 oz" />
    <Field x={16} y={78} w={46} label="Ancho" value="2,0 m" />
    <Field x={68} y={78} w={46} label="Alto" value="1,0 m" />
    <Field x={120} y={78} w={46} label="Cant." value="3" />
    {/* chips de acabados */}
    <Eyebrow x={16} y={124}>Acabados</Eyebrow>
    {["Ojales", "Dobladillo", "Laminado"].map((t, n) => {
      const x = 16 + n * 62;
      return (
        <g key={n}>
          <rect x={x} y={130} width={58} height={18} rx={2} fill={C.suave} stroke={C.regla} />
          <text x={x + 29} y={142.5} fontSize={8.5} fill={C.tinta} textAnchor="middle">{t}</text>
        </g>
      );
    })}
    {/* Tarjeta m² */}
    <rect x={210} y={40} width={174} height={130} rx={2} fill={C.hoja} stroke={C.regla} />
    <Cmyk x={210} y={40} w={174} h={4} />
    <text x={224} y={72} fontSize={9} fill={C.kraft}>Área total</text>
    <text x={370} y={72} fontSize={11} fill={C.tinta} textAnchor="end" fontFamily={MONO}>6,0 m²</text>
    <text x={224} y={98} fontSize={9} fill={C.kraft}>Costo por m²</text>
    <text x={370} y={98} fontSize={11} fill={C.tinta} textAnchor="end" fontFamily={MONO}>$ 8,50</text>
    <line x1={224} y1={110} x2={370} y2={110} stroke={C.regla} />
    <text x={224} y={134} fontSize={10} fontWeight="bold" fill={C.tinta}>Precio</text>
    <text x={370} y={137} fontSize={16} fontWeight="bold" fill={C.exito} textAnchor="end" fontFamily={MONO}>$ 96,00</text>
  </Frame>
);

const cotizarProveedor = (
  <Frame title="Cotizar Proveedor — trabajo tercerizado con margen">
    <Cmyk />
    <Eyebrow x={16} y={26}>Cotizar · Proveedor (tercerizado)</Eyebrow>
    <Field x={16} y={40} w={200} label="Proveedor" value="Gráficas del Este C.A." />
    <Field x={16} y={80} w={95} label="Costo del proveedor" value="$ 120,00" />
    <Field x={121} y={80} w={95} label="Margen" value="35 %" />
    {/* flujo → precio */}
    <Arrow x1={240} x2={266} y={95} color={C.cian} />
    <rect x={270} y={62} width={114} height={64} rx={2} fill={C.hoja} stroke={C.regla} />
    <Cmyk x={270} y={62} w={114} h={4} />
    <text x={284} y={88} fontSize={9} fill={C.kraft}>Precio al cliente</text>
    <text x={327} y={114} fontSize={17} fontWeight="bold" fill={C.exito} textAnchor="middle" fontFamily={MONO}>$ 162,00</text>
    {/* nota */}
    <rect x={16} y={150} width={200} height={30} rx={2} fill="#FBEBD9" stroke={C.regla} />
    <text x={26} y={162} fontSize={8.5} fontWeight="bold" fill="#8A4B00">Trabajo tercerizado</text>
    <text x={26} y={174} fontSize={8} fill="#8A4B00">El cliente ve un solo precio.</text>
  </Frame>
);

const cotizarPersonalizado = (
  <Frame title="Cotizar Personalizado — líneas de costo libres y margen">
    <Cmyk />
    <Eyebrow x={16} y={26}>Cotizar · Personalizado (a medida)</Eyebrow>
    {/* cabecera de tabla */}
    <rect x={16} y={36} width={280} height={18} fill={C.suave} stroke={C.regla} />
    <text x={26} y={48.5} fontSize={8} fontWeight="bold" fill={C.kraft}>CONCEPTO</text>
    <text x={286} y={48.5} fontSize={8} fontWeight="bold" fill={C.kraft} textAnchor="end">MONTO</text>
    {[
      ["Materiales especiales", "$ 60,00"],
      ["Mano de obra", "$ 45,00"],
      ["Extras / empaque", "$ 15,00"],
    ].map(([k, v], n) => (
      <g key={n}>
        <rect x={16} y={54 + n * 22} width={280} height={22} fill={C.hoja} stroke={C.regla} strokeWidth={0.5} />
        <text x={26} y={68.5 + n * 22} fontSize={9.5} fill={C.tinta}>{k}</text>
        <text x={286} y={68.5 + n * 22} fontSize={9.5} fill={C.tinta} textAnchor="end" fontFamily={MONO}>{v}</text>
      </g>
    ))}
    <text x={16} y={140} fontSize={8.5} fill={C.cian}>+ Agregar línea</text>
    {/* margen → total */}
    <line x1={16} y1={152} x2={296} y2={152} stroke={C.regla} />
    <text x={26} y={170} fontSize={9} fill={C.kraft}>Margen 40 %</text>
    <text x={200} y={170} fontSize={10} fontWeight="bold" fill={C.tinta} textAnchor="end">Total</text>
    <text x={296} y={172} fontSize={15} fontWeight="bold" fill={C.exito} textAnchor="end" fontFamily={MONO}>$ 168,00</text>
  </Frame>
);

const cotizacionesTablero = (
  <Frame title="Cotizaciones — tablero Kanban por estado">
    <Cmyk />
    <Eyebrow x={16} y={26}>Cotizaciones · Tablero</Eyebrow>
    {[
      { t: "Borrador", c: C.kraft, n: 1 },
      { t: "Pendiente", c: C.amarillo, n: 1 },
      { t: "Enviada", c: C.cian, n: 2 },
      { t: "Ganadas", c: C.exito, n: 1 },
      { t: "Perdidas", c: C.error, n: 1 },
    ].map((col, i) => {
      const w = 70;
      const x = 16 + i * (w + 4.5);
      return (
        <g key={i}>
          <rect x={x} y={36} width={w} height={172} rx={2} fill={C.suave} stroke={C.regla} />
          <rect x={x} y={36} width={w} height={3} fill={col.c} />
          <text x={x + 8} y={52} fontSize={7.5} fontWeight="bold" fill={C.tinta}>{col.t.toUpperCase()}</text>
          <circle cx={x + w - 10} cy={49} r={6} fill={C.hoja} stroke={C.regla} />
          <text x={x + w - 10} y={52} fontSize={7.5} fill={C.kraft} textAnchor="middle" fontFamily={MONO}>{col.n}</text>
          {Array.from({ length: col.n }).map((_, k) => (
            <MiniCard key={k} x={x + 4} y={60 + k * 28} w={w - 8} accent={col.c} />
          ))}
        </g>
      );
    })}
    {/* tarjeta en arrastre */}
    <g transform="rotate(-4 250 150)">
      <rect x={214} y={138} width={72} height={24} rx={2} fill={C.hoja} stroke={C.cian} strokeWidth={1.5} strokeDasharray="4 2" />
      <rect x={214} y={138} width={3} height={24} fill={C.cian} />
      <rect x={224} y={145} width={48} height={3} rx={1} fill={C.regla} />
      <rect x={224} y={152} width={34} height={3} rx={1} fill={C.suave} />
    </g>
  </Frame>
);

const crm = (
  <Frame title="CRM — tablero de prospectos y reuniones">
    <Cmyk />
    <Eyebrow x={16} y={26}>CRM · Prospectos</Eyebrow>
    {[
      { t: "Nuevo", c: C.cian, n: 2 },
      { t: "Contactado", c: C.amarillo, n: 1 },
      { t: "Convertido", c: C.exito, n: 1 },
      { t: "Descartado", c: C.error, n: 1 },
    ].map((col, i) => {
      const w = 88;
      const x = 16 + i * (w + 4);
      return (
        <g key={i}>
          <rect x={x} y={36} width={w} height={128} rx={2} fill={C.suave} stroke={C.regla} />
          <rect x={x} y={36} width={w} height={3} fill={col.c} />
          <text x={x + 8} y={52} fontSize={7.5} fontWeight="bold" fill={C.tinta}>{col.t.toUpperCase()}</text>
          {Array.from({ length: col.n }).map((_, k) => (
            <MiniCard key={k} x={x + 4} y={60 + k * 28} w={w - 8} accent={col.c} />
          ))}
        </g>
      );
    })}
    {/* fila de reunión */}
    <rect x={16} y={176} width={368} height={30} rx={2} fill={C.hoja} stroke={C.regla} />
    <rect x={16} y={176} width={3} height={30} fill={C.magenta} />
    <text x={30} y={188} fontSize={8} fontWeight="bold" fill={C.kraft} style={{ letterSpacing: "1px" }}>AGENDA</text>
    <text x={30} y={200} fontSize={10} fill={C.tinta}>Reunión · vie 10:00 — Cliente Panadería La Espiga</text>
  </Frame>
);

const handoff = (
  <Frame title="Al ganar — la orden de producción se crea sola">
    <Cmyk />
    <Eyebrow x={200} y={30} anchor="middle">Al ganar la cotización</Eyebrow>
    {/* tarjeta cotización ganada */}
    <rect x={24} y={64} width={150} height={92} rx={2} fill="#EDF9F1" stroke={C.exito} strokeWidth={1.5} />
    <Cmyk x={24} y={64} w={150} h={4} />
    <text x={99} y={94} fontSize={8} fontWeight="bold" fill={C.kraft} textAnchor="middle" style={{ letterSpacing: "1px" }}>COTIZACIÓN</text>
    <text x={99} y={116} fontSize={15} fontWeight="bold" fill={C.exito} textAnchor="middle">GANADA</text>
    <text x={99} y={138} fontSize={9} fill={C.tinta} textAnchor="middle" fontFamily={MONO}>COT-1042</text>
    {/* flecha grande */}
    <Arrow x1={182} x2={224} y={110} color={C.tinta} />
    <text x={203} y={100} fontSize={7.5} fill={C.kraft} textAnchor="middle">auto</text>
    {/* tarjeta orden */}
    <rect x={232} y={64} width={150} height={92} rx={2} fill={C.hoja} stroke={C.exito} strokeWidth={1.5} />
    <rect x={232} y={64} width={150} height={4} fill={C.exito} />
    <text x={307} y={94} fontSize={8} fontWeight="bold" fill={C.kraft} textAnchor="middle" style={{ letterSpacing: "1px" }}>ORDEN DE PRODUCCIÓN</text>
    <text x={307} y={116} fontSize={13} fontWeight="bold" fill={C.tinta} textAnchor="middle">Automática</text>
    <rect x={252} y={128} width={110} height={16} rx={2} fill="#EDF9F1" stroke={C.exito} strokeWidth={0.75} />
    <text x={307} y={139.5} fontSize={8} fill={C.exito} textAnchor="middle">Sin recapturar nada ✓</text>
    <text x={200} y={186} fontSize={9} fill={C.kraft} textAnchor="middle">La cotización pasa a Orden de Venta y genera su producción.</text>
  </Frame>
);

const tallerPiezas = (
  <Frame title="Taller — piezas por carril (taller y compras), sin precios">
    <Cmyk />
    {/* Carril TALLER */}
    <text x={16} y={26} fontSize={8} fontWeight="bold" fill={C.tinta} style={{ letterSpacing: "1.2px" }}>TALLER</text>
    {[
      { t: "Cola diseño", c: C.kraft, tipo: "Tarjetas" },
      { t: "Impresión", c: C.cian, tipo: "Volante" },
      { t: "Lista", c: C.exito, tipo: "Catálogo" },
    ].map((col, i) => {
      const w = 118;
      const x = 16 + i * (w + 6);
      return (
        <g key={i}>
          <rect x={x} y={32} width={w} height={74} rx={2} fill={C.suave} stroke={C.regla} />
          <rect x={x} y={32} width={w} height={3} fill={col.c} />
          <text x={x + 8} y={48} fontSize={7.5} fontWeight="bold" fill={C.tinta}>{col.t.toUpperCase()}</text>
          <rect x={x + 5} y={56} width={w - 10} height={42} rx={2} fill={C.hoja} stroke={C.regla} />
          <rect x={x + 5} y={56} width={3} height={42} fill={col.c} />
          <rect x={x + 13} y={64} width={40} height={10} rx={2} fill={C.suave} stroke={C.regla} strokeWidth={0.5} />
          <text x={x + 33} y={71.5} fontSize={7} fill={C.kraft} textAnchor="middle">{col.tipo}</text>
          <rect x={x + 13} y={80} width={w - 30} height={3} rx={1} fill={C.regla} />
          <rect x={x + 13} y={87} width={w - 50} height={3} rx={1} fill={C.suave} />
        </g>
      );
    })}
    {/* Carril COMPRAS */}
    <text x={16} y={130} fontSize={8} fontWeight="bold" fill={C.tinta} style={{ letterSpacing: "1.2px" }}>COMPRAS</text>
    {[
      { t: "Por cotizar", c: C.amarillo, tipo: "Troquel" },
      { t: "Recibido", c: C.exito, tipo: "Bolsas" },
    ].map((col, i) => {
      const w = 180;
      const x = 16 + i * (w + 6);
      return (
        <g key={i}>
          <rect x={x} y={136} width={w} height={70} rx={2} fill={C.suave} stroke={C.regla} />
          <rect x={x} y={136} width={w} height={3} fill={col.c} />
          <text x={x + 8} y={152} fontSize={7.5} fontWeight="bold" fill={C.tinta}>{col.t.toUpperCase()}</text>
          <rect x={x + 5} y={160} width={w - 10} height={40} rx={2} fill={C.hoja} stroke={C.regla} />
          <rect x={x + 5} y={160} width={3} height={40} fill={col.c} />
          <rect x={x + 13} y={168} width={44} height={10} rx={2} fill={C.suave} stroke={C.regla} strokeWidth={0.5} />
          <text x={x + 35} y={175.5} fontSize={7} fill={C.kraft} textAnchor="middle">{col.tipo}</text>
          <rect x={x + 13} y={184} width={w - 34} height={3} rx={1} fill={C.regla} />
          <rect x={x + 13} y={191} width={w - 70} height={3} rx={1} fill={C.suave} />
        </g>
      );
    })}
  </Frame>
);

const cobro = (
  <Frame title="Cobro — No facturado, Facturado, Cobrado">
    <Cmyk />
    <Eyebrow x={16} y={26}>Orden · Seguimiento de cobro</Eyebrow>
    {[
      { t: "No facturado", done: true, c: C.kraft },
      { t: "Facturado", done: true, c: C.cian },
      { t: "Cobrado", done: true, c: C.exito, green: true },
    ].map((s, i) => {
      const w = 108;
      const x = 20 + i * (w + 20);
      const fill = s.green ? "#EDF9F1" : C.hoja;
      const stroke = s.green ? C.exito : C.regla;
      return (
        <g key={i}>
          {i > 0 ? <Arrow x1={x - 18} x2={x - 2} y={92} color={C.kraft} /> : null}
          <rect x={x} y={62} width={w} height={60} rx={2} fill={fill} stroke={stroke} strokeWidth={s.green ? 1.5 : 1} />
          <rect x={x} y={62} width={w} height={3} fill={s.c} />
          <circle cx={x + w / 2} cy={88} r={9} fill={s.green ? C.exito : C.hoja} stroke={s.c} strokeWidth={1.5} />
          {s.green ? (
            <text x={x + w / 2} y={91.5} fontSize={11} fontWeight="bold" fill={C.hoja} textAnchor="middle">✓</text>
          ) : (
            <text x={x + w / 2} y={91} fontSize={9} fill={s.c} textAnchor="middle" fontFamily={MONO}>{i + 1}</text>
          )}
          <text x={x + w / 2} y={114} fontSize={9} fontWeight="bold" fill={C.tinta} textAnchor="middle">{s.t}</text>
        </g>
      );
    })}
    <text x={266} y={150} fontSize={9} fill={C.exito} textAnchor="middle" fontFamily={MONO}>Cobrado · 12 ago 2026</text>
    <text x={200} y={182} fontSize={8.5} fill={C.kraft} textAnchor="middle">Solo seguimiento (no es una factura fiscal).</text>
  </Frame>
);

const proveedores = (
  <Frame title="Proveedores — comparador de precios por papel">
    <Cmyk />
    <Eyebrow x={16} y={26}>Proveedores · Comparador</Eyebrow>
    <text x={16} y={44} fontSize={11} fontWeight="bold" fill={C.tinta}>Bond 20 · 70×100</text>
    {/* cabecera */}
    <rect x={16} y={52} width={368} height={20} fill={C.suave} stroke={C.regla} />
    <text x={26} y={65.5} fontSize={8} fontWeight="bold" fill={C.kraft}>PROVEEDOR</text>
    <text x={374} y={65.5} fontSize={8} fontWeight="bold" fill={C.kraft} textAnchor="end">PRECIO RESMA</text>
    {[
      { p: "Distribuidora Gráfica", v: "$ 38,00", best: true },
      { p: "Papeles del Centro", v: "$ 44,50", best: false },
    ].map((r, n) => (
      <g key={n}>
        <rect x={16} y={72 + n * 26} width={368} height={26} fill={r.best ? "#EDF9F1" : C.hoja} stroke={C.regla} strokeWidth={0.75} />
        {r.best ? <rect x={16} y={72 + n * 26} width={3} height={26} fill={C.exito} /> : null}
        <text x={30} y={88.5 + n * 26} fontSize={9.5} fill={r.best ? C.exito : C.tinta} fontWeight={r.best ? "bold" : "normal"}>
          {r.best ? "✓ " : ""}{r.p}
        </text>
        <text x={374} y={88.5 + n * 26} fontSize={10} fill={r.best ? C.exito : C.tinta} textAnchor="end" fontFamily={MONO} fontWeight={r.best ? "bold" : "normal"}>
          {r.v}
        </text>
      </g>
    ))}
    {/* ahorro */}
    <rect x={16} y={140} width={368} height={30} rx={2} fill="#EDF9F1" stroke={C.exito} />
    <text x={30} y={159} fontSize={9} fontWeight="bold" fill={C.exito} style={{ letterSpacing: "1px" }}>AHORRO POTENCIAL</text>
    <text x={374} y={160} fontSize={13} fontWeight="bold" fill={C.exito} textAnchor="end" fontFamily={MONO}>$ 6,50 / resma</text>
  </Frame>
);

const inventario = (
  <Frame title="Inventario — papeles con stock y aviso de mínimo">
    <Cmyk />
    <Eyebrow x={16} y={26}>Inventario · Papeles</Eyebrow>
    {/* cabecera */}
    <rect x={16} y={36} width={368} height={20} fill={C.suave} stroke={C.regla} />
    <text x={26} y={49.5} fontSize={8} fontWeight="bold" fill={C.kraft}>PAPEL</text>
    <text x={270} y={49.5} fontSize={8} fontWeight="bold" fill={C.kraft} textAnchor="end">STOCK</text>
    <text x={330} y={49.5} fontSize={8} fontWeight="bold" fill={C.kraft} textAnchor="end">MÍN.</text>
    <text x={374} y={49.5} fontSize={8} fontWeight="bold" fill={C.kraft} textAnchor="end">ESTADO</text>
    {[
      { p: "Couché 300", s: "420", m: "100", warn: false },
      { p: "Bond 90", s: "180", m: "150", warn: false },
      { p: "Cartulina 240", s: "40", m: "120", warn: true },
    ].map((r, n) => {
      const y = 56 + n * 24;
      return (
        <g key={n}>
          <rect x={16} y={y} width={368} height={24} fill={r.warn ? "#FDEDED" : C.hoja} stroke={C.regla} strokeWidth={0.5} />
          {r.warn ? <rect x={16} y={y} width={3} height={24} fill={C.error} /> : null}
          <text x={26} y={y + 15.5} fontSize={9.5} fill={C.tinta}>{r.p}</text>
          <text x={270} y={y + 15.5} fontSize={9.5} fill={r.warn ? C.error : C.tinta} textAnchor="end" fontFamily={MONO} fontWeight={r.warn ? "bold" : "normal"}>{r.s}</text>
          <text x={330} y={y + 15.5} fontSize={9.5} fill={C.kraft} textAnchor="end" fontFamily={MONO}>{r.m}</text>
          {r.warn ? (
            <g>
              <rect x={330} y={y + 5} width={48} height={14} rx={2} fill="#FDEDED" stroke={C.error} strokeWidth={0.75} />
              <text x={354} y={y + 15} fontSize={7} fontWeight="bold" fill={C.error} textAnchor="middle">Bajo mín.</text>
            </g>
          ) : (
            <text x={374} y={y + 15.5} fontSize={8.5} fill={C.exito} textAnchor="end">OK</text>
          )}
        </g>
      );
    })}
    <text x={16} y={148} fontSize={8.5} fill={C.kraft}>El stock se descuenta al terminar cada orden.</text>
  </Frame>
);

// ════════════════════════════════════════════════════════════════════════════
// VARIABLES
// ════════════════════════════════════════════════════════════════════════════

const varConfig = (
  <Frame title="Variables — valores por defecto (márgenes, IVA)">
    <Cmyk />
    <Eyebrow x={16} y={26}>Variables · Valores por defecto</Eyebrow>
    <Field x={16} y={46} w={170} label="Margen por defecto" value="45 %" />
    <Field x={200} y={46} w={170} label="Margen mínimo (protegido)" value="30 %" accent={C.exito} />
    <Field x={16} y={100} w={170} label="IVA" value="16 %" />
    <Field x={200} y={100} w={170} label="Diferencial" value="5 %" />
    <rect x={16} y={158} width={354} height={30} rx={2} fill="#FFF9E6" stroke={C.regla} />
    <text x={26} y={170} fontSize={8} fontWeight="bold" fill="#5C4A00" style={{ letterSpacing: "1px" }}>AFECTA COTIZACIONES NUEVAS</text>
    <text x={26} y={182} fontSize={8.5} fill="#5C4A00">El margen mínimo evita vender por debajo de lo rentable.</text>
  </Frame>
);

const varTasas = (
  <Frame title="Variables — tasa de cambio e histórico Binance">
    <Cmyk />
    <Eyebrow x={16} y={26}>Variables · Tasa de cambio</Eyebrow>
    <rect x={16} y={36} width={150} height={24} rx={2} fill={C.tinta} />
    <text x={91} y={51.5} fontSize={9.5} fontWeight="bold" fill={C.hoja} textAnchor="middle">↻ Actualizar tasas</text>
    <text x={300} y={52} fontSize={9} fill={C.kraft} textAnchor="end" fontFamily={MONO}>Últ.: hoy 09:14</text>
    {/* cabecera histórico */}
    <rect x={16} y={72} width={368} height={20} fill={C.suave} stroke={C.regla} />
    <text x={26} y={85.5} fontSize={8} fontWeight="bold" fill={C.kraft}>FECHA</text>
    <text x={280} y={85.5} fontSize={8} fontWeight="bold" fill={C.kraft} textAnchor="end">COMPRA</text>
    <text x={374} y={85.5} fontSize={8} fontWeight="bold" fill={C.kraft} textAnchor="end">VENTA</text>
    {[
      ["03 ago 2026", "36,80", "37,10"],
      ["02 ago 2026", "36,55", "36,90"],
      ["01 ago 2026", "36,40", "36,72"],
    ].map((r, n) => {
      const y = 92 + n * 24;
      return (
        <g key={n}>
          <rect x={16} y={y} width={368} height={24} fill={n % 2 ? C.suave : C.hoja} stroke={C.regla} strokeWidth={0.5} />
          <text x={26} y={y + 15.5} fontSize={9.5} fill={C.tinta}>{r[0]}</text>
          <text x={280} y={y + 15.5} fontSize={9.5} fill={C.tinta} textAnchor="end" fontFamily={MONO}>{r[1]}</text>
          <text x={374} y={y + 15.5} fontSize={9.5} fill={C.tinta} textAnchor="end" fontFamily={MONO}>{r[2]}</text>
        </g>
      );
    })}
    <text x={16} y={184} fontSize={8} fill={C.kraft}>Bs. por USD · fuente Binance P2P</text>
  </Frame>
);

const varMembrete = (
  <Frame title="Variables — membrete de la cotización">
    <Cmyk />
    <Eyebrow x={16} y={26}>Variables · Membrete</Eyebrow>
    <rect x={16} y={36} width={368} height={168} rx={2} fill={C.hoja} stroke={C.regla} />
    <Cmyk x={16} y={36} w={368} h={4} />
    {/* recuadro logo */}
    <rect x={30} y={54} width={90} height={64} rx={2} fill={C.suave} stroke={C.regla} strokeDasharray="4 3" />
    <text x={75} y={90} fontSize={10} fill={C.kraft} textAnchor="middle">logo</text>
    {/* datos */}
    <text x={140} y={66} fontSize={13} fontWeight="bold" fill={C.tinta}>Imprenta Gráfica C.A.</text>
    {[
      ["RIF", "J-40123456-7"],
      ["Dirección", "Av. Principal, Galpón 4, Caracas"],
      ["Teléfono", "+58 212 555 0198"],
    ].map((r, n) => (
      <g key={n}>
        <text x={140} y={90 + n * 20} fontSize={8} fontWeight="bold" fill={C.kraft} style={{ letterSpacing: "0.8px" }}>{r[0].toUpperCase()}</text>
        <text x={200} y={90 + n * 20} fontSize={9.5} fill={C.tinta} fontFamily={MONO}>{r[1]}</text>
      </g>
    ))}
    <line x1={30} y1={142} x2={370} y2={142} stroke={C.regla} />
    <text x={30} y={162} fontSize={8.5} fill={C.kraft}>Es lo que ve tu cliente en el PDF de la cotización.</text>
  </Frame>
);

const varPapeles = (
  <Frame title="Variables — catálogo de papeles">
    <Cmyk />
    <Eyebrow x={16} y={26}>Variables · Papeles</Eyebrow>
    <rect x={16} y={36} width={368} height={20} fill={C.suave} stroke={C.regla} />
    {[
      ["REFERENCIA", 26, "start"],
      ["MEDIDA", 190, "start"],
      ["HOJAS", 300, "end"],
      ["PRECIO", 374, "end"],
    ].map((h, n) => (
      <text key={n} x={h[1] as number} y={49.5} fontSize={8} fontWeight="bold" fill={C.kraft} textAnchor={h[2] as "start" | "end"}>{h[0]}</text>
    ))}
    {[
      ["Couché 300", "70×100", "250", "$ 62,00"],
      ["Bond 90", "70×100", "500", "$ 38,00"],
      ["Cartulina 240", "65×90", "250", "$ 54,50"],
    ].map((r, n) => {
      const y = 56 + n * 26;
      return (
        <g key={n}>
          <rect x={16} y={y} width={368} height={26} fill={n % 2 ? C.suave : C.hoja} stroke={C.regla} strokeWidth={0.5} />
          <text x={26} y={y + 16.5} fontSize={9.5} fill={C.tinta}>{r[0]}</text>
          <text x={190} y={y + 16.5} fontSize={9.5} fill={C.tinta} fontFamily={MONO}>{r[1]}</text>
          <text x={300} y={y + 16.5} fontSize={9.5} fill={C.tinta} textAnchor="end" fontFamily={MONO}>{r[2]}</text>
          <text x={374} y={y + 16.5} fontSize={9.5} fill={C.tinta} textAnchor="end" fontFamily={MONO}>{r[3]}</text>
        </g>
      );
    })}
    <text x={16} y={150} fontSize={8.5} fill={C.kraft}>El precio puede venir de las listas de proveedores.</text>
  </Frame>
);

const varAcabados = (
  <Frame title="Variables — acabados y cómo se cobran">
    <Cmyk />
    <Eyebrow x={16} y={26}>Variables · Acabados</Eyebrow>
    <rect x={16} y={36} width={368} height={20} fill={C.suave} stroke={C.regla} />
    <text x={26} y={49.5} fontSize={8} fontWeight="bold" fill={C.kraft}>ACABADO</text>
    <text x={250} y={49.5} fontSize={8} fontWeight="bold" fill={C.kraft} textAnchor="end">COSTO</text>
    <text x={374} y={49.5} fontSize={8} fontWeight="bold" fill={C.kraft} textAnchor="end">SE COBRA</text>
    {[
      ["Troquelado", "$ 25,00", "Por pliego"],
      ["Plastificado", "$ 0,04", "Por pieza"],
      ["Barniz UV", "$ 18,00", "Fijo"],
    ].map((r, n) => {
      const y = 56 + n * 26;
      return (
        <g key={n}>
          <rect x={16} y={y} width={368} height={26} fill={n % 2 ? C.suave : C.hoja} stroke={C.regla} strokeWidth={0.5} />
          <text x={26} y={y + 16.5} fontSize={9.5} fill={C.tinta}>{r[0]}</text>
          <text x={250} y={y + 16.5} fontSize={9.5} fill={C.tinta} textAnchor="end" fontFamily={MONO}>{r[1]}</text>
          <text x={374} y={y + 16.5} fontSize={9} fill={C.kraft} textAnchor="end">{r[2]}</text>
        </g>
      );
    })}
    <text x={16} y={150} fontSize={8.5} fill={C.kraft}>Aparecen al cotizar Digital y Offset.</text>
  </Frame>
);

const varGranformato = (
  <Frame title="Variables — materiales de gran formato">
    <Cmyk />
    <Eyebrow x={16} y={26}>Variables · Gran formato y POP</Eyebrow>
    <rect x={16} y={36} width={368} height={20} fill={C.suave} stroke={C.regla} />
    <text x={26} y={49.5} fontSize={8} fontWeight="bold" fill={C.kraft}>MATERIAL</text>
    <text x={270} y={49.5} fontSize={8} fontWeight="bold" fill={C.kraft} textAnchor="end">COSTO / m²</text>
    <text x={374} y={49.5} fontSize={8} fontWeight="bold" fill={C.kraft} textAnchor="end">COBRO</text>
    {[
      ["Lona banner 13 oz", "$ 3,20", "Por m²"],
      ["Vinil adhesivo", "$ 5,80", "Por m²"],
      ["PVC rígido 3 mm", "$ 12,50", "Por pieza"],
    ].map((r, n) => {
      const y = 56 + n * 26;
      return (
        <g key={n}>
          <rect x={16} y={y} width={368} height={26} fill={n % 2 ? C.suave : C.hoja} stroke={C.regla} strokeWidth={0.5} />
          <text x={26} y={y + 16.5} fontSize={9.5} fill={C.tinta}>{r[0]}</text>
          <text x={270} y={y + 16.5} fontSize={9.5} fill={C.tinta} textAnchor="end" fontFamily={MONO}>{r[1]}</text>
          <text x={374} y={y + 16.5} fontSize={9} fill={C.kraft} textAnchor="end">{r[2]}</text>
        </g>
      );
    })}
    <text x={16} y={150} fontSize={8.5} fill={C.kraft}>Alimentan la calculadora de gran formato.</text>
  </Frame>
);

const varEquipos = (
  <Frame title="Variables — equipos y su costo">
    <Cmyk />
    <Eyebrow x={16} y={26}>Variables · Equipos</Eyebrow>
    <rect x={16} y={40} width={368} height={22} fill={C.suave} stroke={C.regla} />
    <text x={26} y={54.5} fontSize={8} fontWeight="bold" fill={C.kraft}>EQUIPO</text>
    <text x={374} y={54.5} fontSize={8} fontWeight="bold" fill={C.kraft} textAnchor="end">COSTO / HORA</text>
    {[
      ["Offset GTO 52", "$ 45,00"],
      ["Digital Xerox C70", "$ 28,00"],
      ["Plotter Latex 360", "$ 20,00"],
    ].map((r, n) => {
      const y = 62 + n * 30;
      return (
        <g key={n}>
          <rect x={16} y={y} width={368} height={30} fill={n % 2 ? C.suave : C.hoja} stroke={C.regla} strokeWidth={0.5} />
          <text x={26} y={y + 19} fontSize={10} fill={C.tinta}>{r[0]}</text>
          <text x={374} y={y + 19} fontSize={10.5} fill={C.tinta} textAnchor="end" fontFamily={MONO}>{r[1]}</text>
        </g>
      );
    })}
    <text x={16} y={172} fontSize={8.5} fill={C.kraft}>El motor reparte el costo de producción entre los equipos.</text>
  </Frame>
);

// ── Registro exportado ──────────────────────────────────────────────────────
export const MOCKUPS: Record<string, ReactNode> = {
  // Inicio
  bienvenida,
  "cotizar-tipos": cotizarTipos,
  "cotizar-digital": cotizarDigital,
  "cotizar-offset": cotizarOffset,
  "cotizar-granformato": cotizarGranformato,
  "cotizar-proveedor": cotizarProveedor,
  "cotizar-personalizado": cotizarPersonalizado,
  "cotizaciones-tablero": cotizacionesTablero,
  crm,
  handoff,
  "taller-piezas": tallerPiezas,
  cobro,
  proveedores,
  inventario,
  // Variables
  "var-config": varConfig,
  "var-tasas": varTasas,
  "var-membrete": varMembrete,
  "var-papeles": varPapeles,
  "var-acabados": varAcabados,
  "var-granformato": varGranformato,
  "var-equipos": varEquipos,
};
