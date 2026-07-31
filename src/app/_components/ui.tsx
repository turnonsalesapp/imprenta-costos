import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Primitivas de presentación compartidas (skill: diseno-imprenta).
 * Codifican una sola vez los patrones elevados para que todas las pantallas
 * queden consistentes: encabezado con filete de "membrete", rótulos de sección,
 * estados vacíos y tarjetas de indicador.
 */

/**
 * Encabezado de página: h1 + rótulo, cerrado con un filete inferior (membrete).
 * `back` pone un enlace de regreso encima; los hijos van como acciones a la derecha.
 */
export function PageHeader({
  title,
  eyebrow,
  back,
  children,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  back?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-regla pb-5">
      {back && (
        <Link href={back.href} className="mb-3 inline-block text-sm text-kraft hover:text-tinta">
          ← {back.label}
        </Link>
      )}
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight">{title}</h1>
          {eyebrow != null && (
            <p className="mt-0.5 text-xs uppercase tracking-widest text-kraft">{eyebrow}</p>
          )}
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}

/**
 * Rótulo de sección (eyebrow), la firma visual de la app. `acento` pinta una
 * marca de registro CMYK (p. ej. "bg-cian"); úsalo con cuentagotas —sólo en
 * pantallas con pocas secciones— para no saturar.
 */
export function SectionTitle({ children, acento }: { children: ReactNode; acento?: string }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-kraft">
      {acento && <span className={`h-2 w-2 rounded-[2px] ${acento}`} />}
      {children}
    </h2>
  );
}

/** Estado vacío: caja con filete y mensaje centrado, en lugar de un hueco en blanco. */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mt-6 rounded-sm border border-regla bg-hoja px-4 py-12 text-center">
      <b className="block text-sm">{title}</b>
      {children && <p className="mx-auto mt-1 max-w-md text-sm text-kraft">{children}</p>}
    </div>
  );
}

/** Tarjeta de indicador (KPI): rótulo en versalitas + cifra monoespaciada protagonista. */
export function KPI({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <div className="rounded-sm border border-regla bg-hoja p-4">
      <div className="text-[10px] font-bold uppercase tracking-widest text-kraft">{k}</div>
      <div className="tabular mt-1.5 font-mono text-xl font-bold">{v}</div>
    </div>
  );
}
