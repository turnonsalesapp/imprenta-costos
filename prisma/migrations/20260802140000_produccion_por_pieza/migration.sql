-- Fase 2: producción POR PIEZA. Añade PiezaOrden (interno/tercerizado), estado de
-- cobro en la Orden y etapas colgadas de la pieza. Backfill: una pieza canónica
-- por cada orden existente, con sus etapas reasignadas.

-- 1) Enums nuevos.
CREATE TYPE "CarrilPieza" AS ENUM ('INTERNO', 'TERCERIZADO');
CREATE TYPE "EstadoPieza" AS ENUM (
    'EN_COLA', 'EN_DISENO', 'ESPERANDO_ARTE', 'EN_IMPRESION', 'EN_ACABADO', 'LISTA',
    'POR_COTIZAR', 'COMPRADO', 'RECIBIDO', 'ENTREGADO'
);
CREATE TYPE "EstadoCobro" AS ENUM ('NO_FACTURADO', 'FACTURADO', 'COBRADO');

-- 2) Seguimiento de cobro en la Orden.
ALTER TABLE "Orden" ADD COLUMN "estadoCobro" "EstadoCobro" NOT NULL DEFAULT 'NO_FACTURADO';
ALTER TABLE "Orden" ADD COLUMN "fechaFactura" TIMESTAMPTZ(3);
ALTER TABLE "Orden" ADD COLUMN "fechaCobro" TIMESTAMPTZ(3);

-- 3) Tabla PiezaOrden.
CREATE TABLE "PiezaOrden" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "carril" "CarrilPieza" NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoPieza" NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "proveedorNombre" TEXT,
    "snapshot" JSONB,
    "notas" TEXT,
    "creadaEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "PiezaOrden_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PiezaOrden_ordenId_idx" ON "PiezaOrden"("ordenId");
CREATE INDEX "PiezaOrden_estado_idx" ON "PiezaOrden"("estado");
ALTER TABLE "PiezaOrden" ADD CONSTRAINT "PiezaOrden_ordenId_fkey"
    FOREIGN KEY ("ordenId") REFERENCES "Orden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4) Etapas colgadas de la pieza.
ALTER TABLE "EtapaOrden" ADD COLUMN "piezaId" TEXT;
CREATE INDEX "EtapaOrden_piezaId_idx" ON "EtapaOrden"("piezaId");
ALTER TABLE "EtapaOrden" ADD CONSTRAINT "EtapaOrden_piezaId_fkey"
    FOREIGN KEY ("piezaId") REFERENCES "PiezaOrden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5) Backfill idempotente: una pieza canónica INTERNA por cada orden existente
--    (las órdenes viejas solo tenían producción propia). Estado derivado del de
--    la orden; snapshot = la proyección ya guardada en Orden.items.
INSERT INTO "PiezaOrden" (
    "id", "ordenId", "carril", "tipo", "titulo", "cantidad", "estado", "orden",
    "snapshot", "creadaEn", "actualizadaEn"
)
SELECT
    gen_random_uuid()::text,
    o."id",
    'INTERNO',
    COALESCE(c."tipo"::text, 'PROPIA'),
    COALESCE(NULLIF(c."titulo", ''), 'Producción'),
    COALESCE(c."cantidad", 0),
    (CASE o."estado"
        WHEN 'PENDIENTE'  THEN 'EN_COLA'
        WHEN 'EN_PROCESO' THEN 'EN_IMPRESION'
        WHEN 'TERMINADA'  THEN 'LISTA'
        WHEN 'ENTREGADA'  THEN 'LISTA'
        WHEN 'ANULADA'    THEN 'LISTA'
        ELSE 'EN_COLA'
    END)::"EstadoPieza",
    0,
    o."items",
    now(),
    now()
FROM "Orden" o
JOIN "Cotizacion" c ON c."id" = o."cotizacionId"
WHERE NOT EXISTS (SELECT 1 FROM "PiezaOrden" p WHERE p."ordenId" = o."id");

-- 6) Reasignar cada etapa a la pieza canónica de su orden.
UPDATE "EtapaOrden" e
SET "piezaId" = p."id"
FROM "PiezaOrden" p
WHERE p."ordenId" = e."ordenId" AND e."piezaId" IS NULL;
