import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { db } from "./db";
import { TAMANOS, MEDIDAS, type Config } from "./calculo";

/**
 * Intérprete de solicitudes del cliente (opcional, con IA de Anthropic).
 *
 * Toma el texto libre que mandó el cliente (WhatsApp, correo, nota) y lo
 * traduce en un borrador estructurado de cotización. NO guarda nada: el
 * vendedor revisa, corrige y luego lo carga en la calculadora, que sigue su
 * flujo normal (cálculo autoritativo + snapshot al guardar). La inmutabilidad
 * de la cotización no se toca aquí.
 *
 * Todo ocurre en el servidor: la API key (ANTHROPIC_API_KEY) nunca llega al
 * navegador. El texto SÍ se envía a la API de Anthropic para procesarlo.
 */

const MODELO = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

/** Confianza del modelo en cada bloque de la interpretación. */
const Confianza = z.enum(["alta", "media", "baja"]);

/**
 * Esquema de salida. Todo es opcional/anulable: si el modelo no está seguro,
 * devuelve null y lo deja en `dudas`, nunca inventa un dato. Los papeles y
 * acabados solo pueden ser claves reales del catálogo (se validan después).
 */
const EsquemaSolicitud = z.object({
  cliente: z.string().nullable().describe("Nombre del cliente o empresa, si se menciona."),
  trabajo: z.string().nullable().describe("Nombre corto del trabajo. Ej. 'Volantes', 'Tarjetas de presentación'."),
  descripcion: z.string().nullable().describe("Descripción de lo pedido en una o dos frases."),
  cantidad: z.number().nullable().describe("Cantidad de piezas. Solo el número."),
  anchoMm: z.number().nullable().describe("Ancho de la pieza en MILÍMETROS. Convierte cm a mm (×10)."),
  altoMm: z.number().nullable().describe("Alto de la pieza en MILÍMETROS. Convierte cm a mm (×10)."),
  tamano: z.string().nullable().describe("Tamaño de corte, EXACTAMENTE uno de la lista dada, o null."),
  papelClave: z.string().nullable().describe("Clave EXACTA de un papel del catálogo, o null si no hay uno claro."),
  imprimeTiro: z.boolean().nullable().describe("¿Se imprime la cara frontal (tiro)? Casi siempre sí."),
  imprimeRetiro: z.boolean().nullable().describe("¿Se imprime también por detrás (retiro / ambos lados)?"),
  acabados: z.array(z.string()).describe("Claves EXACTAS de acabados del catálogo que pida el trabajo. [] si ninguno."),
  notas: z.string().nullable().describe("Cualquier otro detalle relevante que no encaje en los campos."),
  dudas: z.array(z.string()).describe("Cosas ambiguas o que faltan y conviene preguntarle al cliente."),
  confianza: z.object({
    cliente: Confianza,
    trabajo: Confianza,
    cantidad: Confianza,
    medida: Confianza,
    papel: Confianza,
    acabados: Confianza,
  }),
});

export type SolicitudInterpretada = z.infer<typeof EsquemaSolicitud>;

/**
 * Mismo contrato que `EsquemaSolicitud`, en JSON Schema, para constreñir la
 * salida del modelo (`output_config.format`). El SDK trae un helper de Zod pero
 * su tipado va atado a Zod v4; aquí usamos Zod v3, así que escribimos el schema
 * a mano y validamos la respuesta con `EsquemaSolicitud.safeParse`.
 */
const conf = { type: "string", enum: ["alta", "media", "baja"] } as const;
const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    cliente: { type: ["string", "null"] },
    trabajo: { type: ["string", "null"] },
    descripcion: { type: ["string", "null"] },
    cantidad: { type: ["number", "null"] },
    anchoMm: { type: ["number", "null"] },
    altoMm: { type: ["number", "null"] },
    tamano: { type: ["string", "null"] },
    papelClave: { type: ["string", "null"] },
    imprimeTiro: { type: ["boolean", "null"] },
    imprimeRetiro: { type: ["boolean", "null"] },
    acabados: { type: "array", items: { type: "string" } },
    notas: { type: ["string", "null"] },
    dudas: { type: "array", items: { type: "string" } },
    confianza: {
      type: "object",
      additionalProperties: false,
      properties: {
        cliente: conf, trabajo: conf, cantidad: conf, medida: conf, papel: conf, acabados: conf,
      },
      required: ["cliente", "trabajo", "cantidad", "medida", "papel", "acabados"],
    },
  },
  required: [
    "cliente", "trabajo", "descripcion", "cantidad", "anchoMm", "altoMm", "tamano",
    "papelClave", "imprimeTiro", "imprimeRetiro", "acabados", "notas", "dudas", "confianza",
  ],
} as const;

export type ResultadoInterpretar =
  | { ok: true; data: SolicitudInterpretada }
  | { ok: false; error: string };

/** ¿Está disponible la función? Necesita la API key configurada. */
export function interpretarDisponible(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * ¿El intérprete está activo para este usuario? Combina el interruptor general
 * del sistema con el override por usuario (null = hereda). Si no hay API key,
 * nunca está activo (no tiene sentido ofrecer algo que va a fallar).
 */
export async function interpretarActivo(usuarioId: string): Promise<boolean> {
  if (!interpretarDisponible()) return false;
  const [cfg, usuario] = await Promise.all([
    db.config.findUnique({ where: { id: "global" }, select: { interpretarIA: true } }),
    db.usuario.findUnique({ where: { id: usuarioId }, select: { interpretarIA: true } }),
  ]);
  if (usuario?.interpretarIA != null) return usuario.interpretarIA; // override explícito
  return Boolean(cfg?.interpretarIA); // valor del sistema
}

/** Arma el catálogo del taller que se le pasa al modelo como contexto. */
function catalogoTexto(cfg: Config): string {
  const papeles = cfg.papeles.map((p) => `- ${p.id} → ${p.nombre}`).join("\n");
  const acabados = cfg.acabados
    .map((a) => `- ${a.id} → ${a.label}${a.grupo ? ` (grupo: ${a.grupo})` : ""}`)
    .join("\n");
  const tamanos = TAMANOS.map((t) => t.id).join(", ");
  const medidas = Object.entries(MEDIDAS)
    .map(([k, [w, h]]) => `${k} (${w}×${h} mm)`)
    .join(", ");
  return [
    `TAMAÑOS DE CORTE válidos (campo "tamano", usa EXACTAMENTE uno o null):\n${tamanos}`,
    `MEDIDAS de pliego de referencia: ${medidas}`,
    `PAPELES del catálogo (campo "papelClave", usa la clave EXACTA de la izquierda o null):\n${papeles}`,
    `ACABADOS del catálogo (campo "acabados", usa las claves EXACTAS de la izquierda):\n${acabados}`,
  ].join("\n\n");
}

const INSTRUCCIONES = `Eres el asistente de presupuestos de una imprenta venezolana. Recibes la
solicitud de un cliente en texto libre (español, a menudo informal) y la
conviertes en un borrador estructurado para cotizar.

Reglas:
- Extrae solo lo que el cliente realmente dice. NO inventes datos.
- Si un dato no está o es ambiguo, deja el campo en null y anótalo en "dudas".
- Medidas SIEMPRE en milímetros. "media carta" ≈ 215×140 mm, "carta" ≈ 216×279 mm,
  "A4" ≈ 210×297 mm, "tarjeta" ≈ 90×50 mm. Convierte cm a mm multiplicando por 10.
- "papelClave" y "acabados" DEBEN ser claves exactas del catálogo dado. Si el
  cliente pide algo que no está en el catálogo, déjalo en null/[] y ponlo en "dudas".
- "full color" / "a color por ambos lados" → imprimeTiro=true, imprimeRetiro=true.
  "por un solo lado" → imprimeTiro=true, imprimeRetiro=false.
- Sé honesto con "confianza": alta solo si el cliente lo dijo claro.`;

/**
 * Llama al modelo y devuelve la interpretación validada. Filtra papeles y
 * acabados que no existan en el catálogo (defensa: el modelo no debe, pero por
 * si acaso nunca dejamos pasar una clave inventada).
 */
export async function interpretarSolicitud(
  texto: string,
  cfg: Config,
): Promise<ResultadoInterpretar> {
  const limpio = (texto ?? "").trim();
  if (limpio.length < 3) return { ok: false, error: "Pega primero el texto de la solicitud." };
  if (!interpretarDisponible()) {
    return { ok: false, error: "La interpretación con IA no está configurada (falta ANTHROPIC_API_KEY)." };
  }

  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: MODELO,
      max_tokens: 2000,
      system: `${INSTRUCCIONES}\n\n${catalogoTexto(cfg)}`,
      messages: [
        {
          role: "user",
          content: `Solicitud del cliente:\n"""\n${limpio}\n"""`,
        },
      ],
      output_config: { format: { type: "json_schema", schema: JSON_SCHEMA } },
    });

    const crudo = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    let obj: unknown;
    try {
      obj = JSON.parse(crudo);
    } catch {
      return { ok: false, error: "El modelo no devolvió un resultado interpretable. Cárgalo a mano." };
    }

    const val = EsquemaSolicitud.safeParse(obj);
    if (!val.success) {
      return { ok: false, error: "La interpretación llegó incompleta. Cárgalo a mano." };
    }
    const data = val.data;

    // Defensa: nunca devolver una clave de papel/acabado que no exista.
    const clavesPapel = new Set(cfg.papeles.map((p) => p.id));
    const clavesAcabado = new Set(cfg.acabados.map((a) => a.id));
    const dudas = [...(data.dudas ?? [])];
    if (data.papelClave && !clavesPapel.has(data.papelClave)) {
      dudas.push(`No encontré en el catálogo el papel sugerido ("${data.papelClave}"): elígelo a mano.`);
      data.papelClave = null;
    }
    data.acabados = (data.acabados ?? []).filter((c) => clavesAcabado.has(c));

    return { ok: true, data: { ...data, dudas } };
  } catch (e) {
    const detalle = e instanceof Error ? e.message : "error desconocido";
    return { ok: false, error: `No se pudo interpretar la solicitud (${detalle}). Puedes cargarla a mano.` };
  }
}
